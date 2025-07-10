import React, { useState } from 'react';
import {
  AppRoot,
  Card,
  Cell,
  Section,
  List,
  Input,
  Textarea,
  Button,
  ButtonCell,
  Switch,
  Radio,
  Checkbox,
  Select,
  Placeholder,
  Caption,
  Subheadline,
  Headline,
  Title,
  LargeTitle
} from '@telegram-apps/telegram-ui';

function TelegramUIFormExample() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isPublic: true,
    allowComments: false,
    pollType: 'single',
    duration: '24'
  });

  const [webApp, setWebApp] = useState(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleSubmit = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      webApp.showAlert('Form submitted successfully!');
    }
    console.log('Form data:', formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <AppRoot>
      <div style={{ padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LargeTitle style={{ marginBottom: '8px' }}>Create Poll</LargeTitle>
          <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
            Fill out the form below to create a new poll
          </Caption>
        </div>

        {/* Basic Information Section */}
        <Section>
          <List>
            <Cell
              multiline
              description="Enter a clear and concise title for your poll"
            >
              <Input
                header="Poll Title"
                placeholder="What should we vote on?"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </Cell>
            
            <Cell
              multiline
              description="Provide additional context or details"
            >
              <Textarea
                header="Description"
                placeholder="Describe your poll in detail..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </Cell>

            <Cell
              multiline
              description="Choose the most appropriate category"
            >
              <Select
                header="Category"
                placeholder="Select category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select category</option>
                <option value="technology">Technology</option>
                <option value="entertainment">Entertainment</option>
                <option value="sports">Sports</option>
                <option value="politics">Politics</option>
                <option value="business">Business</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="other">Other</option>
              </Select>
            </Cell>
          </List>
        </Section>

        {/* Poll Settings Section */}
        <Section header="Poll Settings">
          <List>
            <Cell
              Component="label"
              after={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                />
              }
            >
              <div>
                <Subheadline>Make poll public</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Allow anyone to participate in this poll
                </Caption>
              </div>
            </Cell>

            <Cell
              Component="label"
              after={
                <Checkbox
                  checked={formData.allowComments}
                  onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                />
              }
            >
              <div>
                <Subheadline>Allow comments</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Let participants add comments to their votes
                </Caption>
              </div>
            </Cell>
          </List>
        </Section>

        {/* Poll Type Section */}
        <Section header="Poll Type">
          <List>
            <Cell
              Component="label"
              before={
                <Radio
                  name="pollType"
                  value="single"
                  checked={formData.pollType === 'single'}
                  onChange={(e) => handleInputChange('pollType', e.target.value)}
                />
              }
            >
              <div>
                <Subheadline>Single Choice</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Participants can select only one option
                </Caption>
              </div>
            </Cell>

            <Cell
              Component="label"
              before={
                <Radio
                  name="pollType"
                  value="multiple"
                  checked={formData.pollType === 'multiple'}
                  onChange={(e) => handleInputChange('pollType', e.target.value)}
                />
              }
            >
              <div>
                <Subheadline>Multiple Choice</Subheadline>
                <Caption level="1" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Participants can select multiple options
                </Caption>
              </div>
            </Cell>
          </List>
        </Section>

        {/* Duration Section */}
        <Section header="Duration">
          <List>
            <Cell
              multiline
              description="How long should the poll remain active?"
            >
              <Select
                header="Poll Duration"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">72 hours</option>
                <option value="168">1 week</option>
              </Select>
            </Cell>
          </List>
        </Section>

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <Button
            size="large"
            mode="filled"
            stretched
            onClick={handleSubmit}
            disabled={!formData.title || !formData.category}
          >
            Create Poll
          </Button>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Button
            size="large"
            mode="plain"
            stretched
            onClick={() => {
              if (webApp) {
                webApp.HapticFeedback.impactOccurred('light');
                webApp.showConfirm('Are you sure you want to save as draft?', (confirmed) => {
                  if (confirmed) {
                    webApp.showAlert('Poll saved as draft!');
                  }
                });
              }
            }}
          >
            Save as Draft
          </Button>
        </div>
      </div>
    </AppRoot>
  );
}

export default TelegramUIFormExample;