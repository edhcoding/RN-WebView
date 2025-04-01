import React from 'react';
import WebView from 'react-native-webview';

const App = () => {
  return (
    <WebView source={{html: '<h1>hello world!</h1>'}} originWhitelist={['*']} />
  );
};

export default App;
