import {useIsFocused, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useCallback, useContext, useEffect, useState} from 'react';
import {TouchableOpacity} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {RootStackParamList, RouteNames} from '../routes';
import CookieManager from '@react-native-cookies/cookies';
import {WebViewContext} from './WebViewProvider';

type Props = NativeStackNavigationProp<RootStackParamList>;

export default function LoginButton() {
  const navigation = useNavigation<Props>();

  const context = useContext(WebViewContext);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const iconName = isLoggedIn ? 'logout' : 'login';

  // useEffect를 사용하면 스크린 앞으로갔다 뒤로가기만해도 다시 쿠키읽음(focus가 될 때만 읽게해주겟음)
  // useIsFocused 훅 지원해줌
  const isFocused = useIsFocused();
  // 쿠키 읽어볼거임
  useEffect(() => {
    if (isFocused) {
      // getAll은 안드로이드 미지원, get으로 해줘야함
      // get(url, usewebkit) - ueswebkit은 iOS가 사용하는 웹뷰가 어떤건지 명시하는 것
      // https://.naver.com을 해야 네이버 쿠키를 읽을 수 있음
      CookieManager.get('https:/.naver.com', true).then(cookie => {
        if (cookie.NID_SES) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      });
    }
  }, [isFocused]);

  const onPressLogin = useCallback(() => {
    navigation.navigate(RouteNames.LOGIN);
  }, [navigation]);
  // 로그아웃 기능은 네이버 같은 경우에는 로그아웃 url이 따로 있는데
  // 일반적으로 웹앱에서 로그인을 구현할 때는 쿠키를 설정해서 로그인을 시키고 쿠키를 지워서 로그아웃을시킴
  const onPressLogout = useCallback(async () => {
    // usewebkit true로 해줘야함 - 이거를 안해주게 되면 다른 형태의 웹앱에 있는 쿠키를 지우기 때문에
    // 내가 만든 웹앱의 쿠키는 안지워짐
    await CookieManager.clearAll(true);
    setIsLoggedIn(false);

    if (context != null) {
      context.webViewRefs.current.forEach(webView => {
        webView.reload();
      });
    }
  }, [context]);

  return (
    <TouchableOpacity onPress={isLoggedIn ? onPressLogout : onPressLogin}>
      <MaterialCommunityIcons name={iconName} size={24} color="white" />
    </TouchableOpacity>
  );
}
