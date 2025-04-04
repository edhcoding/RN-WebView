import queryString from 'query-string';
import React, {useCallback, useMemo, useState} from 'react';
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
});

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');

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
      <body>
        <!-- 1. The <iframe> (and video player) will replace this <div> tag. -->
        <div id="player"></div>

        <script>
          // 2. This code loads the IFrame Player API code asynchronously.
          var tag = document.createElement('script');

          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          // 3. This function creates an <iframe> (and YouTube player)
          //    after the API code downloads.
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
                'onStateChange': onPlayerStateChange
              }
            });
          }

          // 4. The API will call this function when the video player is ready.
          function onPlayerReady(event) {
            event.target.playVideo();
          }

          // 5. The API calls this function when the player's state changes.
          //    The function indicates that when playing a video (state=1),
          //    the player should play for six seconds and then stop.
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

    return {html};
  }, [youtubeId]);

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
        {youtubeId.length > 0 && <WebView source={{html: source.html}} />}
      </View>
    </SafeAreaView>
  );
}
