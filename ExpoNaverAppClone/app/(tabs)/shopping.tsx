import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import WebView from 'react-native-webview';

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
});

const SHOPPING_HOME_URL = 'https://shopping.naver.com/';

export default function ShoppingScreen() {
  const webViewRef = useRef<WebView | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    if (webViewRef.current != null) {
      setRefreshing(true);
      webViewRef.current.reload();
    }
  }, []);

  return (
    <SafeAreaView style={styles.safearea}>
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <WebView
          ref={webViewRef}
          source={{ uri: SHOPPING_HOME_URL }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onShouldStartLoadWithRequest={request => {
            if (
              request.url.startsWith(SHOPPING_HOME_URL) ||
              request.mainDocumentURL?.startsWith(SHOPPING_HOME_URL)
            ) {
              return true;
            }

            if (request.url !== null && request.url.startsWith('https://')) {
              router.navigate({
                pathname: 'browser',
                params: { initialUrl: request.url },
              });
              return false;
            }

            return true;
          }}
          // onLoad는 웹뷰 로딩이 끝났을때 실행, onLoadEnd는 웹뷰 로딩이 성공 or 실패하든 실행됨 (취향차이)
          onLoad={() => setRefreshing(false)}
          // renderLoading은 로딩 중일때 보여줄 컴포넌트 (기본으로 흰색화면이 나와서 pull to refresh 하면 2개씩 나오니까 빈 컴포넌트로 넣어줌)(startInLoadingState 속성을 true로 설정해야 사용 가능)
          renderLoading={() => <></>}
          startInLoadingState={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
