import queryString from 'query-string';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
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
  timeText: {
    color: '#AEAEB2',
    alignSelf: 'flex-end',
    marginTop: 15,
    marginRight: 20,
    fontSize: 13,
  },
});

const formatTime = (seconds: number) => {
  // 19 -> 00:19
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};

export default function App() {
  const webviewRef = useRef<WebView | null>(null);
  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');

  const [playing, setPlaying] = useState<boolean>(false);
  const [durationInSec, setDurationInSec] = useState<number>(0);
  const [currentTimeInSec, setCurrentTimeInSec] = useState<number>(0);

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

          function postMessageToRN(type, data) {
            const message = JSON.stringify({ type, data });
            window.ReactNativeWebView.postMessage(message);
          }

          function onPlayerReady(event) {
            // 이곳에서 영상 길이에 대한 정보를 가지고 오려고 player.getDuration() 으로 postMessage를 보내려고 하는데 이미 아래에서 사용중임
            // 이렇게 여러곳에서 사용하게 되면 onMessage로 받을때 이게 재생 정보인지, 영상 길이 정보인지 헷갈림
            // 해결방법 - 프로토콜을 만들어서 데이터와 타입을 항상 보내는 형식으로 구현하면됨 (postMessageToRN)
            postMessageToRN('duration', player.getDuration());
          }

          function onPlayerStateChange(event) {
            // 웹에서 앱으로 데이터 전달 (postMessage)
            // window.ReactNativeWebView.postMessage(JSON.stringify(event.data)); // event.data가 영상의 상태를 나타냄 (수신 - 웹뷰 onmessage)
            postMessageToRN('player-state', event.data);
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

  const durationText = useMemo(() => {
    return formatTime(Math.floor(durationInSec)); // 초 단위라서 .8 이런식으로 나올 수 있음
  }, [durationInSec]);

  const currentTimeText = useMemo(() => {
    return formatTime(currentTimeInSec);
  }, [currentTimeInSec]);

  useEffect(() => {
    // 에러나와서 playing일 때만 아래 코드 실행하도록 했음 (player가 초기화 되지 않았을 때 실행하면 안되기 때문)
    if (playing) {
      // 일정한 시간동안 영상 재생 시간을 측정하고 싶음 (interval 사용)
      const id = setInterval(() => {
        if (webviewRef.current != null) {
          // 아래처럼 작성했을 때의 문제점은 player.getCurrentTime() 이걸 호출하고 실행하더라도 결과값이 나에게 오지않음 - 왜냐 단순히 그냥 호출하는거기 때문에 (웹뷰한테 보내는거기 때문에)
          // 해결방법 - 웹뷰한테 아래 코드를 실행해서 다시 앱한테 결과값을 보내줘 라는 코드를 작성해야함
          // webviewRef.current.injectJavaScript('player.getCurrentTime();');
          webviewRef.current.injectJavaScript(
            "postMessageToRN('current-time', player.getCurrentTime()); true;", // postMessageToRN 함수를 호출해서 타입은 current-time, 데이터는 player.getCurrentTime() 이걸 보내줘 라고 실행해야함
          );
        }
      }, 50);

      return () => clearInterval(id);
    }
  }, [playing]);

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
              // setPlaying(e.nativeEvent.data === '1'); // 주의할 점이 data가 문자열로 와서 1 말고 '1' 이렇게 와야함 (postMessageToRN 작성 전)
              const {type, data} = JSON.parse(e.nativeEvent.data);
              if (type === 'player-state') {
                setPlaying(data === '1');
              } else if (type === 'duration') {
                setDurationInSec(data);
              } else if (type === 'current-time') {
                setCurrentTimeInSec(data);
              }
            }}
          />
        )}
      </View>
      <Text
        style={styles.timeText}>{`${currentTimeText} / ${durationText}`}</Text>
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
