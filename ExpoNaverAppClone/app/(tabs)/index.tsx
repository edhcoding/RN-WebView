import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useWebViewContext } from '../../components/WebViewProvider';
import useLogin from '../../hooks/useLogin';
import { useBackHandler } from '@react-native-community/hooks';

const styles = StyleSheet.create({
  safearea: {
    // android일 경우에는 statusbar의 높이만큼 패딩을 줌
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flex: 1,
  },
});

export default function HomeScreen() {
  const { addWebView } = useWebViewContext();
  // loadLoggedIn을 useeffect를 이용해서 마운트되자마자 사용하면 문제가 생길 수 있음 (reference가 안들어 와 있을 수도 있고, 웹 브라우저가 로드가 덜 되어있을 수도 있음, 안전하게 onLoadEnd에 사용)
  const { loadLoggedIn, onMessage } = useLogin();

  const webViewRef = useRef<WebView | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useBackHandler(() => {
    // true를 리턴하면 기본 백 버튼 동작이 비활성화 됨
    // 백버튼을 웹뷰 뒤로가기랑 연결해줘야함
    // 더이상 뒤로가기 할 수 없을때도 아무런 반응이 없을 수 있음
    if (canGoBack && webViewRef.current != null) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  });

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        ref={ref => {
          if (ref != null) {
            addWebView(ref);
          }
          webViewRef.current = ref;
        }}
        source={{ uri: 'https://m.naver.com' }}
        showsVerticalScrollIndicator={false} // 스크롤바 숨김
        showsHorizontalScrollIndicator={false}
        // https://www.naver.com이 아닐때 어떠한 스크린으로 네비게이션 해주기
        // onShouldStartLoadWithRequest는 true를 리턴하면 계속 웹 로딩하는거고 false를 리턴하면 로딩을 멈춤
        // 결국에 새로운 스택으로 네비게이션 해주기
        onShouldStartLoadWithRequest={request => {
          if (
            request.url.startsWith('https://m.naver.com') ||
            request.mainDocumentURL?.startsWith('https://m.naver.com')
          ) {
            return true;
          }

          if (request.url != null && request.url.startsWith('https://')) {
            router.navigate({
              pathname: 'browser',
              // 네비게이션 할 때 파라미터로 해당 주소를 넘겨줄 수 있음 (browser에서 이제 해당 주소를 받아서 웹뷰를 보여줄 수 있음)
              params: {
                initialUrl: request.url,
              },
            });
            return false;
          }

          return true;
        }}
        onLoadEnd={() => loadLoggedIn()}
        onMessage={onMessage}
        onNavigationStateChange={e => setCanGoBack(e.canGoBack)}
      />
    </SafeAreaView>
  );
}
