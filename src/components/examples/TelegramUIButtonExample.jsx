import React, { useState } from 'react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Button,
  ButtonCell,
  IconButton,
  Placeholder,
  Caption,
  Subheadline,
  Headline,
  Title,
  Avatar,
  Badge,
  Chip,
  Spinner
} from '@telegram-apps/telegram-ui';

function TelegramUIButtonExample() {
  const [loading, setLoading] = useState(false);
  const [webApp, setWebApp] = useState(null);
  const [selectedTags, setSelectedTags] = useState(['technology']);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
      
      // Configure main button
      tg.MainButton.setText('Main Action');
      tg.MainButton.show();
      tg.MainButton.onClick(() => {
        tg.showAlert('Main button clicked!');
      });

      // Configure back button
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        tg.showAlert('Back button clicked!');
      });

      return () => {
        tg.MainButton.hide();
        tg.BackButton.hide();
      };
    }
  }, []);

  const handleAsyncAction = async () => {
    setLoading(true);
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      webApp.MainButton.showProgress();
    }
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    if (webApp) {
      webApp.MainButton.hideProgress();
      webApp.showAlert('Async action completed!');
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const tags = ['technology', 'entertainment', 'sports', 'politics', 'business', 'lifestyle'];

  return (
    <AppRoot>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title style={{ marginBottom: '8px' }}>Button Examples</Title>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Various button styles and interactions
          </Caption>
        </div>

        {/* Basic Buttons */}
        <Section header="Basic Buttons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              size="large"
              mode="filled"
              stretched
              onClick={() => webApp?.showAlert('Filled button clicked!')}
            >
              Filled Button
            </Button>

            <Button
              size="large"
              mode="outlined"
              stretched
              onClick={() => webApp?.showAlert('Outlined button clicked!')}
            >
              Outlined Button
            </Button>

            <Button
              size="large"
              mode="plain"
              stretched
              onClick={() => webApp?.showAlert('Plain button clicked!')}
            >
              Plain Button
            </Button>

            <Button
              size="large"
              mode="gray"
              stretched
              onClick={() => webApp?.showAlert('Gray button clicked!')}
            >
              Gray Button
            </Button>
          </div>
        </Section>

        {/* Button Sizes */}
        <Section header="Button Sizes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              size="small"
              mode="filled"
              stretched
            >
              Small Button
            </Button>

            <Button
              size="medium"
              mode="filled"
              stretched
            >
              Medium Button
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
            >
              Large Button
            </Button>
          </div>
        </Section>

        {/* Loading and Disabled States */}
        <Section header="Button States">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              size="large"
              mode="filled"
              stretched
              loading={loading}
              onClick={handleAsyncAction}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Async Action'}
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
              disabled
            >
              Disabled Button
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
              before={<Spinner size="s" />}
              disabled
            >
              Loading with Spinner
            </Button>
          </div>
        </Section>

        {/* Button Cells */}
        <Section header="Button Cells">
          <List>
            <ButtonCell
              onClick={() => webApp?.showAlert('Create new poll')}
              before={
                <Avatar size={40} style={{ background: 'var(--tg-theme-button-color)' }}>
                  ➕
                </Avatar>
              }
            >
              <div>
                <Subheadline>Create New Poll</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Start creating a new poll
                </Caption>
              </div>
            </ButtonCell>

            <ButtonCell
              onClick={() => webApp?.showAlert('View poll results')}
              before={
                <Avatar size={40} style={{ background: 'var(--tg-theme-destructive-text-color)' }}>
                  📊
                </Avatar>
              }
              after={<Badge type="number">12</Badge>}
            >
              <div>
                <Subheadline>View Results</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  See poll results and analytics
                </Caption>
              </div>
            </ButtonCell>

            <ButtonCell
              onClick={() => webApp?.showAlert('Manage settings')}
              before={
                <Avatar size={40} style={{ background: 'var(--tg-theme-hint-color)' }}>
                  ⚙️
                </Avatar>
              }
            >
              <div>
                <Subheadline>Settings</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Configure app preferences
                </Caption>
              </div>
            </ButtonCell>
          </List>
        </Section>

        {/* Chip Buttons (Tags) */}
        <Section header="Chip Buttons">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {tags.map(tag => (
              <Chip
                key={tag}
                mode={selectedTags.includes(tag) ? 'filled' : 'mono'}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Selected: {selectedTags.join(', ')}
          </Caption>
        </Section>

        {/* Icon Buttons */}
        <Section header="Icon Buttons">
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <IconButton
              size="large"
              mode="filled"
              onClick={() => webApp?.showAlert('Edit clicked!')}
            >
              ✏️
            </IconButton>

            <IconButton
              size="large"
              mode="outlined"
              onClick={() => webApp?.showAlert('Share clicked!')}
            >
              📤
            </IconButton>

            <IconButton
              size="large"
              mode="plain"
              onClick={() => webApp?.showAlert('Delete clicked!')}
            >
              🗑️
            </IconButton>
          </div>
        </Section>

        {/* Action Buttons with Haptic Feedback */}
        <Section header="Haptic Feedback">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              size="large"
              mode="filled"
              stretched
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('light');
                webApp?.showAlert('Light haptic feedback');
              }}
            >
              Light Haptic
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('medium');
                webApp?.showAlert('Medium haptic feedback');
              }}
            >
              Medium Haptic
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
              onClick={() => {
                webApp?.HapticFeedback.impactOccurred('heavy');
                webApp?.showAlert('Heavy haptic feedback');
              }}
            >
              Heavy Haptic
            </Button>

            <Button
              size="large"
              mode="filled"
              stretched
              onClick={() => {
                webApp?.HapticFeedback.notificationOccurred('success');
                webApp?.showAlert('Success notification');
              }}
            >
              Success Notification
            </Button>
          </div>
        </Section>

        {/* Main Button Control */}
        <Section header="Main Button Control">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              size="large"
              mode="outlined"
              stretched
              onClick={() => {
                webApp?.MainButton.setText('Updated Text');
                webApp?.showAlert('Main button text updated');
              }}
            >
              Change Main Button Text
            </Button>

            <Button
              size="large"
              mode="outlined"
              stretched
              onClick={() => {
                webApp?.MainButton.setParams({
                  color: '#FF0000',
                  text_color: '#FFFFFF',
                  text: 'Red Button'
                });
                webApp?.showAlert('Main button color changed');
              }}
            >
              Change Main Button Color
            </Button>

            <Button
              size="large"
              mode="outlined"
              stretched
              onClick={() => {
                webApp?.MainButton.hide();
                webApp?.showAlert('Main button hidden');
              }}
            >
              Hide Main Button
            </Button>

            <Button
              size="large"
              mode="outlined"
              stretched
              onClick={() => {
                webApp?.MainButton.show();
                webApp?.showAlert('Main button shown');
              }}
            >
              Show Main Button
            </Button>
          </div>
        </Section>

        {/* Empty State */}
        <div style={{ marginTop: '40px' }}>
          <Placeholder
            header="No Actions"
            description="This is an empty state placeholder"
          >
            <Button
              size="medium"
              mode="filled"
              onClick={() => webApp?.showAlert('Action from placeholder')}
            >
              Take Action
            </Button>
          </Placeholder>
        </div>
      </div>
    </AppRoot>
  );
}

export default TelegramUIButtonExample;