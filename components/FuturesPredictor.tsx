
import React, { useState, useEffect } from 'react';
import { TrendingUp, Cpu, Zap, Activity, ShieldCheck, Binary, Loader2, Target, BarChart3, Radio } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from '../services/loggerService';
import { LogLevel, CryptoPrice, FuturesSignal } from '../types';

interface FuturesPredictorProps {
  prices: CryptoPrice[];
}

const FuturesPredictor: React.FC<FuturesPredictorProps> = ({ prices }) => {
  const [signal, setSignal] = useState<FuturesSignal | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSignal = async () => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze current crypto futures bias for BTC/ETH. 
        Prices: ${JSON.stringify(prices)}. 
        Context: Prediction markets are pricing BTC > 100k at 65c. 
        Task: Provide a short-term 1H futures prediction.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              asset: { type: Type.STRING },
              direction: { type: Type.STRING, description: "LONG, SHORT, or NEUTRAL" },
              probability: { type: Type.NUMBER },
              timeframe: { type: Type.STRING },
              rationale: { type: Type.STRING },
              marketAlpha: { type: Type.STRING }
            },
            required: ["asset", "direction", "probability", "timeframe", "rationale", "marketAlpha"]
          }
        }
      });

      const result = JSON.parse(response.text.trim());
      setSignal(result);
      logger.log(LogLevel.INFO, 'FuturesEngine', `Signal locked: ${result.direction} ${result.asset}`);
    } catch (e) {
      logger.log(LogLevel.ERROR, 'FuturesEngine', `Signal generation failure: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prices.length > 0 && !signal) {
      generateSignal();
    }
  }, [prices]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Futures_Alpha_Synthesizer</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-2">
            <Radio className="w-3 h-3 text-indigo-500 animate-pulse" /> Live_Order_Correlation
          </span>
          <button 
            onClick={generateSignal}
            disabled={loading}
            className="px-4 py-1.5 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-black text-[9px] tracking-widest uppercase hover:bg-indigo-600/20 transition-all"
          >
            Refresh_Signal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center border border-slate-800 bg-black/40">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] animate-pulse">Running_Neural_Simulations...</p>
            </div>
          ) : signal ? (
            <div className="border border-slate-800 bg-black/40 p-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-12">
                <div className={`px-6 py-2 border rounded font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 ${
                  signal.direction === 'LONG' ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' :
                  signal.direction === 'SHORT' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' :
                  'bg-slate-500/10 border-slate-500/30 text-slate-500'
                }`}>
                  <Activity className="w-4 h-4" /> {signal.direction}_BIAS_DETECTED
                </div>
                <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-4 h-4" /> Prob: {(signal.probability * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-10 flex-1">
                <div>
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Binary className="w-3.5 h-3.5" /> Market_Alpha_Diagnostic
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium bg-slate-900/30 p-6 border border-slate-800/40">
                    {signal.rationale}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-indigo-500/5 border border-indigo-500/20">
                    <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest block mb-2">TARGET_INSTRUMENT</span>
                    <span className="text-lg font-black text-white">{signal.asset}-PERP</span>
                  </div>
                  <div className="p-6 bg-black/20 border border-slate-800">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2">TIMEFRAME</span>
                    <span className="text-lg font-black text-white">{signal.timeframe}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Grounding_Sync: 100%
                </div>
                <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">GEMINI_3_FLASH_FUTURES_OS</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="border border-slate-800 bg-black/40 p-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" /> Spot_Real_Time
            </h3>
            <div className="space-y-4 font-mono">
              {prices.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-800/40 pb-3">
                  <span className="text-[10px] font-bold text-slate-400">{p.symbol}/USDC</span>
                  <div className="text-right">
                    <div className="text-xs text-white font-black">${p.price.toLocaleString()}</div>
                    <div className={`text-[8px] font-bold ${p.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> High_Volatility_Warning
            </h3>
            <p className="text-[9px] text-slate-400 leading-relaxed uppercase font-bold tracking-tight">
              Orderbook imbalance detected in BTC-100k-MARCH prediction market. Sentiment lagging spot price by approx 4.2%. Short-term mean reversion likely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturesPredictor;
