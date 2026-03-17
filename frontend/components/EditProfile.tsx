import { useState, useEffect } from "react";
import {Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert} from "react-native";
import { api } from "@/lib/api";
 
//testing user profile api call to backend
type EditProfileProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
  currentUser: {
    user_name: string;
    user_first_name: string;
    user_last_name: string;
    user_phone: string | null;
    user_bio: string | null;
  };
};
 
export default function EditProfile({
  visible,
  onClose,
  onSave,
  currentUser,
}: EditProfileProps) {
  //current user info
  const [userName, setUserName] = useState(currentUser.user_name ?? "");
  const [firstName, setFirstName] = useState(currentUser.user_first_name ?? "");
  const [lastName, setLastName] = useState(currentUser.user_last_name ?? "");
  const [phone, setPhone] = useState(currentUser.user_phone ?? "");
  const [bio, setBio] = useState(currentUser.user_bio ?? "");
  //saving request set to false
  const [saving, setSaving] = useState(false);

  //current user info
  useEffect(() => {
    setUserName(currentUser.user_name ?? "");
    setFirstName(currentUser.user_first_name ?? "");
    setLastName(currentUser.user_last_name ?? "");
    setPhone(currentUser.user_phone ?? "");
    setBio(currentUser.user_bio ?? "");
  }, [currentUser]);
 
  //saving function
  async function handleSave() {
    //cannot save if no username
    if (!userName.trim()) {
      Alert.alert("Username is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch("/api/users", {
        user_name: userName.trim(),
        user_first_name: firstName.trim(),
        user_last_name: lastName.trim(),
        user_phone: phone.trim() || null,
        user_bio: bio.trim() || null,
      });
      onSave(updated);
      onClose();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  }
 
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>

        {/* modal header for open and save */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#6b21a8" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
    
        <ScrollView contentContainerStyle={styles.form}>
          {/* first name field */}  
          <View style={styles.field}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor="#c4b5d4"
            />
          </View>

          {/* last name field */}  
          <View style={styles.field}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor="#c4b5d4"
            />
          </View>

          {/* username field */}  
          <View style={styles.field}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Username"
              placeholderTextColor="#c4b5d4"
              autoCapitalize="none"
            />
          </View>

          {/* bio field */}  
          <View style={styles.field}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell people about yourself..."
              placeholderTextColor="#c4b5d4"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* phone number field */}  
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#c4b5d4"
              keyboardType="phone-pad"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9a8d4",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6b21a8",
  },
  cancelText: {
    fontSize: 15,
    color: "#a78bca",
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6b21a8",
  },
  form: {
    padding: 24,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#a78bca",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#6b21a8",
    borderWidth: 1.5,
    borderColor: "#f3e8ff",
  },
  bioInput: {
    height: 90,
    textAlignVertical: "top",
  },
});