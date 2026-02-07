
import React from 'react';
import { PolymarketMarket } from '../types';
import { Layers, Activity, TrendingUp, Search, Target, Zap, ExternalLink } from 'lucide-react';

interface DailyTrackerProps {
  markets: PolymarketMarket[];
  onSelectMarket: (market: PolymarketMarket) => void;
}

const DailyTracker: React.FC<DailyTrackerProps> = ({ markets, onSelectMarket }) => {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {markets.map((market) => {
          const sum = market.outcomePrices.reduce((acc, p) => acc + parseFloat(p), 0);
          const hasArb = sum < 0.98 || sum > 1.02;
          const polymarketUrl = `https://polymarket.com/event/${market.slug}`;

          return (
            <div 
              key={market.id}
              onClick={() => onSelectMarket(market)}
              className={`group relative glass-card p-8 rounded-2xl transition-all duration-500 hover:scale-[1.03] cursor-pointer overflow-hidden flex flex-col min-h-[520px] ${hasArb ? 'border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.15)]' : 'hover:shadow-accent/20 hover:border-accent/40'}`}
            >
              {/* Card Glow Decoration */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full pb-14">
                <div className="flex justify-between items-start mb-6">
                  {hasArb ? (
                    <div className="bg-amber-500 text-black px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 rounded-lg shadow-xl shrink-0">
                      <Target className="w-3.5 h-3.5 animate-pulse" /> ALPHA_DETECTED
                    </div>
                  ) : (
                    <div className="bg-black/20 text-dim px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 rounded-lg border border-terminal shrink-0">
                      <Activity className="w-3.5 h-3.5" /> STABLE_FLOW
                    </div>
                  )}
                  
                  <div className="text-[10px] font-black text-dim uppercase tracking-[0.15em] bg-black/10 px-3 py-1.5 rounded-lg border border-terminal backdrop-blur-md">
                    VOL: ${(parseFloat(market.volume) / 1000).toFixed(1)}K
                  </div>
                </div>

                <div className="flex items-start gap-5 mb-8">
                  <div className="w-16 h-16 bg-black/20 border border-terminal rounded-xl flex items-center justify-center overflow-hidden shrink-0 group-hover:border-accent group-hover:shadow-accent transition-all duration-700 shadow-inner">
                    {market.icon || market.image ? (
                      <img src={market.icon || market.image} alt="" className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
                    ) : (
                      <Layers className="w-8 h-8 text-dim opacity-30 group-hover:text-accent group-hover:opacity-100" />
                    )}
                  </div>
                  <h3 className="font-black text-[var(--terminal-text)] text-base line-clamp-3 leading-snug tracking-tight group-hover:text-accent transition-colors duration-300">
                    {market.question}
                  </h3>
                </div>

                <div className="mt-auto space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {market.outcomes.slice(0, 2).map((outcome, idx) => (
                      <div key={idx} className="bg-black/20 border border-terminal p-4 flex flex-col items-center rounded-xl shadow-inner hover:bg-black/30 hover:border-accent/40 transition-all group/outcome">
                         <span className="text-[9px] text-dim font-black uppercase truncate w-full text-center tracking-[0.1em] mb-1.5">{outcome}</span>
                         <span className={`text-xl font-black font-mono tracking-tighter ${idx === 0 ? 'text-green-500' : 'text-red-500'} group-hover/outcome:scale-105 transition-transform`}>
                            {(parseFloat(market.outcomePrices[idx] || '0') * 100).toFixed(1)}¢
                         </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between text-[9px] font-black uppercase tracking-[0.2em]">
                      <span className="text-dim opacity-60">IMPLIED_PROBABILITY</span>
                      <span className={`${hasArb ? 'text-amber-500' : 'text-dim'} font-black text-[10px]`}>
                        SUM: {(sum * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden shadow-inner border border-terminal">
                      <div 
                        className={`h-full transition-all duration-1500 ease-out shadow-accent ${hasArb ? 'bg-amber-500' : 'bg-accent'}`} 
                        style={{ width: `${parseFloat(market.outcomePrices?.[0] || '0') * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* External Link Overlay - Repositioned to avoid overlap */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500 pointer-events-none">
                <a 
                  href={polymarketUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="pointer-events-auto text-[10px] font-black text-white bg-accent px-6 py-2.5 rounded-xl border border-white/20 shadow-accent flex items-center gap-3 uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
                >
                  EXECUTE_TRADE <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyTracker;
