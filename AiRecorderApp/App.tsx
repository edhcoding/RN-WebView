import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
});

export default function App() {
  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        source={{
          uri: 'https://ff9e-125-139-208-49.ngrok-free.app',
        }}
      />
    </SafeAreaView>
  );
}
