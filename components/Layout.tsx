
import React, { useState, useEffect } from 'react';
import { Terminal, Database, Activity, ShieldAlert, Cpu, List, Github, Radio, Box, ChevronRight, Bug, X, ChevronUp, ChevronDown, UserCheck, TrendingUp, Sparkles, Palette, Sun, Moon, Globe } from 'lucide-react';
import { wsService, WSStatus } from '../services/webSocketService';
import { logger } from '../services/loggerService';
import { LogEntry, LogLevel } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [wsStatus, setWsStatus] = useState<WSStatus>('DISCONNECTED');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [debugOpen, setDebugOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState('theme-blue');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    const unsubWs = wsService.subscribe(setWsStatus);
    const unsubLogs = logger.subscribe(setLogs);
    return () => {
      clearInterval(timer);
      unsubWs();
      unsubLogs();
    };
  }, []);

  const changeColor = (color: string) => {
    setCurrentTheme(color);
    updateClasses(color, isDarkMode);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    updateClasses(currentTheme, newMode);
  };

  const updateClasses = (color: string, dark: boolean) => {
    document.documentElement.className = `${color} ${dark ? 'theme-dark' : 'theme-light'}`;
  };

  const tabs = [
    { id: 'tracking', name: 'MARKET_DATA', icon: Database },
    { id: 'analyze', name: 'AI_ANALYZE', icon: Sparkles },
    { id: 'predictions', name: 'NEURAL_BIAS', icon: Cpu },
    { id: 'futures', name: 'FUTURES_SIGNAL', icon: TrendingUp },
    { id: 'address', name: 'ADDR_SURVEIL', icon: UserCheck },
    { id: 'alerts', name: 'FLOW_ALERTS', icon: ShieldAlert },
    { id: 'logs', name: 'SYS_TRACE', icon: List },
  ];

  return (
    <div className="flex h-screen bg-transparent text-[var(--terminal-text)] overflow-hidden font-mono selection:bg-accent/30 selection:text-white transition-colors duration-300">
      <aside className="w-80 glass-sidebar flex flex-col z-20 shadow-2xl">
        <div className="p-8 border-b border-terminal relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <Radio className="w-20 h-20 text-accent animate-pulse" />
          </div>
          <div className="flex items-center gap-4 mb-3 relative z-10">
            <div className="p-3 bg-[var(--accent-color)]/20 border border-[var(--accent-color)]/30 rounded-lg shadow-accent">
              <Activity className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">POLYPULSE</h1>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-[14px] text-dim font-black uppercase tracking-widest">CLOB Terminal v3.0</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-6 space-y-2 custom-scrollbar overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group w-full flex items-center justify-between px-6 py-4 rounded-xl text-left transition-all duration-300 border ${
                  isActive 
                    ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)]/40 text-accent shadow-accent scale-[1.02]' 
                    : 'border-transparent text-dim hover:text-[var(--terminal-text)] hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-5">
                  <Icon className={`w-6 h-6 transition-transform group-hover:rotate-6 ${isActive ? 'text-accent' : 'text-dim'}`} />
                  <span className="text-[15px] font-black tracking-widest">{tab.name}</span>
                </div>
                {isActive && <ChevronRight className="w-5 h-5 animate-pulse" />}
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-terminal bg-black/5 space-y-8">
          <div className="space-y-5">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[12px] font-black uppercase text-dim">
                  <Palette className="w-5 h-5" /> Visual_Core
                </div>
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg border border-terminal text-dim hover:text-accent transition-all hover:scale-110 active:scale-95 bg-white/5"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
             </div>
             <div className="grid grid-cols-5 gap-3">
                {[
                  { id: 'theme-blue', color: 'bg-blue-500' },
                  { id: 'theme-green', color: 'bg-emerald-500' },
                  { id: 'theme-amber', color: 'bg-amber-500' },
                  { id: 'theme-red', color: 'bg-rose-500' },
                  { id: 'theme-purple', color: 'bg-purple-500' },
                ].map(color => (
                  <button 
                    key={color.id}
                    onClick={() => changeColor(color.id)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${currentTheme === color.id ? 'border-accent scale-125 shadow-accent z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'} ${color.color}`}
                  />
                ))}
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-terminal">
            <div className="flex items-center justify-between text-[12px] font-black tracking-widest uppercase">
              <span className="text-dim">WS_STREAM</span>
              <span className={wsStatus === 'CONNECTED' ? 'text-green-500' : 'text-red-500'}>
                {wsStatus}
              </span>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full transition-all duration-1000 ${wsStatus === 'CONNECTED' ? 'bg-green-500 w-full' : 'bg-red-500 w-1/4'}`}></div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <button 
                onClick={() => setDebugOpen(!debugOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all text-[11px] font-black uppercase tracking-widest ${debugOpen ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 shadow-amber-900/20' : 'bg-black/10 border-terminal text-dim hover:text-[var(--terminal-text)]'}`}
              >
                <Bug className="w-5 h-5" />
                Inspect
              </button>
              <div className="flex items-center gap-6">
                <a href="https://8a5.com" target="_blank" rel="noreferrer" className="text-dim hover:text-accent transition-colors" title="8a5.com">
                  <Globe className="w-6 h-6" />
                </a>
                <a href="https://github.com/tienqnguyen" target="_blank" rel="noreferrer" className="text-dim hover:text-accent transition-all" title="GitHub: tienqnguyen">
                  <Github className="w-6 h-6 cursor-pointer transition-transform hover:scale-125" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 border-b border-terminal px-10 flex items-center justify-between glass-header z-10 transition-all">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <Terminal className="w-5 h-5 text-accent animate-pulse" />
              <span className="text-[14px] font-black text-dim uppercase tracking-widest">CONSOLE://{activeTab.toUpperCase()}</span>
            </div>
            <div className="h-6 w-px bg-terminal"></div>
            <div className="flex items-center gap-8 text-[14px] text-dim font-bold">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-accent/60" />
                <span>UPTIME: 12:44:01</span>
              </div>
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-accent/60" />
                <span>BLOCK: 18,293,023</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-[14px] font-black text-accent bg-accent/10 px-6 py-2 rounded-lg border border-accent/20 shadow-accent">
                {time}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {debugOpen && (
          <div className={`absolute bottom-12 left-12 right-12 h-[500px] glass-card z-50 flex flex-col shadow-2xl overflow-hidden rounded-2xl animate-in slide-in-from-bottom-10 border-accent/30`}>
            <div className="h-16 border-b border-terminal px-8 flex items-center justify-between bg-accent/10">
              <div className="flex items-center gap-4">
                <Bug className="w-6 h-6 text-accent" />
                <span className="text-[13px] font-black text-accent uppercase tracking-[0.3em]">RAW_API_INSPECTOR</span>
              </div>
              <button onClick={() => setDebugOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-dim hover:text-accent transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 font-mono text-[13px] space-y-3 bg-black/10">
              {logs.map((log) => (
                <div key={log.id} className="border border-terminal bg-black/20 rounded-xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    className="flex items-center justify-between p-4 hover:bg-accent/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      <span className="text-dim opacity-70">[{log.timestamp.split('T')[1].slice(0,8)}]</span>
                      <span className={`w-16 font-black text-center ${log.level === LogLevel.ERROR ? 'text-red-500' : log.level === LogLevel.DEBUG ? 'text-amber-500' : 'text-accent'}`}>
                        {log.level}
                      </span>
                      <span className="text-dim font-black">[{log.module}]</span>
                      <span className="text-dim truncate max-w-xl">{log.message}</span>
                    </div>
                    {log.rawData && (
                      <div className="flex items-center gap-3 text-accent bg-accent/5 px-3 py-1 rounded-md">
                        <span className="text-[10px] font-black uppercase tracking-widest">DATA</span>
                        {expandedLogId === log.id ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                      </div>
                    )}
                  </div>
                  {expandedLogId === log.id && log.rawData && (
                    <div className="p-8 bg-black/40 border-t border-terminal text-accent/90 overflow-x-auto">
                      <pre className="whitespace-pre-wrap leading-relaxed">
                        {JSON.stringify(log.rawData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="h-10 border-t border-terminal glass-header px-10 flex items-center justify-between text-[12px] font-black tracking-widest uppercase text-dim transition-colors relative z-10">
          <div className="flex gap-10">
            <span className="flex items-center gap-3"><span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span> GAMMA_NET: STABLE</span>
            <span className="flex items-center gap-3"><span className="w-3 h-3 bg-accent rounded-full animate-pulse shadow-accent"></span> CLOB_NET: ACTIVE</span>
          </div>
          <div className="flex items-center gap-10">
             <span>TOTAL_TRACE: {logs.length}</span>
             <span className="text-accent/60">BUFFER_LOAD: {((logs.length / 200) * 100).toFixed(0)}%</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;
