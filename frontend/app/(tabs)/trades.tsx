import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
} from "react-native";

// ── Types ──────────────────────────────────────────────────────────────────
type TradeStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";

interface TradeItem {
    id: string;
    name: string;
    series: string;
    image?: string;
}

interface Trade {
    id: string;
    counterparty: string;
    status: TradeStatus;
    myItem: TradeItem;
    theirItem: TradeItem;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_ACTIVE: Trade[] = [
    {
        id: "t1",
        counterparty: "@collector_1",
        status: "PENDING",
        myItem: { id: "i1", name: "Labubu Forest", series: "Forest Concert" },
        theirItem: { id: "i2", name: "Dimoo Space", series: "Space Travel" },
    },
    {
        id: "t2",
        counterparty: "@collector_2",
        status: "PENDING",
        myItem: { id: "i3", name: "Molly Bubble", series: "Classic" },
        theirItem: { id: "i4", name: "Skullpanda", series: "Dark Side" },
    },
    {
        id: "t3",
        counterparty: "@collector_3",
        status: "PENDING",
        myItem: { id: "i5", name: "Pucky Elf", series: "Flower World" },
        theirItem: { id: "i6", name: "Crybaby", series: "Secret Garden" },
    },
];

const MOCK_HISTORY: Trade[] = [
    {
        id: "h1",
        counterparty: "@collector_4",
        status: "COMPLETED",
        myItem: { id: "i7", name: "Hirono", series: "The Chaos" },
        theirItem: { id: "i8", name: "Zsiga", series: "Zimomo" },
    },
    {
        id: "h2",
        counterparty: "@collector_5",
        status: "DECLINED",
        myItem: { id: "i9", name: "Labubu Classic", series: "Original" },
        theirItem: { id: "i10", name: "Dimoo Baby", series: "Baby" },
    },
];

// ── Status Badge ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TradeStatus, { label: string; bg: string }> = {
    PENDING: { label: "PENDING", bg: "#00C9A7" },
    ACCEPTED: { label: "ACCEPTED", bg: "#4CAF50" },
    DECLINED: { label: "DECLINED", bg: "#FF5252" },
    COMPLETED: { label: "COMPLETED", bg: "#9E9E9E" },
};

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
    onConfirm: (id: string) => void;
    onCancel: (id: string) => void;
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
    const [active, setActive] = useState<Trade[]>(MOCK_ACTIVE);
    const [history] = useState<Trade[]>(MOCK_HISTORY);

    const handleConfirm = (id: string) =>
        setActive((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: "ACCEPTED" } : t)),
        );

    const handleCancel = (id: string) =>
        setActive((prev) => prev.filter((t) => t.id !== id));

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
});
