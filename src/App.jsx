import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { ToastProvider } from './contexts/ToastContext';
import Welcome from './components/Welcome';
import MainApp from './components/MainApp';
import OnboardingCarousel from './components/OnboardingCarousel';
import GettingStarted from './components/GettingStarted';
import AnimationModeSelection from './components/AnimationModeSelection';
import RoleSelection from './components/RoleSelection';
import PollCreation from './components/PollCreation';
import AnimatedPollCreation from './components/AnimatedPollCreation';
import PollSelection from './components/PollSelection';
import PollResponse from './components/PollResponse';
import UserSettings from './components/UserSettings';
import PollFunding from './components/PollFunding';
import PollAdministration from './components/PollAdministration';
import PollResults from './components/PollResults';
import BottomNavigation from './components/BottomNavigation';
import TelegramUIExamples from './components/examples/TelegramUIExamples';
import TelegramUIPollCreation from './components/TelegramUIPollCreation';
import StartAppPage from './components/StartAppPage';
import StandAlonePollResponse from './components/StandAlonePollResponse';
import { hasUserInteracted, initializeUserHistory, recordPollCreation, recordPollResponse, markOnboardingCompleted, resetOnboarding } from './utils/userHistory';
import { getAnimationMode } from './utils/animationMode';

// Helper function to handle Telegram start_param for deep linking
const handleStartParam = (setCurrentPage, setStartAppParams) => {
  try {
    console.log('🔍 Checking for deep linking...');
    console.log('Window object exists:', typeof window !== 'undefined');
    console.log('Telegram object exists:', typeof window !== 'undefined' && !!window.Telegram);
    console.log('WebApp object exists:', typeof window !== 'undefined' && !!window.Telegram?.WebApp);
    
    let pollId = null;
    let source = null;
    let user = null;
    
    // Check if we're in Telegram WebApp environment
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const initData = window.Telegram.WebApp.initDataUnsafe;
      console.log('🔧 initDataUnsafe:', initData);
      
      if (initData && initData.start_param) {
        const startParam = initData.start_param;
        console.log('✅ Telegram start_param detected:', startParam);
        
        source = 'telegram';
        user = initData.user || null;
        
        // Check if it's a poll deep link (format: poll_123)
        if (startParam.startsWith('poll_')) {
          pollId = startParam.replace('poll_', '');
        }
      }
    } else {
      console.log('⚠️ Not in Telegram WebApp environment');
      
      // For testing outside Telegram, check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const testStartParam = urlParams.get('startapp');
      
      if (testStartParam) {
        console.log('🧪 Test mode: startapp parameter detected:', testStartParam);
        
        source = 'test';
        user = null;
        
        if (testStartParam.startsWith('poll_')) {
          pollId = testStartParam.replace('poll_', '');
        }
      }
    }
    
    if (pollId && !isNaN(pollId)) {
      console.log('🎯 Deep linking to poll ID:', pollId);
      
      // Store poll ID for StandAlonePollResponse
      setStartAppParams({
        source: source,
        start_param: `poll_${pollId}`,
        pollId: pollId,
        user: user
      });
      
      // Navigate directly to StandAlonePollResponse
      setCurrentPage('standalone-poll-response');
      return true;
    } else if (source) {
      // Show StartAppPage for non-poll parameters
      setStartAppParams({
        source: source,
        start_param: source === 'telegram' ? window.Telegram?.WebApp?.initDataUnsafe?.start_param : (new URLSearchParams(window.location.search)).get('startapp'),
        user: user
      });
      setCurrentPage('start-app');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error handling Telegram start_param:', error);
  }
  
  return false; // No deep linking handled
};
import './components/Welcome.css';
import './components/MainApp.css';
import './components/GettingStarted.css';
import './components/AnimationModeSelection.css';
import './components/RoleSelection.css';
import './components/PollCreation.css';
import './components/AnimatedPollCreation.css';
import './components/PollSelection.css';
import './components/PollResponse.css';
import './components/UserSettings.css';
import './components/PollFunding.css';
import './components/PollAdministration.css';
import './components/PollResults.css';
import './components/BottomNavigation.css';
import './components/WalletMenu.css';

function App() {
  const [tonConnectUI] = useTonConnectUI();
  const [currentPage, setCurrentPage] = useState('getting-started');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedPollForResults, setSelectedPollForResults] = useState(null);
  const [animationMode, setAnimationMode] = useState('static');
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [startAppParams, setStartAppParams] = useState(null);
  
  // Use simple contract version - can be toggled via environment variable
  const useSimpleContract = import.meta.env.VITE_USE_SIMPLE_CONTRACT !== 'false';

  useEffect(() => {
    console.log('🚀 App useEffect started');
    
    // Load animation mode preference
    setAnimationMode(getAnimationMode());
    
    
    // Wait for Telegram WebApp to be ready before handling deep linking
    const initializeApp = () => {
      console.log('📱 Initializing app...');
      
      // Handle deep linking only once on app load
      if (!deepLinkHandled) {
        const wasHandled = handleStartParam(setCurrentPage, setStartAppParams);
        
        // Only set deepLinkHandled to true if we actually handled a deep link
        if (wasHandled) {
          setDeepLinkHandled(true);
          return;
        } else {
          setDeepLinkHandled(false); // Ensure we don't get stuck in a bad state
        }
      }
    };
    
    // Check if Telegram WebApp is ready
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('✅ Telegram WebApp is ready');
      initializeApp();
    } else {
      console.log('⏳ Waiting for Telegram WebApp to load...');
      // Wait a bit for the script to load
      const checkTelegram = setInterval(() => {
        if (window.Telegram && window.Telegram.WebApp) {
          console.log('✅ Telegram WebApp loaded after waiting');
          clearInterval(checkTelegram);
          initializeApp();
        }
      }, 100);
      
      // Fallback: proceed anyway after 3 seconds
      setTimeout(() => {
        clearInterval(checkTelegram);
        console.log('⚠️ Proceeding without Telegram WebApp');
        initializeApp();
      }, 3000);
    }
    
    // Set up global navigation functions for MainApp
    window.navigateToExamples = () => setCurrentPage('telegram-ui-examples');
    window.navigateToTelegramUIPollCreation = () => setCurrentPage('telegram-ui-poll-creation');
    window.navigateToPollAdmin = () => setCurrentPage('poll-administration');
    
    // Skip wallet connection logic if deep linking was handled (poll response will be shown)
    if (deepLinkHandled) {
      console.log('🎯 Skipping wallet logic due to startapp parameter');
      return;
    }
    
    // Check initial wallet connection state
    if (tonConnectUI.account) {
      const address = tonConnectUI.account.address;
      setWalletAddress(address);
      setIsConnected(true);
      
      // Initialize user history if new user
      initializeUserHistory(address);
      
      // Check if user has previous interactions
      if (hasUserInteracted(address)) {
        // Returning user - go to dashboard
        setCurrentPage('main');
      } else {
        // New user - go to onboarding
        setCurrentPage('onboarding');
      }
    } else {
      // No wallet connected - show main page with connection option
      setCurrentPage('main');
    }
    
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      // Skip wallet connection changes if showing StartAppPage
      if (currentPage === 'start-app') {
        console.log('🎯 Skipping wallet status change due to startapp parameter');
        return;
      }
      
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
          setCurrentPage('onboarding');
        }
      } else {
        setWalletAddress(null);
        setCurrentPage('main');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  if (deepLinkHandled && startAppParams?.pollId) {
    return <StandAlonePollResponse
      pollId={startAppParams.pollId}
      onBack={() => {
        if (isConnected) {
          setCurrentPage('main');
        } else {
          setCurrentPage('getting-started');
        }
      }}
      onSubmitResponse={(response) => {
        // Handle successful response submission or view results
        if (!response.viewResultsOnly && walletAddress) {
          recordPollResponse(walletAddress, response);
        }
        setSelectedPollForResults({ id: response.pollId });
        setCurrentPage('poll-results');
      }}
    />
  }

  const handleLogin = () => {
    setCurrentPage('main');
  };

  const handleContinue = () => {
    // User starts onboarding process, continue to welcome page
    setCurrentPage('role-selection');
  };

  const handleGettingStartedContinue = () => {
    setCurrentPage('role-selection');
  };

  const handleAnimationModeSelect = (mode) => {
    setAnimationMode(mode);
    setCurrentPage('role-selection');
  };


  const handleRoleSelect = (role) => {
    // Mark onboarding as completed when user selects their role
    if (walletAddress) {
      markOnboardingCompleted(walletAddress);
    }
    
    if (role === 'creator') {
      setCurrentPage('poll-creation');
    } else {
      setCurrentPage('poll-selection');
    }
  };

  const handleBackToGettingStarted = () => {
    setCurrentPage('main');
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
    setSelectedPoll(pollData);
    setCurrentPage('poll-response');
  };

  const handlePollResponse = (responseData) => {
    console.log('Poll response submitted:', responseData);
    
    // Record poll response in user history
    if (walletAddress) {
      recordPollResponse(walletAddress, responseData);
    }
    
    // Navigate to poll results page after successful vote submission
    setSelectedPollForResults(selectedPoll);
    setCurrentPage('poll-results');
  };

  const handleBackToPollSelection = () => {
    setCurrentPage('poll-selection');
  };

  const handleLogout = () => {
    setCurrentPage('getting-started');
    setIsConnected(false);
    setWalletAddress(null);
  };

  const handleRerunGettingStarted = () => {
    // Reset onboarding status and restart the flow
    if (walletAddress) {
      resetOnboarding(walletAddress);
    }
    setCurrentPage('onboarding');
  };

  const handleBottomNavigation = (page) => {
    setCurrentPage(page);
  };

  const handleViewResults = (poll) => {
    console.log('View results for poll:', poll);
    setSelectedPollForResults(poll);
    setCurrentPage('poll-results');
  };

  const handleBackFromResults = () => {
    setCurrentPage('poll-selection');
    setSelectedPollForResults(null);
  };

  const handleManagePolls = () => {
    setCurrentPage('manage-polls');
  };

  return (
    <div className="app">
      {currentPage === 'onboarding' && (
        <OnboardingCarousel onComplete={handleContinue} />
      )}
      {currentPage === 'getting-started-wallet' && (
        <GettingStarted onContinue={handleGettingStartedContinue} />
      )}
      {currentPage === 'animation-mode-selection' && (
        <AnimationModeSelection onModeSelect={handleAnimationModeSelect} onBack={handleBackToGettingStarted} />
      )}
      {currentPage === 'role-selection' && (
        <RoleSelection onRoleSelect={handleRoleSelect} onBack={handleBackToGettingStarted} />
      )}
      {currentPage === 'poll-creation' && (
        animationMode === 'animated' ? (
          <AnimatedPollCreation onPollCreate={handlePollCreate} onBack={handleBackToRoleSelection} />
        ) : (
          <PollCreation onPollCreate={handlePollCreate} onBack={handleBackToRoleSelection} />
        )
      )}
      {currentPage === 'poll-selection' && (
        <PollSelection onPollSelect={handlePollSelect} onBack={handleBackToRoleSelection} onViewResults={handleViewResults} />
      )}
      {currentPage === 'poll-results' && (
        <PollResults 
          pollId={selectedPollForResults?.id} 
          onBack={handleBackFromResults} 
        />
      )}
      {currentPage === 'poll-response' && (
        <PollResponse poll={selectedPoll} onSubmitResponse={handlePollResponse} onBack={handleBackToPollSelection} />
      )}
      {currentPage === 'welcome' && (
        <Welcome onLogin={handleLogin} />
      )}
      {currentPage === 'main' && (
        <MainApp 
          isConnected={isConnected}
          onLogout={handleLogout} 
          onRerunGettingStarted={handleRerunGettingStarted} 
          onPollSelect={handlePollSelect} 
        />
      )}
      {currentPage === 'user-settings' && isConnected && (
        <UserSettings onBack={handleBottomNavigation} onRerunGettingStarted={handleRerunGettingStarted} onManagePolls={handleManagePolls} />
      )}
      {currentPage === 'manage-polls' && isConnected && (
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h1>Manage Polls</h1>
          <p>Manage Polls page coming soon!</p>
          <button onClick={() => handleBottomNavigation('user-settings')}>← Back to Profile</button>
        </div>
      )}
      {currentPage === 'poll-funding' && isConnected && (
        <PollFunding onBack={handleBottomNavigation} />
      )}
      {currentPage === 'poll-administration' && isConnected && (
        <PollAdministration onBack={handleBottomNavigation} />
      )}
       {currentPage === 'standalone-poll-response' && startAppParams?.pollId && (
        <StandAlonePollResponse 
          pollId={startAppParams.pollId}
          onBack={() => {
            if (isConnected) {
              setCurrentPage('main');
            } else {
              setCurrentPage('getting-started');
            }
          }}
          onSubmitResponse={(response) => {
            // Handle successful response submission or view results
            if (!response.viewResultsOnly && walletAddress) {
              recordPollResponse(walletAddress, response);
            }
            setSelectedPollForResults({ id: response.pollId });
            setCurrentPage('poll-results');
          }}
        />
      )}
      {currentPage === 'start-app' && (
        <StartAppPage 
          params={startAppParams}
          onContinue={(params) => {
            // Use provided params or state params
            const effectiveParams = params || startAppParams;
            
            // Check if we have a poll to navigate to
            if (effectiveParams?.start_param?.startsWith('poll_')) {
              const pollId = effectiveParams.start_param.replace('poll_', '');
              if (pollId && !isNaN(pollId)) {
                setCurrentPage('standalone-poll-response');
                return;
              }
            }
            // Otherwise go to main app or onboarding based on connection status
            if (isConnected) {
              setCurrentPage('main');
            } else {
              setCurrentPage('getting-started');
            }
          }}
          onBack={() => {
            if (isConnected) {
              setCurrentPage('main');
            } else {
              setCurrentPage('getting-started');
            }
          }}
        />
      )}
      
      {currentPage === 'telegram-ui-poll-creation' && isConnected && (
        <TelegramUIPollCreation onPollCreate={handlePollCreate} onBack={handleBottomNavigation} />
      )}
      
      {isConnected && !['onboarding', 'getting-started-wallet', 'animation-mode-selection', 'welcome', 'start-app'].includes(currentPage) && (
        <BottomNavigation 
          currentPage={currentPage} 
          onNavigate={handleBottomNavigation} 
        />
      )}
    </div>
  );
}

function AppWithProvider() {
  return (
    <TonConnectUIProvider manifestUrl="https://tpolls.vercel.app/tonconnect-manifest.json">
      <ToastProvider>
        <App />
      </ToastProvider>
    </TonConnectUIProvider>
  );
}

export default AppWithProvider;