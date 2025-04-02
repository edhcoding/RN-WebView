import React, {useContext} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';
import {RootStackParamList} from '../routes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {WebViewContext} from '../components/WebViewProvider';

type Props = NativeStackNavigationProp<RootStackParamList>;

const styles = StyleSheet.create({
  safearea: {flex: 1, backgroundColor: 'black'},
});

const LOGIN_URL = 'https://nid.naver.com/nidlogin.login';

export default function LoginScreen() {
  const navigation = useNavigation<Props>();

  const context = useContext(WebViewContext);

  return (
    <SafeAreaView style={styles.safearea}>
      <WebView
        source={{uri: LOGIN_URL}}
        onNavigationStateChange={event => {
          // 로그인 되고 'https://www.naver.com' 주소로 이동한다면 뒤로가기 처리
          // 로그인하고 새로고침해야 로그인이 적용되기 때문에 새로고침 처리해줘야함
          // 전역으로 context api 사용해서 스크린마다 마운트될 때 마다 ref를 저장할거임
          // 저장된 reference를 이용해서 로그인 스크린에서 로그인이 완료되면 refresh 처리
          if (event.url === 'https://www.naver.com') {
            // refresh 후에 goBack 처리해야함
            if (context?.webViewRefs.current != null) {
              context.webViewRefs.current.forEach(webView => {
                webView.reload();
              });
            }

            navigation.goBack();
          }
        }}
      />
    </SafeAreaView>
  );
}
