
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  rawData?: any;
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
}

export interface ArbitrageOpportunity {
  marketId: string;
  marketName: string;
  type: 'SUM_DISCREPANCY' | 'SPOT_GAP' | 'LIQUIDITY_MISMATCH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedReturn: number;
  description: string;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  active: boolean;
  closed: boolean;
  group_id?: string;
  image?: string;
  icon?: string;
  news?: string[];
  liquidity?: string;
  clobTokenIds?: string[];
  category?: string;
  slug?: string;
  raw?: any;
}

export interface AddressTrade {
  id: string;
  marketName: string;
  marketId: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  timestamp: string;
  transactionHash: string;
  address: string;
}

export interface AddressStats {
  address: string;
  winRate: number;
  totalVolume: number;
  totalTrades: number;
  pnl: number;
  tier: 'WHALE' | 'SMART_MONEY' | 'RETAIL' | 'BOT';
  lastActive: string;
}

export interface FuturesSignal {
  asset: string;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  probability: number;
  timeframe: string;
  rationale: string;
  marketAlpha: string;
}

export interface OrderBook {
  bids: { price: string; size: string }[];
  asks: { price: string; size: string }[];
}

export interface TradeAlert {
  id: string;
  marketId: string;
  marketName: string;
  price: number;
  size: number;
  side: 'BUY' | 'SELL';
  timestamp: string;
  address: string;
}

export interface PredictionResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  reasoning: string;
  predictionDate: string;
  suggestedAction: string;
  arbitrageDetected?: boolean;
}

export interface AppSettings {
  discordWebhookUrl: string;
  whaleThreshold: number;
  autoRefreshInterval: number;
}

export interface AppState {
  markets: PolymarketMarket[];
  alerts: TradeAlert[];
  logs: LogEntry[];
  prices: CryptoPrice[];
  arbitrage: ArbitrageOpportunity[];
  trackedAddress: string;
  savedAddresses: string[];
  addressTrades: AddressTrade[];
  futuresSignals: FuturesSignal[];
  isLoading: boolean;
  selectedMarket: PolymarketMarket | null;
  settings: AppSettings;
}
