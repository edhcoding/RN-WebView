import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default function App() {
  return (
    <SafeAreaView style={styles.safearea}>
      <WebView source={{ uri: 'https://42b6-125-139-208-49.ngrok-free.app' }} />
    </SafeAreaView>
  );
}
