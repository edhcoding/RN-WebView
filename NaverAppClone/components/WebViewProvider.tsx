import React, {
  MutableRefObject,
  ReactNode,
  createContext,
  useCallback,
  useRef,
} from 'react';
import WebView from 'react-native-webview';

interface WebViewContexType {
  webViewRefs: MutableRefObject<WebView[]>;
  addWebView: (webView: WebView) => void;
}

const WebViewContext = createContext<WebViewContexType | undefined>(undefined);

const WebViewProvider = ({children}: {children: ReactNode}) => {
  const webViewRefs = useRef<WebView[]>([]);
  const addWebView = useCallback((webView: WebView) => {
    webViewRefs.current.push(webView);
  }, []);

  return (
    <WebViewContext.Provider
      value={{
        webViewRefs,
        addWebView,
      }}>
      {children}
    </WebViewContext.Provider>
  );
};

export {WebViewProvider, WebViewContext};

// 전역으로 context api 사용해서 스크린마다 마운트될 때 마다 ref를 저장할거임
// 저장된 reference를 이용해서 로그인 스크린에서 로그인이 완료되면 refresh 처리
