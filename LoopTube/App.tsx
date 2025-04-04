import queryString from 'query-string';
import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import WebView from 'react-native-webview';

// 디바이스 너비 구하기
const YT_WIDTH = Dimensions.get('window').width; // window는 위에 노치는 포함 X, screen은 노치 포함
const YT_HEIGHT = YT_WIDTH * (9 / 16);

const styles = StyleSheet.create({
  safearea: {flex: 1, backgroundColor: '#242424'},
  input: {
    fontSize: 15,
    color: '#AEAEB2',
    paddingVertical: 0, // 안드로이드에는 TextInput 위아래에 여백이 주어져있음(동일하게 적용하기 위해 사용)
    flex: 1,
    marginRight: 4,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  youtubeContainer: {
    width: YT_WIDTH,
    height: YT_HEIGHT,
    backgroundColor: '#4A4A4A',
  },
  controller: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  playButton: {
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function App() {
  const webviewRef = useRef<WebView | null>(null);
  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');

  const [playing, setPlaying] = useState<boolean>(false);

  const onPressOpenLink = useCallback(() => {
    const {
      query: {v},
    } = queryString.parseUrl(url);

    if (typeof v === 'string') {
      setYoutubeId(v as string);
    } else {
      Alert.alert('잘못된 URL입니다.');
    }
  }, [url]);

  const source = useMemo(() => {
    const html = /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body style="margin: 0; padding: 0;">
        <div id="player"></div>

        <script>
          var tag = document.createElement('script');

          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '${YT_HEIGHT}', // 여기 수정
              width: '${YT_WIDTH}', // 여기 수정
              videoId: '${youtubeId}', // 여기 수정
              playerVars: {
                'playsinline': 1
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange // onStateChange를 이용해서 재생 정보 알 수 잇음
              }
            });
          }

          function onPlayerReady(event) {
          }

          function onPlayerStateChange(event) {
            // 웹에서 앱으로 데이터 전달 (postMessage)
            window.ReactNativeWebView.postMessage(JSON.stringify(event.data)); // event.data가 영상의 상태를 나타냄 (수신 - 웹뷰 onmessage)
          }
        </script>
      </body>
    </html>
  `;

    return {html};
  }, [youtubeId]);

  const onPressPlay = useCallback(() => {
    // webview에 메시지를 보내야함 => webview객체에 접근해서 injectJavaScript 사용
    if (webviewRef.current != null) {
      webviewRef.current.injectJavaScript('player.playVideo(); true;'); // true넣은거는 warning 방지용
    }
  }, []);

  const onPressPause = useCallback(() => {
    if (webviewRef.current != null) {
      webviewRef.current.injectJavaScript('player.pauseVideo(); true;'); // true넣은거는 warning 방지용
    }
  }, []);

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="클릭하여 링크를 삽입하세요"
          placeholderTextColor="#AEAEB2"
          value={url}
          onChangeText={text => setUrl(text)}
          inputMode="url" // keyboard 타입 (decimal, email, none, search, tel, text, url) - url 사용하면 키보드 스페이스 옆에 .com 이 보임(사용자 편의)
        />
        {/* TouchableOpacity의 hitSlop 속성을 사용해서 버튼의 터치 영역 늘리기 가능 */}
        <TouchableOpacity
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          onPress={onPressOpenLink}>
          <Icon name="add-link" size={24} color="#AEAEB2" />
        </TouchableOpacity>
      </View>
      <View style={styles.youtubeContainer}>
        {/* 바로 webview넣지말고 youtubeId가 있을때만 넣기 */}
        {youtubeId.length > 0 && (
          <WebView
            ref={webviewRef}
            source={{html: source.html}}
            scrollEnabled={false}
            allowsInlineMediaPlayback // 미디어 재생 인라인 허용 (iOS 전체화면 재생이 없어짐)
            mediaPlaybackRequiresUserAction={false} // 유저 액션 없이도 재생 허용
            onMessage={e => {
              // console.log(e.nativeEvent.data); // 이렇게 콘솔 찍어보면 -1, 1, 2, 3 뭐 이런식으로 재생 상태가 들어옴 (1 재생중인 상태)
              setPlaying(e.nativeEvent.data === '1'); // 주의할 점이 data가 문자열로 와서 1 말고 '1' 이렇게 와야함
            }}
          />
        )}
      </View>
      <View style={styles.controller}>
        {playing ? (
          <TouchableOpacity style={styles.playButton} onPress={onPressPause}>
            <Icon name="pause-circle" size={41.67} color="#E5E5EA" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={onPressPlay}>
            <Icon name="play-circle" size={39.58} color="#00DDA8" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
