
import React, { useState, useEffect } from 'react';
import { TradeAlert, PolymarketMarket, PredictionResult, AddressStats, AddressTrade } from '../types';
import { X, ShieldAlert, Cpu, Database, Binary, Loader2, Code, ChevronRight, Activity, TrendingUp, TrendingDown, Target, ShieldCheck, ExternalLink, User, BarChart3, History, ArrowUpRight, ArrowDownRight, ArrowLeft, Radar } from 'lucide-react';
import { analyzeMarketSentiment } from '../services/geminiService';
import { fetchAddressStats, fetchAddressTrades } from '../services/polymarketService';

interface ActivityModalProps {
  alert: TradeAlert;
  market: PolymarketMarket | undefined;
  onClose: () => void;
  onTrackAddress?: (address: string) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ alert, market, onClose, onTrackAddress }) => {
  const [analysis, setAnalysis] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  
  // Profile state
  const [activeView, setActiveView] = useState<'analysis' | 'profile'>('analysis');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStats, setProfileStats] = useState<AddressStats | null>(null);
  const [profileTrades, setProfileTrades] = useState<AddressTrade[]>([]);

  useEffect(() => {
    if (market) {
      runAnalysis();
    }
  }, [market]);

  const runAnalysis = async () => {
    if (!market) return;
    setLoading(true);
    const result = await analyzeMarketSentiment(market);
    setAnalysis(result);
    setLoading(false);
  };

  const handleAddressClick = async (address: string) => {
    setActiveView('profile');
    setProfileLoading(true);
    try {
      const [stats, trades] = await Promise.all([
        fetchAddressStats(address),
        fetchAddressTrades(address)
      ]);
      setProfileStats(stats);
      setProfileTrades(trades);
    } catch (e) {
      console.error("Profile load failed", e);
    } finally {
      setProfileLoading(false);
    }
  };

  const polymarketUrl = market ? `https://polymarket.com/event/${market.slug}` : `https://polymarket.com/`;
  const profileUrl = `https://polymarket.com/profile/${alert.address}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-[#020617] border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header HUD */}
        <div className="h-14 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeView === 'profile' ? (
              <button 
                onClick={() => setActiveView('analysis')}
                className="p-1.5 hover:bg-slate-800 rounded text-blue-500 transition-colors mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">
                {activeView === 'profile' ? 'Wallet_Identity_Scanner' : 'Activity_Inquiry_Terminal'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">ID: {alert.id}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Col: TX Data & Market (Always visible context) */}
            <div className="lg:col-span-4 space-y-6">
              <section className="bg-black/40 border border-slate-800 p-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> TX_METADATA
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-600 font-bold uppercase mb-1">Execution_Side</span>
                    <span className={`text-sm font-black ${alert.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{alert.side} ORDER</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-600 font-bold uppercase mb-1">Order_Volume</span>
                    <span className="text-xl font-mono text-white font-black">${alert.size.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-600 font-bold uppercase mb-1 text-blue-500">Counterparty_Addr (Inspect_User)</span>
                    <button 
                      onClick={() => handleAddressClick(alert.address)}
                      className="text-[10px] font-mono text-blue-400 break-all bg-blue-500/5 p-2 border border-blue-500/20 rounded hover:bg-blue-500/10 hover:border-blue-500/40 transition-all text-left group"
                    >
                      <span className="flex items-center gap-2">
                        {alert.address}
                        <User className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="bg-black/40 border border-slate-800 p-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" /> TARGET_MARKET
                </h3>
                <h4 className="text-xs font-bold text-white mb-4 leading-relaxed">{alert.marketName}</h4>
                {market && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-800 pb-2">
                      <span className="text-slate-600 font-black uppercase">Lit_Volume</span>
                      <span className="text-slate-300 font-mono font-bold">${parseFloat(market.volume).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {market.outcomes.slice(0, 2).map((o, i) => (
                        <div key={i} className="bg-slate-900/60 p-3 rounded border border-slate-800 text-center flex flex-col justify-center min-h-[60px]">
                          <div className="text-[9px] text-slate-500 font-black uppercase mb-1 truncate">{o}</div>
                          <div className="text-sm font-black text-white">{(parseFloat(market.outcomePrices[i] || '0') * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <a 
                  href={polymarketUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-blue-900/40 group border border-blue-400/20"
                >
                  Place Bet on Polymarket 
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </section>

              <button 
                onClick={() => setShowRaw(!showRaw)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-800 text-slate-600 hover:text-blue-400 hover:border-blue-500/30 transition-all text-[10px] font-black uppercase tracking-widest bg-black/20"
              >
                <Code className="w-3.5 h-3.5" />
                {showRaw ? 'Hide_Source_JSON' : 'Inspect_Raw_Protocol_Data'}
              </button>
            </div>

            {/* Right Col: AI Analysis or Profile View */}
            <div className="lg:col-span-8">
              {showRaw ? (
                <div className="h-full bg-slate-950/50 border border-slate-800 p-6 font-mono text-[10px] overflow-auto text-blue-300 custom-scrollbar">
                  <div className="mb-4 text-slate-600 flex items-center gap-2 uppercase font-black">
                    <Binary className="w-4 h-4" />
                    INSPECTING_FLOW_DATA_OBJECTS
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h5 className="text-amber-500/80 mb-2 font-black tracking-widest text-[9px] uppercase">Trade_Alert_Event</h5>
                      <pre className="whitespace-pre-wrap leading-relaxed opacity-80 bg-black/40 p-4 border border-slate-800/50">{JSON.stringify(alert, null, 2)}</pre>
                    </div>
                    {market && (
                      <div>
                        <h5 className="text-blue-500/80 mb-2 font-black tracking-widest text-[9px] uppercase">Market_Raw_Payload</h5>
                        <pre className="whitespace-pre-wrap leading-relaxed opacity-80 bg-black/40 p-4 border border-slate-800/50">{JSON.stringify(market.raw || market, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeView === 'profile' ? (
                <div className="h-full flex flex-col min-h-[500px] animate-in slide-in-from-right-4 duration-300">
                  {profileLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center border border-slate-800 border-dashed bg-black/20">
                      <User className="w-12 h-12 text-blue-500 animate-pulse mb-6" />
                      <p className="text-blue-500 font-black text-[10px] animate-pulse uppercase tracking-[0.3em]">Indexing_Wallet_Statistics...</p>
                    </div>
                  ) : profileStats && (
                    <div className="flex-1 bg-black/40 border border-slate-800 p-8 flex flex-col space-y-8 relative">
                      {/* Action Buttons Overlay */}
                      <div className="absolute top-8 right-8 flex gap-3">
                        <button 
                          onClick={() => onTrackAddress?.(profileStats.address)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 font-black text-[10px] tracking-widest uppercase hover:bg-indigo-600/20 transition-all"
                        >
                          <Radar className="w-3.5 h-3.5" />
                          Track_Wallet
                        </button>
                        <a 
                          href={profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 font-black text-[10px] tracking-widest uppercase hover:bg-blue-600/20 transition-all"
                        >
                          Polymarket_Profile
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Wallet_ID</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${profileStats.tier === 'WHALE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                              {profileStats.tier}
                            </span>
                          </div>
                          <h4 className="text-sm font-mono font-bold text-white break-all mt-1">{profileStats.address}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Win_Rate</span>
                          <div className="text-2xl font-black text-green-500 font-mono">{(profileStats.winRate * 100).toFixed(1)}%</div>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Volume_Total</span>
                          <div className="text-2xl font-black text-white font-mono">${(profileStats.totalVolume / 1000000).toFixed(2)}M</div>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Total_Orders</span>
                          <div className="text-2xl font-black text-blue-400 font-mono">{profileStats.totalTrades}</div>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 flex flex-col">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <History className="w-3.5 h-3.5" /> Recent_Large_Order_Flow
                        </h5>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                          {profileTrades.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/60 rounded group hover:bg-slate-900/40 transition-all">
                              <div className="flex items-center gap-4">
                                <div className={`p-1.5 rounded ${t.side === 'BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {t.side === 'BUY' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                  <div className="text-[9px] text-slate-600 font-bold uppercase">{new Date(t.timestamp).toLocaleDateString()}</div>
                                  <div className="text-xs font-bold text-white max-w-sm truncate">{t.marketName}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-white font-mono">${t.size.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-600 font-bold">@{t.price.toFixed(3)} USDC</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-[500px]">
                  {loading ? (
                    <div className="flex-1 border border-slate-800 border-dashed bg-black/20 flex flex-col items-center justify-center">
                      <Cpu className="w-12 h-12 text-blue-500 animate-spin mb-6" />
                      <p className="text-blue-500 font-black text-[10px] animate-pulse uppercase tracking-[0.3em]">Neural_Engine_Syncing_Sentiment...</p>
                    </div>
                  ) : analysis ? (
                    <div className="flex-1 bg-black/40 border border-slate-800 p-8 flex flex-col">
                      <div className="flex items-center justify-between mb-10">
                        <div className={`px-4 py-2 border rounded flex items-center gap-3 ${
                          analysis.sentiment === 'BULLISH' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                          analysis.sentiment === 'BEARISH' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                          'bg-slate-500/10 border-slate-500/30 text-slate-500'
                        }`}>
                          {analysis.sentiment === 'BULLISH' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-[10px] font-black tracking-[0.2em] uppercase">{analysis.sentiment}_SIGNAL_LOCKED</span>
                        </div>
                        <div className="text-[9px] font-black text-slate-700 tracking-[0.2em] uppercase flex items-center gap-2">
                          <Target className="w-3.5 h-3.5" />
                          CONFIDENCE: {(analysis.score * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="space-y-8 flex-1">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                             <ChevronRight className="w-3 h-3 text-blue-500" />
                             <h5 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">NARRATIVE_DIAGNOSTIC</h5>
                          </div>
                          <p className="text-slate-300 text-sm leading-relaxed font-medium bg-slate-900/40 p-6 border border-slate-800/40 shadow-inner">
                            {analysis.reasoning}
                          </p>
                        </div>

                        <div className="bg-blue-600/5 border border-blue-500/20 p-6">
                           <h5 className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest mb-4">TACTICAL_FLOW_INSTRUCTION</h5>
                           <div className="text-white font-bold text-sm tracking-tight border-l-2 border-blue-500 pl-4">{analysis.suggestedAction}</div>
                        </div>
                      </div>

                      <div className="mt-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-700 font-bold uppercase tracking-widest">
                         <div className="flex items-center gap-2">
                            <Binary className="w-3.5 h-3.5" />
                            <span>Neural_Provider: Gemini_3_Flash</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                            <span>Grounding_Verified</span>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 border border-slate-800 border-dashed bg-black/20 flex flex-col items-center justify-center cursor-pointer group" onClick={runAnalysis}>
                       <Binary className="w-12 h-12 text-slate-800 group-hover:text-blue-500 transition-colors mb-6" />
                       <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em] group-hover:text-blue-400">Initialize_Neural_Probe</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityModal;
