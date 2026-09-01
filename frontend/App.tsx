import React, { useState } from 'react';
import axios from 'axios';
import { View } from 'react-native';

// Import your custom TSX screen components
import { OwnlyScreen } from './src/components/whatever';

// Configure API base URL
const API_BASE = 'http://192.168.1.5:5000';

export default function App() {
  const [screen, setScreen] = useState<string>('home');
  const [loading, setLoading] = useState<boolean>(false);

  // API Helper: SGFindex Data Fetching
  const fetchSgfIndexData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/sgfindex/aggregate`);
      return data;
    } catch (error) {
      console.error('SGFindex Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // API Helper: AI Insights Engine
  const askAI = async (financialData: any, promptText: string) => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/api/ai-insights`, {
        userFinancialData: financialData,
        userPrompt: promptText,
      });
      return data;
    } catch (error) {
      console.error('AI Insights Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // API Helper: MockPass Auth
  const handleMockpassLogin = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/api/auth/mockpass`);
      return data;
    } catch (error) {
      console.error('Mockpass Login Error:', error);
    } finally {
      setLoading(false);
    }
  };

  function nav(to: string) {
    setScreen(to);
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Direct component rendering without WebView */}
      <OwnlyScreen onNav={nav} />
    </View>
  );
}