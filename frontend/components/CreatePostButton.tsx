import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useState } from "react";
import CreatePost from "./CreatePost";

export default function CreatePostButton() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.plus}>
          <View style={styles.horizontal} />
          <View style={styles.vertical} />
        </View>
      </TouchableOpacity>

      <CreatePost
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
    button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    backgroundColor: '#6b21a8',
    },
  plus: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    position: 'absolute',
    width: 18,
    height: 2.5,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  vertical: {
    position: 'absolute',
    width: 2.5,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});