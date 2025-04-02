import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useContext, useRef, useState} from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import WebView from 'react-native-webview';
import {RootStackParamList, RouteNames} from '../routes';
import {WebViewContext} from '../components/WebViewProvider';

type Props = NativeStackScreenProps<RootStackParamList>; // 정의한 스크린, 파라미터리스트

const styles = StyleSheet.create({
  safearea: {flex: 1},
  contentContainerStyle: {flex: 1},
});

const SHOPPING_HOME_URL = 'https://shopping.naver.com/home';

export default function ShoppingScreen({navigation}: Props) {
  const webViewRef = useRef<WebView | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    webViewRef.current?.reload();
    // 이렇게만 사용하면 계속 로딩바보임 webview에서 onLoad 속성 사용
  }, []);

  const context = useContext(WebViewContext);

  return (
    <SafeAreaView style={styles.safearea}>
      <ScrollView
        contentContainerStyle={styles.contentContainerStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <WebView
          ref={ref => {
            webViewRef.current = ref;

            if (ref != null) {
              context?.addWebView(ref);
            }
          }}
          source={{uri: SHOPPING_HOME_URL}}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          onShouldStartLoadWithRequest={request => {
            console.log(request);
            if (
              request.url.startsWith(SHOPPING_HOME_URL) ||
              request.mainDocumentURL?.startsWith(SHOPPING_HOME_URL)
            ) {
              return true;
            }

            // 'https://m.naver.com' 이 주소가 아닌 경우에는 새로운 스크린을 보여줄거임
            if (request.url != null && request.url.startsWith('https://')) {
              navigation.navigate(RouteNames.BROWSER, {
                initialUrl: request.url,
              });
              return false;
            }

            return true;
          }}
          // onLoad 는 webview가 로딩이 끝났을때 호출
          onLoad={() => {
            setRefreshing(false);
          }}
          // pull to refresh 로딩바가 상단에도 나오고 웹페이지 가운데에서 나오는데 가운데는 안보여주고싶음
          // renderLoading을 사용하려면 startInLoadingState를 true로 설정해줘야함
          renderLoading={() => <></>}
          startInLoadingState={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
