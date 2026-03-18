import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

//testing match api call to backend
type Match = {
  match_id: number;
  matched_at: string;
  match_status: string;
  user_id_a: string;
  user_id_b: string;
  user_a: { user_name: string };
  user_b: { user_name: string };
};

export default function Messages() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  //get the current user id
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentUserId(session.user.id);
    });
  }, []);

  //fetch all matches for current user
  useEffect(() => {
    api.get<Match[]>('/api/matches')
      .then((data) => setMatches(data))
      .catch((err) => console.error(err));
  }, []);

  //get the other user's username in the match
  function getOtherUsername(match: Match): string {
    if (!currentUserId) return '...';
    return currentUserId === match.user_id_a
      ? match.user_b?.user_name
      : match.user_a?.user_name;
  }

  //get initials from username
  function getInitials(username: string): string {
    return username?.[0]?.toUpperCase() ?? '?';
  }

  //format timestamp
  function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Messages</Text>
      {/* divider */}
      <View style={styles.divider} />

      {matches.length === 0 ? (
        // if no matches exist
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💌</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>Start swiping to find collectors to trade with!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.match_id.toString()}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const otherUsername = getOtherUsername(item);
            return (
              //navigate to the chat screen for this match
              <TouchableOpacity
                style={styles.matchRow}
                onPress={() => router.push(`/chat/${item.match_id}`)}
              >
                {/* avatar with initial */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(otherUsername)}</Text>
                </View>

                {/* username and matched date */}
                <View style={styles.matchInfo}>
                  <Text style={styles.username}>@{otherUsername}</Text>
                  <Text style={styles.matchedAt}>Matched {formatDate(item.matched_at)}</Text>
                </View>

                {/* arrow */}
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6b21a8',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f472b6',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  matchInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b21a8',
    marginBottom: 3,
  },
  matchedAt: {
    fontSize: 12,
    color: '#a78bca',
  },
  arrow: {
    fontSize: 24,
    color: '#a78bca',
  },
  separator: {
    height: 1,
    backgroundColor: '#f9a8d4',
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#a78bca',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  divider: {
    width: '100%',
    alignSelf: 'center',
    height: 1,
    backgroundColor: '#f9a8d4',
    opacity: 0.6,
    marginBottom: 18,
  },
});