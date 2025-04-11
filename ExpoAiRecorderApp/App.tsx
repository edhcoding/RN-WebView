import { Audio } from 'expo-av';
import { RecordingOptionsPresets } from 'expo-av/build/Audio';
import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import * as FileSystem from 'expo-file-system'; // 파일 시스템 import 이렇게 해줘야함
import { CameraView, useCameraPermissions } from 'expo-camera';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  camera: {
    backgroundColor: 'black',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  cameraCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cameraPhotoButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 80 / 2,
    backgroundColor: 'white',
    bottom: 60,
    alignSelf: 'center',
  },
});

export default function App() {
  const webViewRef = useRef<WebView | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const [audioPermissionResponse, requestAudioPermission] =
    Audio.usePermissions();
  const [cameraPermissionResponse, requestCameraPermission] =
    useCameraPermissions();

  const [recording, setRecording] = useState<Audio.Recording | null>();
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);

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

  const openCamera = useCallback(async () => {
    const response = await requestCameraPermission();

    if (response.granted) {
      setIsCameraOn(true);
    }
  }, [requestCameraPermission]);

  const closeCamera = useCallback(() => {
    setIsCameraOn(false);
  }, []);

  const onPressPhotoButton = useCallback(async () => {
    const picture = await cameraRef.current?.takePictureAsync({ quality: 0 });

    if (picture?.uri != null) {
      const base64Image = await FileSystem.readAsStringAsync(picture.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // base64만 보내는게 아니고 이미지 타입도 같이 보내줘야 웹에서 이미지로 보여줄 수 있음
      const imageDataUrl = `data:image/jpeg:base64,${base64Image}`;

      sendMessageToWebView({
        type: 'onTakePhoto',
        data: imageDataUrl,
      });
    }
  }, [sendMessageToWebView]);

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
          } else if (type === 'open-camera') {
            openCamera();
          }
        }}
      />
      {isCameraOn && (
        <View style={styles.camera}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back">
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={closeCamera}>
              <Text style={styles.cameraCloseText}>CLOSE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraPhotoButton}
              onPress={onPressPhotoButton}
            />
          </CameraView>
        </View>
      )}
    </SafeAreaView>
  );
}
