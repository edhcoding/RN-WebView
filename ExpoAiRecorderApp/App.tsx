import { Audio } from 'expo-av';
import { RecordingOptionsPresets } from 'expo-av/build/Audio';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system'; // 파일 시스템 import 이렇게 해줘야함

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default function App() {
  const webViewRef = useRef<WebView | null>(null);
  const [audioPermissionResponse, requestAudioPermission] =
    Audio.usePermissions();

  const [recording, setRecording] = useState<Audio.Recording | null>();

  const sendMessageToWebView = useCallback(
    ({ type, data }: { type: string; data?: any }) => {
      const message = JSON.stringify({ type, data });
      webViewRef.current?.postMessage(message);
    },
    [],
  );

  const startRecord = useCallback(async () => {
    const response = await requestAudioPermission();

    if (!response.granted) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(recording);
    // 녹음이 시작됬으면 웹으로 onStartRecord 메시지 보내줘야함
    sendMessageToWebView({ type: 'onStartRecord' });
  }, [requestAudioPermission, sendMessageToWebView]);

  const stopRecord = useCallback(async () => {
    if (recording != null) {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }
    // 웹으로 보내는데 그냥 바이너리 파일을 보낼 수 없음 base64로 인코딩해서 보내줘야함 (expo-file-system 사용해서 변환 가능함)
    const filePath = recording?.getURI();

    // ex) abc/recording.mp3
    if (filePath != null) {
      const ext = filePath.split('.').pop();
      const base64audio = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      sendMessageToWebView({
        type: 'onStopRecord',
        data: {
          audio: base64audio,
          mimeType: 'audio/mp4',
          ext,
        },
      });
      setRecording(null);
    }
  }, [recording, sendMessageToWebView]);

  const pauseRecord = useCallback(async () => {
    if (recording != null) {
      await recording.pauseAsync();
      sendMessageToWebView({ type: 'onPauseRecord' });
    }
  }, [recording, sendMessageToWebView]);

  const resumeRecord = useCallback(async () => {
    if (recording != null) {
      await recording.startAsync();
    }
    sendMessageToWebView({ type: 'onResumeRecord' });
  }, [recording, sendMessageToWebView]);

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://42b6-125-139-208-49.ngrok-free.app' }}
        onMessage={event => {
          const { type } = JSON.parse(event.nativeEvent.data);

          if (type === 'start-record') {
            startRecord();
          } else if (type === 'stop-record') {
            stopRecord();
          } else if (type === 'pause-record') {
            pauseRecord();
          } else if (type === 'resume-record') {
            resumeRecord();
          }
        }}
      />
    </SafeAreaView>
  );
}
