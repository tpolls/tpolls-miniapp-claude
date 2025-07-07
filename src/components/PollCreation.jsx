import React, { useState, useEffect } from 'react';
import WalletMenu from './WalletMenu';
import './PollCreation.css';

function PollCreation({ onBack, onPollCreate }) {
  const [webApp, setWebApp] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '']
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleQuestionChange = (e) => {
    setFormData({
      ...formData,
      question: e.target.value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions
      });
    }
  };

  const handleCreate = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (formData.question.trim() && formData.options.every(opt => opt.trim())) {
      if (onPollCreate) {
        onPollCreate(formData);
      }
    }
  };

  const handleBack = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onBack) {
      onBack();
    }
  };

  const isFormValid = formData.question.trim() && formData.options.every(opt => opt.trim());

  return (
    <div className="poll-creation-page">
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
      <div className="poll-creation-header">
        <h1 className="page-title">Creating Polls</h1>
      </div>

      <div className="poll-creation-content">
        <div className="poll-form-section">
          <div className="poll-form">
            <div className="form-group">
              <label htmlFor="question">Poll Question</label>
              <input
                type="text"
                id="question"
                value={formData.question}
                onChange={handleQuestionChange}
                placeholder="Enter your poll question"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Poll Options</label>
              <div className="poll-options-list">
                {formData.options.map((option, index) => (
                  <div key={index} className="poll-option-item">
                    <div className="option-radio">
                      <div className="radio-button"></div>
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="option-input"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="remove-option-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formData.options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="add-option-btn"
                >
                  + Add Option
                </button>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={!isFormValid}
              className={`create-poll-btn ${!isFormValid ? 'disabled' : ''}`}
            >
              Create
            </button>
          </div>
        </div>

        <div className="poll-illustration-section">
          <div className="poll-creation-illustration">
            <div className="character-with-form">
              <div className="character poll-creator">
                <div className="character-head"></div>
                <div className="character-body"></div>
                <div className="character-arm"></div>
              </div>
              <div className="form-preview">
                <div className="form-header"></div>
                <div className="form-line"></div>
                <div className="form-option">
                  <div className="preview-radio checked"></div>
                  <div className="preview-line"></div>
                </div>
                <div className="form-option">
                  <div className="preview-radio"></div>
                  <div className="preview-line"></div>
                </div>
                <div className="form-create-btn"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="poll-creation-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default PollCreation;