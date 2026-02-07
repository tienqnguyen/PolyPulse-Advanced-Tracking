
import { TradeAlert, PolymarketMarket } from '../types';
import { logger } from './loggerService';
import { LogLevel } from '../types';
import { storageService } from './storageService';

export const sendWhaleAlertToDiscord = async (alert: TradeAlert, market?: PolymarketMarket) => {
  try {
    const settings = storageService.getSettings();
    const discordUrl = settings.discordWebhookUrl;
    
    if (!discordUrl || !discordUrl.startsWith('https://discord.com')) {
      return;
    }

    const polymarketUrl = market ? `https://polymarket.com/event/${market.slug}` : 'https://polymarket.com';
    
    const embed = {
      title: `🚨 WHALE ACTIVITY DETECTED: ${alert.side}`,
      description: `**Market:** ${alert.marketName}\n**Size:** $${alert.size.toLocaleString()} USDC\n**Price:** ${alert.price.toFixed(3)} USDC`,
      url: polymarketUrl,
      color: alert.side === 'BUY' ? 3066993 : 15158332,
      fields: [
        {
          name: 'Address',
          value: `\`${alert.address}\``,
          inline: false
        },
        {
          name: 'Timestamp',
          value: new Date(alert.timestamp).toUTCString(),
          inline: true
        },
        {
          name: 'Network',
          value: 'Polygon/Mainnet',
          inline: true
        }
      ],
      footer: {
        text: 'PolyPulse OS | Surveillance Bot',
        icon_url: 'https://polymarket.com/favicon.ico'
      },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (response.ok) {
      logger.log(LogLevel.INFO, 'Webhook', `Discord notification dispatched: ${alert.id}`);
    } else {
      throw new Error(`Discord API responded with ${response.status}`);
    }
  } catch (error) {
    logger.log(LogLevel.ERROR, 'Webhook', `Failed to send Discord alert: ${error}`);
  }
};
