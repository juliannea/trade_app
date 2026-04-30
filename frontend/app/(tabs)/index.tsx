import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Platform,
    Modal,
    ScrollView,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    interpolate,
    Extrapolation,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;
const SWIPE_THRESHOLD = 100;

//types
interface BlindBoxItem {
    id: string;
    name: string;
    series: string;
    description: string;
    image: string;
    rarity?: string;
    collection: string; //brand
    collectionId: number; //collection ID from backend
}

interface Collection {
    id: string;
    name: string;
    image: string;
    collection_id?: number; //backend ID
    collection_name?: string; //backend name
}

interface BackendPost {
    post_id: number;
    post_title: string;
    post_image_url: string;
    post_caption: string;
    collection_id: number;
    user_id?: string;
    Collection: { collection_name: string } | null;
    User?: { user_name: string };
}

interface BackendCollection {
    collection_id: number;
    collection_name: string;
    collection_image_url: string;
}

interface MatchPopupData {
    matchId: number;
    userA: { username: string; profileImage: string | null };
    userB: { username: string; profileImage: string | null };
}

//helper to transform backend post to BlindBoxItem
function transformPost(post: BackendPost): BlindBoxItem {
    return {
        id: post.post_id.toString(),
        name: post.post_title,
        series: post.Collection?.collection_name || "Unknown Series",
        description: post.post_caption,
        image: post.post_image_url,
        collection: post.Collection?.collection_name || "Unknown",
        collectionId: post.collection_id,
    };
}

//helper to transform backend collection to Collection
function transformCollection(col: BackendCollection): Collection {
    return {
        id: col.collection_id.toString(),
        name: col.collection_name,
        image: col.collection_image_url,
        collection_id: col.collection_id,
        collection_name: col.collection_name,
    };
}

//swipe card
interface SwipeCardProps {
    item: BlindBoxItem;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
    isTop: boolean;
}

function SwipeCard({ item, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .enabled(isTop)
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY * 0.3;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD) {
                translateX.value = withTiming(SCREEN_WIDTH * 1.5, {}, () => {
                    "worklet";
                    onSwipeRight();
                });
            } else if (event.translationX < -SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH * 1.5, {}, () => {
                    "worklet";
                    onSwipeLeft();
                });
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => {
        const rotate = interpolate(
            translateX.value,
            [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
            [-12, 0, 12],
            Extrapolation.CLAMP,
        );
        return {
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotate: `${rotate}deg` },
            ],
        };
    });

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [0, 60],
            [0, 1],
            Extrapolation.CLAMP,
        ),
    }));
    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(
            translateX.value,
            [-60, 0],
            [1, 0],
            Extrapolation.CLAMP,
        ),
    }));

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <Animated.View
                    style={[styles.stamp, styles.likeStamp, likeOpacity]}
                >
                    <Text style={styles.likeText}>WANT</Text>
                </Animated.View>
                <Animated.View
                    style={[styles.stamp, styles.nopeStamp, nopeOpacity]}
                >
                    <Text style={styles.nopeText}>PASS</Text>
                </Animated.View>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                        defaultSource={require("../../assets/images/icon.png")}
                    />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.seriesName}>{item.series}</Text>
                    <Text style={styles.itemDescription}>
                        &ldquo;{item.description}&rdquo;
                    </Text>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

//select collections modal
interface CollectionsModalProps {
    visible: boolean;
    selected: string[];
    onClose: () => void;
    onApply: (selected: string[]) => void;
    collections: Collection[];
}

function CollectionsModal({
    visible,
    selected,
    onClose,
    onApply,
    collections,
}: CollectionsModalProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selected);

    const toggle = (id: string) => {
        setLocalSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                {/* Modal header */}
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.modalCloseBtn}
                    >
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Collections</Text>
                    <TouchableOpacity onPress={() => setLocalSelected([])}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                </View>

                {/* 2-column grid */}
                <ScrollView
                    contentContainerStyle={styles.collectionGrid}
                    showsVerticalScrollIndicator={false}
                >
                    {collections.map((col) => {
                        const isSelected = localSelected.includes(col.id);
                        return (
                            <TouchableOpacity
                                key={col.id}
                                style={[
                                    styles.collectionCell,
                                    isSelected && styles.collectionCellSelected,
                                ]}
                                onPress={() => toggle(col.id)}
                                activeOpacity={0.8}
                            >
                                <Image
                                    source={{ uri: col.image }}
                                    style={styles.collectionImage}
                                />
                                <Text
                                    style={[
                                        styles.collectionName,
                                        isSelected &&
                                            styles.collectionNameSelected,
                                    ]}
                                >
                                    {col.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Apply button */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => {
                            onApply(localSelected);
                            onClose();
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.applyBtnText}>Apply Selection</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

//filter bottomj
interface FilterSheetProps {
    visible: boolean;
    selected: string[];
    onClose: () => void;
    onApply: (selected: string[]) => void;
    onSeeAll: () => void;
    collections: Collection[];
}

function FilterSheet({
    visible,
    selected,
    onClose,
    onApply,
    onSeeAll,
    collections,
}: FilterSheetProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selected);

    const toggle = (id: string) => {
        setLocalSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    };

    //show only first 3 collections as quick-select pills
    const quickCollections = collections.slice(0, 3);

    return (
        <Modal visible={visible} transparent animationType="slide">
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose} />

            {/* Sheet */}
            <View style={styles.sheet}>
                {/* Drag handle */}
                <View style={styles.sheetHandle} />

                {/* Sheet header */}
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Filter Collections</Text>
                    <TouchableOpacity onPress={onSeeAll}>
                        <Text style={styles.seeAllText}>
                            See All Collections
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Quick-select pills */}
                <View style={styles.pillRow}>
                    {quickCollections.map((col) => {
                        const isActive = localSelected.includes(col.id);
                        return (
                            <TouchableOpacity
                                key={col.id}
                                style={[
                                    styles.pill,
                                    isActive && styles.pillActive,
                                ]}
                                onPress={() => toggle(col.id)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.pillText,
                                        isActive && styles.pillTextActive,
                                    ]}
                                >
                                    {col.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Apply button */}
                <TouchableOpacity
                    style={styles.applyBtn}
                    onPress={() => {
                        onApply(localSelected);
                        onClose();
                    }}
                    activeOpacity={0.85}
                >
                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

interface MatchPopupModalProps {
    data: MatchPopupData;
    onClose: () => void;
    onStartChat: (matchId: number) => void;
}

function MatchPopupModal({ data, onClose, onStartChat }: MatchPopupModalProps) {
    return (
        <Modal visible transparent animationType="fade">
            <View style={styles.matchOverlay}>
                <View style={styles.matchCard}>
                    <Text style={styles.matchTitle}>It&apos;s a Match!</Text>
                    <Text style={styles.matchSubtitle}>
                        You and {data.userB.username} both want to trade
                    </Text>
                    <View style={styles.matchAvatarRow}>
                        <View style={styles.matchAvatarWrap}>
                            <Image
                                source={
                                    data.userA.profileImage
                                        ? { uri: data.userA.profileImage }
                                        : require("../../assets/images/icon.png")
                                }
                                style={styles.matchAvatar}
                            />
                            <Text style={styles.matchAvatarName}>
                                {data.userA.username}
                            </Text>
                        </View>
                        <Text style={styles.matchHeart}>♥</Text>
                        <View style={styles.matchAvatarWrap}>
                            <Image
                                source={
                                    data.userB.profileImage
                                        ? { uri: data.userB.profileImage }
                                        : require("../../assets/images/icon.png")
                                }
                                style={styles.matchAvatar}
                            />
                            <Text style={styles.matchAvatarName}>
                                {data.userB.username}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.matchChatBtn}
                        onPress={() => onStartChat(data.matchId)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.matchChatBtnText}>
                            Start Chatting
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.matchKeepBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.matchKeepBtnText}>
                            Keep Swiping
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

//MAIN
export default function SwipeFeedScreen() {
    const router = useRouter();
    const [allCollections, setAllCollections] = useState<Collection[]>([]);
    const [deck, setDeck] = useState<BlindBoxItem[]>([]);
    const [activeFilters, setActiveFilters] = useState<string[]>([]);
    const [filterVisible, setFilterVisible] = useState(false);
    const [collectionsVisible, setCollectionsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [matchPopup, setMatchPopup] = useState<MatchPopupData | null>(null);

    const fetchCollections = useCallback(async () => {
        try {
            const data = await api.get<BackendCollection[]>("/api/collections");
            const transformed = data.map(transformCollection);
            setAllCollections(transformed);
        } catch (err) {
            console.error("Failed to fetch collections:", err);
            setError("Failed to load collections");
        }
    }, []);

    const fetchPosts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            //build query string with collection IDs if filters are active
            const query =
                activeFilters.length > 0
                    ? `?collectionIds=${activeFilters.join(",")}`
                    : "";

            const data = await api.get<BackendPost[]>(`/api/posts/feed${query}`);
            const transformed = data.map(transformPost);
            setDeck(transformed);
        } catch (err) {
            console.error("Failed to fetch posts:", err);
            setError("Failed to load posts");
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]);

    const applyFilters = (selected: string[]) => {
        setActiveFilters(selected);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUserId(session?.user?.id ?? null);
        });
    }, []);

    useEffect(() => {
        if (!currentUserId) return;

        async function handleNewMatch(matchRow: {
            match_id: number;
            user_id_a: string;
            user_id_b: string;
        }) {
            const { data: messages } = await supabase
                .from("Message")
                .select("match_id")
                .eq("match_id", matchRow.match_id)
                .limit(1);

            if (messages && messages.length > 0) return;

            type MatchResponse = {
                match_id: number;
                user_a: { user_name: string; user_profile_image: string | null };
                user_b: { user_name: string; user_profile_image: string | null };
            };

            const matches = await api.get<MatchResponse[]>("/api/matches");
            const match = matches.find((m) => m.match_id === matchRow.match_id);
            if (!match) return;

            setMatchPopup({
                matchId: match.match_id,
                userA: {
                    username: match.user_a.user_name,
                    profileImage: match.user_a.user_profile_image,
                },
                userB: {
                    username: match.user_b.user_name,
                    profileImage: match.user_b.user_profile_image,
                },
            });
        }

        const channel = supabase
            .channel(`match_popup_${currentUserId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "Match",
                },
                (payload) => {
                    const match = payload.new as {
                        match_id: number;
                        user_id_a: string;
                        user_id_b: string;
                    };
                    if (
                        match.user_id_a === currentUserId ||
                        match.user_id_b === currentUserId
                    ) {
                        handleNewMatch(match);
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const handleSwipeLeft = async () => {
        if (deck.length === 0) return;

        const currentPost = deck[0];
        setDeck((prev) => prev.slice(1));

        //send swipe to backend
        try {
            await api.post("/api/swipes", {
                post_id: currentPost.id,
                direction: "LEFT",
            });
        } catch (err) {
            console.error("Failed to record swipe:", err);
        }
    };

    const handleSwipeRight = async () => {
        if (deck.length === 0) return;

        const currentPost = deck[0];
        setDeck((prev) => prev.slice(1));

        try {
            await api.post("/api/swipes", {
                post_id: currentPost.id,
                direction: "RIGHT",
            });
        } catch (err) {
            console.error("Failed to record swipe:", err);
        }
    };

    //fetch collections on mount
    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    //fetch posts whenever filters change
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconText}>👤🔍</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Swipe Feed</Text>
                <TouchableOpacity
                    style={[
                        styles.iconBtn,
                        filterVisible && styles.iconBtnActive,
                    ]}
                    onPress={() => setFilterVisible(true)}
                >
                    <Text style={styles.iconText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Active filter pills (shown when filters are on) */}
            {activeFilters.length > 0 && (
                <View style={styles.activeFilterRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 8,
                            paddingHorizontal: 20,
                        }}
                    >
                        {activeFilters.map((id) => {
                            const col = allCollections.find(
                                (c: Collection) => c.id === id,
                            );
                            return (
                                <View key={id} style={styles.activeFilterPill}>
                                    <Text style={styles.activeFilterText}>
                                        {col?.name}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            applyFilters(
                                                activeFilters.filter(
                                                    (f) => f !== id,
                                                ),
                                            )
                                        }
                                    >
                                        <Text style={styles.activeFilterRemove}>
                                            ✕
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Card Stack */}
            <View style={styles.cardStack}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#E8445A" />
                ) : error ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Error</Text>
                        <Text style={styles.emptySubText}>{error}</Text>
                        <TouchableOpacity
                            onPress={fetchPosts}
                            style={styles.retryBtn}
                        >
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : deck.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No more items!</Text>
                        <Text style={styles.emptySubText}>
                            Check back later for more trades
                        </Text>
                    </View>
                ) : (
                    [...deck].reverse().map((item, index) => {
                        const isTop = index === deck.length - 1;
                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.cardWrapper,
                                    {
                                        zIndex: index,
                                        top: (deck.length - 1 - index) * 8,
                                        transform: [
                                            {
                                                scale:
                                                    1 -
                                                    (deck.length - 1 - index) *
                                                        0.03,
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <SwipeCard
                                    item={item}
                                    onSwipeLeft={handleSwipeLeft}
                                    onSwipeRight={handleSwipeRight}
                                    isTop={isTop}
                                />
                            </View>
                        );
                    })
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.actionBtnPass}
                    onPress={handleSwipeLeft}
                >
                    <Text style={styles.actionBtnText}>✕</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionBtnWant}
                    onPress={handleSwipeRight}
                >
                    <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                        ♡
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Filter Bottom Sheet */}
            <FilterSheet
                visible={filterVisible}
                selected={activeFilters}
                onClose={() => setFilterVisible(false)}
                onApply={applyFilters}
                onSeeAll={() => {
                    setFilterVisible(false);
                    setCollectionsVisible(true);
                }}
                collections={allCollections}
            />

            {/* Select Collections Full Modal */}
            <CollectionsModal
                visible={collectionsVisible}
                selected={activeFilters}
                onClose={() => setCollectionsVisible(false)}
                onApply={applyFilters}
                collections={allCollections}
            />

            {/* Match Popup */}
            {matchPopup && (
                <MatchPopupModal
                    data={matchPopup}
                    onClose={() => setMatchPopup(null)}
                    onStartChat={(matchId) => {
                        setMatchPopup(null);
                        router.push(`/chat/${matchId}`);
                    }}
                />
            )}
        </View>
    );
}

//styling
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },

    //header
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: "#F5F5F7",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        letterSpacing: -0.3,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    iconBtnActive: {
        backgroundColor: "#FFE8EC",
        borderWidth: 1.5,
        borderColor: "#E8445A",
    },
    iconText: {
        fontSize: 14,
    },

    //active filters
    activeFilterRow: {
        marginBottom: 8,
    },
    activeFilterPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#FFE8EC",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#E8445A",
    },
    activeFilterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E8445A",
    },
    activeFilterRemove: {
        fontSize: 11,
        color: "#E8445A",
        fontWeight: "700",
    },

    //cards
    cardStack: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    cardWrapper: {
        position: "absolute",
        alignItems: "center",
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: "#fff",
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    imageContainer: {
        width: "100%",
        height: SCREEN_HEIGHT * 0.42,
        backgroundColor: "#EEE",
    },
    cardImage: {
        width: "100%",
        height: "100%",
    },
    cardInfo: {
        padding: 20,
        paddingBottom: 24,
    },
    itemName: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1A1A1A",
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    seriesName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E8445A",
        marginBottom: 8,
    },
    itemDescription: {
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
        lineHeight: 19,
    },

    //stamps
    stamp: {
        position: "absolute",
        top: 40,
        zIndex: 10,
        borderWidth: 3,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    likeStamp: {
        left: 20,
        borderColor: "#00C9A7",
        transform: [{ rotate: "-15deg" }],
    },
    nopeStamp: {
        right: 20,
        borderColor: "#E8445A",
        transform: [{ rotate: "15deg" }],
    },
    likeText: {
        fontSize: 24,
        fontWeight: "900",
        color: "#00C9A7",
        letterSpacing: 2,
    },
    nopeText: {
        fontSize: 24,
        fontWeight: "900",
        color: "#E8445A",
        letterSpacing: 2,
    },

    //action button
    actionRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 32,
        paddingBottom: Platform.OS === "ios" ? 110 : 90,
        paddingTop: 16,
    },
    actionBtnPass: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    actionBtnWant: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E8445A",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#E8445A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionBtnText: {
        fontSize: 24,
        color: "#E8445A",
    },

    //empty
    emptyState: {
        alignItems: "center",
        gap: 8,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    emptySubText: {
        fontSize: 14,
        color: "#888",
    },

    //filter bottom
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
        paddingTop: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#DDD",
        alignSelf: "center",
        marginBottom: 20,
    },
    sheetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E8445A",
    },
    pillRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
    },
    pill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
        backgroundColor: "#fff",
    },
    pillActive: {
        backgroundColor: "#FFE8EC",
        borderColor: "#E8445A",
    },
    pillText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#555",
    },
    pillTextActive: {
        color: "#E8445A",
    },

    //apply button
    applyBtn: {
        backgroundColor: "#E8445A",
        borderRadius: 30,
        height: 56,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#E8445A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    applyBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },

    //collections modal
    modalContainer: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: "#F5F5F7",
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    modalCloseText: {
        fontSize: 18,
        color: "#1A1A1A",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    clearAllText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E8445A",
    },
    collectionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 120,
    },
    collectionCell: {
        width: (SCREEN_WIDTH - 44) / 2,
        backgroundColor: "#fff",
        borderRadius: 20,
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: "transparent",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    collectionCellSelected: {
        borderColor: "#E8445A",
        backgroundColor: "#FFF5F7",
    },
    collectionImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 12,
        backgroundColor: "#EEE",
    },
    collectionName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    collectionNameSelected: {
        color: "#E8445A",
    },
    modalFooter: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
        paddingTop: 16,
        backgroundColor: "#F5F5F7",
        borderTopWidth: 1,
        borderTopColor: "#EBEBEB",
    },

    //retry button
    retryBtn: {
        marginTop: 16,
        backgroundColor: "#E8445A",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    retryBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },

    //match popup
    matchOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    matchCard: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 32,
        alignItems: "center",
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 28,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    matchTitle: {
        fontSize: 30,
        fontWeight: "900",
        color: "#E8445A",
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    matchSubtitle: {
        fontSize: 15,
        color: "#555",
        textAlign: "center",
        marginBottom: 28,
    },
    matchAvatarRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginBottom: 32,
    },
    matchAvatarWrap: {
        alignItems: "center",
        gap: 8,
    },
    matchAvatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: "#E8445A",
        backgroundColor: "#EEE",
    },
    matchAvatarName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    matchHeart: {
        fontSize: 32,
        color: "#E8445A",
        marginBottom: 20,
    },
    matchChatBtn: {
        width: "100%",
        backgroundColor: "#E8445A",
        borderRadius: 30,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: "#E8445A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    matchChatBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },
    matchKeepBtn: {
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    matchKeepBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#888",
    },
});
