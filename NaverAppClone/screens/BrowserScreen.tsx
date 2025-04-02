import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo, useRef, useState} from 'react';
import {Animated, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import WebView from 'react-native-webview';
import {RootStackParamList} from '../routes';

type Props = NativeStackScreenProps<RootStackParamList, 'browser'>;

const styles = StyleSheet.create({
  safearea: {flex: 1, backgroundColor: 'black'}, // safearea에도 배경색 검정색으로 안넣으면 위 아래 바깥 부분 흰색처럼보임
  urlContainer: {
    backgroundColor: 'black',
    alignItems: 'center', // align, justify 사용해서 중앙정렬
    justifyContent: 'center',
    paddingVertical: 5, // padding 위아래 5씩
  },
  urlText: {
    color: 'white',
  },
  loadingBarBackground: {
    height: 3,
    backgroundColor: 'white',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: 'green',
  },
});

export default function BrowserScreen({route}: Props) {
  const {initialUrl} = route.params;
  const [url, setUrl] = useState(initialUrl);
  // useMemo를 사용하게되면 값이 바뀌지 않는이상 이전에 저장된 값을 사용 (렌더링 할 때 마다 계산하지 않기 때문에 좋음)
  // https://를 제거, / 기준으로 나누고 앞에 있는 것을 가져옴
  const urlTitle = useMemo(
    () => url.replace('https://', '').split('/')[0],
    [url],
  );

  // 처음 browser 스크린이 렌더링되면서 animated.value 객체가 생성이되고 초기값은 0, 여기 value를 업데이트 시켜줘야함
  const progressAnim = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.urlContainer}>
        <Text style={styles.urlText}>{urlTitle}</Text>
      </View>
      <View style={styles.loadingBarBackground}>
        {/* 이제 progressAnim의 value에 값은 들어오는데 style에 적용해야함 style에 배열을 주면 여러 스타일 중첩가능함 */}
        {/* width에 넣으려는건 0에서 100%인데 progressAnim의 value에는 0~1이 들어옴 - 이것을 바꿔주는게 progressAnim.interpolate */}
        <Animated.View
          style={[
            styles.loadingBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1], // 들어오는 값은 0~1 이기 때문에 0 1
                outputRange: ['0%', '100%'], // 출력은 0% 100% 으로 하고싶음
              }),
            },
          ]}
        />
      </View>
      <WebView
        source={{uri: initialUrl}}
        onNavigationStateChange={event => {
          setUrl(event.url);
        }}
        onLoadProgress={event =>
          progressAnim.setValue(event.nativeEvent.progress)
        }
        // 로딩이 끝나면 로딩바 안보이게 하고싶음, 0으로하면 width가 0이되어 안보이게됨
        onLoadEnd={() => progressAnim.setValue(0)}
      />
    </SafeAreaView>
  );
}
