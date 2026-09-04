// frontend/src/constants/appConfig.ts

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface AppConfig {
  appName: string;
  theme: {
    colors: {
      primary: string;
      black: string;
      grey: string;
      border: string;
      bg: string;
      cream: string;
    };
  };
  dimensions: {
    width: number;
    height: number;
    borderRadius: number;
  };
}

export const MOCK_APP_CONFIG: AppConfig = {
  appName: 'OCBC Digital — OWNLYplans',
  theme: {
    colors: {
      primary: '#D81E05', // ocbc red
      black: '#1A1A1A',
      grey: '#767676',
      border: '#E8E8E8',
      bg: '#F5F4F0',
      cream: '#EDE8DF',
    },
  },
  dimensions: {
    width: 390,
    height: 844,
    borderRadius: 50,
  },
};

const explicitApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
const expoDevHost = Constants.expoConfig?.hostUri?.split(':')[0];

/**
 * Expo Go runs on the phone, so localhost would point at the phone itself.
 * In LAN development, hostUri contains the computer running Metro; use that
 * same host for the Express API unless an explicit URL was supplied.
 */
export const API_BASE_URL = explicitApiUrl
  || (Platform.OS !== 'web' && expoDevHost ? `http://${expoDevHost}:5000` : 'http://localhost:5000');
