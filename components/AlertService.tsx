
import React, { useState, useEffect } from 'react';
import { TradeAlert, AppSettings } from '../types';
import { ShieldAlert, Wallet, Clock, Radio, ChevronUp, ChevronDown, Activity, ExternalLink, Cpu, Terminal, Copy, Download, Zap, Settings, Globe } from 'lucide-react';
import { storageService } from '../services/storageService';

interface AlertServiceProps {
  alerts: TradeAlert[];
  onSelectAlert: (alert: TradeAlert) => void;
}

const AlertService: React.FC<AlertServiceProps> = ({ alerts, onSelectAlert }) => {
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [showConfig, setShowConfig] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const copyWorkerScript = () => {
    const script = `// PolyPulse Worker Configuration (Cron-compatible)
const THRESHOLD = ${settings.whaleThreshold};
const DISCORD_URL = "${settings.discordWebhookUrl}";
const SCAN_INTERVAL = ${settings.autoRefreshInterval};

// Run as persistent background process:
// 1. Save to background_monitor.js
// 2. npm install node-fetch
// 3. pm2 start background_monitor.js
`;
    navigator.clipboard.writeText(script);
    alert('Worker Configuration Copied to Clipboard');
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-terminal pb-8">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl shadow-amber-900/10">
            <ShieldAlert className="w-7 h-7 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[var(--terminal-text)] uppercase tracking-[0.4em]">Whale_Flow_Surveillance</h2>
            <p className="text-[10px] text-dim mt-2 uppercase font-black tracking-widest opacity-60">Scanning CLOB depth for volume anomalies</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all text-[11px] font-black uppercase tracking-widest ${showConfig ? 'bg-accent text-white border-accent shadow-accent' : 'bg-black/10 border-terminal text-dim hover:text-accent shadow-inner'}`}
          >
            <Settings className="w-4 h-4" />
            Automation_Core
          </button>
          <div className="flex items-center gap-3 px-6 py-2.5 bg-black/10 border border-terminal rounded-2xl shadow-inner">
            <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-dim uppercase tracking-widest">Scanning_Live_Depth</span>
          </div>
        </div>
      </div>

      {showConfig && (
        <section className="glass-card p-10 rounded-3xl border-accent/30 bg-accent/[0.02] animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Cpu className="w-40 h-40 text-accent" />
          </div>
          
          <div className="flex items-center gap-4 mb-10 border-b border-terminal pb-6 relative z-10">
            <Cpu className="w-6 h-6 text-accent" />
            <h3 className="text-xs font-black text-[var(--terminal-text)] uppercase tracking-[0.3em]">Worker_Daemon_Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-dim uppercase tracking-widest block">Whale_Alert_Threshold (USDC)</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range" 
                    min="1000" 
                    max="500000" 
                    step="5000"
                    value={settings.whaleThreshold}
                    onChange={(e) => updateSetting('whaleThreshold', parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-lg font-black font-mono text-accent bg-accent/10 px-6 py-2 rounded-xl border border-accent/20 min-w-[120px] text-center">
                    ${settings.whaleThreshold.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-dim uppercase tracking-widest block flex items-center gap-3">
                   <Globe className="w-4 h-4 text-accent" /> Discord_Webhook_URL_Hook
                </label>
                <input 
                  type="text" 
                  value={settings.discordWebhookUrl}
                  onChange={(e) => updateSetting('discordWebhookUrl', e.target.value)}
                  placeholder="Paste Discord Webhook URL"
                  className="w-full bg-black/20 border border-terminal rounded-2xl px-6 py-4 text-[13px] font-mono text-[var(--terminal-text)] placeholder:text-dim focus:outline-none focus:border-accent/50 transition-all shadow-inner"
                />
              </div>

              <div className="p-8 bg-black/20 border border-terminal rounded-3xl space-y-6 shadow-inner">
                 <div className="flex items-center gap-3 text-[10px] font-black text-dim uppercase tracking-widest">
                    <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Auto_Run_Protocols
                 </div>
                 <p className="text-[12px] text-dim leading-relaxed font-bold opacity-80">
                   Deploy the <span className="text-accent font-black">PolyPulse Daemon</span> to a headless server (Node.js) to receive flow alerts even when the terminal is closed.
                 </p>
                 <div className="flex gap-4">
                    <button 
                      onClick={copyWorkerScript}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-accent text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-accent border border-white/10"
                    >
                      <Copy className="w-4 h-4" /> Copy_Job_Config
                    </button>
                 </div>
              </div>
            </div>

            <div className="bg-black/40 p-10 rounded-3xl border border-terminal relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Terminal className="w-48 h-48 text-accent" />
               </div>
               <h4 className="text-[11px] font-black text-dim uppercase tracking-widest mb-8 flex items-center gap-4 border-b border-terminal pb-4">
                 <Terminal className="w-5 h-5 text-accent" /> CRON_DEPLOYMENT_SHELL
               </h4>
               <pre className="text-[12px] font-mono text-accent/80 leading-relaxed whitespace-pre-wrap select-all custom-scrollbar overflow-auto h-[200px]">
{`# Deployment Guide:
# 1. SSH into target server
# 2. mkdir polypulse && cd polypulse
# 3. cat > config.js <<EOF
{
  "threshold": ${settings.whaleThreshold},
  "webhook": "${settings.discordWebhookUrl.slice(0, 30)}..."
}
EOF
# 4. node background_monitor.js

# Setup CRON (Every 5 mins)
*/5 * * * * /usr/bin/node /root/polypulse/monitor.js`}
               </pre>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6">
        {alerts.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center glass-card bg-black/10 rounded-3xl border-dashed border-2 border-terminal opacity-60">
             <Activity className="w-20 h-20 text-dim mb-10 animate-pulse" />
             <p className="text-[13px] text-dim font-black uppercase tracking-[0.5em]">Listening_For_Vol_Anomalies...</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => onSelectAlert(alert)}
              className={`flex items-center gap-10 glass-card p-8 transition-all hover:scale-[1.01] hover:border-accent/40 group cursor-pointer relative overflow-hidden rounded-3xl ${
                alert.side === 'BUY' ? 'border-l-8 border-l-green-500/40 shadow-[0_0_30px_rgba(34,197,94,0.05)]' : 'border-l-8 border-l-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.05)]'
              }`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                 <ShieldAlert className="w-40 h-40" />
              </div>

              <div className={`p-5 rounded-2xl shadow-xl transition-all group-hover:rotate-6 ${
                alert.side === 'BUY' ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-green-900/10' : 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-red-900/10'
              }`}>
                {alert.side === 'BUY' ? <ChevronUp className="w-8 h-8" /> : <ChevronDown className="w-8 h-8" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-6 mb-4">
                  <span className={`text-[11px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-xl border shadow-inner ${
                    alert.side === 'BUY' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}>
                    {alert.side}_ALERT
                  </span>
                  <div className="flex items-center gap-3 text-[12px] text-dim font-black uppercase tracking-widest bg-black/10 px-4 py-1.5 rounded-xl border border-terminal">
                    <Clock className="w-4 h-4 text-accent/60" />
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <h4 className="font-black text-[var(--terminal-text)] truncate text-lg tracking-tight group-hover:text-accent transition-colors leading-tight mb-4">
                  {alert.marketName}
                </h4>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 text-dim text-[13px] font-black hover:text-accent transition-colors bg-black/10 px-4 py-1.5 rounded-xl border border-terminal">
                    <Wallet className="w-4 h-4 text-accent/60" />
                    <span className="font-mono tracking-tighter opacity-80 uppercase">{alert.address.slice(0, 16)}...</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-3 px-12 shrink-0 border-l border-terminal">
                <div className="text-3xl font-black text-[var(--terminal-text)] tracking-tighter font-mono flex items-baseline gap-2">
                   <span className="text-dim text-lg font-black">$</span>
                   {alert.size.toLocaleString()}
                </div>
                <div className="text-[11px] font-black text-dim uppercase tracking-widest flex items-center gap-4 opacity-70 bg-black/10 px-4 py-2 rounded-xl border border-terminal">
                  {alert.price.toFixed(3)} USDC
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-accent" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertService;
