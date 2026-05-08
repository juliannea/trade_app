import { Image } from "expo-image";
import { supabase } from "@/lib/supabase";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput } from "react-native";
import { useEffect, useState, useCallback  } from "react";
import { useFocusEffect } from "expo-router";
import { RefreshControl, DeviceEventEmitter } from "react-native";
import { api } from "@/lib/api";
import EditProfile from "@/components/EditProfile";

//determine screen dimensions for post card placement
const screenWidth = Dimensions.get('window').width;
const maxWidth = Math.min(screenWidth, 900);
const numColumns = screenWidth > 600 ? 3 : 2;
const cardWidth = (maxWidth - 48 - (numColumns - 1) * 8) / numColumns;

//testing user profile api call to backend
type UserProfile = {
    user_id: string;
    user_name: string;
    user_first_name: string;
    user_last_name: string;
    user_email: string;
    user_phone: string;
    user_profile_image: string | null;
    user_created_at: string | null;
    user_bio: string | null;
    user_location: string | null;
};

//testing user post api call to backend
type UserPost = {
  post_id: number;
  post_title: string;
  post_image_url: string;
  post_caption: string;
  collection_id: number;
  Collection: { collection_name: string } | null;
};

export default function Profile() {

    //testing frontend to backend connection by fetching the users data
    const [user, setUser] = useState<UserProfile | null>(null);
    const [refreshing, setRefreshing] = useState(false);

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

    //test frontend to backend connection for fetching the posts data
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);

    useFocusEffect(
      useCallback(() => {
        api.get<UserPost[]>("/api/posts")
        .then((data) => {
          const sorted = data.sort((a, b) => b.post_id - a.post_id);
          setPosts(sorted);
        })
        .catch((err) => console.error(err));
      }, [])
    );

    //listen for the emit to know to refresh page
    useEffect(() => {
      const subscription = DeviceEventEmitter.addListener('postCreated', () => {
        api.get<UserPost[]>('/api/posts')
          .then((data) => setPosts(data))
          .catch((err) => console.error(err));
        });
      return () => subscription.remove();
    }, []);

    //listen for the emit to know to refresh page
    useEffect(() => {
      const subscription = DeviceEventEmitter.addListener('postDeleted', () => {
        api.get<UserPost[]>('/api/posts')
          .then((data) => setPosts(data))
          .catch((err) => console.error(err));
      });
      return () => subscription.remove();
    }, []);

    //to refresh page
    const onRefresh = async () => {
    setRefreshing(true);

    try {
      const data = await api.get<UserPost[]>("/api/posts");
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const [editingCaption, setEditingCaption] = useState(false);
  const [newCaption, setNewCaption] = useState('');

  //determine user intials to display in profile picture
  const initials = user
  ? `${user.user_first_name?.[0] ?? ''}${user.user_last_name?.[0] ?? ''}`.toUpperCase()
  : '?';

  //extract month and year from timestamp
  const joinedDate = user?.user_created_at
  ? `Trading since ${new Date(user.user_created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
  : null;

  //sets edit profile modal to not visible
  const [editModalVisible, setEditModalVisible] = useState(false);

  //handle post deleting
  async function handleDeletePost(postId: number | undefined) {
    if (!postId) return;
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.post_id !== postId));
      setSelectedPost(null);
      setEditingCaption(false);
      DeviceEventEmitter.emit('postDeleted');
    } catch (err) {
      console.error(err);
    }
  }

  //handle caption editing
  async function handleEditCaption(postId: number | undefined) {
    if (!postId) return;
    try {
      await api.patch(`/api/posts/${postId}/caption`, { post_caption: newCaption });
      setPosts(prev => prev.map(p => 
        p.post_id === postId ? { ...p, post_caption: newCaption } : p
      ));
      setSelectedPost(prev => prev ? { ...prev, post_caption: newCaption } : prev);
      setEditingCaption(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >

      {/* display profile picture or a placeholder with initials */}
      <View style={styles.pfpWrapper}>
        <View style={styles.pfp}>
        {user?.user_profile_image ? (
          <Image
            source={{ uri: user.user_profile_image }}
            style={{ width: 115, height: 115, borderRadius: 60 }}
          />
          ) : (
          <Text style={styles.pfpText}>{initials}</Text>
          )}
        </View>
      </View>

      <View style={styles.nameSection}>

        {/* display user's full name */}
        <Text style={styles.fullName}>
        {user?.user_first_name} {user?.user_last_name}
        </Text>
        
        {/* display username and bio */}
        <Text style={styles.userName}>@{user?.user_name}</Text>
        {user?.user_bio && (
        <Text style={styles.bio}>{user.user_bio}</Text>
        )}

        {/* display date joined and location as a badge */}
        <View style={styles.badgeRow}>
        {joinedDate && (
          <View style={styles.joinedBadge}>
            <Text style={styles.joinedBadgeText}>⏱︎ {joinedDate}</Text>
          </View>
          )}
          {user?.user_location && (
            <View style={styles.joinedBadge}>
              <Text style={styles.joinedBadgeText}>𖡡 {user.user_location}</Text>
            </View>
          )}
        </View>

      </View>

      {/* display edit profile button */}
      <View style={styles.buttonRow}>
        {/* edit profile modal is visible */}
        <TouchableOpacity style={styles.actionButton} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        </View>

      {/* divider */}
      <View style={styles.divider} />

      {/* grid for displaying a user's posts */}
      <View style={styles.postsGrid}>
        {posts.map((post) => (
          <TouchableOpacity
            key={post.post_id}
            style={styles.postCard}
            onPress={() => setSelectedPost(post)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: post.post_image_url }} style={styles.postImage} />
            <Text style={styles.postTitle} numberOfLines={1}>{post.post_title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* sign out button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* post detail modal */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="none"
        onPress={() => {
          setSelectedPost(null);
          setEditingCaption(false);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>

            {/* post close button */}
            <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setSelectedPost(null);
                  setEditingCaption(false);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            
            <Image
              source={{ uri: selectedPost?.post_image_url }}
              style={styles.modalImage}
            />
            <View style={styles.modalContent}>
              {selectedPost?.Collection?.collection_name && (
                <View style={styles.collectionBadge}>
                  <Text style={styles.collectionBadgeText}>
                    ⧉ {selectedPost.Collection.collection_name}
                  </Text>
                </View>
              )}
              <Text style={styles.modalTitle}>{selectedPost?.post_title}</Text>
              
              {/* caption that is editable */}
              {editingCaption ? (
                <View>
                  <TextInput
                    style={styles.captionInput}
                    value={newCaption}
                    onChangeText={setNewCaption}
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleEditCaption(selectedPost?.post_id)}>
                    <Text style={styles.saveCaption}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.captionRow}>
                  <Text style={styles.postCaption}>
                    {selectedPost?.post_caption || 'Add a caption...'}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setNewCaption(selectedPost?.post_caption ?? '');
                    setEditingCaption(true);
                  }}>
                    <Text style={styles.editCaptionText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* delete button */}
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.deletePostButton}
                  onPress={() => handleDeletePost(selectedPost?.post_id)}
                >
                  <Text style={styles.deletePostText}>Delete Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* edit profile modal */}
      <EditProfile
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={() => {
          api.get<UserProfile>("/api/users")
            .then((data) => setUser(data))
            .catch((err) => console.error(err));
        }}
        currentUser={{
          user_name: user?.user_name ?? '',
          user_first_name: user?.user_first_name ?? '',
          user_last_name: user?.user_last_name ?? '',
          user_phone: user?.user_phone ?? null,
          user_bio: user?.user_bio ?? null,
          user_location: user?.user_location ?? null,
          user_profile_image: user?.user_profile_image ?? null,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  pfpWrapper: {
    paddingTop: 40,
    marginBottom: 12,
  },
  pfp: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: '#6b21a8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#f472b6',
  },
  pfpText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  nameSection: {
    alignItems: 'center',
  },
  fullName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    color: '#6b21a8',
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e8445a',
    opacity: 0.6,
    marginBottom: 18,
  },
  signOutButton: {
    borderWidth: 1.5,
    borderColor: '#6b21a8',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 18,
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
  bio: {
    fontSize: 14,
    color: '#a78bca',
    textAlign: 'center',
    marginBottom: 8,
  },
  joinedBadge: {
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  joinedBadgeText: {
    fontSize: 12,
    color: '#6b21a8',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row', 
    gap: 8, 
    marginTop: 4,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    marginTop: 8,
  },
  postCard: {
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3e8ff',
  },
  postImage: {
    width: '100%',
    height: 160,
  },
  postTitle: {
    fontSize: 12,
    color: '#6b21a8',
    fontWeight: '600',
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  modalImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#f5f5f7',
  },
  modalContent: {
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  collectionBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
  },
  collectionBadgeText: {
    fontSize: 11,
    color: '#6b21a8',
    fontWeight: '500',
  },
  postCaption: {
    fontSize: 13,
    color: '#a78bca',
    lineHeight: 18,
  },
  captionInput: {
    borderWidth: 1.5,
    borderColor: '#e9d5ff',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#6b21a8',
    marginBottom: 6,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  saveCaption: {
    color: '#6b21a8',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 8,
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  deletePostButton: {
    flex: 1,
    backgroundColor: '#fce4ec',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deletePostText: {
    color: '#e11d48',
    fontWeight: '600',
    fontSize: 13,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  editCaptionText: {
    color: '#6b21a8',
    fontWeight: '600',
    fontSize: 13,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});