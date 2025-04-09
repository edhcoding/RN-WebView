import React, {useCallback, useRef, useState} from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncodingOption,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import WebView from 'react-native-webview';
import Permission from 'react-native-permissions';
import RNFS from 'react-native-fs';
import {Camera, useCameraDevice} from 'react-native-vision-camera';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
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
    top: 69,
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
    bottom: 60,
    backgroundColor: 'white',
    alignSelf: 'center',
  },
});

export default function App() {
  const webViewRef = useRef<WebView | null>(null);
  const audioRecorderPlayerRef = useRef(new AudioRecorderPlayer());
  const cameraRef = useRef<Camera | null>(null);

  const [isCameraOn, setIsCameraOn] = useState<boolean>(false); // 카메라 열었는지 여부

  const device = useCameraDevice('back');

  // 메시지를 웹뷰로 보내는 함수
  const sendMessageToWebView = useCallback(
    ({type, data}: {type: string; data?: any}) => {
      const message = JSON.stringify({type, data});
      webViewRef.current?.postMessage(message);
    },
    [],
  );

  const startRecord = useCallback(async () => {
    // 안드로이드만 실행
    if (Platform.OS === 'android') {
      try {
        // 여러개 권한 요청 가능하지만 하나만 사용해서 하나만 넣음, 그냥 request 사용해도 되지만 추후에 여러개 넣을 수도 있어서 requestMultiple 사용
        const grants = await Permission.requestMultiple([
          Permission.PERMISSIONS.ANDROID.RECORD_AUDIO,
        ]);
        // grants는 객체 형식이고, 키값은 권한 이름이고 값은 권한 결과 값이다.

        console.log('write external storage', grants);

        // 결과값이 GRANTED로 권한 획득 했는지 확인
        if (
          grants[Permission.PERMISSIONS.ANDROID.RECORD_AUDIO] ===
          Permission.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    // whisper api를 썻는데 특정 포멧만 지원함, 오디오 녹음이 될 오디오의 포멧을 지정해줄거임, audioSets로 포멧 지정가능함, 첫 번째 인자는 저장 위치인데 기본값으로 하려고 undefined로 넣음
    await audioRecorderPlayerRef.current.startRecorder(undefined, {
      AVFormatIDKeyIOS: AVEncodingOption.mp4, // ios 포멧
      OutputFormatAndroid: OutputFormatAndroidType.MPEG_4, // android 포멧
      // 포멧을 통일시켜서 녹음
    });
    // ios 같은경우에는 위 코드만 작성해도 위 함수가 마이크 퍼미션까지 요청하고 권한을 얻고 녹음 시작하게 됨, 안드로이드 같은 경우에는 마시멜로 이상 버전에서는 녹음 기능을 런타임에서 요청해줘야함
    // 런타임 이라는게 앱을 실행할 때 실행하는 동안 사용자에게 명시적으로 녹음 권한을 요청해야 된다는 거임(react native permission 라이브러리 사용) (첫번째 줄)

    // 이렇게 녹음이 시작이 되고 웹뷰에다가 onStartRecord 전송

    // 이제 웹으로 onStartRecord 이벤트를 보내야 함 - 그럼 웹뷰에서 postMessage 구현 해야함
    sendMessageToWebView({type: 'onStartRecord'});
  }, [sendMessageToWebView]);

  const stopRecord = useCallback(async () => {
    // 레코드가 완료 되면 오디오 파일이 나오고 이 오디오 파일을 웹뷰로 보내야함
    // 여기서 리턴하는게 filepath임
    const filepath = await audioRecorderPlayerRef.current.stopRecorder();

    // 확장자 가지고 오는 코드 ex) "/a/b/c/recording.mp4" -> "mp4"
    const ext = filepath.split('.').pop();

    // 오디오 데이터 base64로 인코딩
    const base64audio = await RNFS.readFile(filepath, 'base64');

    // 보내줘야 할 데이터 3가지 - 오디오 데이터, 오디오 타입, 확장자
    sendMessageToWebView({
      type: 'onStopRecord',
      data: {
        audio: base64audio, // 오디오 데이터
        mimeType: 'audio/mp4', // 오디오 타입
        ext, // 확장자
      },
    });
  }, [sendMessageToWebView]);

  const pauseRecord = useCallback(async () => {
    await audioRecorderPlayerRef.current.pauseRecorder();

    sendMessageToWebView({type: 'onPauseRecord'});
  }, [sendMessageToWebView]);

  const resumeRecord = useCallback(async () => {
    await audioRecorderPlayerRef.current.resumeRecorder();

    sendMessageToWebView({type: 'onResumeRecord'});
  }, [sendMessageToWebView]);

  const openCamera = useCallback(async () => {
    const permission = await Camera.requestCameraPermission();

    if (permission === 'granted') {
      setIsCameraOn(true);
      // 카메라 페이지로 이동하게 할건데, 이전에 배운 네비게이션 이용해서 구현할 수도 있겠지만 따로 라이브러리 사용해야 하니까 그냥 카메라 버튼 클릭하면 웹뷰를 덮어버리는 방식으로 구현할 것임
    }
  }, []);

  const closeCamera = useCallback(() => {
    setIsCameraOn(false);
  }, []);

  const onPressPhotoButton = useCallback(async () => {
    // 사진 찍으려면 camera의 reference에 접근해야함, image file 리턴해줌
    const file = await cameraRef.current?.takePhoto({
      flash: 'off', // 플래시 끄기
    });

    console.log('file', file);

    if (file != null) {
      const base64Image = await RNFS.readFile(file.path, 'base64');
      const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

      sendMessageToWebView({
        type: 'onTakePhoto',
        data: imageDataUrl,
      });
    }
  }, [sendMessageToWebView]);

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        ret={webViewRef}
        source={{
          uri: 'https://49ee-125-139-208-49.ngrok-free.app',
        }}
        onMessage={event => {
          console.log(event.nativeEvent.data);
          const {type} = JSON.parse(event.nativeEvent.data);

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
        webviewDebuggingEnabled={true}
      />
      {isCameraOn && device != null && (
        <View style={styles.camera}>
          {/* device는 전면 후면 카메라, 사진 or 비디오 지원, style={StyleSheet.absoluteFill} 은 화면 꽉차게 카메라 넣음 */}
          <Camera
            ref={cameraRef}
            device={device}
            photo
            isActive
            photoQualityBalance="speed"
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            style={styles.cameraCloseButton}
            onPress={closeCamera}>
            <Text style={styles.cameraCloseText}>CLOSE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraPhotoButton}
            onPress={onPressPhotoButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
