
import { CryptoPrice } from '../types';
import { logger } from './loggerService';
import { LogLevel } from '../types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true';

const PROXY_URLS = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

export const fetchCryptoPrices = async (): Promise<CryptoPrice[]> => {
  let lastError;
  
  // Attempt to fetch via proxies to bypass CORS
  for (const proxy of PROXY_URLS) {
    try {
      const proxiedUrl = `${proxy}${encodeURIComponent(COINGECKO_API)}`;
      const response = await fetch(proxiedUrl);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (!data || !data.bitcoin) continue;

      return [
        { id: 'bitcoin', symbol: 'BTC', price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change },
        { id: 'ethereum', symbol: 'ETH', price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change },
        { id: 'solana', symbol: 'SOL', price: data.solana.usd, change24h: data.solana.usd_24h_change },
        { id: 'binancecoin', symbol: 'BNB', price: data.binancecoin.usd, change24h: data.binancecoin.usd_24h_change }
      ];
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  // Fallback to direct fetch if proxies fail (though it likely fails due to CORS)
  try {
    const response = await fetch(COINGECKO_API);
    const data = await response.json();
    return [
      { id: 'bitcoin', symbol: 'BTC', price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change },
      { id: 'ethereum', symbol: 'ETH', price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change },
      { id: 'solana', symbol: 'SOL', price: data.solana.usd, change24h: data.solana.usd_24h_change },
      { id: 'binancecoin', symbol: 'BNB', price: data.binancecoin.usd, change24h: data.binancecoin.usd_24h_change }
    ];
  } catch (e) {
    logger.log(LogLevel.ERROR, 'MarketData', `Price synchronization failed: ${lastError || e}`);
    return [];
  }
};
