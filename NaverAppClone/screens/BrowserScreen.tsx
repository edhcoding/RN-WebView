import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo, useRef, useState} from 'react';
import {
  Animated,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import {RootStackParamList} from '../routes';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
  navigator: {
    backgroundColor: 'black',
    flexDirection: 'row', // 기본값 column
    paddingVertical: 10,
    paddingHorizontal: 40,
    justifyContent: 'space-between', // 간격 똑같이 줄거임
  },
  button: {
    width: 30,
    height: 30,
    padding: 4,
    alignItems: 'center', // 중앙 정렬
    justifyContent: 'center',
  },
  naverIconOutline: {
    borderWidth: 1,
    borderColor: 'white',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  naverIconText: {
    color: 'white',
  },
});

// 하단 네비게이션 컴포넌트로 제작
const NavButton = ({
  iconName,
  disabled,
  onPress,
}: {
  iconName: string;
  disabled?: boolean;
  onPress?: () => void;
}) => {
  const color = disabled ? 'gray' : 'white';

  return (
    <TouchableOpacity
      style={styles.button}
      disabled={disabled}
      onPress={onPress}>
      <MaterialCommunityIcons name={iconName} size={24} color={color} />
    </TouchableOpacity>
  );
};

export default function BrowserScreen({route, navigation}: Props) {
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
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

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
        ref={webViewRef}
        source={{uri: initialUrl}}
        onNavigationStateChange={event => {
          setUrl(event.url);
          setCanGoBack(event.canGoBack);
          setCanGoForward(event.canGoForward);
        }}
        onLoadProgress={event =>
          progressAnim.setValue(event.nativeEvent.progress)
        }
        // 로딩이 끝나면 로딩바 안보이게 하고싶음, 0으로하면 width가 0이되어 안보이게됨
        onLoadEnd={() => progressAnim.setValue(0)}
      />
      <View style={styles.navigator}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // goBack 이전 화면으로 이동
            navigation.goBack();
          }}>
          <View style={styles.naverIconOutline}>
            <Text style={styles.naverIconText}>N</Text>
          </View>
        </TouchableOpacity>
        {/* 뒤로가기 버튼을 구현하려면 webview 객체를 가지고 오면 webview를 컨트롤 가능함 */}
        <NavButton
          iconName="arrow-left"
          disabled={!canGoBack}
          onPress={() => {
            webViewRef.current?.goBack(); // 처음에 null이라서 옵셔널 체이닝 사용, 뒤로가기가 가능한지 판단하기 위해 state 생성
          }}
        />
        <NavButton
          iconName="arrow-right"
          onPress={() => {
            webViewRef.current?.goForward();
          }}
          disabled={!canGoForward}
        />
        <NavButton
          iconName="refresh"
          onPress={() => {
            webViewRef.current?.reload();
          }}
        />
        <NavButton
          iconName="share-outline"
          onPress={() => {
            Share.share({message: url});
          }}
        />
      </View>
    </SafeAreaView>
  );
}
