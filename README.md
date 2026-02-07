# PolyPulse OS | Advanced Polymarket Terminal

PolyPulse is a high-fidelity analytics and surveillance platform for Polymarket. It provides real-time tracking of CLOB (Central Limit Order Book) data, AI-driven sentiment analysis, whale movement alerts, and arbitrage detection.
READY TO RUN : https://aistudio.google.com/apps/drive/1AytBpbzEd9N8LRyDQ8Ru2Jnj3fChDbYb?fullscreenApplet=true 
## 🚀 Key Features

- **Real-Time Market Surveillance**: Live tracking of active prediction markets with volume and liquidity diagnostics.
- **Neural Sentiment Analysis**: Leverages Google Gemini 3 Flash to scan news and detect mispricing or "information lag" in market odds.
- **Whale Flow Alerts**: Monitors large orders ($25k+) and smart money movements.
- **Arbitrage Engine**: Automatically detects discrepancies in market outcome sums (Alpha detection).
- **Address Surveillance**: Index and track specific wallet activity to follow "Smart Money" or "Whale" accounts.
- **Automation Core**: Deployment-ready Node.js worker for persistent 24/7 monitoring without a browser.
<img width="3077" height="1697" alt="image" src="https://github.com/user-attachments/assets/e45ea0ce-9843-46a5-9ade-f1951c6439dc" />
<img width="3065" height="1726" alt="image" src="https://github.com/user-attachments/assets/9f7393ae-3ea6-4774-bf16-9df714486348" />
<img width="1852" height="1446" alt="image" src="https://github.com/user-attachments/assets/23acd43e-bfe7-4138-8f4b-0bd85a3d1b76" />
<img width="1607" height="992" alt="image" src="https://github.com/user-attachments/assets/42f74d00-9f2c-42ff-80b6-24a305795a43" />

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons.
- **AI Engine**: Google Gemini API (GenAI SDK).
- **Data Layer**: Polymarket Gamma & CLOB APIs.
- **Persistence**: Browser LocalStorage for settings and tracked addresses.

## 📦 Setup & Installation

### Frontend (Browser Terminal)
1. Ensure you have your `process.env.API_KEY` configured for the Gemini API.
2. The terminal automatically persists your settings and tracked addresses to your browser.

### Background Flow Monitor (Headless Node.js)
To run the Flow Alert system without a browser (e.g., on a VPS):
1. Install Node.js (v18+).
2. Install dependencies:
   ```bash
   npm install node-fetch
   ```
3. Update the `DISCORD_WEBHOOK_URL` inside `background_monitor.ts` (or the generated JS file).
4. Run the worker:
   ```bash
   node background_monitor.js
   ```

### Cron Job Automation
To ensure the monitor runs at regular intervals (or checks for crashes), add it to your crontab:
```bash
# Check every 5 minutes
*/5 * * * * /usr/bin/node /path/to/polypulse/background_monitor.js >> /path/to/polypulse/cron.log 2>&1
```

## 🚨 Discord Integration
1. Create a Discord server and a channel for alerts.
2. Go to Channel Settings -> Integrations -> Webhooks.
3. Create a New Webhook and copy the URL.
4. Paste this URL into the **Automation_Core** settings within the PolyPulse terminal UI.

## 🔒 Security & Persistence
- **API Keys**: PolyPulse uses your environment variables for Gemini.
- **Data**: All tracked addresses and webhook configurations are stored locally in your browser. Clearing your browser cache will reset these settings.
