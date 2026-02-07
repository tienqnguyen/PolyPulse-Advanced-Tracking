
import { logger } from './loggerService';
import { LogLevel } from '../types';

export type WSStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

class PolymarketWS {
  private socket: WebSocket | null = null;
  private status: WSStatus = 'DISCONNECTED';
  private listeners: ((status: WSStatus) => void)[] = [];

  connect() {
    if (this.socket) return;
    this.status = 'CONNECTING';
    this.notify();
    
    try {
      this.socket = new WebSocket('wss://clob.polymarket.com/ws');

      this.socket.onopen = () => {
        this.status = 'CONNECTED';
        logger.log(LogLevel.INFO, 'WebSocket', 'CLOB Live Stream Activated.');
        this.notify();
      };

      this.socket.onerror = () => {
        this.status = 'DISCONNECTED';
        this.notify();
      };

      this.socket.onclose = () => {
        this.status = 'DISCONNECTED';
        this.socket = null;
        this.notify();
      };
    } catch (e) {
      this.status = 'DISCONNECTED';
      this.notify();
    }
  }

  subscribeToMarket(marketId: string) {
    if (this.status !== 'CONNECTED' || !this.socket) return;
    
    const msg = {
      type: 'subscribe',
      channels: ['trades', 'order_book_10'],
      market_ids: [marketId]
    };
    
    try {
      this.socket.send(JSON.stringify(msg));
      logger.log(LogLevel.INFO, 'WebSocket', `Subscribed to depth: ${marketId}`);
    } catch (e) {
      console.error('WS Subscribe error', e);
    }
  }

  subscribe(callback: (status: WSStatus) => void) {
    this.listeners.push(callback);
    callback(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.status));
  }
}

export const wsService = new PolymarketWS();
