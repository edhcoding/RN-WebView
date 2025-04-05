import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
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
