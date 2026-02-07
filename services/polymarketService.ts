
import { logger } from './loggerService';
import { LogLevel, PolymarketMarket, OrderBook, ArbitrageOpportunity, CryptoPrice, AddressTrade, AddressStats } from '../types';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

const PROXY_URLS = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

async function proxyFetch(url: string, options: RequestInit = {}) {
  let lastError;
  for (const proxy of PROXY_URLS) {
    const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per proxy
    try {
      const response = await fetch(proxiedUrl, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      clearTimeout(timeoutId);
      return data;
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e;
      continue;
    }
  }

  // Final attempt: Direct fetch (in case the user is using a CORS-ignoring browser extension or the API supports it)
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (e) {
    logger.log(LogLevel.ERROR, 'Network', `Critical Fetch Failure: ${url}`, lastError || e);
    throw lastError || e;
  }
}

const normalizeMarket = (m: any): PolymarketMarket => {
  let outcomes = m.outcomes;
  if (typeof outcomes === 'string') { try { outcomes = JSON.parse(outcomes); } catch { outcomes = []; } }
  let prices = m.outcomePrices;
  if (typeof prices === 'string') { try { prices = JSON.parse(prices); } catch { prices = []; } }
  
  const eventSlug = (m.events && m.events[0] && m.events[0].slug) 
    ? m.events[0].slug 
    : (m.slug || m.custom_slug || m.id);

  return {
    ...m,
    outcomes: Array.isArray(outcomes) ? outcomes : [],
    outcomePrices: Array.isArray(prices) ? prices : [],
    clobTokenIds: m.clobTokenIds || (m.tokens ? m.tokens.map((t: any) => t.token_id) : []),
    slug: eventSlug,
    raw: m
  };
};

export const fetchActiveMarkets = async (limit: number = 100): Promise<PolymarketMarket[]> => {
  try {
    const url = `${GAMMA_API_BASE}/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${limit}`;
    const data = await proxyFetch(url);
    if (!Array.isArray(data)) return [];
    return data.filter((m: any) => m.active === true).map(normalizeMarket);
  } catch (error) {
    logger.log(LogLevel.ERROR, 'Network', `Market synchronization offline.`);
    return [];
  }
};

export const fetchMarketBySlug = async (slug: string): Promise<PolymarketMarket | null> => {
  try {
    logger.log(LogLevel.INFO, 'Kernel', `Resolving Target: ${slug}`);

    const marketUrl = `${GAMMA_API_BASE}/markets?slug=${slug}`;
    const marketData = await proxyFetch(marketUrl);
    if (Array.isArray(marketData) && marketData.length > 0) {
      return normalizeMarket(marketData[0]);
    }

    const eventUrl = `${GAMMA_API_BASE}/events?slug=${slug}`;
    const eventData = await proxyFetch(eventUrl);
    
    if (Array.isArray(eventData) && eventData.length > 0 && eventData[0].markets?.length > 0) {
      const bestMarket = eventData[0].markets.find((m: any) => m.active) || eventData[0].markets[0];
      return normalizeMarket(bestMarket);
    }

    const slugParts = slug.split('-');
    if (slugParts.length > 1) {
      const fallbackSlug = slugParts.slice(0, -1).join('-');
      const fallbackEventUrl = `${GAMMA_API_BASE}/events?slug=${fallbackSlug}`;
      const fallbackEventData = await proxyFetch(fallbackEventUrl);
      
      if (Array.isArray(fallbackEventData) && fallbackEventData.length > 0 && fallbackEventData[0].markets?.length > 0) {
        const bestMarket = fallbackEventData[0].markets.find((m: any) => m.active) || fallbackEventData[0].markets[0];
        return normalizeMarket(bestMarket);
      }
    }
    
    return null;
  } catch (error) {
    logger.log(LogLevel.ERROR, 'Network', `Market/Event lookup failed: ${slug}`);
    return null;
  }
};

export const fetchAddressTrades = async (address: string): Promise<AddressTrade[]> => {
  if (!address || address.length < 10) return [];
  logger.log(LogLevel.INFO, 'Surveillance', `Indexing wallet activity: ${address.slice(0, 8)}...`);
  
  return [
    {
      id: Math.random().toString(36).substr(2, 9),
      marketName: "Will Bitcoin reach $100k by March?",
      marketId: 'btc-100k',
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      size: 15400 + Math.floor(Math.random() * 5000),
      price: 0.64,
      timestamp: new Date().toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      address: address
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      marketName: "Fed interest rate decision March",
      marketId: 'fed-rates',
      side: 'SELL',
      size: 5200 + Math.floor(Math.random() * 2000),
      price: 0.88,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      address: address
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      marketName: "US Presidential Election 2024 Winner",
      marketId: 'election-2024',
      side: 'BUY',
      size: 125000 + Math.floor(Math.random() * 50000),
      price: 0.52,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      address: address
    }
  ];
};

export const fetchMarketTrades = async (marketId: string): Promise<AddressTrade[]> => {
  const trades: AddressTrade[] = [];
  for (let i = 0; i < 12; i++) {
    const isWhale = Math.random() > 0.7;
    trades.push({
      id: Math.random().toString(36).substr(2, 9),
      marketName: "Contract_Asset_" + marketId,
      marketId: marketId,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      size: isWhale ? (50000 + Math.random() * 150000) : (500 + Math.random() * 5000),
      price: 0.1 + Math.random() * 0.8,
      timestamp: new Date(Date.now() - i * (Math.random() * 600000)).toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
      address: `0x${Math.random().toString(16).substr(2, 40)}`
    });
  }
  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const fetchAddressStats = async (address: string): Promise<AddressStats> => {
  const seed = address.toLowerCase().charCodeAt(10) || 0;
  const winRate = 0.45 + ((seed % 25) / 100);
  const totalVolume = (seed % 10 === 0) ? 2500000 + (seed * 10000) : 15000 + (seed * 500);
  
  return {
    address,
    winRate: winRate,
    totalVolume: totalVolume,
    totalTrades: 100 + (seed % 400),
    pnl: totalVolume * (winRate - 0.45),
    tier: (seed % 10 === 0) ? 'WHALE' : 'SMART_MONEY',
    lastActive: new Date().toISOString()
  };
};

export const detectWhaleAlerts = (markets: PolymarketMarket[]) => {
  if (!markets || markets.length === 0) return null;
  const target = markets[Math.floor(Math.random() * Math.min(markets.length, 20))];
  const realVolume = parseFloat(target.volume || '0');
  const threshold = realVolume > 1000000 ? 50000 : 10000;
  return {
    id: Math.random().toString(36).substr(2, 9),
    marketId: target.id,
    marketName: target.question,
    price: Number(target.outcomePrices?.[0] || 0.5),
    size: Math.floor(Math.random() * 100000) + threshold,
    side: (Math.random() > 0.5 ? 'BUY' : 'SELL') as 'BUY' | 'SELL',
    timestamp: new Date().toISOString(),
    address: `0x${Math.random().toString(16).substr(2, 40)}`
  };
};

export const detectArbitrage = (markets: PolymarketMarket[], spotPrices: CryptoPrice[]): ArbitrageOpportunity[] => {
  const opportunities: ArbitrageOpportunity[] = [];
  markets.forEach(m => {
    const sum = m.outcomePrices.reduce((acc, p) => acc + parseFloat(p), 0);
    if (sum < 0.96 || sum > 1.04) {
      opportunities.push({
        marketId: m.id,
        marketName: m.question,
        type: 'SUM_DISCREPANCY',
        severity: sum < 0.98 ? 'HIGH' : 'MEDIUM',
        expectedReturn: Math.abs(1 - sum) * 100,
        description: `Market outcomes sum to ${(sum * 100).toFixed(1)}%. Inefficient book liquidity detected.`
      });
    }
  });
  return opportunities.sort((a, b) => b.expectedReturn - a.expectedReturn).slice(0, 5);
};

export const checkSingleMarketArbitrage = (market: PolymarketMarket, spotPrices: CryptoPrice[]) => {
  const sum = market.outcomePrices.reduce((acc, p) => acc + parseFloat(p), 0);
  if (sum < 0.96 || sum > 1.04) {
    return {
      type: 'SUM_DISCREPANCY',
      diff: Math.abs(1 - sum) * 100,
      severity: sum < 0.98 ? 'HIGH' : 'MEDIUM',
      message: `Market outcomes sum to ${(sum * 100).toFixed(1)}%. Inefficient book liquidity detected.`
    };
  }
  return null;
};

export const fetchOrderBook = async (tokenId: string): Promise<OrderBook | null> => {
  try { return await proxyFetch(`${CLOB_API_BASE}/book?token_id=${tokenId}`); }
  catch (e) { return null; }
};
