
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from './loggerService';
import { LogLevel, PolymarketMarket, PredictionResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const OPENROUTER_API_KEY = (process.env as any).OPENROUTER_API_KEY;
const PERPLEXITY_API_KEY = (process.env as any).PERPLEXITY_API_KEY;

async function fallbackAnalyze(market: PolymarketMarket, provider: 'OPENROUTER' | 'PERPLEXITY'): Promise<PredictionResult | null> {
  const prompt = `Analyze Polymarket contract: "${market.question}". Context: ${market.description}. Odds: ${market.outcomePrices.join('/')}. Detect mispricing or news lag. Return JSON with keys: sentiment (BULLISH/BEARISH/NEUTRAL), score (0-1), reasoning, predictionDate (ISO), suggestedAction, arbitrageDetected (bool).`;
  
  const url = provider === 'OPENROUTER' 
    ? 'https://openrouter.ai/api/v1/chat/completions' 
    : 'https://api.perplexity.ai/chat/completions';
    
  const key = provider === 'OPENROUTER' ? OPENROUTER_API_KEY : PERPLEXITY_API_KEY;
  const model = provider === 'OPENROUTER' ? 'google/gemini-2.0-flash-001' : 'sonar-reasoning-pro';

  if (!key) {
    logger.log(LogLevel.WARN, 'Intelligence', `${provider} key missing. Skipping fallback.`);
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content) as PredictionResult;
    logger.log(LogLevel.INFO, 'Intelligence', `Fallback success via ${provider}`);
    return result;
  } catch (e) {
    logger.log(LogLevel.ERROR, 'Intelligence', `${provider} fallback failed: ${e}`);
    return null;
  }
}

export const analyzeMarketSentiment = async (market: PolymarketMarket): Promise<PredictionResult | null> => {
  logger.log(LogLevel.INFO, 'NeuralEngine', `Scanning mispricing vectors: ${market.id}`);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-frequency trading bot analyzing a Polymarket prediction contract.
      
      MARKET: "${market.question}"
      CONTEXT: ${market.description}
      ODDS: ${market.outcomes.join('/')} at ${market.outcomePrices.join('/')}
      
      TASK:
      1. Use Google Search to find current event status or spot prices related to this.
      2. Identify if the current market odds are 'lagging' behind real-world news.
      3. Look for arbitrage: are there related markets (e.g., in a group) that contradict this one?
      4. Determine if the "Yes" price is mathematically undervalued given news probability.
      
      OUTPUT: Provide a sentiment bias, confidence score, and a "suggestedAction" that specifically targets the mispricing.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, description: "BULLISH, BEARISH, or NEUTRAL" },
            score: { type: Type.NUMBER, description: "Confidence score (0-1)" },
            reasoning: { type: Type.STRING, description: "Logical breakdown of the mispricing found" },
            predictionDate: { type: Type.STRING, description: "ISO timestamp" },
            suggestedAction: { type: Type.STRING, description: "Direct trading instruction (e.g. ARBITRAGE_LONG_YES)" },
            arbitrageDetected: { type: Type.BOOLEAN }
          },
          required: ["sentiment", "score", "reasoning", "predictionDate", "suggestedAction"]
        }
      }
    });

    const result = JSON.parse(response.text.trim()) as PredictionResult;
    logger.log(LogLevel.INFO, 'NeuralEngine', `Analysis Locked. Provider: GEMINI`);
    return result;
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429')) {
      logger.log(LogLevel.WARN, 'NeuralEngine', `Gemini rate limited (429). Triggering redundant intelligence layers...`);
      const orResult = await fallbackAnalyze(market, 'OPENROUTER');
      if (orResult) return orResult;
      
      const pxResult = await fallbackAnalyze(market, 'PERPLEXITY');
      if (pxResult) return pxResult;
    }
    
    logger.log(LogLevel.ERROR, 'NeuralEngine', `Diagnostic Failure: ${error}`);
    return null;
  }
};
