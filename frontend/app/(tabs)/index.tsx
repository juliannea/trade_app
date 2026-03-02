import React, { useState } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Platform,
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
}

//mock data
const MOCK_ITEMS: BlindBoxItem[] = [
    {
        id: "1",
        name: "Labubu – The Monsters",
        series: "Forest Concert Series",
        description:
            "Looking for a new home! Part of the limited Forest Concert series.",
        image: "https://cdn-images.farfetch-contents.com/31/78/63/51/31786351_61459894_600.jpg",
        rarity: "Limited",
    },
    {
        id: "2",
        name: "Dimoo – Space",
        series: "Space Travel Series",
        description: "Rare space edition Dimoo looking for a trade!",
        image: "https://cdn-images.farfetch-contents.com/31/78/63/51/31786351_61459894_600.jpg",
        rarity: "Rare",
    },
    {
        id: "3",
        name: "Molly – Bubble",
        series: "Bubble Mart Classic",
        description: "Mint condition classic Molly up for grabs.",
        image: "https://cdn-images.farfetch-contents.com/31/78/63/51/31786351_61459894_600.jpg",
        rarity: "Common",
    },
];

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

    //stamps
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
                {/* LIKE stamp */}
                <Animated.View
                    style={[styles.stamp, styles.likeStamp, likeOpacity]}
                >
                    <Text style={styles.likeText}>WANT</Text>
                </Animated.View>
                {/* NOPE stamp */}
                <Animated.View
                    style={[styles.stamp, styles.nopeStamp, nopeOpacity]}
                >
                    <Text style={styles.nopeText}>PASS</Text>
                </Animated.View>

                {/* Card image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: item.image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                        defaultSource={require("../../assets/images/icon.png")}
                    />
                </View>

                {/* Card info */}
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

//main screen
export default function SwipeFeedScreen() {
    const [items, setItems] = useState<BlindBoxItem[]>(MOCK_ITEMS);

    const handleSwipeLeft = () => {
        setItems((prev) => prev.slice(1));
    };

    const handleSwipeRight = () => {
        //trigger trade offer via Express API -- still need
        setItems((prev) => prev.slice(1));
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconText}>👤🔍</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Swipe Feed</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Text style={styles.iconText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            {/* Card Stack */}
            <View style={styles.cardStack}>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No more items!</Text>
                        <Text style={styles.emptySubText}>
                            Check back later for more trades
                        </Text>
                    </View>
                ) : (
                    [...items].reverse().map((item, index) => {
                        const isTop = index === items.length - 1;
                        return (
                            <View
                                key={item.id}
                                style={[
                                    styles.cardWrapper,
                                    {
                                        zIndex: index,
                                        top: (items.length - 1 - index) * 8,
                                        transform: [
                                            {
                                                scale:
                                                    1 -
                                                    (items.length - 1 - index) *
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
        </View>
    );
}

//styling
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F7",
    },

    // Header
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
    iconText: {
        fontSize: 14,
    },

    //card stack
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

    // Stamps
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

    // Action buttons
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
});
