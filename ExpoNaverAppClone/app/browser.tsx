import { useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";

const styles = StyleSheet.create({
  safearea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flex: 1,
    backgroundColor: "black",
  },
  urlContainer: {
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
  },
  urlText: {
    color: "white",
  },
  loadingBarBackground: {
    height: 3,
    backgroundColor: "white",
  },
  loadingBar: {
    height: "100%",
    backgroundColor: "green",
  },
});

export default function BrowserScreen() {
  // index.tsx에서 넘겨준 파라미터 사용하려면 useLocalSearchParams를 사용해야 함
  const { initialUrl } = useLocalSearchParams();

  // 주소 저장 state
  const [url, setUrl] = useState<string>(initialUrl as string);

  // replace 메서드는 첫 번째 인자를 두 번째 인자로 변경
  const urlTitle = useMemo(
    () => url.replace("https://", "").split("/")[0],
    [url],
  );

  // Animated.Value를 0으로 초기화해서 progressAnim에 ref로 저장
  const progressAnim = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.urlContainer}>
        <Text style={styles.urlText}>{urlTitle}</Text>
      </View>
      <View style={styles.loadingBarBackground}>
        <Animated.View
          style={[
            styles.loadingBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <WebView
        source={{ uri: initialUrl as string }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // 웹 페이지가 변경될 때 마다 주소 트리거 해줘야함 (현재 접속된 주소를 트리거)
        onNavigationStateChange={(e) => setUrl(e.url)}
        // webview 로딩 퍼센트
        onLoadProgress={(e) => progressAnim.setValue(e.nativeEvent.progress)}
        // 로딩 끝날때 한번 실행됨 (로딩바 없애기 위함)
        onLoadEnd={() => progressAnim.setValue(0)}
      />
    </SafeAreaView>
  );
}
