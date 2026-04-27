import { useEffect, useState, useRef } from 'react'
import { View,Text,FlatList,StyleSheet,KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { api } from "@/lib/api";
import { Stack, useLocalSearchParams } from 'expo-router'

//testing message api call to backend
type Message = {
  match_id: number;
  message_sent_by_user_a: boolean;
  message_content: string;
  message_created_at: string;
}

export default function Chat() {
  const { matchId } = useLocalSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isUserA, setIsUserA] = useState<boolean | null>(null)
  const flatListRef = useRef<FlatList<Message>>(null)

  const [otherUsername] = useState('Chat')

  // get current user id and determine if they are user_a in this match
  useEffect(() => {
    async function determineUserRole() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return;
      const userId = session.user.id;

      // fetch match to check if logged in user is user_a or user_b
      const match = await api.get<{ user_id_a: string; user_id_b: string }>(`/api/message/${matchId}`)
        .catch(() => null);

      // fall back: fetch match directly from supabase
      const { data: matchData } = await supabase
        .from('Match')
        .select('user_id_a, user_id_b')
        .eq('match_id', matchId)
        .single();

      if (matchData) {
        setIsUserA(matchData.user_id_a === userId);
      }
    }
    determineUserRole();
  }, [matchId])

  //load the messages from backend api
  useEffect(() => {
    api.get<Message[]>(`/api/message/${matchId}`)
      .then((data) => {
        setMessages(data)
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
      })
      .catch(err => console.error(err))
  }, [matchId])

  //subscribe to supabase real time
  useEffect(() => {
    const channel = supabase
      .channel(`messages:match_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]) 
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [matchId])

  // send a new message
  async function handleSend() {
    const content = newMessage.trim();
    if (!content) return;
    setSending(true);
    try {
      await api.post(`/api/message/${matchId}`, { messageContent: content });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  // determine if message was sent by the logged in user
  function isMine(message: Message): boolean {
    if (isUserA === null) return false;
    return isUserA ? message.message_sent_by_user_a : !message.message_sent_by_user_a;
  }

  // format timestamp
  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
}

  return (
    <>
    <Stack.Screen
      options={{
        title: otherUsername,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#6b21a8',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    />
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const mine = isMine(item);
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

      {/* message input bar */}
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
    </>
  )
}

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
})