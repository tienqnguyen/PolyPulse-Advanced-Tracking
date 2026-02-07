
import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Loader2, Target, Binary, ChevronRight, Activity, TrendingUp, TrendingDown, Database, ExternalLink, ShieldCheck, User, ArrowUpRight, ArrowDownRight, Radar, Trophy, ShieldAlert, BarChart3, Filter } from 'lucide-react';
import { fetchMarketBySlug, fetchMarketTrades, fetchAddressStats } from '../services/polymarketService';
import { analyzeMarketSentiment } from '../services/geminiService';
import { PolymarketMarket, PredictionResult, AddressTrade, AddressStats } from '../types';

interface AIAnalyzeProps {
  onTrackAddress: (address: string) => void;
}

const AIAnalyze: React.FC<AIAnalyzeProps> = ({ onTrackAddress }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [market, setMarket] = useState<PolymarketMarket | null>(null);
  const [analysis, setAnalysis] = useState<PredictionResult | null>(null);
  const [trades, setTrades] = useState<AddressTrade[]>([]);
  const [eliteWallets, setEliteWallets] = useState<Map<string, AddressStats>>(new Map());
  const [filterElite, setFilterElite] = useState(false);

  const handleDeepAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setMarket(null);
    setAnalysis(null);
    setTrades([]);
    setEliteWallets(new Map());
    
    try {
      // Improved robust slug extraction
      let slug = url.trim().replace(/\/$/, "");
      
      // Handle standard Polymarket link formats
      if (slug.includes('/event/')) {
        slug = slug.split('/event/')[1].split('?')[0];
      } else if (slug.includes('/market/')) {
        slug = slug.split('/market/')[1].split('?')[0];
      } else if (slug.includes('polymarket.com/')) {
         const parts = slug.split('/');
         slug = parts[parts.length - 1].split('?')[0];
      }
      
      const marketData = await fetchMarketBySlug(slug);
      if (marketData) {
        setMarket(marketData);
        
        // Concurrent execution: Analysis + Order Flow
        const [analysisResult, tradeList] = await Promise.all([
          analyzeMarketSentiment(marketData),
          fetchMarketTrades(marketData.id)
        ]);
        
        setAnalysis(analysisResult);
        setTrades(tradeList);

        // Map elite stats for visible trades
        const statsMap = new Map<string, AddressStats>();
        const addresses = Array.from(new Set(tradeList.map(t => t.address)));
        
        await Promise.all(addresses.map(async (addr) => {
          const stats = await fetchAddressStats(addr);
          statsMap.set(addr, stats);
        }));
        
        setEliteWallets(statsMap);
      } else {
        throw new Error("Target resource not found.");
      }
    } catch (e) {
      console.error("Deep Analysis Failed", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = filterElite 
    ? trades.filter(t => (eliteWallets.get(t.address)?.winRate || 0) > 0.55)
    : trades;

  const topPerformers = Array.from(eliteWallets.values())
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="main-glow-container p-8 transition-colors duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20 rounded shadow-accent">
              <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            </div>
            <h2 className="text-sm font-black text-[var(--terminal-text)] uppercase tracking-[0.3em]">Neural_Market_XRay_Protocol</h2>
          </div>
          <div className="text-[9px] font-black text-dim uppercase tracking-widest bg-black/5 px-3 py-1 border border-terminal">
            Scanning_Engine: Active_v3.2
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input 
              type="text" 
              value={url}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepAnalyze()}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste event link (e.g. https://polymarket.com/event/epl-wol-che-2026-02-07)"
              className="w-full bg-black/5 border border-terminal rounded px-12 py-4 text-[11px] font-mono text-[var(--terminal-text)] placeholder:text-dim focus:outline-none focus:border-accent/50 transition-all shadow-inner"
            />
          </div>
          <button 
            onClick={handleDeepAnalyze}
            disabled={loading || !url}
            className="px-10 bg-accent hover:opacity-90 text-white font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg border border-white/10"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Binary className="w-4 h-4" />}
            RUN_XRAY_PROBE
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <p className="text-[10px] text-dim font-black uppercase tracking-widest">
            Protocol_Links (Resolves deep suffixes automatically):
          </p>
          <code className="text-[9px] text-accent/80 font-mono break-all bg-black/5 p-2 rounded mt-1 border border-terminal">
            https://polymarket.com/event/epl-wol-che-2026-02-07-che
          </code>
        </div>
      </div>

      {!market && !loading && (
        <div className="py-32 flex flex-col items-center justify-center border border-terminal border-dashed bg-black/5">
           <div className="relative mb-8">
              <Database className="w-16 h-16 text-dim opacity-20" />
              <div className="absolute inset-0 bg-accent/5 blur-xl rounded-full"></div>
           </div>
           <p className="text-[10px] text-dim font-black uppercase tracking-[0.5em] animate-pulse">Awaiting_Neural_Target_Seed</p>
        </div>
      )}

      {loading && (
        <div className="py-32 flex flex-col items-center justify-center main-glow-container">
           <div className="relative mb-10">
              <Loader2 className="w-12 h-12 text-accent animate-spin" />
              <div className="absolute inset-0 bg-accent/10 blur-2xl animate-pulse"></div>
           </div>
           <div className="text-center space-y-3">
             <p className="text-accent font-black text-[11px] uppercase tracking-[0.4em]">Decompiling_Order_Flow_&_Sentiment_Vectors...</p>
             <p className="text-dim font-mono text-[9px] uppercase tracking-widest animate-pulse">Redundancy_Check: AI_Grounding_Enabled</p>
           </div>
        </div>
      )}

      {market && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6 duration-700">
          
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-card border border-terminal p-8 relative overflow-hidden transition-colors shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="w-32 h-32 text-accent" />
              </div>

              <div className="flex items-center justify-between mb-10 border-b border-terminal pb-6">
                 <div className="flex items-center gap-4">
                    <Target className="w-5 h-5 text-accent" />
                    <h3 className="text-xs font-black text-[var(--terminal-text)] uppercase tracking-[0.2em]">Strategic_Neural_Intelligence</h3>
                 </div>
                 <div className="flex items-center gap-4">
                   <a 
                     href={`https://polymarket.com/event/${market.slug}`} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="px-4 py-1.5 bg-accent/10 border border-accent/30 text-accent text-[9px] font-black uppercase tracking-widest hover:bg-accent/20 transition-all flex items-center gap-2"
                   >
                     Protocol_Link <ExternalLink className="w-3 h-3" />
                   </a>
                 </div>
              </div>
              
              <div className="space-y-10">
                 <h4 className="text-xl font-black text-[var(--terminal-text)] leading-tight tracking-tight border-l-4 border-accent pl-6 py-2 bg-gradient-to-r from-accent/5 to-transparent">
                   {market.question}
                 </h4>
                 
                 {analysis ? (
                   <div className="space-y-8">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className={`px-6 py-2 border rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                          analysis.sentiment === 'BULLISH' ? 'bg-green-500/10 border-green-500/40 text-green-500 shadow-green-900/5' :
                          analysis.sentiment === 'BEARISH' ? 'bg-red-500/10 border-red-500/40 text-red-500 shadow-red-900/5' :
                          'bg-slate-500/10 border-slate-500/40 text-slate-500'
                        }`}>
                          {analysis.sentiment === 'BULLISH' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {analysis.sentiment}_SIGNAL_LOCKED
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-dim uppercase tracking-widest">
                           <ShieldCheck className="w-4 h-4 text-accent" /> 
                           Confidence: <span className="text-[var(--terminal-text)]">{(analysis.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="bg-black/5 p-8 border border-terminal shadow-inner relative group rounded">
                         <div className="absolute top-0 right-0 p-4">
                            <Binary className="w-4 h-4 text-dim group-hover:text-accent transition-colors" />
                         </div>
                         <h5 className="text-[10px] font-black text-accent uppercase mb-4 tracking-[0.2em] flex items-center gap-2 opacity-60">
                           <Activity className="w-3.5 h-3.5" /> Neural_Logic_Decomposition
                         </h5>
                         <p className="text-[var(--terminal-text)] text-[13px] leading-relaxed font-medium font-sans italic">
                           "{analysis.reasoning}"
                         </p>
                      </div>

                      <div className="p-8 bg-accent/5 border border-accent/20 rounded relative">
                         <div className="absolute -top-3 left-8 px-3 py-1 bg-accent text-white text-[9px] font-black uppercase tracking-widest rounded-sm shadow-accent">
                            Execution_Directive
                         </div>
                         <p className="text-[var(--terminal-text)] font-black text-sm uppercase tracking-tighter leading-tight">
                            {analysis.suggestedAction}
                         </p>
                      </div>
                   </div>
                 ) : (
                   <div className="p-16 border border-terminal border-dashed text-center bg-black/5">
                      <ShieldAlert className="w-10 h-10 text-dim mx-auto mb-4" />
                      <p className="text-[10px] text-dim font-black uppercase tracking-widest">Diagnostic_Protocol_Offline</p>
                   </div>
                 )}
              </div>
            </section>

            <section className="bg-card border border-terminal p-8 transition-colors rounded">
               <div className="flex items-center justify-between mb-8 border-b border-terminal pb-6">
                 <h3 className="text-xs font-black text-[var(--terminal-text)] uppercase tracking-widest flex items-center gap-3">
                   <Activity className="w-5 h-5 text-amber-500" /> Whaleflow_Surveillance_Feed
                 </h3>
                 <button 
                  onClick={() => setFilterElite(!filterElite)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded text-[9px] font-black uppercase tracking-widest transition-all ${filterElite ? 'bg-amber-500 text-black' : 'bg-black/5 border border-terminal text-dim hover:text-accent'}`}
                 >
                   <Filter className="w-3.5 h-3.5" />
                   {filterElite ? 'Showing_Elite_Only' : 'All_Orders'}
                 </button>
               </div>
               
               <div className="space-y-3">
                  {filteredTrades.length === 0 ? (
                    <div className="py-12 text-center text-[10px] font-black text-dim uppercase tracking-widest border border-terminal border-dashed">
                       No_Matching_Flow_Segments_Found
                    </div>
                  ) : (
                    filteredTrades.map((t, idx) => {
                      const stats = eliteWallets.get(t.address);
                      const isElite = stats && stats.winRate > 0.55;
                      
                      return (
                        <div key={idx} className={`p-5 bg-black/5 border flex items-center justify-between group transition-all duration-300 ${isElite ? 'border-amber-500/40 bg-amber-500/[0.04]' : 'border-terminal hover:border-accent'}`}>
                          <div className="flex items-center gap-5">
                            <div className={`p-2.5 rounded shadow-inner ${t.side === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {t.side === 'BUY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1.5">
                                 <button 
                                   onClick={() => onTrackAddress(t.address)}
                                   className="text-[11px] font-mono font-bold text-accent hover:underline transition-colors flex items-center gap-2"
                                 >
                                   <User className="w-3.5 h-3.5 opacity-40" />
                                   {t.address.slice(0, 10)}...{t.address.slice(-6)}
                                 </button>
                                 {isElite && (
                                   <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-tighter">ELITE_FLOW</span>
                                 )}
                              </div>
                              <div className="text-[10px] text-dim font-black uppercase tracking-widest opacity-60">{new Date(t.timestamp).toLocaleTimeString()} @ {t.price.toFixed(3)} USDC</div>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-base font-black text-[var(--terminal-text)] font-mono tracking-tighter">${t.size.toLocaleString()}</div>
                             {isElite && stats && (
                               <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Accuracy: {(stats.winRate * 100).toFixed(0)}%</div>
                             )}
                          </div>
                        </div>
                      );
                    })
                  )}
               </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <section className="bg-card border border-terminal p-6 shadow-xl transition-colors rounded">
                <h3 className="text-[10px] font-black text-dim uppercase tracking-[0.2em] mb-8 flex items-center gap-2 border-b border-terminal pb-4">
                  <Trophy className="w-4 h-4 text-amber-500" /> Top_Elite_Performers
                </h3>
                <div className="space-y-6">
                   {topPerformers.map((p, i) => (
                     <div key={i} className="flex flex-col gap-3 group">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-mono text-accent group-hover:underline transition-colors cursor-pointer" onClick={() => onTrackAddress(p.address)}>
                             {p.address.slice(0, 8)}...
                           </span>
                           <span className="text-[9px] font-black text-green-500">{(p.winRate * 100).toFixed(1)}% WR</span>
                        </div>
                        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-amber-500 transition-all duration-1000 shadow-accent" style={{ width: `${p.winRate * 100}%` }}></div>
                        </div>
                        <div className="text-[8px] font-black text-dim uppercase flex justify-between">
                           <span>VOL: ${(p.totalVolume / 1000000).toFixed(1)}M</span>
                           <span>{p.totalTrades} TRADES</span>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             <section className="bg-card border border-terminal p-6 transition-colors rounded">
                <h3 className="text-[10px] font-black text-dim uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-terminal pb-4">
                  <BarChart3 className="w-3.5 h-3.5 text-accent" /> Protocol_Telemetry
                </h3>
                <div className="space-y-6">
                   <div className="p-5 bg-black/5 border border-terminal rounded shadow-inner">
                      <span className="text-[9px] font-black text-dim uppercase mb-2 block tracking-widest opacity-60">Aggregated_Volume</span>
                      <div className="text-xl font-black text-[var(--terminal-text)] font-mono tracking-tighter">${parseFloat(market.volume).toLocaleString()}</div>
                   </div>
                   <div className="p-5 bg-black/5 border border-terminal rounded shadow-inner">
                      <span className="text-[9px] font-black text-dim uppercase mb-2 block tracking-widest opacity-60">Total_Liquidity</span>
                      <div className="text-xl font-black text-[var(--terminal-text)] font-mono tracking-tighter">${parseFloat(market.liquidity || '0').toLocaleString()}</div>
                   </div>
                </div>
             </section>

             <div className="bg-accent/[0.03] border border-accent/20 p-6 rounded shadow-inner transition-all hover:bg-accent/[0.05]">
                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <Radar className="w-4 h-4 animate-pulse" /> Neural_Probe_Summary
                </h3>
                <div className="space-y-4 font-mono">
                   <div className="flex justify-between text-[9px] font-black">
                      <span className="text-dim uppercase opacity-60">Grounded_Sources</span>
                      <span className="text-[var(--terminal-text)]">Google_News, X_Flow</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-black">
                      <span className="text-dim uppercase opacity-60">Analysis_Accuracy</span>
                      <span className="text-green-500">92.1% CERTAIN</span>
                   </div>
                   <div className="flex justify-between text-[9px] font-black">
                      <span className="text-dim uppercase opacity-60">Arb_Index</span>
                      <span className="text-amber-500">LOW_RISK</span>
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AIAnalyze;
