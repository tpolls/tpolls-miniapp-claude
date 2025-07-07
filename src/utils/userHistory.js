// Utility functions for checking user interaction history

const USER_HISTORY_KEY = 'tpolls_user_history';

/**
 * Check if user has previous contract interactions
 * @param {string} walletAddress - User's wallet address
 * @returns {boolean} - True if user has previous interactions
 */
export const hasUserInteracted = (walletAddress) => {
  if (!walletAddress) return false;
  
  try {
    const history = localStorage.getItem(USER_HISTORY_KEY);
    if (!history) return false;
    
    const userHistory = JSON.parse(history);
    const userRecord = userHistory[walletAddress];
    
    return userRecord && (
      userRecord.pollsCreated > 0 || 
      userRecord.pollsResponded > 0 ||
      userRecord.hasCompletedOnboarding
    );
  } catch (error) {
    console.error('Error checking user history:', error);
    return false;
  }
};

/**
 * Get user's interaction history
 * @param {string} walletAddress - User's wallet address
 * @returns {object} - User's history object
 */
export const getUserHistory = (walletAddress) => {
  if (!walletAddress) return null;
  
  try {
    const history = localStorage.getItem(USER_HISTORY_KEY);
    if (!history) return null;
    
    const userHistory = JSON.parse(history);
    return userHistory[walletAddress] || null;
  } catch (error) {
    console.error('Error getting user history:', error);
    return null;
  }
};

/**
 * Initialize user history record
 * @param {string} walletAddress - User's wallet address
 */
export const initializeUserHistory = (walletAddress) => {
  if (!walletAddress) return;
  
  try {
    let history = {};
    const existingHistory = localStorage.getItem(USER_HISTORY_KEY);
    
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    if (!history[walletAddress]) {
      history[walletAddress] = {
        firstInteraction: new Date().toISOString(),
        pollsCreated: 0,
        pollsResponded: 0,
        hasCompletedOnboarding: false,
        lastActivity: new Date().toISOString()
      };
      
      localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error initializing user history:', error);
  }
};

/**
 * Mark onboarding as completed
 * @param {string} walletAddress - User's wallet address
 */
export const markOnboardingCompleted = (walletAddress) => {
  if (!walletAddress) return;
  
  try {
    let history = {};
    const existingHistory = localStorage.getItem(USER_HISTORY_KEY);
    
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    if (!history[walletAddress]) {
      initializeUserHistory(walletAddress);
      history = JSON.parse(localStorage.getItem(USER_HISTORY_KEY));
    }
    
    history[walletAddress].hasCompletedOnboarding = true;
    history[walletAddress].lastActivity = new Date().toISOString();
    
    localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error marking onboarding completed:', error);
  }
};

/**
 * Record poll creation
 * @param {string} walletAddress - User's wallet address
 * @param {object} pollData - Poll data
 */
export const recordPollCreation = (walletAddress, pollData) => {
  if (!walletAddress) return;
  
  try {
    let history = {};
    const existingHistory = localStorage.getItem(USER_HISTORY_KEY);
    
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    if (!history[walletAddress]) {
      initializeUserHistory(walletAddress);
      history = JSON.parse(localStorage.getItem(USER_HISTORY_KEY));
    }
    
    history[walletAddress].pollsCreated += 1;
    history[walletAddress].lastActivity = new Date().toISOString();
    history[walletAddress].hasCompletedOnboarding = true;
    
    localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error recording poll creation:', error);
  }
};

/**
 * Record poll response
 * @param {string} walletAddress - User's wallet address
 * @param {object} responseData - Response data
 */
export const recordPollResponse = (walletAddress, responseData) => {
  if (!walletAddress) return;
  
  try {
    let history = {};
    const existingHistory = localStorage.getItem(USER_HISTORY_KEY);
    
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    if (!history[walletAddress]) {
      initializeUserHistory(walletAddress);
      history = JSON.parse(localStorage.getItem(USER_HISTORY_KEY));
    }
    
    history[walletAddress].pollsResponded += 1;
    history[walletAddress].lastActivity = new Date().toISOString();
    history[walletAddress].hasCompletedOnboarding = true;
    
    localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error recording poll response:', error);
  }
};

/**
 * Clear user history (for testing/development)
 * @param {string} walletAddress - Optional: specific wallet to clear, or all if not provided
 */
export const clearUserHistory = (walletAddress = null) => {
  try {
    if (walletAddress) {
      const history = localStorage.getItem(USER_HISTORY_KEY);
      if (history) {
        const userHistory = JSON.parse(history);
        delete userHistory[walletAddress];
        localStorage.setItem(USER_HISTORY_KEY, JSON.stringify(userHistory));
      }
    } else {
      localStorage.removeItem(USER_HISTORY_KEY);
    }
  } catch (error) {
    console.error('Error clearing user history:', error);
  }
};