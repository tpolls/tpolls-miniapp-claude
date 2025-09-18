/**
 * Contract Data Transformer
 * Handles data transformation between different contract formats
 * Ensures UI compatibility when switching between simple and complex contracts
 */

/**
 * Transform poll data from simplified contract to format expected by UI components
 * @param {Object} simplePoll - Poll data from simplified contract
 * @returns {Object} Transformed poll data compatible with existing UI
 */
export const transformSimplePollForUI = (simplePoll) => {
  return {
    // Core data from blockchain
    id: simplePoll.id,
    title: simplePoll.title || `Poll ${simplePoll.id}`,
    description: simplePoll.description || 'No description available',
    options: simplePoll.options || Array.from({ length: simplePoll.optionCount || 2 }, (_, i) => `Option ${i + 1}`),
    creator: simplePoll.creator,
    totalVotes: simplePoll.totalVotes || 0,
    totalResponses: simplePoll.totalVotes || 0,
    isActive: simplePoll.isActive,
    optionCount: simplePoll.optionCount,
    
    // Enhanced metadata
    category: simplePoll.category || 'general',
    author: formatAddress(simplePoll.creator),
    createdAt: simplePoll.createdAt || new Date().toLocaleDateString(),
    
    // UI compatibility fields (with default values for simple contract)
    totalRewardFund: '0 TON', // Simple contract doesn't have funding
    daysRemaining: calculateDaysRemaining(simplePoll.endTime),
    gaslessEnabled: false, // Simple contract doesn't support gasless voting
    rewardPerVote: '0', // Simple contract doesn't have rewards
    duration: 'N/A', // Simple contract doesn't store duration
    
    // Contract type indicators
    contractType: 'simple',
    hasAiData: simplePoll.hasAiData || false,
    hasMetadata: simplePoll.hasMetadata || false,
    
    // Feature flags for UI
    features: {
      canVote: simplePoll.isActive,
      hasRewards: false,
      hasGaslessVoting: false,
      hasFunding: false,
      hasComplexMetadata: false
    }
  };
};

/**
 * Transform poll data from complex contract to standard format
 * @param {Object} complexPoll - Poll data from complex contract
 * @returns {Object} Standardized poll data
 */
export const transformComplexPollForUI = (complexPoll) => {
  return {
    ...complexPoll,
    contractType: 'complex',
    features: {
      canVote: complexPoll.isActive,
      hasRewards: !!(complexPoll.rewardPerVote && parseFloat(complexPoll.rewardPerVote) > 0),
      hasGaslessVoting: complexPoll.gaslessEnabled || false,
      hasFunding: !!(complexPoll.totalRewardFund && complexPoll.totalRewardFund !== '0 TON'),
      hasComplexMetadata: true
    }
  };
};

/**
 * Transform poll creation data for simplified contract
 * @param {Object} pollData - Poll creation data from UI
 * @returns {Object} Data formatted for simplified contract
 */
// Jetton address mapping
const getJettonAddress = (tokenType) => {
  const addresses = {
    'jetton-custom': 'EQDiYefKbljzJeBgLAB6Y4AYSRrgnFQnqdCKhHCw8fk987hQ',
    'jetton-usdt': 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    'jetton-usdc': 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',
    'jetton-not': 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT'
  };
  return addresses[tokenType] || null;
};

export const transformPollDataForSimpleContract = (pollData) => {
  const isJettonReward = pollData.rewardToken && pollData.rewardToken !== 'ton';

  const transformedData = {
    // Essential data for simple contract
    subject: pollData.subject,
    options: pollData.options,
    createdBy: pollData.createdBy,

    // Reward configuration
    rewardPerVote: pollData.rewardToken === 'ton' ?
      (pollData.rewardAmount ? parseFloat(pollData.rewardAmount) : 0) : 0,

    // Jetton reward configuration
    jettonRewardWallet: isJettonReward ? getJettonAddress(pollData.rewardToken) : null,
    jettonRewardPerVote: isJettonReward ?
      (pollData.jettonRewardAmount ? parseFloat(pollData.jettonRewardAmount) : 0) : 0
  };

  return transformedData;
};

/**
 * Transform poll creation data for complex contract
 * @param {Object} pollData - Poll creation data from UI
 * @returns {Object} Data formatted for complex contract
 */
export const transformPollDataForComplexContract = (pollData) => {
  return {
    // Pass all data for complex contract
    ...pollData
  };
};

/**
 * Transform vote data for simplified contract
 * @param {number} pollId - Poll ID
 * @param {number} optionIndex - Selected option index
 * @param {Object} options - Additional voting options
 * @returns {Object} Vote data for simplified contract
 */
export const transformVoteDataForSimpleContract = (pollId, optionIndex, options = {}) => {
  return {
    pollId: parseInt(pollId),
    optionIndex: parseInt(optionIndex)
    // Simple contract doesn't use gasless voting or complex options
  };
};

/**
 * Transform vote data for complex contract
 * @param {number} pollId - Poll ID
 * @param {number} optionIndex - Selected option index
 * @param {Object} options - Additional voting options
 * @returns {Object} Vote data for complex contract
 */
export const transformVoteDataForComplexContract = (pollId, optionIndex, options = {}) => {
  return {
    pollId: parseInt(pollId),
    optionIndex: parseInt(optionIndex),
    useGaslessVoting: options.useGaslessVoting || false,
    // Include all complex voting options
    ...options
  };
};

/**
 * Get contract-specific feature availability
 * @param {string} contractType - 'simple' or 'complex'
 * @returns {Object} Feature availability flags
 */
export const getContractFeatures = (contractType) => {
  if (contractType === 'simple') {
    return {
      hasGaslessVoting: false,
      hasFundingOptions: false,
      hasComplexRewards: false,
      hasMinimalData: true,
      supportsAIPoll: true,
      supportsBasicVoting: true
    };
  } else {
    return {
      hasGaslessVoting: true,
      hasFundingOptions: true,
      hasComplexRewards: true,
      hasMinimalData: false,
      supportsAIPoll: true,
      supportsBasicVoting: true
    };
  }
};

/**
 * Helper function to format wallet addresses
 * @param {string} address - Full wallet address
 * @returns {string} Formatted address
 */
function formatAddress(address) {
  if (!address || address.length < 10) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Helper function to calculate days remaining
 * @param {string|Date} endTime - End time
 * @returns {number} Days remaining
 */
function calculateDaysRemaining(endTime) {
  if (!endTime) return 0;
  
  try {
    const end = new Date(endTime);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
}

/**
 * Universal poll transformer that detects contract type and applies appropriate transformation
 * @param {Object} poll - Raw poll data from contract
 * @param {string} contractType - Contract type ('simple' or 'complex')
 * @returns {Object} Transformed poll data
 */
export const transformPollForUI = (poll, contractType) => {
  if (contractType === 'simple') {
    return transformSimplePollForUI(poll);
  } else {
    return transformComplexPollForUI(poll);
  }
};

export default {
  transformSimplePollForUI,
  transformComplexPollForUI,
  transformPollDataForSimpleContract,
  transformPollDataForComplexContract,
  transformVoteDataForSimpleContract,
  transformVoteDataForComplexContract,
  getContractFeatures,
  transformPollForUI
};