import React, { useState } from 'react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Button,
  ButtonCell,
  Caption,
  Subheadline,
  Title,
  Avatar
} from '@telegram-apps/telegram-ui';

import TelegramUIFormExample from './TelegramUIFormExample';
import TelegramUIDialogExample from './TelegramUIDialogExample';
import TelegramUIButtonExample from './TelegramUIButtonExample';

function TelegramUIExamples({ onBack }) {
  const [activeTab, setActiveTab] = useState('forms');
  const [webApp, setWebApp] = useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
      
      // Configure back button
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        if (onBack) {
          onBack('main');
        }
      });
      
      return () => {
        tg.BackButton.hide();
      };
    }
  }, [onBack]);

  const renderContent = () => {
    switch (activeTab) {
      case 'forms':
        return <TelegramUIFormExample />;
      case 'dialogs':
        return <TelegramUIDialogExample />;
      case 'buttons':
        return <TelegramUIButtonExample />;
      default:
        return <TelegramUIFormExample />;
    }
  };

  return (
    <AppRoot>
      <div style={{ minHeight: '100vh', paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{ padding: '20px', textAlign: 'center', marginBottom: '0' }}>
          <Title style={{ marginBottom: '8px' }}>TelegramUI Examples</Title>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Comprehensive examples of Telegram UI components
          </Caption>
        </div>

        {/* Tab Navigation */}
        <Section>
          <List>
            <ButtonCell
              selected={activeTab === 'forms'}
              onClick={() => setActiveTab('forms')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📝</span>
                <Subheadline>Forms</Subheadline>
              </div>
            </ButtonCell>
            <ButtonCell
              selected={activeTab === 'dialogs'}
              onClick={() => setActiveTab('dialogs')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💬</span>
                <Subheadline>Dialogs</Subheadline>
              </div>
            </ButtonCell>
            <ButtonCell
              selected={activeTab === 'buttons'}
              onClick={() => setActiveTab('buttons')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔘</span>
                <Subheadline>Buttons</Subheadline>
              </div>
            </ButtonCell>
          </List>
        </Section>

        {/* Content */}
        <div style={{ minHeight: 'calc(100vh - 140px)' }}>
          {renderContent()}
        </div>
      </div>
    </AppRoot>
  );
}

export default TelegramUIExamples;