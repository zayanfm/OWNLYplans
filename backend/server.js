require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const financeRoutes = require('./routes/finance');

// 1. Initialize Express FIRST
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Google Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 2. Middlewares
app.use(cors());
app.use(express.json());

// 3. Routes
app.use('/api/finance', financeRoutes);

// 1. Gemini AI Insights Endpoint
app.post('/api/ai-insights', async (req, res) => {
  try {
    const { userPrompt, userFinancialData } = req.body;

    let prompt = userPrompt;

    // Only attach financial data context if actual balance data is provided
    if (userFinancialData && Object.keys(userFinancialData).length > 0) {
      prompt = `Context Data: ${JSON.stringify(userFinancialData)}\n\nQuestion: ${userPrompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ success: true, advice: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate AI insights.' });
  }
});

// 2. Mock SGFinDex Aggregation Endpoint
app.get('/api/sgfindex/aggregate', (req, res) => {
  res.json({
    success: true,
    lastUpdated: new Date().toISOString(),
    accounts: [
      { bank: 'OCBC', accountType: '360 Account', balance: 12450.80, currency: 'SGD' },
      { bank: 'DBS', accountType: 'Multiplier', balance: 5300.20, currency: 'SGD' },
      { bank: 'UOB', accountType: 'One Account', balance: 8120.00, currency: 'SGD' },
    ],
    cpf: { oa: 24000.00, sa: 18000.00, ma: 12000.00 },
  });
});

// 3. MockPass Authentication Endpoint
app.post('/api/auth/mockpass', (req, res) => {
  res.json({
    success: true,
    user: {
      nric: 'S****123A',
      name: 'Alex Tan',
      singpassVerified: true,
    },
  });
});

// Bind to 0.0.0.0 so devices on your local network (like your phone) can connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://192.168.1.5:${PORT}`);
});