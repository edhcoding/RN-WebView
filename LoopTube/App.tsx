import queryString from 'query-string';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  PanResponder,
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
    marginHorizontal: 54,
  },
  timeText: {
    color: '#AEAEB2',
    alignSelf: 'flex-end',
    marginTop: 15,
    marginRight: 20,
    fontSize: 13,
  },
  seekBarBackground: {
    height: 3,
    backgroundColor: '#D4D4D4',
    pointerEvents: 'box-none', // 아래처럼 none으로 하게되면 프로그레스 바랑 thumb 둘다 터치 이벤트를 받지 않아짐 (box-none은 자기자신만 터치 이벤트를 받지 않고 children은 터치 이벤트를 받음)
  },
  seekBarProgress: {
    height: 3,
    backgroundColor: '#00DDA8',
    width: '0%',
    pointerEvents: 'none', // 터치 이벤트를 받지 않도록 설정 (프로그레스바 클릭하면 thumb가 이동함, 프로그레스 영역 클릭하면 thumb가 이동함)
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    borderRadius: 14 / 2,
    backgroundColor: '#00DDA8',
    position: 'absolute',
    top: (-14 + 3) / 2,
  },
  repeat: {
    width: 14,
    height: 14,
    borderRadius: 14 / 2,
    backgroundColor: 'red',
    position: 'absolute',
    top: (-14 + 3) / 2,
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
  const seekBarAnimRef = useRef(new Animated.Value(0));

  const [url, setUrl] = useState<string>('');
  const [youtubeId, setYoutubeId] = useState<string>('');

  const [playing, setPlaying] = useState<boolean>(false);
  const [durationInSec, setDurationInSec] = useState<number>(0);
  const [currentTimeInSec, setCurrentTimeInSec] = useState<number>(0);

  // 구간반복 저장 state
  const [repeatStartInSec, setRepeatStartInSec] = useState<number | null>(null); // 초기값으로 start나 end나 0으로 주게되면 기본으로 0부터 설정되어 버리기 때문에 null로 초기화해서 시작
  const [repeatEndInSec, setRepeatEndInSec] = useState<number | null>(null);
  const [repeated, setRepeated] = useState<boolean>(false);

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
    return formatTime(Math.floor(currentTimeInSec));
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

  useEffect(() => {
    // seekBarAnimRef.setValue(0); 를 하게되면 문제가 발생할 수 있음, 딱딱딱 끊어지는 효과가 발생할 수 있음, 스무스하게 하려면 Animated.timing 사용
    // timing의 첫번째 인자로 value, 두번째 인자로 config 객체 전달
    // 값을 조정하고 싶은 값을 넣어주고, 원하는 시간을 넣어주고, 애니메이션 효과를 주고 싶으면 useNativeDriver를 false로 설정
    Animated.timing(seekBarAnimRef.current, {
      toValue: currentTimeInSec, // 애니메이션 효과를 주고 싶은 값, value를 바꿔주는건데 currentTimeInSec 값으로 변경 (목표값, 애니메이션이 도달해야 할 최종값)
      duration: 50, // 50ms 마다 애니메이션 효과 적용 (애니메이션 지속시간)
      useNativeDriver: false, // 애니메이션을 처리를 플랫폼(Android, iOS)에게 넘길 것인지 선택, true로 설정시 애니메이션 처리가 브릿지를 통하지 않아 성능 향상이 있지만 지원되는 애니메이션에서만 사용 가능 (네이티브 드라이버 사용 여부)
    }).start();
  }, [currentTimeInSec]);

  const durationInSecRef = useRef(durationInSec); // 이렇게만 작성하면 durationInSec이 바뀔 때마다 durationInSecRef에 안들어감, useRef에 들어가는 값은 맨 처음에 한 번만 들어가기 때문임
  // 그렇기 때문에 durationInSec가 바뀔때마다 넣어줘야함
  durationInSecRef.current = durationInSec;

  const panResponder = useRef(
    PanResponder.create({
      // panResponder를 시작할 때 panResponder에게 응답할건지 말건지 결정 (항상 터지 가능하게 할거니까 기본으로 true로 설정하겠음)
      onStartShouldSetPanResponder: () => true,
      // 움직일 때 잡을것인가 말것인가
      onMoveShouldSetPanResponder: () => true,
      // 유저가 터치를 시작했을 때의 이벤트
      onPanResponderGrant: () => {
        // 비디오 정지
        webviewRef.current?.injectJavaScript('player.pauseVideo(); true;');
      },
      // 유저가 움직일 때
      onPanResponderMove: (event, gestureEvent) => {
        // seekBarThumb 위치 변경
        // gestureEvent.moveX - 이동한 곳의 x좌표, YT_WIDTH - 영상의 너비
        // 여기서 durationInSec을 곱해주면 되는데 durationInSec는 state를 쓰는경우에 나중에 durationInSec가 바뀌었을 때 create에 넣은 값은 바뀌지 않았기 때문에 계속 옛날 시점의 durationInSec을 사용하게됨
        // 해결 - 여기서는 state를 사용하면 안되고 useRef를 이용해서 이 함수내에서 현재시간을 가져올 수 있도록 해야함
        const newTimeInSec =
          (gestureEvent.moveX / YT_WIDTH) * durationInSecRef.current; // useRef는 한 번만 실행돼서 create를 선언했을때 옛날 durationInSec 값으로 고정되는데 대신에 durationInSecRef.current로 작성하면 계속해서 current를 외부에서 가지고 오기 때문에 계속 최신의 데이터를 가지고 올 수 있음
        // 위 식은 전체너비에서 이동한 x 값만큼의 비율을 구한다음에 비디오의 전체 시간을 곱해서 계산하면 새로운 시간을 구할 수 있음

        seekBarAnimRef.current.setValue(newTimeInSec);
      },
      // 유저가 손을 놓았을 때
      onPanResponderRelease: (event, gestureEvent) => {
        // seek 이동 - 이동 시점을 알아야함 (위랑 똑같이 구현)
        const newTimeInSec =
          (gestureEvent.moveX / YT_WIDTH) * durationInSecRef.current;

        webviewRef.current?.injectJavaScript(
          `player.seekTo(${newTimeInSec}, true); true;`,
        );
        // 비디오 재생
        webviewRef.current?.injectJavaScript('player.playVideo(); true;');
      },
    }),
  ).current;

  const onPressSetRepeatTime = useCallback(() => {
    if (repeatStartInSec == null) {
      setRepeatStartInSec(currentTimeInSec);
    } else if (repeatEndInSec == null) {
      setRepeatEndInSec(currentTimeInSec);
    } else {
      setRepeatStartInSec(null);
      setRepeatEndInSec(null);
    }
  }, [currentTimeInSec, repeatEndInSec, repeatStartInSec]);

  const onPressRepeat = useCallback(() => {
    setRepeated(prev => !prev);
  }, []);

  useEffect(() => {
    // repeated가 true일 때 현재 시간이 설정된 시간 밖으로 벗어나면 설정된 구간으로 돌아오도록해서 재생
    if (repeated && repeatStartInSec != null && repeatEndInSec != null) {
      // 재생되는 시간이 repeatEndInSec 보다 크면 구간 반복 시작
      if (currentTimeInSec > repeatEndInSec) {
        webviewRef.current?.injectJavaScript(
          `player.seekTo(${repeatStartInSec}, true); true;`,
        );
      }
    }
  }, [currentTimeInSec, repeatEndInSec, repeatStartInSec, repeated]);

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
                setPlaying(data === 1); // 주의! 숫자 1로 비교
              } else if (type === 'duration') {
                setDurationInSec(data);
              } else if (type === 'current-time') {
                setCurrentTimeInSec(data);
              }
            }}
          />
        )}
      </View>
      {/* panResponder사용법, View에 panResponder를 스프레드해주고 panHandlers를 전부 꺼내서 View에 적용 (panHandlers에 여러 property가 있는데 그걸 다 꺼내서 View에 적용) */}
      <View style={styles.seekBarBackground} {...panResponder.panHandlers}>
        {/* 애니메이션으로 점점 채워지는 효과를 만들거기 때문에 Animated.View 사용 */}
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
        {/* 구간 반복 표시를 위해 seekbar 위에 작성 */}
        {repeatStartInSec != null && (
          // 구간 반복 시작
          <View
            style={[
              styles.repeat,
              {
                left: (repeatStartInSec / durationInSec) * YT_WIDTH, // repeatStartInSec 에서 전체 시간으로 비율을 구하고 너비만큼 곱해서 좌표를 구함
              },
            ]}
          />
        )}
        {repeatEndInSec != null && (
          // 구간 반복 끝
          <View
            style={[
              styles.repeat,
              {
                left: (repeatEndInSec / durationInSec) * YT_WIDTH,
              },
            ]}
          />
        )}
      </View>
      <Text
        style={styles.timeText}>{`${currentTimeText} / ${durationText}`}</Text>
      <View style={styles.controller}>
        <TouchableOpacity onPress={onPressSetRepeatTime}>
          <Icon name="data-array" size={28} color="#D9D9D9" />
        </TouchableOpacity>
        {playing ? (
          <TouchableOpacity style={styles.playButton} onPress={onPressPause}>
            <Icon name="pause-circle" size={41.67} color="#E5E5EA" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.playButton} onPress={onPressPlay}>
            <Icon name="play-circle" size={39.58} color="#00DDA8" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onPressRepeat}>
          <Icon
            name="repeat"
            size={28}
            color={repeated ? '#00DDA8' : '#E5E5EA'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
