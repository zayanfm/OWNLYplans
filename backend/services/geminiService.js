const env = require('../config/env');

let GoogleGenAI = null;
try {
  const genaiModule = require('@google/genai');
  GoogleGenAI = genaiModule.GoogleGenAI || genaiModule;
} catch (e) {
  // Optional dependency
}

class GeminiService {
  constructor() {
    this.ai = null;
    if (GoogleGenAI && env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      } catch (err) {
        console.warn('[GeminiService] Failed to initialize GoogleGenAI client:', err.message);
      }
    }
  }

  async generateJson(prompt, fallbackData) {
    if (!this.ai || !env.GEMINI_API_KEY) {
      return fallbackData;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No markdown ticks, no commentary.`
      });

      const text = response.text ? response.text.trim() : '';
      const cleanJson = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn('[GeminiService] Gemini call failed or returned unparseable JSON, using deterministic fallback:', error.message);
      return fallbackData;
    }
  }

  async generateChatResponse(systemContext, conversationHistory, userMessage) {
    if (!this.ai || !env.GEMINI_API_KEY) {
      return null;
    }

    try {
      const contents = [
        `You are OWNLYplans AI Assistant, an empathetic, explainable, and expert financial guide inside the OCBC Digital app in Singapore.`,
        `Current Household Context:\n${JSON.stringify(systemContext, null, 2)}`,
        `Recent conversation:\n${conversationHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}`,
        `User query: ${userMessage}`,
        `Provide a helpful, precise, explainable response grounded in Singapore context (CPF, BTO, MMF, OCBC 360, Great Eastern). Keep it warm, concise, and structured.`
      ].join('\n\n');

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents
      });

      return response.text ? response.text.trim() : null;
    } catch (error) {
      console.warn('[GeminiService] Chat generation failed:', error.message);
      return null;
    }
  }
}

module.exports = new GeminiService();
