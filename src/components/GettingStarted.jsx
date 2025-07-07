import React, { useState, useEffect } from 'react';
import './GettingStarted.css';
import illustrationImage from './getting-started-illustration.png';

function GettingStarted({ onContinue }) {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleContinue = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className="getting-started-page">
      <div className="getting-started-header">
        <h1 className="app-title">tPolls</h1>
        <h2 className="page-title">Get Started</h2>
        <p className="page-subtitle">
          A miniapp for polls built on<br />
          top of TON
        </p>
      </div>

      <div className="getting-started-illustration">
        <img src={illustrationImage} alt="Getting Started Illustration" />
      </div>

      <div className="getting-started-actions">
        <button 
          className="continue-btn"
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default GettingStarted;