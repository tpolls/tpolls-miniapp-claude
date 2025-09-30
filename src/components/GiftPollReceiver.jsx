import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import {
  AppRoot,
  Card,
  Button,
  Title,
  Subheadline,
  Caption
} from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';
import PollResponse from './PollResponse';
import tpollsApi from '../services/tpollsApi';
import './GiftPollReceiver.css';

function GiftPollReceiver({ giftId, onBack }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [giftData, setGiftData] = useState(null);
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }

    loadGiftData();
  }, [giftId]);

  const loadGiftData = async () => {
    try {
      setIsLoading(true);

      try {
        // Try to load from API first
        const gift = await tpollsApi.getGiftMetadata(giftId);
        if (gift) {
          setGiftData(gift);
          console.log('✅ Gift data loaded via API');
          return;
        }
      } catch (error) {
        console.warn('⚠️ API loading failed, trying localStorage:', error);
      }

      // Fallback to localStorage
      const storedGift = localStorage.getItem(`gift_${giftId}`);
      if (storedGift) {
        const gift = JSON.parse(storedGift);
        setGiftData(gift);
        console.log('✅ Gift data loaded from localStorage');
      } else {
        setError('Gift not found or may have expired');
      }
    } catch (error) {
      console.error('Error loading gift data:', error);
      setError('Failed to load gift data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnwrapGift = async () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    // Track unwrapping
    try {
      const unwrappedBy = tonConnectUI.account?.address;
      if (unwrappedBy) {
        await tpollsApi.markGiftUnwrapped(giftId, unwrappedBy);
        console.log('✅ Gift unwrapping tracked');
      }
    } catch (error) {
      console.warn('⚠️ Failed to track gift unwrapping:', error);
    }

    setIsUnwrapped(true);
  };

  const getThemeEmoji = (theme) => {
    const themes = {
      default: '🎁',
      birthday: '🎂',
      celebration: '🎉',
      question: '❓'
    };
    return themes[theme] || '🎁';
  };

  const getThemeColors = (theme) => {
    const colors = {
      default: { primary: '#FFD700', secondary: '#FFA500' },
      birthday: { primary: '#FF69B4', secondary: '#FF1493' },
      celebration: { primary: '#32CD32', secondary: '#228B22' },
      question: { primary: '#87CEEB', secondary: '#4682B4' }
    };
    return colors[theme] || colors.default;
  };

  if (isLoading) {
    return (
      <AppRoot>
        <div className="gift-receiver-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <Caption>Loading your gift...</Caption>
          </div>
        </div>
      </AppRoot>
    );
  }

  if (error) {
    return (
      <AppRoot>
        <div className="gift-receiver-page">
          <Card className="error-card">
            <div className="error-content">
              <div className="error-emoji">😔</div>
              <Title level="2">Oops!</Title>
              <Subheadline>{error}</Subheadline>
              <Button
                size="large"
                mode="filled"
                onClick={onBack}
                style={{ marginTop: '20px' }}
              >
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </AppRoot>
    );
  }

  if (!isUnwrapped) {
    const themeColors = getThemeColors(giftData.theme);

    return (
      <AppRoot>
        <div className="gift-receiver-page">
          <div className="gift-wrapper">
            <div
              className={`gift-box ${giftData.theme}-theme`}
              style={{
                '--theme-primary': themeColors.primary,
                '--theme-secondary': themeColors.secondary
              }}
            >
              <div className="gift-bow"></div>
              <div className="gift-emoji">
                {getThemeEmoji(giftData.theme)}
              </div>
            </div>

            <div className="gift-message-section">
              <Title level="1">You received a gift!</Title>

              {giftData.message && (
                <Card className="gift-message-card">
                  <Subheadline>Personal message:</Subheadline>
                  <div className="gift-message">"{giftData.message}"</div>
                </Card>
              )}

              <div className="gift-sender">
                <Caption>
                  From: {giftData.sender ?
                    `${giftData.sender.slice(0, 6)}...${giftData.sender.slice(-4)}` :
                    'Anonymous'}
                </Caption>
              </div>

              <Button
                size="large"
                mode="filled"
                onClick={handleUnwrapGift}
                className="unwrap-button"
              >
                🎁 Unwrap Gift
              </Button>
            </div>
          </div>
        </div>
      </AppRoot>
    );
  }

  // Show the actual poll after unwrapping
  return (
    <AppRoot>
      <div className="gift-receiver-page unwrapped">
        <div className="unwrapped-header">
          <div className="celebration-animation">🎉</div>
          <Title level="2">Surprise! It's a poll!</Title>
          <Subheadline>Your gift has been unwrapped</Subheadline>
        </div>

        <PollResponse
          pollId={giftData.pollId}
          onBack={onBack}
          isGiftPoll={true}
        />
      </div>
    </AppRoot>
  );
}

export default GiftPollReceiver;