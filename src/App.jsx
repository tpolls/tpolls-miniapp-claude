import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
import './components/Welcome.css';
import './components/MainApp.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [currentPage, setCurrentPage] = useState('welcome');
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

  const handleLogout = () => {
    setCurrentPage('welcome');
    setIsConnected(false);
  };

  return (
    <div className="app">
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
    <TonConnectUIProvider manifestUrl="https://tpolls-miniapp.vercel.app/tonconnect-manifest.json">
      <App />
    </TonConnectUIProvider>
  );
}

export default AppWithProvider;