import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import queryString from 'query-string';
import WebView from 'react-native-webview';

const YT_WIDTH = Dimensions.get('window').width;
const YT_HEIGHT = (9 / 16) * YT_WIDTH;

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    backgroundColor: '#242424',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  inputContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    fontSize: 15,
    color: '#AEAEB2',
    flex: 1,
    marginRight: 4,
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
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#AEAEB2',
    alignSelf: 'flex-end',
    fontSize: 13,
    marginTop: 15,
    marginRight: 20,
  },
  seekBarBackground: {
    height: 3,
    backgroundColor: '#D4D4D4',
    pointerEvents: 'box-none',
  },
  seekBarProgress: {
    height: 3,
    backgroundColor: '#00DDA8',
    width: '0%',
    pointerEvents: 'none',
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    backgroundColor: '#00DDA8',
    borderRadius: 14 / 2,
    position: 'absolute',
    top: (-14 + 3) / 2,
  },
});

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
};

// https://www.youtube.com/watch?v=UKAk_FP1SQg
export default function App() {
  const webViewRef = useRef<WebView | null>(null);
  const seekBarAnimRef = useRef(new Animated.Value(0));

  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');
  const [playing, setPlaying] = useState<boolean>(false);
  const [durationInSec, setDurationInSec] = useState<number>(0);
  const [currentTimeInSec, setCurrentTimeInSec] = useState<number>(0);

  const onPressOpenLink = useCallback(() => {
    const {
      query: { v },
    } = queryString.parseUrl(url);

    if (typeof v === 'string') {
      setYoutubeId(v);
    } else {
      Alert.alert('올바른 유튜브 주소를 입력해주세요.');
    }
  }, [url]);

  const source = useMemo(() => {
    const html = /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>
      <body style='margin: 0; padding: 0;'>
        <div id="player"></div>

        <script>
          var tag = document.createElement('script');

          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '${YT_HEIGHT}', // 수정
              width: '${YT_WIDTH}', // 수정
              videoId: '${youtubeId}', // 수정
              playerVars: {
                'playsinline': 1
              },
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
          }

          function postMessageToRN(type, data) {
            const message = JSON.stringify({ type, data });
            window.ReactNativeWebView.postMessage(message);
          }

          function onPlayerReady(event) {
            postMessageToRN('duration', player.getDuration());
          }

          function onPlayerStateChange(event) {
            postMessageToRN('player-state', event.data);
          }
        </script>
      </body>
    </html>
    `;

    return { html };
  }, [youtubeId]);

  const onPressPlay = useCallback(() => {
    if (webViewRef.current != null) {
      webViewRef.current.injectJavaScript('player.playVideo(); true;');
    }
  }, []);

  const onPressPause = useCallback(() => {
    if (webViewRef.current != null) {
      webViewRef.current.injectJavaScript('player.pauseVideo(); true;');
    }
  }, []);

  const durationText = useMemo(
    () => formatTime(Math.floor(durationInSec)),
    [durationInSec],
  );

  const currentTimeText = useMemo(
    () => formatTime(Math.floor(currentTimeInSec)),
    [currentTimeInSec],
  );

  useEffect(() => {
    if (playing) {
      const id = setInterval(() => {
        if (webViewRef.current != null) {
          webViewRef.current.injectJavaScript(
            'postMessageToRN("current-time", player.getCurrentTime()); true;',
          );
        }
      }, 50);

      return () => clearInterval(id);
    }
  }, [playing]);

  useEffect(() => {
    // seekBarAnimRef.current.setValue(currentTimeInSec); 이렇게 작성하면 50ms마다 값이 변경되는걸 감지해서 setValue로 값을 넣어주는거라서 뚝뚝 끊기는 효과가 나옴
    Animated.timing(seekBarAnimRef.current, {
      toValue: currentTimeInSec,
      duration: 50,
      useNativeDriver: false,
    }).start();
  }, [currentTimeInSec]);

  const durationInSecRef = useRef(durationInSec);
  durationInSecRef.current = durationInSec;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        webViewRef.current?.injectJavaScript('player.pauseVideo(); true;');
      },
      onPanResponderMove: (event, gestureState) => {
        const newTimeInSec =
          (gestureState.moveX / YT_WIDTH) * durationInSecRef.current;

        seekBarAnimRef.current.setValue(newTimeInSec);
      },
      onPanResponderRelease: (event, gestureState) => {
        const newTimeInSec =
          (gestureState.moveX / YT_WIDTH) * durationInSecRef.current;

        webViewRef.current?.injectJavaScript(
          `player.seekTo(${newTimeInSec}, true);`,
        );

        webViewRef.current?.injectJavaScript('player.playVideo(); true;');
      },
    }),
  ).current; // App.tsx가 마운트 될 때 생성되도록

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="클릭하여 링크를 사입하세요."
          placeholderTextColor="#AEAEB2"
          value={url}
          onChangeText={text => setUrl(text)}
          inputMode="url"
        />
        <TouchableOpacity
          onPress={onPressOpenLink}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="add-link" size={24} color="#AEAEB2" />
        </TouchableOpacity>
      </View>
      <View style={styles.youtubeContainer}>
        {youtubeId.length > 0 && (
          <WebView
            ref={webViewRef}
            source={{ html: source.html }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            onMessage={event => {
              const { type, data } = JSON.parse(event.nativeEvent.data);

              if (type === 'player-state') {
                setPlaying(data === 1);
              } else if (type === 'duration') {
                setDurationInSec(data);
              } else if (type === 'current-time') {
                setCurrentTimeInSec(data);
              }
            }}
          />
        )}
      </View>
      <View style={styles.seekBarBackground} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.seekBarProgress,
            {
              width: seekBarAnimRef.current.interpolate({
                inputRange: [0, durationInSec],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.seekBarThumb,
            {
              left: seekBarAnimRef.current.interpolate({
                inputRange: [0, durationInSec],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
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
