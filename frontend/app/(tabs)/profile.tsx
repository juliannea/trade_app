import { Image } from "expo-image";
import { supabase } from "@/lib/supabase";
import { Platform, StyleSheet, Text } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Button } from "react-native";
import { api } from "@/lib/api";

//testing api call to backend
type UserProfile = {
    user_id: string;
    user_name: string;
    user_first_name: string;
    user_last_name: string;
    user_email: string;
    user_phone: string;
};

export default function Profile() {
    //testing frontend to backend connection by fetching the users data
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        api.get<UserProfile>("/api/users")
            .then((data) => setUser(data))
            .catch((err) => console.error(err));
    }, []);

    //testing Supabase connection
    useEffect(() => {
        async function testConnection() {
            const { data, error } = await supabase.from("User").select("*");
            console.log("data:", data);
            console.log("error:", error);
        }
        testConnection();
    }, []);

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={
                <Image
                    source={require("@/assets/images/partial-react-logo.png")}
                    style={styles.reactLogo}
                />
            }
        >
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Welcome!</ThemedText>
                <HelloWave />
            </ThemedView>

            {/*temp sign out button and testing auth connection to backend*/}
            <ThemedView style={styles.stepContainer}>
                <Text style={{ color: "white" }}>
                    Logged in as: {user ? user.user_email : "Loading..."}
                </Text>
                <Button
                    title="Sign Out"
                    onPress={() => supabase.auth.signOut()}
                />
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: "absolute",
    },
});
