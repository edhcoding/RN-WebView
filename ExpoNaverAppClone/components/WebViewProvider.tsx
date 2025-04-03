import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import WebView from 'react-native-webview';

interface WebViewContextType {
  webViewRefs: MutableRefObject<WebView[]>;
  addWebView: (webView: WebView) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
}

const WebViewContext = createContext<WebViewContextType | null>(null);

export function WebViewProvider({ children }: { children: ReactNode }) {
  const webViewRefs = useRef<WebView[]>([]);

  const addWebView = useCallback((webView: WebView) => {
    webViewRefs.current.push(webView);
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <WebViewContext.Provider
      value={{ webViewRefs, addWebView, isLoggedIn, setIsLoggedIn }}>
      {children}
    </WebViewContext.Provider>
  );
}

export function useWebViewContext() {
  const context = useContext(WebViewContext);

  if (!context) {
    throw new Error('WebView 컨텍스트를 호출할 수 없는 범위입니다.');
  }

  return context;
}
