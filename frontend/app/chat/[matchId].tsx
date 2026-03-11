import { useEffect, useState, useRef } from 'react'
import { View,Text,FlatList,StyleSheet,KeyboardAvoidingView, Platform} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { api } from "@/lib/api";

type Message = {
  match_id: number;
  message_sent_by_user_a: boolean;
  message_content: string;
  message_created_at: string;
}

export default function Chat() {
  const { matchId } = useLocalSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const flatListRef = useRef<FlatList<Message>>(null)

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {JSON.stringify(item, null, 2)}
            </Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  messageBox: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a', 
  },
  messageText: {
    color: '#fff', 
    fontSize: 14,
  },
})