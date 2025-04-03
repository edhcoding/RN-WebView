import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import { useWebViewContext } from '../components/WebViewProvider';

const styles = StyleSheet.create({
  safearea: {
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flex: 1,
  },
});

const LOGIN_URL = 'https://nid.naver.com/nidlogin.login';

export default function LoginScreen() {
  const { webViewRefs } = useWebViewContext();

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        source={{ uri: LOGIN_URL }}
        onNavigationStateChange={e => {
          // 로그인 하면 https://m.naver.com/ 주소로 이동하게 되는데 이걸 router.back()으로 이전 스크린으로 돌아가게 함
          // 로그인 후에 스크린이 리로드 되지 않아서 바로 반영이 안됨, 새로고침 해야 반영이 됨 (reload 해줘야함)
          // webview들을 refresh 해줘야함 - 하지만 로그인 스크린에서 webview들을 어떻게 접근할까?
          // 이미 webview는 home, browser, shopping에도 있음 이 웹뷰들을 가지고 와서 refresh 해줘야함 (전역 상태 관리)
          if (e.url === 'https://m.naver.com/') {
            webViewRefs.current.forEach(webView => {
              webView.reload();
            });
            router.back();
          }
        }}
      />
    </SafeAreaView>
  );
}
