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

  isConfigured() {
    return Boolean(this.ai && env.GEMINI_API_KEY);
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      model: 'gemini-2.5-flash',
      role: 'Narrative synthesis and conversational explanation',
      fallback: 'Deterministic explainable engine'
    };
  }

  async generateJsonWithMeta(prompt, fallbackData) {
    if (!this.isConfigured()) {
      return { data: fallbackData, source: 'DETERMINISTIC_FALLBACK' };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. No markdown ticks, no commentary.`
      });
      const text = response.text ? response.text.trim() : '';
      const cleanJson = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/, '').trim();
      return { data: JSON.parse(cleanJson), source: 'GEMINI_2_5_FLASH' };
    } catch (error) {
      console.warn('[GeminiService] Gemini synthesis failed, using deterministic fallback:', error.message);
      return { data: fallbackData, source: 'DETERMINISTIC_FALLBACK' };
    }
  }

  async generateJson(prompt, fallbackData) {
    const result = await this.generateJsonWithMeta(prompt, fallbackData);
    return result.data;
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
        `Provide a helpful, precise, explainable response grounded in the consented household data and Singapore context (CPF, HDB home financing, cash management, OCBC, Great Eastern). Never invent grant eligibility, product rates, family members, or balances. Keep it warm, concise, and structured.`
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
