// frontend/src/constants/appConfig.ts

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

export const API_BASE_URL = 'http://localhost:5000';