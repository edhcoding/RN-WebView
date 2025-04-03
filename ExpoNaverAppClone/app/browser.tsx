import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

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
  navigator: {
    backgroundColor: "black",
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 40,
    justifyContent: "space-between",
  },
  button: {
    width: 30,
    height: 30,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  naverIconOutline: {
    borderWidth: 1,
    borderColor: "white",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  naverIconText: {
    color: "white",
  },
});

const NavButton = ({
  iconName,
  disabled,
  onPress,
}: {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  onPress?: () => void;
}) => {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={24}
        color={disabled ? "gray" : "white"}
        style={styles.naverIconText}
      />
    </TouchableOpacity>
  );
};

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
  const webViewRef = useRef<WebView | null>(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

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
        ref={webViewRef}
        source={{ uri: initialUrl as string }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // 웹 페이지가 변경될 때 마다 주소 트리거 해줘야함 (현재 접속된 주소를 트리거)
        onNavigationStateChange={(e) => {
          setUrl(e.url);
          // 뒤로 갈 수 있는지 여부 파악 가능 (canGoBack 속성)
          setCanGoBack(e.canGoBack);
          setCanGoForward(e.canGoForward);
        }}
        // webview 로딩 퍼센트
        onLoadProgress={(e) => progressAnim.setValue(e.nativeEvent.progress)}
        // 로딩 끝날때 한번 실행됨 (로딩바 없애기 위함)
        onLoadEnd={() => progressAnim.setValue(0)}
      />
      <View style={styles.navigator}>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <View style={styles.naverIconOutline}>
            <Text style={styles.naverIconText}>N</Text>
          </View>
        </TouchableOpacity>
        {/* 이제 웹뷰에게 뒤로 가라는 명령을 하려면 webview reference에 접근해야함 */}
        <NavButton
          iconName="arrow-left"
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        />
        <NavButton
          iconName="arrow-right"
          disabled={!canGoForward}
          onPress={() => webViewRef.current?.goForward()}
        />
        <NavButton
          iconName="refresh"
          onPress={() => webViewRef.current?.reload()}
        />
      </View>
    </SafeAreaView>
  );
}
