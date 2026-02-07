
import { LogLevel, LogEntry } from '../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  log(level: LogLevel, module: string, message: string, rawData?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      rawData
    };
    
    this.logs = [entry, ...this.logs].slice(0, 200); // Increased buffer
    console.log(`[${entry.timestamp}] [${level}] [${module}] ${message}`, rawData);
    this.notify();
  }

  subscribe(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
    callback(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.logs));
  }

  getLogs() {
    return this.logs;
  }
}

export const logger = new LoggerService();
