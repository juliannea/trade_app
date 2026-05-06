import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, KeyboardAvoidingView, Platform,
  TextInput, TouchableOpacity, Modal, Image, ScrollView, Alert, ActivityIndicator, DeviceEventEmitter
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { tradeService } from '@/services/tradeService'
import { Stack, useLocalSearchParams } from 'expo-router'

type Message = {
  match_id: number
  message_sent_by_user_a: boolean
  message_content: string
  message_created_at: string
}

type Post = {
  post_id: number
  post_title: string
  post_image_url: string
  post_caption: string
  user_id: string
}

function PostSelectCard({
  post,
  selected,
  onSelect,
}: {
  post: Post
  selected: boolean
  onSelect: (post: Post) => void
}) {
  return (
    <TouchableOpacity
      style={[styles.postCard, selected && styles.postCardSelected]}
      onPress={() => onSelect(post)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: post.post_image_url }} style={styles.postThumb} />
      {selected && (
        <View style={styles.selectedOverlay}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
      <Text style={styles.postCardTitle} numberOfLines={1}>
        {post.post_title}
      </Text>
    </TouchableOpacity>
  )
}

export default function Chat() {
  const { matchId } = useLocalSearchParams()
  const matchIdNum = Number(matchId)

  //chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isUserA, setIsUserA] = useState<boolean | null>(null)
  const flatListRef = useRef<FlatList<Message>>(null)
  const [otherUsername] = useState('Chat')

  //modal state
  const [showLikedModal, setShowLikedModal] = useState(false)
  const [showTradeModal, setShowTradeModal] = useState(false)
  //myPosts: current user's own posts (for "Your Offer" section)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  //theirLikedPosts: other person's posts the current user liked (for "You Want" section)
  const [theirLikedPosts, setTheirLikedPosts] = useState<Post[]>([])
  const [selectedMyPost, setSelectedMyPost] = useState<Post | null>(null)
  const [selectedTheirPost, setSelectedTheirPost] = useState<Post | null>(null)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [submittingTrade, setSubmittingTrade] = useState(false)

  //determine if current user is user_a in this match (for message rendering)
  useEffect(() => {
    async function determineUserRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const userId = session.user.id

      const { data: matchData } = await supabase
        .from('Match')
        .select('user_id_a, user_id_b')
        .eq('match_id', matchId)
        .single()

      if (matchData) {
        setIsUserA(matchData.user_id_a === userId)
      }
    }
    determineUserRole()
  }, [matchId])

  //load messages
  useEffect(() => {
    api.get<Message[]>(`/api/message/${matchId}`)
      .then((data) => {
        setMessages(data)
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      })
      .catch(err => console.error(err))
  }, [matchId])

  //subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:match_${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  //fetch current user's own posts via API (backend auth handles ownership)
  const fetchMyOwnPosts = useCallback((): Promise<Post[]> => {
    return api.get<Post[]>('/api/posts')
  }, [])

  //fetch the other person's posts that the current user liked (existing endpoint)
  const fetchTheirLikedPosts = useCallback((): Promise<Post[]> => {
    return api.get<Post[]>(`/api/posts/match/${matchId}/liked`)
  }, [matchId])

  const handleOpenLikedModal = useCallback(async () => {
    setShowLikedModal(true)
    setLoadingPosts(true)
    try {
      const posts = await fetchMyOwnPosts()
      setMyPosts(posts)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPosts(false)
    }
  }, [fetchMyOwnPosts])

  const handleOpenTradeModal = useCallback(async () => {
    setSelectedMyPost(null)
    setSelectedTheirPost(null)
    setShowTradeModal(true)
    setLoadingPosts(true)

    //use allSettled so one failure doesn't wipe out the other result
    const [myResult, theirResult] = await Promise.allSettled([
      fetchMyOwnPosts(),
      fetchTheirLikedPosts(),
    ])

    if (myResult.status === 'fulfilled') setMyPosts(myResult.value)
    if (theirResult.status === 'fulfilled') setTheirLikedPosts(theirResult.value)

    setLoadingPosts(false)
  }, [fetchMyOwnPosts, fetchTheirLikedPosts])

  const handleSubmitTrade = async () => {
    if (!selectedMyPost || !selectedTheirPost) return
    setSubmittingTrade(true)
    try {
      await tradeService.createTrade({
        matchId: matchIdNum,
        postIdA: selectedMyPost.post_id,
        postIdB: selectedTheirPost.post_id,
      })
      DeviceEventEmitter.emit('postCreated');
      setShowTradeModal(false)
      Alert.alert('Trade Proposed!', 'Your trade has been sent. Check the Trades tab for updates.')
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create trade')
    } finally {
      setSubmittingTrade(false)
    }
  }

  async function handleSend() {
    const content = newMessage.trim()
    if (!content) return
    setSending(true)
    try {
      await api.post(`/api/message/${matchId}`, { messageContent: content })
      setNewMessage('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  function isMine(message: Message): boolean {
    if (isUserA === null) return false
    return isUserA ? message.message_sent_by_user_a : !message.message_sent_by_user_a
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const canProposeTrade = !!selectedMyPost && !!selectedTheirPost

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUsername,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#6b21a8',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <View style={styles.headerBtns}>
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenLikedModal}>
                <Text style={styles.headerIconText}>♡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={handleOpenTradeModal}>
                <Text style={styles.headerIconText}>⇄</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const mine = isMine(item)
            return (
              <View style={[styles.messageRow, mine ? styles.myRow : styles.theirRow]}>
                <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.bubbleText, mine ? styles.myText : styles.theirText]}>
                    {item.message_content}
                  </Text>
                  <Text style={[styles.timeText, mine ? styles.myTime : styles.theirTime]}>
                    {formatTime(item.message_created_at)}
                  </Text>
                </View>
              </View>
            )
          }}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#c4b5d4"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Liked Posts Modal — shows your posts (♡ button) */}
      <Modal
        visible={showLikedModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLikedModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Posts</Text>
            <TouchableOpacity onPress={() => setShowLikedModal(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>Posts the other person could trade for</Text>

          {loadingPosts ? (
            <ActivityIndicator color="#6b21a8" style={styles.loader} />
          ) : myPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>You haven&apos;t posted anything yet</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.postGrid}>
              {myPosts.map(post => (
                <View key={post.post_id} style={styles.postCardViewOnly}>
                  <Image source={{ uri: post.post_image_url }} style={styles.postThumb} />
                  <Text style={styles.postCardTitle} numberOfLines={1}>{post.post_title}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Trade Form Modal — (⇄ button) */}
      <Modal
        visible={showTradeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTradeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Propose a Trade</Text>
            <TouchableOpacity onPress={() => setShowTradeModal(false)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingPosts ? (
            <ActivityIndicator color="#6b21a8" style={styles.loader} />
          ) : (
            <ScrollView contentContainerStyle={styles.tradeScroll}>
              {/* Your offer */}
              <Text style={styles.sectionLabel}>Your Offer</Text>
              <Text style={styles.sectionHint}>Pick one of your posts to trade away</Text>
              {myPosts.length === 0 ? (
                <Text style={styles.sectionEmpty}>You haven&apos;t posted anything yet</Text>
              ) : (
                <View style={styles.postGrid}>
                  {myPosts.map(post => (
                    <PostSelectCard
                      key={post.post_id}
                      post={post}
                      selected={selectedMyPost?.post_id === post.post_id}
                      onSelect={setSelectedMyPost}
                    />
                  ))}
                </View>
              )}

              <View style={styles.tradeDivider} />

              {/* What you want */}
              <Text style={styles.sectionLabel}>You Want</Text>
              <Text style={styles.sectionHint}>Pick one of their posts you liked</Text>
              {theirLikedPosts.length === 0 ? (
                <Text style={styles.sectionEmpty}>You haven&apos;t liked any of their posts yet</Text>
              ) : (
                <View style={styles.postGrid}>
                  {theirLikedPosts.map(post => (
                    <PostSelectCard
                      key={post.post_id}
                      post={post}
                      selected={selectedTheirPost?.post_id === post.post_id}
                      onSelect={setSelectedTheirPost}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.tradeFooter}>
            {selectedMyPost && selectedTheirPost && (
              <View style={styles.tradePreview}>
                <Image source={{ uri: selectedMyPost.post_image_url }} style={styles.previewThumb} />
                <Text style={styles.tradeArrow}>⇄</Text>
                <Image source={{ uri: selectedTheirPost.post_image_url }} style={styles.previewThumb} />
              </View>
            )}
            <TouchableOpacity
              style={[styles.proposeBtn, !canProposeTrade && styles.proposeBtnDisabled]}
              onPress={handleSubmitTrade}
              disabled={!canProposeTrade || submittingTrade}
            >
              {submittingTrade ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.proposeBtnText}>Propose Trade</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const POST_CARD_SIZE = 155

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fce4ec',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  theirRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#6b21a8',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: 'white',
  },
  theirText: {
    color: '#6b21a8',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  myTime: {
    color: '#d8b4fe',
    textAlign: 'right',
  },
  theirTime: {
    color: '#a78bca',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9a8d4',
    backgroundColor: 'white',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fce4ec',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingTop: 15,
    fontSize: 15,
    color: '#6b21a8',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d8b4fe',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  //header
  headerBtns: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
    color: '#6b21a8',
  },

  //modal shared
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#6b21a8',
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // post grid
  postGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  postCard: {
    width: POST_CARD_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
    backgroundColor: '#f9fafb',
  },
  postCardSelected: {
    borderColor: '#6b21a8',
  },
  postCardViewOnly: {
    width: POST_CARD_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  postThumb: {
    width: '100%',
    height: POST_CARD_SIZE,
    resizeMode: 'cover',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  postCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 8,
    paddingTop: 6,
  },

  // trade form
  tradeScroll: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    marginBottom: 2,
    marginTop: 16,
  },
  sectionHint: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionEmpty: {
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  tradeDivider: {
    height: 1,
    backgroundColor: '#f3e8ff',
    marginHorizontal: 20,
    marginTop: 20,
  },

  //trade footer
  tradeFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#f3e8ff',
    gap: 12,
  },
  tradePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  tradeArrow: {
    fontSize: 22,
    color: '#6b21a8',
    fontWeight: '600',
  },
  proposeBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposeBtnDisabled: {
    backgroundColor: '#d8b4fe',
  },
  proposeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
})
