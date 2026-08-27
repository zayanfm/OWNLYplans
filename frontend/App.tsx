import { useAssets } from 'expo-asset';
import axios from 'axios';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

const API_BASE = 'http://192.168.1.5:5000';

type NativeRequest = {
  type?: string;
  userFinancialData?: unknown;
  userPrompt?: string;
  prompt?: string;
  bankData?: unknown;
};

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [assets] = useAssets([require('./assets/index.html')]);

  const sendToWebView = (response: unknown) => {
    webViewRef.current?.postMessage(JSON.stringify(response));
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    let message: NativeRequest;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    const { type } = message;

    try {
      if (type === 'FETCH_SGFINDEX') {
        const { data } = await axios.get(`${API_BASE}/api/sgfindex/aggregate`);
        sendToWebView({ type: 'SGFINDEX_DATA', payload: data });
        return;
      }

      if (type === 'ASK_AI') {
        const { data } = await axios.post(`${API_BASE}/api/ai-insights`, {
          userFinancialData: message.userFinancialData ?? message.bankData,
          userPrompt: message.userPrompt ?? message.prompt,
        });
        sendToWebView({ type: 'ASK_AI', payload: data });
        return;
      }

      if (type === 'MOCKPASS_LOGIN') {
        const { data } = await axios.post(`${API_BASE}/api/auth/mockpass`);
        sendToWebView({ type: 'MOCKPASS_LOGIN', payload: data });
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed';
      sendToWebView({ type, error: errorMessage });
    }
  };

  if (!assets?.[0]?.localUri) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: assets[0].localUri }}
      onMessage={onMessage}
      originWhitelist={['*']}
      javaScriptEnabled
      style={styles.flex}
    />
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
