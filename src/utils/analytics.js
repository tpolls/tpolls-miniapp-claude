import telegramAnalytics from '@telegram-apps/analytics';

let analyticsInitialized = false;

export const initAnalytics = () => {
  if (analyticsInitialized) return;

  try {
    // Initialize with environment variables or defaults
    const token = import.meta.env.VITE_TELEGRAM_ANALYTICS_TOKEN;
    const appName = import.meta.env.VITE_TELEGRAM_ANALYTICS_APP_NAME || 'tpolls-miniapp';

    if (!token) {
      console.warn('Telegram Analytics token not found. Analytics will not be initialized.');
      return;
    }

    telegramAnalytics.init({
      token: token,
      appName: appName
    });

    analyticsInitialized = true;
    console.log('Telegram Analytics initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram Analytics:', error);
  }
};

export const trackEvent = (eventName, eventData = {}) => {
  if (!analyticsInitialized) {
    console.warn('Analytics not initialized. Call initAnalytics() first.');
    return;
  }

  try {
    if (telegramAnalytics.track) {
      telegramAnalytics.track(eventName, eventData);
    }
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

export const trackPageView = (pageName) => {
  trackEvent('page_view', { page: pageName });
};

export const trackUserAction = (action, details = {}) => {
  trackEvent('user_action', { action, ...details });
};

export const trackPollEvent = (eventType, pollData = {}) => {
  trackEvent('poll_event', { type: eventType, ...pollData });
};

export const trackWalletEvent = (eventType, walletData = {}) => {
  trackEvent('wallet_event', { type: eventType, ...walletData });
};

export default {
  init: initAnalytics,
  trackEvent,
  trackPageView,
  trackUserAction,
  trackPollEvent,
  trackWalletEvent
};