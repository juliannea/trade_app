import { Image } from "expo-image";
import { supabase } from "@/lib/supabase";
import { Platform, StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";

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

    //determine user intials to display in profile picture
    const initials = user
    ? `${user.user_first_name?.[0] ?? ''}${user.user_last_name?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      contentContainerStyle={styles.container}
    >
      {/* profile picture placeholder with initials */}
      <View style={styles.pfpWrapper}>
        <View style={styles.pfp}>
          <Text style={styles.pfpText}>
            {initials}
          </Text>
        </View>
      </View>

      {/* display name and username */}
      <View style={styles.nameSection}>
        <Text style={styles.fullName}>
        {user?.user_first_name} {user?.user_last_name}
        </Text>
        <Text style={styles.userName}>@{user?.user_name}</Text>
        </View>

      {/* edit profile and share profile buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Share Profile</Text>
        </TouchableOpacity>
        </View>

      {/* divider */}
      <View style={styles.divider} />

      {/* sign out button*/}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  pfpWrapper: {
    marginBottom: 16,
  },
  pfp: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f472b6',
  },
  pfpText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  fullName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    color: '#a78bca',
  },
  loadingText: {
    fontSize: 16,
    color: '#a78bca',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f9a8d4',
    opacity: 0.6,
    marginBottom: 24,
  },
  infoSection: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  infoRow: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#f472b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: '#a78bca',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: '#6b21a8',
    fontWeight: '500',
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: '#6b21a8',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  signOutText: {
    color: '#6b21a8',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
    marginBottom: 18,
  },
  actionButton: {
    borderWidth: 1.5,
    borderColor: '#6b21a8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#6b21a8',
    fontWeight: '600',
    fontSize: 13,
  },
});