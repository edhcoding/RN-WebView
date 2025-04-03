import { router } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    // android일 경우에는 statusbar의 높이만큼 패딩을 줌
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flex: 1,
  },
});

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
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
      />
    </SafeAreaView>
  );
}
