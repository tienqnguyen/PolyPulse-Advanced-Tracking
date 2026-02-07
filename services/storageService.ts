
import { AppSettings } from '../types';

const KEYS = {
  ADDRESSES: 'polypulse_saved_addresses',
  SETTINGS: 'polypulse_app_settings'
};

const DEFAULT_SETTINGS: AppSettings = {
  discordWebhookUrl: '', // User must provide their own webhook in the Automation Core settings
  whaleThreshold: 25000,
  autoRefreshInterval: 30000
};

export const storageService = {
  getSavedAddresses: (): string[] => {
    try {
      const data = localStorage.getItem(KEYS.ADDRESSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAddress: (address: string) => {
    const addresses = storageService.getSavedAddresses();
    if (!addresses.includes(address.toLowerCase())) {
      const updated = [...addresses, address.toLowerCase()];
      localStorage.setItem(KEYS.ADDRESSES, JSON.stringify(updated));
    }
  },

  removeAddress: (address: string) => {
    const addresses = storageService.getSavedAddresses();
    const updated = addresses.filter(a => a !== address.toLowerCase());
    localStorage.setItem(KEYS.ADDRESSES, JSON.stringify(updated));
  },

  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};
