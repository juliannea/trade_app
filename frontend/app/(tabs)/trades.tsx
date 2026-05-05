import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, ActivityIndicator, Alert, Image,
} from 'react-native'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type TradeStatus = 'PENDING' | 'COMPLETE' | 'CANCELLED'

// Shape the backend actually returns
interface BackendPost {
  post_id: number
  post_title: string
  post_image_url: string
  User: { user_name: string } | null
}

interface BackendTrade {
  trade_id: number
  trade_status: TradeStatus
  match_id: number
  trade_date_completed: string | null
  post_a: BackendPost
  post_b: BackendPost
}

// Matches API response (used to resolve counterparty name)
interface MatchInfo {
  match_id: number
  user_id_a: string
  user_id_b: string
  user_a: { user_name: string }
  user_b: { user_name: string }
}

// Flattened UI trade
interface Trade {
  id: number
  status: TradeStatus
  counterparty: string
  itemA: { id: number; title: string; image: string | null; owner: string }
  itemB: { id: number; title: string; image: string | null; owner: string }
}

const STATUS_CONFIG: Record<TradeStatus, { label: string; bg: string }> = {
  PENDING:   { label: 'PENDING',    bg: '#00C9A7' },
  COMPLETE:  { label: 'COMPLETED',  bg: '#9E9E9E' },
  CANCELLED: { label: 'CANCELLED',  bg: '#FF5252' },
}

function buildTrades(
  raw: BackendTrade[],
  matchMap: Map<number, MatchInfo>,
  currentUserId: string,
): Trade[] {
  return raw.map(t => {
    const match = matchMap.get(t.match_id)
    let counterparty = 'Unknown'
    if (match) {
      counterparty = match.user_id_a === currentUserId
        ? match.user_b.user_name
        : match.user_a.user_name
    }
    return {
      id: t.trade_id,
      status: t.trade_status,
      counterparty,
      itemA: {
        id: t.post_a.post_id,
        title: t.post_a.post_title,
        image: t.post_a.post_image_url,
        owner: t.post_a.User?.user_name ?? '',
      },
      itemB: {
        id: t.post_b.post_id,
        title: t.post_b.post_title,
        image: t.post_b.post_image_url,
        owner: t.post_b.User?.user_name ?? '',
      },
    }
  })
}

function StatusBadge({ status }: { status: TradeStatus }) {
  const { label, bg } = STATUS_CONFIG[status]
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  )
}

function ItemBox({ title, image, owner }: { title: string; image: string | null; owner: string }) {
  return (
    <View style={styles.itemBox}>
      {image ? (
        <Image source={{ uri: image }} style={styles.itemImage} />
      ) : (
        <View style={styles.itemImagePlaceholder} />
      )}
      <Text style={styles.itemTitle} numberOfLines={2}>{title}</Text>
      {owner ? <Text style={styles.itemOwner} numberOfLines={1}>@{owner}</Text> : null}
    </View>
  )
}

function TradeCard({
  trade,
  isActive,
  onConfirm,
  onCancel,
}: {
  trade: Trade
  isActive: boolean
  onConfirm: (id: number) => void
  onCancel: (id: number) => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.counterparty}>@{trade.counterparty}</Text>
        <StatusBadge status={trade.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.exchangeRow}>
        <ItemBox title={trade.itemA.title} image={trade.itemA.image} owner={trade.itemA.owner} />
        <Text style={styles.arrow}>⇄</Text>
        <ItemBox title={trade.itemB.title} image={trade.itemB.image} owner={trade.itemB.owner} />
      </View>

      <View style={styles.divider} />

      {isActive ? (
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(trade.id)} activeOpacity={0.75}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => onConfirm(trade.id)} activeOpacity={0.85}>
            <Text style={styles.confirmText}>Complete</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyFooter}>
          <StatusBadge status={trade.status} />
        </View>
      )}
    </View>
  )
}

export default function TradesScreen() {
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [active, setActive] = useState<Trade[]>([])
  const [history, setHistory] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  const loadTrades = useCallback(async () => {
    if (!currentUserId) return
    setLoading(true)
    try {
      const [pending, hist, matches] = await Promise.all([
        api.get<BackendTrade[]>('/api/trades/pending'),
        api.get<BackendTrade[]>('/api/trades/history'),
        api.get<MatchInfo[]>('/api/matches'),
      ])

      const matchMap = new Map(matches.map(m => [m.match_id, m]))
      setActive(buildTrades(pending, matchMap, currentUserId))
      setHistory(buildTrades(hist, matchMap, currentUserId))
    } catch (err) {
      console.error('Failed to load trades:', err)
      Alert.alert('Error', 'Failed to load trades')
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  const handleConfirm = (id: number) => {
    Alert.alert(
      'Complete Trade',
      'Are you sure you want to mark this trade as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await api.patch(`/api/trades/${id}`, { trade_status: 'COMPLETE' })
              await loadTrades()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete trade')
            }
          },
        },
      ],
    )
  }

  const handleCancel = (id: number) => {
    Alert.alert(
      'Cancel Trade',
      'Are you sure you want to cancel this trade?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Trade',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.patch(`/api/trades/${id}`, { trade_status: 'CANCELLED' })
              await loadTrades()
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel trade')
            }
          },
        },
      ],
    )
  }

  const trades = tab === 'active' ? active : history

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trades</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('active')}>
          <View style={styles.tabLabelRow}>
            <Text style={[styles.tabLabel, tab === 'active' && styles.tabLabelActive]}>
              Active
            </Text>
            {active.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{active.length}</Text>
              </View>
            )}
          </View>
          {tab === 'active' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setTab('history')}>
          <Text style={[styles.tabLabel, tab === 'history' && styles.tabLabelActive]}>
            History
          </Text>
          {tab === 'history' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8445A" />
          <Text style={styles.loadingText}>Loading trades...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {trades.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No trades here yet</Text>
            </View>
          ) : (
            trades.map(trade => (
              <TradeCard
                key={trade.id}
                trade={trade}
                isActive={tab === 'active'}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0F0F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 62 : 42,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  // tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 28,
    marginBottom: 14,
  },
  tabItem: {
    paddingBottom: 6,
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ABABAB',
  },
  tabLabelActive: {
    color: '#1A1A1A',
  },
  tabUnderline: {
    height: 2.5,
    backgroundColor: '#E8445A',
    borderRadius: 2,
    marginTop: 4,
  },
  tabBadge: {
    backgroundColor: '#E8445A',
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // list
  list: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 14,
  },

  // card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  counterparty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F3',
  },

  // exchange row
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 12,
  },
  arrow: {
    fontSize: 22,
    color: '#E8445A',
    fontWeight: '600',
  },

  // item box
  itemBox: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  itemImage: {
    width: 110,
    height: 110,
    borderRadius: 14,
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    maxWidth: 110,
  },
  itemOwner: {
    fontSize: 11,
    color: '#ABABAB',
    textAlign: 'center',
    maxWidth: 110,
  },

  // buttons
  btnRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8445A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8445A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // history footer
  historyFooter: {
    padding: 14,
    alignItems: 'flex-start',
  },

  // badge
  badge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
  },

  // empty / loading
  empty: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#ABABAB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ABABAB',
  },
})
