import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { tradeService, TradeResponse } from "../../services/tradeService";
import { supabase } from "../../lib/supabase";

//types
type TradeStatus = "PENDING" | "COMPLETE" | "CANCELLED";

interface Trade {
    id: number;
    counterparty: string;
    status: TradeStatus;
    myItem: {
        id: number;
        name: string;
        image?: string;
    };
    theirItem: {
        id: number;
        name: string;
        image?: string;
    };
}

//status
const STATUS_CONFIG: Record<TradeStatus, { label: string; bg: string }> = {
    PENDING: { label: "PENDING", bg: "#00C9A7" },
    COMPLETE: { label: "COMPLETED", bg: "#9E9E9E" },
    CANCELLED: { label: "CANCELLED", bg: "#FF5252" },
};

//helper to transform backend response to UI format
function transformTradeData(trades: TradeResponse[], currentUserId: string): Trade[] {
    return trades.map((trade) => {
        const isUserA = trade.user_a_id === currentUserId;
        const myPost = isUserA ? trade.post_a : trade.post_b;
        const theirPost = isUserA ? trade.post_b : trade.post_a;
        const counterpartyUsername = isUserA ? trade.post_b.username : trade.post_a.username;

        return {
            id: trade.trade_id,
            counterparty: `@${counterpartyUsername}`,
            status: trade.trade_status,
            myItem: {
                id: myPost.post_id,
                name: myPost.title,
                image: myPost.image || undefined,
            },
            theirItem: {
                id: theirPost.post_id,
                name: theirPost.title,
                image: theirPost.image || undefined,
            },
        };
    });
}

function StatusBadge({ status }: { status: TradeStatus }) {
    const { label, bg } = STATUS_CONFIG[status];
    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={styles.badgeText}>{label}</Text>
        </View>
    );
}

//trade card
function TradeCard({
    trade,
    isActive,
    onConfirm,
    onCancel,
}: {
    trade: Trade;
    isActive: boolean;
    onConfirm: (id: number) => void;
    onCancel: (id: number) => void;
}) {
    return (
        <View style={styles.card}>
            {/* Header row */}
            <View style={styles.cardHeader}>
                <View style={styles.avatarRow}>
                    <View style={styles.avatar} />
                    <Text style={styles.counterparty}>
                        {trade.counterparty}
                    </Text>
                </View>
                <StatusBadge status={trade.status} />
            </View>

            <View style={styles.divider} />

            {/* Item exchange row */}
            <View style={styles.exchangeRow}>
                {/* My item: pink bg + teal border */}
                <View style={[styles.itemBox, styles.itemMine]} />

                <Text style={styles.arrow}>⇄</Text>

                {/* Their item: blue bg, no border */}
                <View style={[styles.itemBox, styles.itemTheirs]} />
            </View>

            <View style={styles.divider} />

            {/* Action buttons */}
            {isActive ? (
                <View style={styles.btnRow}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => onCancel(trade.id)}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={() => onConfirm(trade.id)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.historyFooter}>
                    <StatusBadge status={trade.status} />
                </View>
            )}
        </View>
    );
}

//screen
export default function TradesScreen() {
    const [tab, setTab] = useState<"active" | "history">("active");
    const [active, setActive] = useState<Trade[]>([]);
    const [history, setHistory] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    //fetch curr user ID
    useEffect(() => {
        const fetchUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        fetchUserId();
    }, []);

    //fetch pending trades
    const fetchPendingTrades = useCallback(async () => {
        try {
            const data = await tradeService.getPendingTrades();
            const transformed = transformTradeData(data, currentUserId);
            setActive(transformed);
        } catch (error) {
            console.error("Error fetching pending trades:", error);
            Alert.alert("Error", "Failed to load pending trades");
        }
    }, [currentUserId]);

    //fetch trade history
    const fetchTradeHistory = useCallback(async () => {
        try {
            const data = await tradeService.getTradeHistory();
            const transformed = transformTradeData(data, currentUserId);
            setHistory(transformed);
        } catch (error) {
            console.error("Error fetching trade history:", error);
            Alert.alert("Error", "Failed to load trade history");
        }
    }, [currentUserId]);

    //load trades on mount and when user ID is available
    useEffect(() => {
        if (!currentUserId) return;

        const loadTrades = async () => {
            setLoading(true);
            await Promise.all([fetchPendingTrades(), fetchTradeHistory()]);
            setLoading(false);
        };

        loadTrades();
    }, [currentUserId, fetchPendingTrades, fetchTradeHistory]);

    const handleConfirm = async (id: number) => {
        try {
            await tradeService.updateTradeStatus(id, { trade_status: "COMPLETE" });
            // Refresh both lists
            await Promise.all([fetchPendingTrades(), fetchTradeHistory()]);
            Alert.alert("Success", "Trade completed!");
        } catch (error) {
            console.error("Error confirming trade:", error);
            Alert.alert("Error", "Failed to confirm trade");
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await tradeService.updateTradeStatus(id, { trade_status: "CANCELLED" });
            // Refresh both lists
            await Promise.all([fetchPendingTrades(), fetchTradeHistory()]);
            Alert.alert("Success", "Trade cancelled");
        } catch (error) {
            console.error("Error cancelling trade:", error);
            Alert.alert("Error", "Failed to cancel trade");
        }
    };

    const trades = tab === "active" ? active : history;

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Current Trades</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>☰</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setTab("active")}
                >
                    <View style={styles.tabLabelRow}>
                        <Text
                            style={[
                                styles.tabLabel,
                                tab === "active" && styles.tabLabelActive,
                            ]}
                        >
                            Active
                        </Text>
                        {active.length > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>
                                    {active.length}
                                </Text>
                            </View>
                        )}
                    </View>
                    {tab === "active" && <View style={styles.tabUnderline} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabItem}
                    onPress={() => setTab("history")}
                >
                    <Text
                        style={[
                            styles.tabLabel,
                            tab === "history" && styles.tabLabelActive,
                        ]}
                    >
                        History
                    </Text>
                    {tab === "history" && <View style={styles.tabUnderline} />}
                </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E8445A" />
                    <Text style={styles.loadingText}>Loading trades...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                >
                    {trades.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No trades here yet</Text>
                        </View>
                    ) : (
                        trades.map((trade) => (
                            <TradeCard
                                key={trade.id}
                                trade={trade}
                                isActive={tab === "active"}
                                onConfirm={handleConfirm}
                                onCancel={handleCancel}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

//styles
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#F0F0F3",
    },

    //header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 62 : 42,
        paddingBottom: 14,
    },
    headerBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    headerBtnText: {
        fontSize: 26,
        color: "#1A1A1A",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        letterSpacing: -0.3,
    },

    //tabs
    tabBar: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 28,
        marginBottom: 14,
    },
    tabItem: {
        paddingBottom: 6,
    },
    tabLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    tabLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ABABAB",
    },
    tabLabelActive: {
        color: "#1A1A1A",
    },
    tabUnderline: {
        height: 2.5,
        backgroundColor: "#E8445A",
        borderRadius: 2,
        marginTop: 4,
    },
    tabBadge: {
        backgroundColor: "#E8445A",
        borderRadius: 10,
        minWidth: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
    tabBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
    },

    //list
    list: {
        paddingHorizontal: 16,
        paddingBottom: 110,
        gap: 14,
    },

    //card
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    avatarRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#D9D9D9",
    },
    counterparty: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1A1A",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F3",
    },

    //exchange
    exchangeRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        gap: 20,
    },
    itemBox: {
        width: 100,
        height: 100,
        borderRadius: 20,
    },
    itemMine: {
        backgroundColor: "#F9D9E7",
        borderWidth: 2.5,
        borderColor: "#00C9A7",
    },
    itemTheirs: {
        backgroundColor: "#D6E4F5",
    },
    arrow: {
        fontSize: 22,
        color: "#E8445A",
        fontWeight: "600",
    },

    //buttons
    btnRow: {
        flexDirection: "row",
        padding: 14,
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#E8E8E8",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#555",
    },
    confirmBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#E8445A",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#E8445A",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },

    //history footer
    historyFooter: {
        padding: 14,
        alignItems: "flex-start",
    },

    //badge
    badge: {
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.4,
    },

    //empty
    empty: {
        paddingTop: 80,
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#ABABAB",
    },

    //loading
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#ABABAB",
    },
});
