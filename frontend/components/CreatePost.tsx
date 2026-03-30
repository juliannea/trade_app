import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { api, apiRequest } from "@/lib/api";

type Collection = {
  collection_id: number;
  collection_name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreatePost({ visible, onClose }: Props) {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      api.get<Collection[]>("/api/collections")
        .then((data) => setCollections(data))
        .catch((err) => console.error(err));
    }
  }, [visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image || !title || !selectedCollection) {
      Alert.alert("Missing fields", "Please add an image, title, and collection.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      console.log("image object:", image);
      const blob = await fetch(image.uri).then(r => r.blob());
      formData.append("image", blob, image.fileName ?? `photo_${Date.now()}.jpg`);
      formData.append("post_title", title);
      formData.append("post_caption", caption);
      formData.append("collection_id", String(selectedCollection));

      await apiRequest("/api/posts", {
        method: "POST",
        body: formData,
      });

      setImage(null);
      setTitle("");
      setCaption("");
      setSelectedCollection(null);
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.heading}>New Post</Text>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <Text style={styles.imagePickerText}>+ Tap to select image</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Title"
          placeholderTextColor="#a78bca"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.captionInput]}
          placeholder="Caption (optional)"
          placeholderTextColor="#a78bca"
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <Text style={styles.label}>Collection</Text>
        <View style={styles.collectionsRow}>
          {collections.map((col) => (
            <TouchableOpacity
              key={col.collection_id}
              style={[
                styles.collectionChip,
                selectedCollection === col.collection_id && styles.collectionChipSelected,
              ]}
              onPress={() => setSelectedCollection(col.collection_id)}
            >
              <Text
                style={[
                  styles.collectionChipText,
                  selectedCollection === col.collection_id && styles.collectionChipTextSelected,
                ]}
              >
                {col.collection_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Posting..." : "Post"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 24,
    paddingTop: 60,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6b21a8",
    marginBottom: 24,
    textAlign: "center",
  },
  imagePicker: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePickerText: {
    color: "#a78bca",
    fontSize: 16,
    fontWeight: "500",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#6b21a8",
    marginBottom: 12,
  },
  captionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b21a8",
    marginBottom: 8,
  },
  collectionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  collectionChip: {
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  collectionChipSelected: {
    backgroundColor: "#6b21a8",
    borderColor: "#6b21a8",
  },
  collectionChipText: {
    fontSize: 13,
    color: "#6b21a8",
    fontWeight: "500",
  },
  collectionChipTextSelected: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#6b21a8",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: "#6b21a8",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#6b21a8",
    fontWeight: "600",
    fontSize: 16,
  },
});