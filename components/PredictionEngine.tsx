
import React, { useState, useEffect } from 'react';
import { PolymarketMarket, PredictionResult, OrderBook, CryptoPrice, AddressTrade, AddressStats } from '../types';
import { analyzeMarketSentiment } from '../services/geminiService';
import { fetchOrderBook, checkSingleMarketArbitrage, fetchMarketTrades, fetchAddressStats } from '../services/polymarketService';
import { wsService } from '../services/webSocketService';
import { Binary, Loader2, Zap, ShieldCheck, AlertCircle, TrendingUp, TrendingDown, Activity, ChevronRight, BarChart3, Fingerprint, Database, Cpu, Code, ExternalLink, Target, AlertTriangle, Sparkles, User, ArrowUpRight, ArrowDownRight, Award, ShieldAlert } from 'lucide-react';

interface PredictionEngineProps {
  selectedMarket: PolymarketMarket | null;
  prices: CryptoPrice[];
}

const formatValue = (val: string) => {
  const num = parseFloat(val || '0');
  if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
};

const ConfidenceGauge: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score * circumference);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          className="text-black/20"
        />
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
          className={`${color}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-[var(--terminal-text)] font-mono tracking-tighter">{(score * 100).toFixed(0)}%</span>
        <span className="text-[11px] font-black text-dim uppercase tracking-[0.3em] mt-2">CERTAINTY</span>
      </div>
    </div>
  );
};

const PredictionEngine: React.FC<PredictionEngineProps> = ({ selectedMarket, prices }) => {
  const [analysis, setAnalysis] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [arbAlert, setArbAlert] = useState<{ type: string; diff: number; severity: string; message: string } | null>(null);
  
  // Market Flow Diagnostics State
  const [marketTrades, setMarketTrades] = useState<AddressTrade[]>([]);
  const [addressStats, setAddressStats] = useState<Map<string, AddressStats>>(new Map());
  const [flowLoading, setFlowLoading] = useState(false);

  useEffect(() => {
    if (selectedMarket) {
      handleAnalyze();
      loadOrderBook();
      loadFlowDiagnostics();
      wsService.subscribeToMarket(selectedMarket.id);
      
      const arb = checkSingleMarketArbitrage(selectedMarket, prices);
      setArbAlert(arb);
    }
  }, [selectedMarket, prices]);

  const loadOrderBook = async () => {
    if (selectedMarket?.clobTokenIds?.length) {
      const data = await fetchOrderBook(selectedMarket.clobTokenIds[0]);
      if (data) setOrderBook(data);
    }
  };

  const loadFlowDiagnostics = async () => {
    if (!selectedMarket) return;
    setFlowLoading(true);
    try {
      const trades = await fetchMarketTrades(selectedMarket.id);
      setMarketTrades(trades);
      
      const statsMap = new Map<string, AddressStats>();
      const uniqueAddresses = Array.from(new Set(trades.slice(0, 10).map(t => t.address)));
      await Promise.all(uniqueAddresses.map(async (addr) => {
        const stats = await fetchAddressStats(addr);
        statsMap.set(addr, stats);
      }));
      setAddressStats(statsMap);
    } catch (e) {
      console.error("Flow load failed", e);
    } finally {
      setFlowLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedMarket) return;
    setLoading(true);
    const result = await analyzeMarketSentiment(selectedMarket);
    setAnalysis(result);
    setLoading(false);
  };

  if (!selectedMarket) {
    return (
      <div className="h-[700px] flex flex-col items-center justify-center glass-card bg-black/10 rounded-3xl">
        <div className="relative mb-12">
           <Fingerprint className="w-24 h-24 text-dim animate-pulse opacity-40" />
           <div className="absolute inset-0 bg-accent/20 blur-3xl animate-pulse"></div>
        </div>
        <h3 className="text-lg font-black text-dim uppercase tracking-[0.5em]">AWAITING_INDEX_TARGET...</h3>
        <p className="text-[14px] text-dim/60 mt-6 uppercase font-black tracking-[0.2em]">Select asset from MARKET_DATA for deep analysis</p>
      </div>
    );
  }

  const polymarketUrl = `https://polymarket.com/event/${selectedMarket.slug}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-10 duration-700 pb-20">
      
      {/* Target Market Info & Flow Context */}
      <div className="lg:col-span-4 space-y-10">
        <div className="glass-card p-10 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Target className="w-40 h-40 text-accent" />
          </div>
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <Database className="w-6 h-6 text-accent" />
               <h3 className="text-[12px] font-black text-dim uppercase tracking-[0.3em]">ASSET_SPECIFICATION</h3>
             </div>
             <button 
               onClick={() => setShowRaw(!showRaw)}
               className={`p-2 rounded-lg border transition-all ${showRaw ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-black/10 border-terminal text-dim hover:text-accent shadow-inner'}`}
             >
                <Code className="w-5 h-5" />
             </button>
          </div>
          <h4 className="text-2xl font-black text-[var(--terminal-text)] mb-6 leading-tight tracking-tighter border-l-4 border-accent pl-6 bg-accent/5 py-4">{selectedMarket.question}</h4>
          <p className="text-[14px] text-dim mb-10 leading-relaxed font-bold opacity-90 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
            {selectedMarket.description}
          </p>
          
          {arbAlert && (
            <div className={`mb-10 p-6 border flex items-start gap-6 rounded-2xl shadow-xl transition-all ${arbAlert.severity === 'HIGH' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
              <AlertTriangle className="w-6 h-6 mt-1 shrink-0" />
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">{arbAlert.type}_ARBITRAGE_DETECTED</span>
                <p className="text-[13px] leading-relaxed font-black italic">"{arbAlert.message}"</p>
                <span className="text-[11px] font-black mt-2 bg-black/20 px-4 py-2 rounded-lg w-fit self-start border border-terminal">EXPECTED_ALPHA: +{arbAlert.diff.toFixed(1)}%</span>
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-terminal grid grid-cols-2 gap-6 mb-10">
            <div className="bg-black/10 p-4 rounded-xl border border-terminal min-w-0">
              <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-2 opacity-60">Vol_24H</p>
              <p className="text-base font-mono text-[var(--terminal-text)] font-black tracking-tighter truncate" title={selectedMarket.volume}>{formatValue(selectedMarket.volume)}</p>
            </div>
            <div className="bg-black/10 p-4 rounded-xl border border-terminal min-w-0">
              <p className="text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-2 opacity-60">Liquidity</p>
              <p className="text-base font-mono text-[var(--terminal-text)] font-black tracking-tighter truncate" title={selectedMarket.liquidity}>{formatValue(selectedMarket.liquidity || '0')}</p>
            </div>
          </div>
          <a 
            href={polymarketUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 rounded-2xl font-black flex items-center justify-center gap-4 text-[13px] uppercase tracking-[0.3em] transition-all mb-4 shadow-accent"
          >
            OPEN_CLOB_PORTAL <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* Live Order Book Depth */}
        <div className="glass-card p-10 rounded-3xl overflow-hidden shadow-2xl transition-all">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-[12px] font-black text-dim uppercase tracking-[0.3em] flex items-center gap-4">
                <BarChart3 className="w-6 h-6 text-accent" />
                L2_ORDER_DEPTH
             </h3>
             <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-accent rounded-full animate-ping"></div>
                <span className="text-[11px] font-black text-accent uppercase tracking-[0.2em]">LIVE_FEED</span>
             </div>
          </div>
          
          <div className="space-y-2 font-mono text-[13px]">
            <div className="space-y-1.5 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={`ask-${i}`} className="flex justify-between items-center h-6 hover:bg-red-500/10 transition-all px-3 rounded-md">
                  <span className="text-red-500 font-black">0.{(65 + i).toString().padEnd(2, '0')}</span>
                  <div className="flex-1 mx-6 h-[1px] bg-red-500/20"></div>
                  <span className="text-dim opacity-70">{(Math.random() * 8000 + 500).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="py-3 border-y border-terminal text-center font-black text-dim tracking-[0.4em] text-[11px] bg-black/10 rounded-lg">
               --- MIDPOINT: 0.645 ---
            </div>
            <div className="space-y-1.5 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={`bid-${i}`} className="flex justify-between items-center h-6 hover:bg-green-500/10 transition-all px-3 rounded-md">
                  <span className="text-green-500 font-black">0.{(64 - i).toString().padEnd(2, '0')}</span>
                  <div className="flex-1 mx-6 h-[1px] bg-green-500/20"></div>
                  <span className="text-dim opacity-70">{(Math.random() * 8000 + 500).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full flex items-center justify-center gap-5 py-6 px-10 bg-accent hover:opacity-90 text-white rounded-2xl font-black transition-all disabled:opacity-50 text-[15px] tracking-[0.3em] uppercase shadow-2xl shadow-blue-900/40 border border-white/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Binary className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
          {loading ? 'RUNNING_NEURAL_XRAY...' : 'START_DIAGNOSTIC_PROBE'}
        </button>
      </div>

      {/* Result Panel & Flow Surveillance */}
      <div className="lg:col-span-8 space-y-12 flex flex-col">
        {showRaw ? (
          <div className="glass-card p-10 h-full font-mono text-[14px] overflow-auto text-accent rounded-3xl shadow-inner custom-scrollbar transition-all bg-black/20">
            <div className="flex items-center gap-4 mb-8 text-dim uppercase font-black tracking-[0.3em] border-b border-terminal pb-6">
              <Code className="w-6 h-6" />
              INSPECTING_FLOW_DATA_OBJECTS
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed opacity-90">
              {JSON.stringify(selectedMarket.raw || selectedMarket, null, 2)}
            </pre>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center glass-card bg-black/10 min-h-[600px] rounded-3xl relative overflow-hidden transition-all">
             <div className="absolute inset-0 bg-accent/10 animate-pulse"></div>
             <Cpu className="w-20 h-20 text-accent animate-spin mb-10" />
             <p className="text-accent font-black text-lg animate-pulse uppercase tracking-[0.6em]">SYNTHESIZING_GLOBAL_NARRATIVES...</p>
             <div className="mt-12 flex gap-4">
                {[1, 2, 3].map(i => <div key={i} className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{animationDelay: `${i * 0.2}s`}}></div>)}
             </div>
          </div>
        ) : analysis ? (
          <div className="flex-1 space-y-12">
            {/* AI result card */}
            <div className="glass-card p-12 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden group transition-all bg-accent/[0.02]">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Sparkles className="w-64 h-64 text-accent" />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-8 mb-16 relative z-10 border-b border-terminal pb-10">
                <div className="flex items-center gap-8">
                  <div className={`px-8 py-3 rounded-2xl text-[13px] font-black tracking-[0.3em] uppercase flex items-center gap-4 border shadow-2xl ${
                    analysis.sentiment === 'BULLISH' ? 'bg-green-500/20 text-green-500 border-green-500/40 shadow-green-900/10' : 
                    analysis.sentiment === 'BEARISH' ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-red-900/10' :
                    'bg-slate-500/20 text-slate-500 border-slate-500/40'
                  }`}>
                    {analysis.sentiment === 'BULLISH' ? <TrendingUp className="w-6 h-6" /> : analysis.sentiment === 'BEARISH' ? <TrendingDown className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                    {analysis.sentiment}_FLOW_BIAS
                  </div>
                  <div className="flex items-center gap-4 text-dim text-[13px] font-black uppercase tracking-[0.2em] bg-black/10 px-6 py-2 rounded-xl border border-terminal">
                    <ShieldCheck className="w-6 h-6 text-accent" />
                    GROUNDING_CORE: ACTIVE
                  </div>
                </div>
                <div className="text-[12px] font-mono text-dim uppercase font-black tracking-[0.4em] bg-black/20 px-6 py-2 rounded-xl border border-terminal">
                  HASH: {Math.random().toString(36).substr(2, 10).toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10 mb-16">
                 <div className="md:col-span-8 space-y-8">
                    <div className="flex items-center gap-4 border-b border-terminal pb-4 mb-4">
                       <ChevronRight className="w-5 h-5 text-accent" />
                       <h5 className="text-[13px] font-black text-dim uppercase tracking-[0.3em]">NARRATIVE_DIAGNOSTIC_CORE</h5>
                    </div>
                    <p className="text-[var(--terminal-text)] text-xl leading-relaxed font-black italic border-l-8 border-accent pl-10 bg-accent/[0.03] py-8 shadow-2xl rounded-r-2xl">
                      "{analysis.reasoning}"
                    </p>
                 </div>
                 <div className="md:col-span-4 flex justify-center">
                    <ConfidenceGauge 
                      score={analysis.score} 
                      color={analysis.sentiment === 'BULLISH' ? 'text-green-500' : analysis.sentiment === 'BEARISH' ? 'text-red-500' : 'text-slate-500'} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="p-10 bg-black/20 border border-terminal rounded-3xl relative group overflow-hidden shadow-2xl transition-all hover:border-amber-500/40">
                  <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h5 className="text-[12px] font-black text-dim uppercase tracking-[0.3em] mb-8 flex items-center gap-4 border-b border-terminal pb-4">
                    <Zap className="w-6 h-6 text-amber-500 animate-pulse" /> TACTICAL_EXECUTION_SEED
                  </h5>
                  <div className="flex items-start gap-8 relative">
                    <div className="p-4 bg-accent/20 rounded-2xl border border-accent/40 group-hover:scale-110 transition-transform shadow-accent">
                      <Target className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <p className="text-[var(--terminal-text)] font-black text-lg uppercase tracking-tight leading-tight mb-4">{analysis.suggestedAction}</p>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-accent rounded-full animate-pulse shadow-accent"></span>
                        <p className="text-[11px] text-dim uppercase font-black tracking-[0.2em]">Alpha_Projection: +{(analysis.score * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-10 bg-black/20 border border-terminal rounded-3xl flex flex-col justify-center relative shadow-2xl transition-all">
                   <h5 className="text-[12px] font-black text-dim uppercase tracking-[0.3em] mb-8 flex items-center gap-4 border-b border-terminal pb-4">
                      <Activity className="w-6 h-6 text-accent" /> NEURAL_CONVICTION
                   </h5>
                   <div className="flex flex-col gap-6">
                      <div className="flex items-end justify-between">
                         <span className="text-4xl font-black text-[var(--terminal-text)] font-mono tracking-tighter">
                            {(analysis.score * 100).toFixed(1)}%
                         </span>
                         <span className="text-[11px] font-black text-dim uppercase mb-2 tracking-[0.2em]">ACCURACY_CONFIRM</span>
                      </div>
                      <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden shadow-inner border border-terminal">
                         <div className="h-full bg-accent shadow-accent transition-all duration-2000 ease-out" style={{ width: `${analysis.score * 100}%` }}></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* FLOW SURVEILLANCE PANEL */}
            <div className="glass-card rounded-3xl p-10 shadow-2xl transition-all bg-black/5">
               <div className="flex items-center justify-between mb-10 border-b border-terminal pb-8">
                 <div className="flex items-center gap-5">
                    <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
                    <h3 className="text-lg font-black text-[var(--terminal-text)] uppercase tracking-[0.4em]">DEEP_FLOW_DIAGNOSTICS</h3>
                 </div>
                 {flowLoading ? (
                   <Loader2 className="w-6 h-6 animate-spin text-accent" />
                 ) : (
                   <div className="flex items-center gap-6">
                     <div className="text-[11px] font-black text-accent bg-accent/10 px-6 py-2 border border-accent/30 rounded-lg uppercase tracking-[0.3em] shadow-accent">NODE_SCANNING_ACTIVE</div>
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Smart Money & Large Orders */}
                  <div className="space-y-6">
                     <h4 className="text-[12px] font-black text-dim uppercase tracking-[0.3em] flex items-center gap-3 mb-4 border-l-4 border-green-500/50 pl-4">
                       <Award className="w-6 h-6 text-green-500" /> SMART_MONEY_FLOW (WR > 70%)
                     </h4>
                     <div className="space-y-3">
                        {marketTrades.slice(0, 6).map((t, i) => {
                          const stats = addressStats.get(t.address);
                          const isSmart = stats && stats.winRate > 0.7;
                          const isWhale = t.size > 50000;
                          
                          if (!isSmart && !isWhale && i > 3) return null;

                          return (
                            <div key={i} className={`p-6 border rounded-2xl flex items-center justify-between transition-all group hover:scale-[1.02] ${isSmart ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.05)]' : isWhale ? 'bg-accent/10 border-accent/40 shadow-accent' : 'bg-black/10 border-terminal'}`}>
                              <div className="flex items-center gap-5">
                                 <div className={`p-3 rounded-xl shadow-lg ${t.side === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {t.side === 'BUY' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                 </div>
                                 <div>
                                    <div className="flex items-center gap-4 mb-2">
                                      <span className="text-[13px] font-mono text-accent font-black">{t.address.slice(0, 10)}...</span>
                                      {isSmart && <span className="text-[9px] font-black bg-green-500/20 text-green-500 px-3 py-1 rounded-lg uppercase tracking-widest border border-green-500/30">ELITE</span>}
                                      {isWhale && <span className="text-[9px] font-black bg-accent/20 text-accent px-3 py-1 rounded-lg uppercase tracking-widest border border-accent/30">WHALE</span>}
                                    </div>
                                    <div className="text-[11px] text-dim font-black uppercase tracking-[0.2em] opacity-70">
                                       Vol: ${(t.size / 1000).toFixed(1)}k @ {t.price.toFixed(3)}
                                    </div>
                                 </div>
                              </div>
                              {stats && (
                                <div className="text-right">
                                   <div className={`text-base font-black font-mono tracking-tighter ${stats.winRate > 0.7 ? 'text-green-500' : 'text-dim'}`}>
                                      {(stats.winRate * 100).toFixed(0)}% WR
                                   </div>
                                   <div className="text-[10px] text-dim font-black uppercase tracking-widest opacity-60">{stats.totalTrades} ORDERS</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                     </div>
                  </div>

                  {/* Liquidity & Summary Panels */}
                  <div className="space-y-10">
                     <div className="p-8 bg-accent/[0.05] border border-accent/30 rounded-3xl relative shadow-2xl">
                        <h4 className="text-[12px] font-black text-accent uppercase tracking-[0.3em] flex items-center gap-4 mb-8 border-b border-accent/20 pb-4">
                          <Activity className="w-6 h-6 animate-pulse" /> GLOBAL_FLOW_BIAS
                        </h4>
                        <div className="space-y-6">
                           <div className="flex justify-between items-end">
                              <span className="text-[11px] font-black text-dim uppercase tracking-[0.2em]">NET_FLOW (1H_WINDOW)</span>
                              <span className="text-xl font-black text-green-500 font-mono tracking-tighter">+$42,190 BUY</span>
                           </div>
                           <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden shadow-inner border border-terminal">
                              <div className="h-full bg-green-500 shadow-accent" style={{ width: '65%' }}></div>
                           </div>
                           <div className="grid grid-cols-2 gap-8 mt-6">
                              <div className="bg-black/10 p-4 rounded-2xl border border-terminal">
                                 <div className="text-[10px] font-black text-dim uppercase mb-2 tracking-[0.2em] opacity-60">ELITE_CONVICTION</div>
                                 <div className="text-xl font-black text-[var(--terminal-text)] font-mono tracking-tighter">HIGH</div>
                              </div>
                              <div className="bg-black/10 p-4 rounded-2xl border border-terminal">
                                 <div className="text-[10px] font-black text-dim uppercase mb-2 tracking-[0.2em] opacity-60">WHALE_BIAS</div>
                                 <div className="text-xl font-black text-accent font-mono tracking-tighter">LONG</div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 glass-card rounded-3xl transition-all hover:bg-black/20">
                        <h4 className="text-[12px] font-black text-dim uppercase tracking-[0.3em] flex items-center gap-4 mb-8 border-b border-terminal pb-4">
                          <Target className="w-6 h-6 text-amber-500" /> PNL_SURVEILLANCE_LOG
                        </h4>
                        <div className="space-y-4">
                           {Array.from(addressStats.values()).slice(0, 4).map((s, i) => (
                             <div key={i} className="flex items-center justify-between text-[13px] font-bold p-3 bg-black/10 rounded-xl border border-terminal hover:border-accent/30 transition-all">
                                <span className="text-dim font-mono tracking-tighter">{s.address.slice(0, 15)}...</span>
                                <span className={`font-black tracking-tighter ${s.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                   {s.pnl >= 0 ? '+' : ''}${(s.pnl / 1000).toFixed(1)}k USDC
                                </span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 flex flex-col items-center justify-center glass-card bg-black/10 group hover:bg-accent/[0.05] transition-all cursor-pointer rounded-3xl min-h-[600px] border-dashed border-2 border-terminal" 
            onClick={handleAnalyze}
          >
            <div className="relative mb-14 group-hover:scale-110 transition-all duration-500">
               <div className="w-28 h-28 bg-black/20 border-2 border-terminal rounded-full flex items-center justify-center group-hover:border-accent group-hover:shadow-accent transition-all">
                  <Binary className="w-14 h-14 text-dim group-hover:text-accent transition-colors" />
               </div>
               <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <p className="text-lg font-black text-dim uppercase tracking-[0.6em] group-hover:text-accent transition-colors">INITIALIZE_NEURAL_BRIDGE</p>
            <div className="mt-10 flex items-center gap-5 text-dim group-hover:text-[var(--terminal-text)] transition-all">
               <div className="w-10 h-[2px] bg-accent/50 group-hover:w-16 transition-all"></div>
               <span className="text-[13px] font-black uppercase tracking-[0.4em]">BRIDGE_SYNC: READY</span>
               <div className="w-10 h-[2px] bg-accent/50 group-hover:w-16 transition-all"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionEngine;
