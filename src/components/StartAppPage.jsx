import React from 'react';
import './StartAppPage.css';

const StartAppPage = ({ params, onContinue, onBack }) => {
  const handleContinue = () => {
    if (onContinue) {
      onContinue(params);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (!params) {
    return (
      <div className="start-app-loading">
        <div className="start-app-spinner"></div>
        <p>Loading Telegram app parameters...</p>
      </div>
    );
  }

  return (
    <div className="start-app-container">
      <div className="start-app-header">
        <h1 className="start-app-title">Welcome to T-Polls!</h1>
        <p className="start-app-subtitle">
          {params?.start_param ? 'Deep link activated' : 'Ready to get started'}
        </p>
      </div>

      <div className="start-app-content">
        <div className="start-app-icon">🗳️</div>
        
        <div className="start-app-description">
          {params?.start_param ? (
            <>
              You've been invited to participate in a poll!
              <br /><br />
              <strong>Parameter:</strong> {params.start_param}
            </>
          ) : (
            <>Welcome to the decentralized polling platform powered by TON blockchain.</>
          )}
        </div>

        {params?.user && (
          <div style={{ marginBottom: '20px', fontSize: '0.9rem', opacity: 0.8 }}>
            Hello, {params.user.first_name || 'User'}!
          </div>
        )}

        <div className="start-app-buttons">
          <button className="start-app-button start-app-primary" onClick={handleContinue}>
            Continue to App
          </button>
          <button className="start-app-button start-app-secondary" onClick={handleBack}>
            Go Back
          </button>
        </div>

        {params && (
          <div className="start-app-params">
            <strong>Debug Info:</strong><br />
            Source: {params.source}<br />
            Param: {params.start_param || 'none'}<br />
            {params.error && <span style={{ color: '#ff6b6b' }}>Error: {params.error}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StartAppPage;