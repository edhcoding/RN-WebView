import { router } from "expo-router";
import React from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";
import WebView from "react-native-webview";

const styles = StyleSheet.create({
  safearea: {
    // android일 경우에는 statusbar의 높이만큼 패딩을 줌
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
  },
});

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        source={{ uri: "https://www.naver.com" }}
        showsVerticalScrollIndicator={false} // 스크롤바 숨김
        showsHorizontalScrollIndicator={false}
        // https://www.naver.com이 아닐때 어떠한 스크린으로 네비게이션 해주기
        // onShouldStartLoadWithRequest는 true를 리턴하면 계속 웹 로딩하는거고 false를 리턴하면 로딩을 멈춤
        onShouldStartLoadWithRequest={(request) => {
          if (
            request.url.startsWith("https://www.naver.com") ||
            request.mainDocumentURL?.startsWith("https://www.naver.com")
          ) {
            return true;
          }

          if (request.url != null && request.url.startsWith("https://")) {
            router.navigate({
              pathname: "browser",
            });
            return false;
          }

          return true;
        }}
      />
    </SafeAreaView>
  );
}
