import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import useLogin from '../hooks/useLogin';

export default function LoginButton() {
  // 우리가 하나 더 안전하게 작성하려면 로그인 버튼이 마운트되고 포커스 될 때 마다 쿠키를 다시 읽는 과정이 필요함
  // 이유: 로그인을하고 back으로 왔을때 쿠키가 리로드가 안되있을 수 있음 왜냐하면 웹뷰를 리로드 햇지만 쿠키를 불러오지 않으면 리로드가 안될 수 있음
  // 그래서 안전하게 스크린이 포커스 되어 있을 때 마다 수동으로 읽어서 isLoggedIn을 업데이트 해줘야함
  const { isLoggedIn, loadLoggedIn, logout } = useLogin();
  const iconName = isLoggedIn ? 'logout' : 'login';

  // 스크린 포커스 훅 useFocusEffect, 이걸 사용하면 focus 될 때 마다 안에 있는 콜백이 실행됨
  const [isFocused, setIsFocused] = useState(false);
  useFocusEffect(() => {
    setIsFocused(true);

    // focused가 안되있을때는 return 하는 콜백이 호출됨
    return () => {
      setIsFocused(false);
    };
  });

  useEffect(() => {
    if (isFocused) {
      loadLoggedIn();
    }
  }, [isFocused, loadLoggedIn]);

  const onPressLogin = useCallback(() => {
    router.navigate({ pathname: 'login' });
  }, []);
  const onPressLogout = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <TouchableOpacity onPress={isLoggedIn ? onPressLogout : onPressLogin}>
      <MaterialCommunityIcons name={iconName} size={24} color="white" />
    </TouchableOpacity>
  );
}
