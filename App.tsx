
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchActiveMarkets, detectWhaleAlerts, detectArbitrage, fetchAddressTrades } from './services/polymarketService';
import { fetchCryptoPrices } from './services/cryptoService';
import { logger } from './services/loggerService';
import { wsService } from './services/webSocketService';
import { sendWhaleAlertToDiscord } from './services/webhookService';
import { storageService } from './services/storageService';
import { LogLevel, AppState, PolymarketMarket, TradeAlert, AddressTrade, FuturesSignal } from './types';
import Layout from './components/Layout';
import DailyTracker from './components/DailyTracker';
import PredictionEngine from './components/PredictionEngine';
import AlertService from './components/AlertService';
import ActivityModal from './components/ActivityModal';
import AddressTracker from './components/AddressTracker';
import FuturesPredictor from './components/FuturesPredictor';
import AIAnalyze from './components/AIAnalyze';
import { Database, ShieldAlert, Cpu, Terminal, TrendingUp, Zap, Target, Binary, AlertCircle, UserCheck } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tracking');
  const [selectedAlert, setSelectedAlert] = useState<TradeAlert | null>(null);
  
  const [state, setState] = useState<AppState>(() => ({
    markets: [],
    alerts: [],
    logs: [],
    prices: [],
    arbitrage: [],
    trackedAddress: '',
    savedAddresses: storageService.getSavedAddresses(),
    addressTrades: [],
    futuresSignals: [],
    isLoading: true,
    selectedMarket: null,
    settings: storageService.getSettings()
  }));

  const isInitialMount = useRef(true);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [markets, prices] = await Promise.all([
        fetchActiveMarkets(60),
        fetchCryptoPrices()
      ]);
      const arb = detectArbitrage(markets, prices);
      
      setState(prev => ({ 
        ...prev, 
        markets, 
        prices,
        arbitrage: arb,
        isLoading: false,
        selectedMarket: prev.selectedMarket || (markets.length > 0 ? markets[0] : null)
      }));
    } catch (e) {
      logger.log(LogLevel.ERROR, 'Kernel', `SYNC_FAILURE: ${e}`);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleTrackAddress = useCallback(async (address: string) => {
    setSelectedAlert(null);
    setActiveTab('address');
    setState(prev => ({ ...prev, trackedAddress: address, isLoading: true }));
    try {
      const trades = await fetchAddressTrades(address);
      setState(prev => ({ ...prev, addressTrades: trades, isLoading: false }));
      logger.log(LogLevel.INFO, 'Navigation', `Switched to ADDR_SURVEIL for ${address.slice(0, 10)}`);
    } catch (e) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      loadData();
      wsService.connect();
      isInitialMount.current = false;
    }
    const dataInterval = setInterval(() => loadData(true), state.settings.autoRefreshInterval);
    
    const alertInterval = setInterval(() => {
      setState(prev => {
        if (prev.markets.length === 0) return prev;
        const newAlert = detectWhaleAlerts(prev.markets);
        if (!newAlert) return prev;
        
        if (newAlert.size > prev.settings.whaleThreshold) {
          logger.log(LogLevel.WARN, 'Flow', `LARGE_ORDER: ${newAlert.side} ${newAlert.size.toLocaleString()}`);
          const market = prev.markets.find(m => m.id === newAlert.marketId);
          sendWhaleAlertToDiscord(newAlert, market);
        }
        
        return { ...prev, alerts: [newAlert, ...prev.alerts].slice(0, 50) };
      });
    }, 8000);

    const unsubscribeLogs = logger.subscribe((logs) => setState(prev => ({ ...prev, logs })));
    return () => { clearInterval(dataInterval); clearInterval(alertInterval); unsubscribeLogs(); };
  }, [loadData, state.settings.autoRefreshInterval, state.settings.whaleThreshold]);

  // Sync settings and saved addresses from localStorage periodically
  useEffect(() => {
    const syncInterval = setInterval(() => {
       setState(prev => ({
         ...prev,
         savedAddresses: storageService.getSavedAddresses(),
         settings: storageService.getSettings()
       }));
    }, 5000);
    return () => clearInterval(syncInterval);
  }, []);

  const renderContent = () => {
    if (state.isLoading && state.markets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] border border-terminal border-dashed bg-black/20 rounded-3xl">
          <Binary className="w-12 h-12 text-accent animate-pulse mb-10" />
          <div className="text-center">
            <p className="text-white font-black text-sm mb-4 uppercase tracking-[0.4em] shadow-accent">Authenticating_API_Gateway...</p>
            <p className="text-dim font-mono text-[10px] tracking-[0.2em] uppercase opacity-60">
              Mapping CLOB_Nodes & Polymarket_Mainnet...
            </p>
          </div>
        </div>
      );
    }

    if (!state.isLoading && state.markets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] bg-red-900/5 border border-red-900/20 p-12 rounded-3xl">
                <AlertCircle className="w-16 h-16 text-red-500 mb-8 animate-bounce" />
                <h2 className="text-sm font-black text-white mb-6 uppercase tracking-[0.5em]">Connection_Error</h2>
                <button onClick={() => loadData()} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[12px] tracking-[0.3em] uppercase transition-all shadow-xl shadow-red-900/20 rounded-2xl border border-white/10">Retry_Handshake</button>
            </div>
        );
    }

    switch (activeTab) {
      case 'tracking':
        return (
          <div className="space-y-12">
            {state.arbitrage.length > 0 && (
               <section className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-3xl shadow-amber-900/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Target className="w-40 h-40 text-amber-500" />
                  </div>
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                      <Target className="w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-[12px] font-black text-amber-500 uppercase tracking-[0.4em]">CRITICAL_ARBITRAGE_DETECTED</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                     {state.arbitrage.map((arb, i) => (
                       <div key={i} className="flex items-center justify-between bg-black/40 p-5 border border-amber-500/10 rounded-2xl hover:border-amber-500/30 transition-all shadow-inner">
                          <span className="text-[12px] text-dim font-bold truncate pr-6 leading-tight">{arb.marketName}</span>
                          <span className="text-amber-500 font-mono text-sm font-black whitespace-nowrap shadow-sm">+{arb.expectedReturn.toFixed(1)}%</span>
                       </div>
                     ))}
                  </div>
               </section>
             )}
            <DailyTracker markets={state.markets} onSelectMarket={(m) => { setState(prev => ({ ...prev, selectedMarket: m })); setActiveTab('predictions'); }} />
          </div>
        );
      case 'analyze':
        return <AIAnalyze onTrackAddress={handleTrackAddress} />;
      case 'predictions':
        return <PredictionEngine selectedMarket={state.selectedMarket} prices={state.prices} />;
      case 'futures':
        return <FuturesPredictor prices={state.prices} />;
      case 'address':
        return <AddressTracker initialAddress={state.trackedAddress} onMonitor={(trades) => setState(prev => ({ ...prev, addressTrades: trades }))} />;
      case 'alerts':
        return <AlertService alerts={state.alerts} onSelectAlert={setSelectedAlert} />;
      case 'logs':
        return (
          <div className="border border-terminal bg-black/20 flex flex-col h-[70vh] rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="p-6 bg-black/40 border-b border-terminal flex items-center justify-between font-black uppercase tracking-[0.4em] text-[12px] text-dim shadow-md">
              <span className="flex items-center gap-3"><Terminal className="w-5 h-5 text-accent" /> SYSTEM_TRACE</span>
              <span className="bg-accent/10 text-accent px-4 py-1 rounded-lg border border-accent/20">BUFFER_ACTIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2 font-mono text-[11px] bg-black/10 custom-scrollbar">
              {state.logs.map((log) => (
                <div key={log.id} className="flex gap-6 py-2.5 border-b border-terminal hover:bg-accent/5 px-4 transition-all rounded-lg group">
                  <span className="text-dim opacity-50 shrink-0">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
                  <span className={`w-20 font-black shrink-0 text-center rounded-lg border ${log.level === LogLevel.ERROR ? 'text-red-500 border-red-500/20 bg-red-500/5' : log.level === LogLevel.WARN ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 'text-accent border-accent/20 bg-accent/5'}`}>{log.level}</span>
                  <span className="text-dim group-hover:text-[var(--terminal-text)] flex-1 truncate transition-colors font-medium">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="flex gap-6 mb-10 overflow-x-auto border-b border-terminal pb-6 bg-black/5 px-4 custom-scrollbar rounded-xl">
         {state.prices.map(p => (
           <div key={p.id} className="flex items-center gap-4 bg-black/20 px-6 py-3 border border-terminal min-w-fit rounded-2xl shadow-inner hover:border-accent/40 transition-all group">
             <span className="text-[11px] font-black text-dim tracking-[0.2em] group-hover:text-accent transition-colors">{p.symbol}</span>
             <span className="text-base font-mono text-white font-black tracking-tighter">${p.price.toLocaleString()}</span>
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${p.change24h >= 0 ? 'text-green-500 border-green-500/20 bg-green-500/5' : 'text-red-500 border-red-500/20 bg-red-500/5'}`}>
               {p.change24h >= 0 ? '+' : ''}{p.change24h.toFixed(2)}%
             </span>
           </div>
         ))}
         <div className="ml-auto flex items-center gap-6">
           <div className="flex items-center gap-3 bg-black/20 px-6 py-3 border border-terminal rounded-2xl shadow-inner">
              <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-dim uppercase tracking-[0.3em]">ARB_ENGINE: ONLINE</span>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
         {[
           { label: 'MARKET_TARGETS', value: state.markets.length, icon: Database, color: 'text-blue-500' },
           { label: 'ARB_OPPORTUNITIES', value: state.arbitrage.length, icon: Target, color: 'text-amber-500' },
           { label: 'ADDR_SENSORS', value: state.addressTrades.length, icon: UserCheck, color: 'text-accent' },
           { label: 'NEURAL_CORES', value: '16', icon: Cpu, color: 'text-accent' },
           { label: 'FLOW_VECTORS', value: state.alerts.length, icon: ShieldAlert, color: 'text-dim' }
         ].map((stat, idx) => (
           <div key={idx} className="glass-card p-8 group hover:bg-accent/[0.04] hover:border-accent/30 transition-all cursor-default relative overflow-hidden rounded-3xl shadow-xl">
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                <stat.icon className={`w-20 h-20 ${stat.color}`} />
              </div>
              <div className="flex items-center justify-between mb-5 relative z-10">
                 <span className="text-[10px] font-black text-dim uppercase tracking-[0.3em]">{stat.label}</span>
                 <stat.icon className={`w-5 h-5 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
              </div>
              <div className="text-3xl font-black text-[var(--terminal-text)] font-mono tracking-tighter relative z-10 shadow-sm">{stat.value}</div>
           </div>
         ))}
      </div>

      {renderContent()}

      {selectedAlert && (
        <ActivityModal 
          alert={selectedAlert}
          market={state.markets.find(m => m.id === selectedAlert.marketId)}
          onClose={() => setSelectedAlert(null)}
          onTrackAddress={handleTrackAddress}
        />
      )}
    </Layout>
  );
};

export default App;
