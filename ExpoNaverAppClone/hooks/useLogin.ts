import { useCallback } from 'react';
import { useWebViewContext } from '../components/WebViewProvider';
import { WebViewMessageEvent } from 'react-native-webview';

// useLogin 훅은 로그인 상태를 관리하는 훅
export default function useLogin() {
  const { webViewRefs, setIsLoggedIn, isLoggedIn } = useWebViewContext();

  const loadLoggedIn = useCallback(() => {
    webViewRefs.current.forEach(webView => {
      // document.cookie를 가지고 온 다음에 postMessage로 보내줌 (그러면 onMessage에서 쿠키를 읽어올 수 있음)
      webView.injectJavaScript(`
        (function() {
          window.ReactNativeWebView.postMessage(document.cookie);
        })();
      `);
    });
  }, [webViewRefs]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      // NID_SES가 있으면 로그인 상태, 없으면 로그인 안된 상태
      const cookieString = e.nativeEvent.data;
      setIsLoggedIn(cookieString.includes('NID_SES'));
    },
    [setIsLoggedIn],
  );

  const logout = useCallback(() => {
    webViewRefs.current.forEach(webView => {
      // NID_SES를 초기화 명령어
      webView.injectJavaScript(`
        (function() {
          document.cookie = 'NID_SES=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.naver.com';
          window.ReactNativeWebView.postMessage(document.cookie);
        })();      
      `);
    });

    setIsLoggedIn(false);

    if (webViewRefs != null) {
      webViewRefs.current.forEach(webView => {
        webView.reload();
      });
    }
  }, [setIsLoggedIn, webViewRefs]);

  return { loadLoggedIn, onMessage, isLoggedIn, logout };
}
