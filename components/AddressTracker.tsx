
import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Wallet, History, ExternalLink, Activity, ArrowUpRight, ArrowDownRight, Loader2, Save, Trash2, ShieldCheck } from 'lucide-react';
import { AddressTrade } from '../types';
import { fetchAddressTrades } from '../services/polymarketService';
import { storageService } from '../services/storageService';

interface AddressTrackerProps {
  initialAddress?: string;
  onMonitor: (trades: AddressTrade[]) => void;
}

const AddressTracker: React.FC<AddressTrackerProps> = ({ initialAddress, onMonitor }) => {
  const [address, setAddress] = useState(initialAddress || '');
  const [trades, setTrades] = useState<AddressTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);

  useEffect(() => {
    setSavedAddresses(storageService.getSavedAddresses());
    if (initialAddress) {
      handleSearch(initialAddress);
    }
  }, [initialAddress]);

  const handleSearch = async (addrToSearch?: string) => {
    const target = addrToSearch || address;
    if (!target) return;
    setLoading(true);
    const results = await fetchAddressTrades(target);
    setTrades(results);
    onMonitor(results);
    setLoading(false);
  };

  const toggleSaveAddress = (addr: string) => {
    if (savedAddresses.includes(addr.toLowerCase())) {
      storageService.removeAddress(addr);
    } else {
      storageService.saveAddress(addr);
    }
    setSavedAddresses(storageService.getSavedAddresses());
  };

  const isSaved = savedAddresses.includes(address.toLowerCase());

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass-card p-10 rounded-3xl relative overflow-hidden transition-all shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <UserCheck className="w-40 h-40 text-accent" />
        </div>
        
        <div className="flex items-center gap-5 mb-10 border-b border-terminal pb-6 relative z-10">
          <div className="p-3 bg-accent/20 border border-accent/30 rounded-xl shadow-accent">
            <UserCheck className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-sm font-black text-[var(--terminal-text)] uppercase tracking-[0.4em]">Address_Surveillance_Protocol</h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-5 relative z-10">
          <div className="flex-1 relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim" />
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="0x... Enter wallet address to index"
              className="w-full bg-black/10 border border-terminal rounded-2xl px-14 py-4 text-[13px] font-mono text-[var(--terminal-text)] placeholder:text-dim focus:outline-none focus:border-accent/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-10 bg-accent hover:opacity-90 text-white font-black text-[12px] tracking-widest uppercase flex items-center gap-3 transition-all disabled:opacity-50 shadow-lg border border-white/10 rounded-2xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              INDEX_FLOW
            </button>
            <button 
              onClick={() => toggleSaveAddress(address)}
              disabled={!address || address.length < 20}
              className={`p-4 rounded-2xl border transition-all ${isSaved ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-amber-900/20' : 'bg-black/10 border-terminal text-dim hover:text-accent'}`}
              title={isSaved ? "Remove from persistent storage" : "Add to persistent storage"}
            >
              <Save className="w-6 h-6" />
            </button>
          </div>
        </div>

        {savedAddresses.length > 0 && (
          <div className="mt-12 relative z-10">
             <h3 className="text-[10px] font-black text-dim uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-accent" /> SAVED_NODES_IN_STORAGE
             </h3>
             <div className="flex flex-wrap gap-4">
                {savedAddresses.map(addr => (
                  <div key={addr} className="flex items-center gap-3 bg-accent/5 border border-accent/20 px-5 py-2.5 rounded-xl group hover:border-accent transition-all">
                     <span 
                      onClick={() => { setAddress(addr); handleSearch(addr); }}
                      className="text-[12px] font-mono font-bold text-accent cursor-pointer"
                     >
                       {addr.slice(0, 8)}...{addr.slice(-6)}
                     </span>
                     <button 
                      onClick={() => { storageService.removeAddress(addr); setSavedAddresses(storageService.getSavedAddresses()); }}
                      className="text-dim hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3 text-[11px] font-black text-dim uppercase tracking-[0.4em]">
            <History className="w-4 h-4 text-accent" /> Recent_Flow_History
          </div>
          <span className="text-[10px] font-black text-dim uppercase tracking-widest bg-black/10 px-4 py-1 border border-terminal rounded-lg">Records: {trades.length}</span>
        </div>

        <div className="space-y-4">
          {trades.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center glass-card bg-black/10 rounded-3xl border-dashed border-2 border-terminal opacity-60">
              <Activity className="w-16 h-16 text-dim mb-8 animate-pulse" />
              <p className="text-[11px] text-dim font-black uppercase tracking-[0.5em]">Waiting_For_Target_Input...</p>
            </div>
          ) : (
            trades.map((trade) => (
              <div key={trade.id} className="glass-card p-6 flex items-center gap-8 group hover:scale-[1.01] hover:border-accent/40 transition-all cursor-pointer rounded-2xl">
                <div className={`p-4 rounded-xl shadow-lg ${trade.side === 'BUY' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {trade.side === 'BUY' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-dim font-black uppercase tracking-[0.3em] mb-2">{new Date(trade.timestamp).toLocaleString()}</div>
                  <h4 className="text-base font-black text-[var(--terminal-text)] truncate tracking-tight">{trade.marketName}</h4>
                </div>
                <div className="text-right px-8 border-l border-terminal">
                  <div className="text-xl font-black text-[var(--terminal-text)] font-mono tracking-tighter shadow-sm">${trade.size.toLocaleString()}</div>
                  <div className="text-[10px] text-dim font-black uppercase tracking-widest opacity-60">@{trade.price.toFixed(3)} USDC</div>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  <a 
                    href={`https://polygonscan.com/tx/${trade.transactionHash}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-3 text-dim hover:text-accent bg-black/20 rounded-xl border border-terminal transition-all hover:scale-110"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressTracker;
