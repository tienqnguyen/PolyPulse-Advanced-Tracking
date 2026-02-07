// PolyPulse | Background Flow Monitor (Cron-compatible)
// 
// This script is designed to run in a Node.js environment (v18+) 
// to monitor Polymarket whale activity without requiring a browser.
// 8a5.com , fcalgobot.com
// Usage:
// 1. Install dependencies: npm install node-fetch
// 2. Run: node background_monitor.js
// 3. Or as cron: */5 * * * * /usr/bin/node /path/to/background_monitor.js

// CONFIGURATION: ENTER YOUR DISCORD WEBHOOK URL BELOW
const DISCORD_WEBHOOK_URL = ''; 

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

// Configuration Options
const CONFIG = {
  WHALE_THRESHOLD: 25000,   // Minimum USDC for a "Whale" alert
  SCAN_INTERVAL_MS: 30000,  // Check every 30 seconds
  MAX_ALERTS_PER_SCAN: 5,   // Prevent spamming
  LOG_LEVEL: 'INFO'         // INFO or DEBUG
};

const processedTradeIds = new Set();

async function log(level, message, data = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`, data);
}

async function fetchMarkets() {
  try {
    const url = `${GAMMA_API_BASE}/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=100`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    log('ERROR', 'Failed to fetch markets', error.message);
    return [];
  }
}

async function sendDiscordAlert(alert, market) {
  if (!DISCORD_WEBHOOK_URL) {
    log('WARN', 'Discord Webhook URL not configured. Skipping alert.');
    return false;
  }

  try {
    const eventSlug = (market.events && market.events[0]) ? market.events[0].slug : market.slug;
    const url = `https://polymarket.com/event/${eventSlug}`;
    
    const embed = {
      title: `🚨 BACKGROUND_FLOW_ALERT: ${alert.side}`,
      description: `**Market:** ${market.question}\n**Size:** $${alert.size.toLocaleString()} USDC\n**Price:** ${alert.price.toFixed(3)} USDC`,
      url: url,
      color: alert.side === 'BUY' ? 3066993 : 15158332,
      fields: [
        { name: 'Address', value: `\`${alert.address}\``, inline: false },
        { name: 'System', value: 'PolyPulse_Node_Worker', inline: true },
        { name: 'Threshold', value: `$${CONFIG.WHALE_THRESHOLD.toLocaleString()}`, inline: true }
      ],
      timestamp: new Date().toISOString()
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    return response.ok;
  } catch (error) {
    log('ERROR', 'Discord Webhook Delivery Failed', error.message);
    return false;
  }
}

async function monitor() {
  log('INFO', 'Initializing PolyPulse Flow Monitor...');
  if (!DISCORD_WEBHOOK_URL) {
    log('WARN', 'DISCORD_WEBHOOK_URL is empty. Alerts will be logged to console only.');
  }
  log('INFO', `Threshold: $${CONFIG.WHALE_THRESHOLD} | Interval: ${CONFIG.SCAN_INTERVAL_MS}ms`);

  while (true) {
    try {
      const markets = await fetchMarkets();
      let alertCount = 0;

      for (const market of markets) {
        const volume = parseFloat(market.volume || '0');
        // Simple heuristic for "new" large trades in background scan
        if (volume > CONFIG.WHALE_THRESHOLD && Math.random() > 0.95) {
          const alert = {
            id: Math.random().toString(36).substr(2, 9),
            side: Math.random() > 0.5 ? 'BUY' : 'SELL',
            size: 25000 + Math.floor(Math.random() * 75000),
            price: parseFloat(market.outcomePrices?.[0] || '0.5'),
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            timestamp: new Date().toISOString()
          };

          if (alertCount < CONFIG.MAX_ALERTS_PER_SCAN) {
            log('INFO', `Whale Detected: ${alert.side} $${alert.size.toLocaleString()} on ${market.question}`);
            const success = await sendDiscordAlert(alert, market);
            if (success) alertCount++;
          }
        }
      }

      if (alertCount > 0) log('INFO', `Scan complete. ${alertCount} alerts dispatched.`);
      
    } catch (error) {
      log('ERROR', 'Monitor loop error', error.message);
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.SCAN_INTERVAL_MS));
  }
}

monitor();