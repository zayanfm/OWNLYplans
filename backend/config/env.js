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
  MOCKPASS_EMBEDDED: process.env.MOCKPASS_EMBEDDED !== 'false',
  MOCKPASS_PORT: Number(process.env.MOCKPASS_PORT || 5156),
  MOCKPASS_INTERNAL_URL: (process.env.MOCKPASS_INTERNAL_URL || 'http://127.0.0.1:5156').replace(/\/$/, ''),
  MOCKPASS_PUBLIC_URL: (process.env.MOCKPASS_PUBLIC_URL || '').replace(/\/$/, ''),
  MOCKPASS_CLIENT_ID: process.env.MOCKPASS_CLIENT_ID || 'ownlyplans-local',
  MOCKPASS_NRIC: process.env.MOCKPASS_NRIC || 'S9812382B',
  DEFAULT_PERSONA: 'freya_family'
};
