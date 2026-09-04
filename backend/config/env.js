const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || '',
  MOCKPASS_CLIENT_ID: process.env.MOCKPASS_CLIENT_ID || 'ownlyplans-local',
  MOCKPASS_STATE_SECRET: process.env.MOCKPASS_STATE_SECRET || 'ownlyplans-local-state-secret-change-in-production',
  DEFAULT_PERSONA: 'alex_family'
};
