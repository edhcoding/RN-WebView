import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
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
});
// https://www.youtube.com/watch?v=UKAk_FP1SQg
export default function App() {
  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');

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

          function onPlayerReady(event) {
            event.target.playVideo();
          }

          var done = false;
          function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING && !done) {
              setTimeout(stopVideo, 6000);
              done = true;
            }
          }
          function stopVideo() {
            player.stopVideo();
          }
        </script>
      </body>
    </html>
    `;

    return { html };
  }, [youtubeId]);

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
            source={{ html: source.html }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
