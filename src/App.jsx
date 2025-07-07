import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
import GettingStarted from './components/GettingStarted';
import RoleSelection from './components/RoleSelection';
import PollCreation from './components/PollCreation';
import PollSelection from './components/PollSelection';
import { hasUserInteracted, initializeUserHistory, recordPollCreation, recordPollResponse, markOnboardingCompleted } from './utils/userHistory';
import './components/Welcome.css';
import './components/MainApp.css';
import './components/GettingStarted.css';
import './components/RoleSelection.css';
import './components/PollCreation.css';
import './components/PollSelection.css';
import './components/WalletMenu.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [currentPage, setCurrentPage] = useState('getting-started');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      setIsConnected(!!walletInfo);
      
      if (walletInfo) {
        const address = walletInfo.account.address;
        setWalletAddress(address);
        
        // Initialize user history if new user
        initializeUserHistory(address);
        
        // Check if user has previous interactions
        if (hasUserInteracted(address)) {
          // Returning user - go to dashboard
          setCurrentPage('main');
        } else {
          // New user - go to onboarding
          setCurrentPage('getting-started');
        }
      } else {
        setWalletAddress(null);
        setCurrentPage('welcome');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const handleLogin = (walletInfo) => {
    setCurrentPage('main');
  };

  const handleContinue = () => {
    // Mark that user has started the onboarding process
    if (walletAddress) {
      markOnboardingCompleted(walletAddress);
    }
    setCurrentPage('role-selection');
  };

  const handleRoleSelect = (role) => {
    if (role === 'creator') {
      setCurrentPage('poll-creation');
    } else {
      setCurrentPage('poll-selection');
    }
  };

  const handleBackToGettingStarted = () => {
    setCurrentPage('getting-started');
  };

  const handleBackToRoleSelection = () => {
    setCurrentPage('role-selection');
  };

  const handlePollCreate = (pollData) => {
    console.log('Poll created:', pollData);
    
    // Record poll creation in user history
    if (walletAddress) {
      recordPollCreation(walletAddress, pollData);
    }
    
    setCurrentPage('main');
  };

  const handlePollSelect = (pollData) => {
    console.log('Poll selected:', pollData);
    
    // Record poll response in user history
    if (walletAddress) {
      recordPollResponse(walletAddress, pollData);
    }
    
    setCurrentPage('main');
  };

  const handleLogout = () => {
    setCurrentPage('getting-started');
    setIsConnected(false);
    setWalletAddress(null);
  };

  const handleRerunGettingStarted = () => {
    setCurrentPage('getting-started');
  };

  return (
    <div className="app">
      {currentPage === 'getting-started' && (
        <GettingStarted onContinue={handleContinue} />
      )}
      {currentPage === 'role-selection' && (
        <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBackToGettingStarted} />
      )}
      {currentPage === 'poll-creation' && (
        <PollCreation onPollCreate={handlePollCreate} onBack={handleBackToRoleSelection} />
      )}
      {currentPage === 'poll-selection' && (
        <PollSelection onPollSelect={handlePollSelect} onBack={handleBackToRoleSelection} />
      )}
      {currentPage === 'welcome' && (
        <Welcome onLogin={handleLogin} />
      )}
      {currentPage === 'main' && isConnected && (
        <MainApp onLogout={handleLogout} onRerunGettingStarted={handleRerunGettingStarted} />
      )}
    </div>
  );
}

function AppWithProvider() {
  return (
    <TonConnectUIProvider manifestUrl="https://tpolls.vercel.app/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}

export default AppWithProvider;