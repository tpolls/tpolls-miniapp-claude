import React, { useState } from 'react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Button,
  ButtonCell,
  Placeholder,
  Caption,
  Subheadline,
  Headline,
  Title,
  Avatar,
  Badge,
  Spinner
} from '@telegram-apps/telegram-ui';

function TelegramUIDialogExample() {
  const [showModal, setShowModal] = useState(false);
  const [webApp, setWebApp] = useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const showSimpleAlert = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
      webApp.showAlert('This is a simple alert message!');
    }
  };

  const showConfirmDialog = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
      webApp.showConfirm('Are you sure you want to delete this poll?', (confirmed) => {
        if (confirmed) {
          webApp.showAlert('Poll deleted successfully!');
        }
      });
    }
  };

  const showCustomPopup = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
      webApp.showPopup({
        title: 'Poll Actions',
        message: 'What would you like to do with this poll?',
        buttons: [
          {id: 'edit', type: 'default', text: 'Edit Poll'},
          {id: 'share', type: 'default', text: 'Share Poll'},
          {id: 'delete', type: 'destructive', text: 'Delete Poll'},
          {id: 'cancel', type: 'cancel'}
        ]
      }, (buttonId) => {
        switch(buttonId) {
          case 'edit':
            webApp.showAlert('Opening edit mode...');
            break;
          case 'share':
            webApp.showAlert('Sharing poll...');
            break;
          case 'delete':
            webApp.showAlert('Poll deleted!');
            break;
          default:
            // Cancel or close
            break;
        }
      });
    }
  };

  const showScanQR = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
      webApp.showScanQrPopup({
        text: 'Scan QR code to join poll'
      }, (qrText) => {
        webApp.showAlert(`QR Code scanned: ${qrText}`);
      });
    }
  };

  const requestContact = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      webApp.requestContact((contact) => {
        if (contact) {
          webApp.showAlert(`Contact received: ${contact.phone_number}`);
        }
      });
    }
  };

  return (
    <AppRoot>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title style={{ marginBottom: '8px' }}>Dialog Examples</Title>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Native Telegram UI components and dialogs
          </Caption>
        </div>

        {/* Native Telegram Dialogs */}
        <Section header="Native Telegram Dialogs">
          <List>
            <ButtonCell onClick={showSimpleAlert}>
              <div>
                <Subheadline>Simple Alert</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Basic alert with OK button
                </Caption>
              </div>
            </ButtonCell>

            <ButtonCell onClick={showConfirmDialog}>
              <div>
                <Subheadline>Confirmation Dialog</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Dialog with OK and Cancel buttons
                </Caption>
              </div>
            </ButtonCell>

            <ButtonCell onClick={showCustomPopup}>
              <div>
                <Subheadline>Custom Popup</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Popup with multiple custom buttons
                </Caption>
              </div>
            </ButtonCell>
          </List>
        </Section>

        {/* System Integration */}
        <Section header="System Integration">
          <List>
            <ButtonCell onClick={showScanQR}>
              <div>
                <Subheadline>QR Code Scanner</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Open native QR code scanner
                </Caption>
              </div>
            </ButtonCell>

            <ButtonCell onClick={requestContact}>
              <div>
                <Subheadline>Request Contact</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Request user's phone number
                </Caption>
              </div>
            </ButtonCell>
          </List>
        </Section>

        {/* Custom Modal Example */}
        <Section header="Custom Modal">
          <List>
            <ButtonCell onClick={() => setShowModal(true)}>
              <div>
                <Subheadline>Custom Modal</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Custom modal with TelegramUI components
                </Caption>
              </div>
            </ButtonCell>
          </List>
        </Section>

        {/* Poll Status Cards */}
        <Section header="Status Cards">
          <List>
            <Cell
              before={
                <Avatar
                  size={40}
                  style={{ background: 'var(--tg-theme-button-color)' }}
                >
                  📊
                </Avatar>
              }
              after={<Badge type="number">5</Badge>}
            >
              <div>
                <Subheadline>Active Polls</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Currently running polls
                </Caption>
              </div>
            </Cell>

            <Cell
              before={
                <Avatar
                  size={40}
                  style={{ background: 'var(--tg-theme-destructive-text-color)' }}
                >
                  ⏰
                </Avatar>
              }
              after={<Badge type="number">12</Badge>}
            >
              <div>
                <Subheadline>Completed Polls</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Finished polls with results
                </Caption>
              </div>
            </Cell>

            <Cell
              before={
                <Avatar
                  size={40}
                  style={{ background: 'var(--tg-theme-hint-color)' }}
                >
                  📝
                </Avatar>
              }
              after={<Badge type="number">3</Badge>}
            >
              <div>
                <Subheadline>Draft Polls</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Saved drafts waiting to be published
                </Caption>
              </div>
            </Cell>
          </List>
        </Section>

        {/* Loading State Example */}
        <Section header="Loading States">
          <List>
            <Cell
              before={<Spinner size="s" />}
            >
              <div>
                <Subheadline>Loading Poll Data</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Please wait while we fetch your polls...
                </Caption>
              </div>
            </Cell>
          </List>
        </Section>

        {/* Custom Modal Placeholder */}
        {showModal && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{ 
              backgroundColor: 'var(--tg-theme-bg-color, #ffffff)', 
              padding: '20px', 
              borderRadius: '12px',
              maxWidth: '300px',
              width: '90%'
            }}>
              <Placeholder
                header="Poll Configuration"
                description="Configure your poll settings here"
              >
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <Button
                    size="medium"
                    mode="filled"
                    onClick={() => {
                      setShowModal(false);
                      if (webApp) {
                        webApp.showAlert('Settings saved!');
                      }
                    }}
                  >
                    Save Settings
                  </Button>
                  <Button
                    size="medium"
                    mode="plain"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Placeholder>
            </div>
          </div>
        )}
      </div>
    </AppRoot>
  );
}

export default TelegramUIDialogExample;