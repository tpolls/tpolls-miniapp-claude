import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
import GettingStarted from './components/GettingStarted';
import RoleSelection from './components/RoleSelection';
import PollCreation from './components/PollCreation';
import './components/Welcome.css';
import './components/MainApp.css';
import './components/GettingStarted.css';
import './components/RoleSelection.css';
import './components/PollCreation.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [currentPage, setCurrentPage] = useState('getting-started');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      setIsConnected(!!walletInfo);
      if (walletInfo) {
        setCurrentPage('main');
      } else {
        setCurrentPage('welcome');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const handleLogin = (walletInfo) => {
    setCurrentPage('main');
  };

  const handleContinue = () => {
    setCurrentPage('role-selection');
  };

  const handleRoleSelect = (role) => {
    if (role === 'creator') {
      setCurrentPage('poll-creation');
    } else {
      setCurrentPage('welcome');
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
    setCurrentPage('welcome');
  };

  const handleLogout = () => {
    setCurrentPage('getting-started');
    setIsConnected(false);
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
      {currentPage === 'welcome' && (
        <Welcome onLogin={handleLogin} />
      )}
      {currentPage === 'main' && isConnected && (
        <MainApp onLogout={handleLogout} />
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