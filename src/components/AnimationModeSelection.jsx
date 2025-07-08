import React, { useState, useEffect } from 'react';
import { getAnimationMode, setAnimationMode } from '../utils/animationMode';
import './AnimationModeSelection.css';

function AnimationModeSelection({ onModeSelect, onBack }) {
  const [selectedMode, setSelectedMode] = useState('static');
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }

    // Load saved preference
    const savedMode = getAnimationMode();
    setSelectedMode(savedMode);
  }, []);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleConfirm = () => {
    // Save preference
    setAnimationMode(selectedMode);
    
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (onModeSelect) {
      onModeSelect(selectedMode);
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

  return (
    <div className="animation-mode-selection">
      <div className="mode-selection-header">
        <h1 className="page-title">Choose Experience Mode</h1>
        <p className="page-subtitle">Select how you want to experience TPolls</p>
      </div>

      <div className="mode-selection-content">
        <div className="mode-options">
          <div 
            className={`mode-option ${selectedMode === 'static' ? 'selected' : ''}`}
            onClick={() => handleModeChange('static')}
          >
            <div className="mode-icon">
              <div className="static-icon">📊</div>
            </div>
            <div className="mode-info">
              <h3>Classic Mode</h3>
              <p>Clean, minimal interface with static elements. Perfect for focus and performance.</p>
              <div className="mode-features">
                <span className="feature-tag">✓ Fast Loading</span>
                <span className="feature-tag">✓ Battery Efficient</span>
                <span className="feature-tag">✓ Clean Design</span>
              </div>
            </div>
            <div className="mode-selector">
              <div className={`radio-circle ${selectedMode === 'static' ? 'checked' : ''}`}>
                {selectedMode === 'static' && <div className="radio-dot"></div>}
              </div>
            </div>
          </div>

          <div 
            className={`mode-option ${selectedMode === 'animated' ? 'selected' : ''}`}
            onClick={() => handleModeChange('animated')}
          >
            <div className="mode-icon">
              <div className="animated-icon">🎭</div>
            </div>
            <div className="mode-info">
              <h3>Beta Mode</h3>
              <p>Enhanced experience with animated characters and smooth transitions. More engaging and fun!</p>
              <div className="mode-features">
                <span className="feature-tag beta">✨ Animated Characters</span>
                <span className="feature-tag beta">🎨 Smooth Transitions</span>
                <span className="feature-tag beta">🆕 Latest Features</span>
              </div>
            </div>
            <div className="mode-selector">
              <div className={`radio-circle ${selectedMode === 'animated' ? 'checked' : ''}`}>
                {selectedMode === 'animated' && <div className="radio-dot"></div>}
              </div>
            </div>
          </div>
        </div>

        <div className="mode-preview">
          <h4>Preview</h4>
          <div className="preview-container">
            {selectedMode === 'static' ? (
              <div className="static-preview">
                <div className="preview-element">Static Poll Card</div>
                <div className="preview-element">Static Button</div>
              </div>
            ) : (
              <div className="animated-preview">
                <div className="preview-element animated">Animated Poll Card</div>
                <div className="preview-element animated-button">Animated Button</div>
              </div>
            )}
          </div>
        </div>

        <div className="mode-note">
          <p>
            <strong>Note:</strong> You can change this setting anytime in the app settings. 
            Beta mode features are experimental and may be updated frequently.
          </p>
        </div>
      </div>

      <div className="mode-selection-actions">
        <button 
          className="back-btn"
          onClick={handleBack}
        >
          ← Back
        </button>
        <button 
          className="confirm-btn"
          onClick={handleConfirm}
        >
          Continue with {selectedMode === 'static' ? 'Classic' : 'Beta'} Mode
        </button>
      </div>
    </div>
  );
}

export default AnimationModeSelection;