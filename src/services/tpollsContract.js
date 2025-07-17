import { toNano, Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import gaslessVotingService from './gaslessVoting';

/**
 * TPolls Smart Contract Service
 * Handles all interactions with the TPollsDapp smart contract
 */
class TPollsContract {
  constructor() {
    // Use the deployed contract address from deployment.json
    this.contractAddress = import.meta.env.VITE_TPOLLS_CONTRACT_ADDRESS || 'EQCZ2buqvFaweGDUGbUk8Aph2vuhDFxPS3WoMkEuQoCEKj5j';
    this.tonConnectUI = null;
    this.client = null;
    this.managerAddresses = {
      pollManager: null,
      responseManager: null,
      fundManager: null,
      optionsStorage: null
    };
    
    // Log which contract address is being used
    const usingDefault = !import.meta.env.VITE_TPOLLS_CONTRACT_ADDRESS;
    console.log(`TPollsContract initialized with address: ${this.contractAddress}${usingDefault ? ' (default)' : ' (from deployment.json)'}`);
  }

  /**
   * Initialize the service with TonConnect UI instance
   */
  async init(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
    
    // Initialize TonClient for contract interactions
    try {
      this.client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: import.meta.env.VITE_TONCENTER_API_KEY // Optional API key for higher rate limits
      });
      console.log('TonClient initialized successfully');
      
      // Initialize manager contract addresses
      await this._initializeManagerAddresses();
      
    } catch (error) {
      console.warn('Failed to initialize TonClient, using mock data:', error);
      this.client = null;
    }
  }

  /**
   * Initialize manager contract addresses from main contract
   */
  async _initializeManagerAddresses() {
    try {
      if (!this.client) return;

      const contractAddress = Address.parse(this.contractAddress);
      
      // Get manager addresses from main contract
      const pollManagerResult = await this.client.runMethod(contractAddress, 'getGetPollManager');
      const responseManagerResult = await this.client.runMethod(contractAddress, 'getGetResponseManager');
      const fundManagerResult = await this.client.runMethod(contractAddress, 'getGetFundManager');
      const optionsStorageResult = await this.client.runMethod(contractAddress, 'getGetOptionsStorage');

      if (pollManagerResult.stack?.[0]) {
        this.managerAddresses.pollManager = pollManagerResult.stack[0].value.toString();
      }
      if (responseManagerResult.stack?.[0]) {
        this.managerAddresses.responseManager = responseManagerResult.stack[0].value.toString();
      }
      if (fundManagerResult.stack?.[0]) {
        this.managerAddresses.fundManager = fundManagerResult.stack[0].value.toString();
      }
      if (optionsStorageResult.stack?.[0]) {
        this.managerAddresses.optionsStorage = optionsStorageResult.stack[0].value.toString();
      }

      console.log('Manager addresses initialized:', this.managerAddresses);
    } catch (error) {
      console.warn('Failed to initialize manager addresses:', error);
    }
  }

  /**
   * Create a new poll with funding
   * @param {Object} pollData - Poll creation data
   * @param {string} pollData.title - Poll title
   * @param {string} pollData.description - Poll description
   * @param {Array<string>} pollData.options - Poll options (text)
   * @param {number} pollData.duration - Duration in seconds (default: 24 hours)
   * @param {string} pollData.rewardPerVote - Reward per vote in TON (default: 0.01)
   * @param {string} pollData.totalFunding - Total funding for rewards in TON (default: 1.0)
   * @returns {Promise<Object>} Transaction result
   */
  async createPoll(pollData) {
    if (!this.tonConnectUI || !this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    const {
      title,
      description,
      options,
      duration = 86400, // 24 hours default
      rewardPerVote = '0.01',
      totalFunding = '1.0'
    } = pollData;

    // Validate input
    if (!title || !description || !options || options.length < 2) {
      throw new Error('Invalid poll data: title, description, and at least 2 options required');
    }

    if (options.length > 10) {
      throw new Error('Maximum 10 options allowed');
    }

    try {
      // For now, we'll use a simplified approach without complex cell building
      // In a production environment, you'd want to properly encode the message
      
      // Calculate total value needed (fees + funding)
      const feeAmount = 0.01; // Reduced gas fees for testing
      const totalValue = (parseFloat(totalFunding) + feeAmount).toFixed(3); // Fixed to 3 decimal places

      console.log('Debug - Poll Data:', {
        title,
        description,
        options,
        duration,
        rewardPerVote,
        totalFunding,
        totalValue
      });

      // For now, send a simple transaction without payload
      // In production, you'd build proper BOC messages for the smart contract
      
      // Send transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: this.contractAddress,
            amount: toNano(totalValue).toString()
            // No payload for simple transfer - will be added later when contract is ready
          }
        ]
      };

      console.log('Debug - Transaction object:', JSON.stringify(transaction, null, 2));
      console.log('Debug - Contract address:', this.contractAddress);
      console.log('Debug - TonConnect UI connected:', this.tonConnectUI?.connected);
      console.log('Debug - Amount in nano:', toNano(totalValue).toString());

      const result = await this.tonConnectUI.sendTransaction(transaction);
      
      // Store poll options and gasless preference off-chain
      this._storePollOptions(title, options);
      this._storePollGaslessPreference(title, pollData.enableGaslessResponses);
      
      return {
        success: true,
        transactionHash: result.boc,
        pollData: {
          title,
          description,
          options,
          optionCount: options.length,
          duration,
          rewardPerVote
        }
      };
    } catch (error) {
      console.error('Error creating poll:', error);
      throw new Error(`Failed to create poll: ${error.message}`);
    }
  }

  /**
   * Vote on a poll with gasless option
   * @param {number} pollId - Poll ID
   * @param {number} optionId - Selected option ID (0-based index)
   * @param {boolean} useGaslessVoting - Whether to use gasless voting (default: true)
   * @returns {Promise<Object>} Transaction result
   */
  async voteOnPoll(pollId, optionId, useGaslessVoting = true) {
    if (!this.tonConnectUI || !this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Check if the poll has gasless voting enabled
      const poll = await this.getPoll(pollId);
      const pollSupportsGasless = poll.gaslessEnabled;
      
      // Check if gasless voting is available
      const gaslessAvailable = await gaslessVotingService.isGaslessVotingAvailable();
      
      // Only use gasless if user wants it, poll supports it, and service is available
      const shouldUseGasless = useGaslessVoting && pollSupportsGasless && gaslessAvailable;
      
      if (shouldUseGasless) {
        console.log('Using gasless voting (poll creator enabled this feature)...');
        return await this.submitGaslessVote(pollId, optionId);
      } else {
        if (useGaslessVoting && !pollSupportsGasless) {
          console.log('Poll creator disabled gasless voting, using traditional voting...');
        } else {
          console.log('Using traditional voting...');
        }
        return await this.submitTraditionalVote(pollId, optionId);
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw new Error(`Failed to vote: ${error.message}`);
    }
  }

  /**
   * Submit a gasless vote using meta-transactions
   * @param {number} pollId - Poll ID
   * @param {number} optionId - Selected option ID
   * @returns {Promise<Object>} Vote result
   */
  async submitGaslessVote(pollId, optionId) {
    try {
      // Get user's wallet address
      const userAddress = this.tonConnectUI.account?.address;
      if (!userAddress) {
        throw new Error('User address not available');
      }

      const voteData = {
        pollId,
        optionId,
        userAddress
      };

      // Submit gasless vote
      const result = await gaslessVotingService.submitGaslessVote(voteData, this.tonConnectUI);
      
      return result;
    } catch (error) {
      console.error('Error in gasless voting:', error);
      // Fallback to traditional voting if gasless fails
      console.log('Falling back to traditional voting...');
      return await this.submitTraditionalVote(pollId, optionId);
    }
  }

  /**
   * Submit a traditional vote (user pays gas)
   * @param {number} pollId - Poll ID
   * @param {number} optionId - Selected option ID
   * @returns {Promise<Object>} Vote result
   */
  async submitTraditionalVote(pollId, optionId) {
    try {
      // Send simple transaction for voting
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: this.contractAddress,
            amount: toNano('0.05').toString() // Reduced gas fees
            // No payload for simple transfer
          }
        ]
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.boc,
        gasless: false,
        pollId,
        selectedOption: optionId,
        message: 'Vote submitted successfully'
      };
    } catch (error) {
      console.error('Error in traditional voting:', error);
      throw error;
    }
  }

  /**
   * Get poll data from contract
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll data
   */
  async getPoll(pollId) {
    try {
      // This would typically use TonClient to call getter methods
      // For now, returning mock data structure that matches contract
      
      // In a real implementation, you would:
      // const client = new TonClient({ endpoint: 'https://toncenter.com/api/v2/jsonRPC' });
      // const contract = client.open(Address.parse(this.contractAddress));
      // const poll = await contract.getPoll(pollId);
      
      // Mock poll data for demonstration
      const pollOptions = this._getPollOptions(pollId);
      const gaslessEnabled = this._getPollGaslessPreference(pollId);
      
      const startTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const endTime = Math.floor(Date.now() / 1000) + 82800; // 23 hours from now
      const totalResponses = Math.floor(Math.random() * 100) + 10;
      const totalRewardFund = `${(Math.random() * 2 + 0.1).toFixed(2)} TON`;
      const daysRemaining = Math.floor((endTime - Math.floor(Date.now() / 1000)) / 86400);

      // Generate more realistic poll titles
      const pollTitles = [
        'What\'s your favorite programming language?',
        'Which blockchain has the most potential?',
        'Best mobile app development framework?',
        'Future of artificial intelligence?',
        'Most important tech trend in 2025?'
      ];
      
      return {
        id: pollId,
        creator: 'EQDxxx...', // Would come from contract
        title: pollTitles[pollId - 1] || `Poll ${pollId}`, // Would come from contract
        description: `Description for poll ${pollId}`, // Would come from contract
        options: pollOptions || ['Option 1', 'Option 2', 'Option 3'],
        optionCount: pollOptions?.length || 3,
        startTime,
        endTime,
        isActive: true,
        totalVotes: totalResponses, // Keep for backward compatibility
        totalResponses, // New field for PollSelection
        totalRewardFund, // New field for PollSelection
        daysRemaining, // New field for PollSelection
        duration: daysRemaining > 0 ? `${daysRemaining + 1} days` : 'Ended', // New field for PollSelection
        rewardPerVote: '0.01',
        gaslessEnabled: gaslessEnabled !== null ? gaslessEnabled : true // Default to gasless enabled
      };
    } catch (error) {
      console.error('Error getting poll:', error);
      throw new Error(`Failed to get poll: ${error.message}`);
    }
  }

  /**
   * Get all active polls
   * @returns {Promise<Array>} Array of poll data
   */
  async getActivePolls() {
    try {
      if (!this.client || !this.managerAddresses.pollManager) {
        console.warn('TonClient or PollManager not available, using fallback data');
        return await this._getFallbackPolls();
      }

      // Get total polls count from PollManager
      const pollManagerAddress = Address.parse(this.managerAddresses.pollManager);
      const pollsCountResult = await this.client.runMethod(pollManagerAddress, 'getGetPollsCount');
      
      if (!pollsCountResult.stack || pollsCountResult.stack.length === 0) {
        console.warn('No polls found on contract');
        return [];
      }

      const totalPolls = Number(pollsCountResult.stack[0].value);
      console.log(`Found ${totalPolls} total polls on contract`);

      // Fetch individual polls and filter for active ones
      const polls = [];
      for (let i = 1; i <= Math.min(totalPolls, 10); i++) { // Limit to 10 polls for performance
        try {
          const pollData = await this.getPollFromContract(i);
          if (pollData && pollData.isActive) {
            polls.push(pollData);
          }
        } catch (pollError) {
          console.warn(`Failed to fetch poll ${i}:`, pollError);
          // Continue with other polls even if one fails
        }
      }
      
      console.log(`Retrieved ${polls.length} active polls from contract`);
      return polls;
      
    } catch (error) {
      console.error('Error getting active polls from contract:', error);
      
      // Fallback to mock data if contract call fails
      console.warn('Falling back to mock data due to contract error');
      return await this._getFallbackPolls();
    }
  }

  /**
   * Check if user has voted on a poll
   * @param {string} userAddress - User's wallet address
   * @param {number} pollId - Poll ID
   * @returns {Promise<boolean>} Whether user has voted
   */
  async hasUserVoted(userAddress, pollId) {
    try {
      // This would call the contract's hasUserVoted getter
      // For now, returning false (allowing votes)
      return false;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  }

  /**
   * Get vote statistics for a poll
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Vote statistics
   */
  async getPollStats(pollId) {
    try {
      // This would call contract getters for vote statistics
      const poll = await this.getPoll(pollId);
      const stats = {
        totalVotes: poll.totalVotes,
        optionVotes: [],
        percentages: []
      };
      
      // Mock vote distribution
      for (let i = 0; i < poll.optionCount; i++) {
        const votes = Math.floor(Math.random() * poll.totalVotes);
        stats.optionVotes.push(votes);
        stats.percentages.push(((votes / poll.totalVotes) * 100).toFixed(1));
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting poll stats:', error);
      throw new Error(`Failed to get poll statistics: ${error.message}`);
    }
  }

  /**
   * Claim voting rewards
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Transaction result
   */
  async claimReward(pollId) {
    if (!this.tonConnectUI || !this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Send simple transaction for claiming rewards
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: this.contractAddress,
            amount: toNano('0.05').toString()
            // No payload for simple transfer
          }
        ]
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);
      
      return {
        success: true,
        transactionHash: result.boc,
        pollId
      };
    } catch (error) {
      console.error('Error claiming reward:', error);
      throw new Error(`Failed to claim reward: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Store poll options off-chain (localStorage for demo)
   */
  _storePollOptions(title, options) {
    try {
      const pollsData = JSON.parse(localStorage.getItem('tpolls_options') || '{}');
      pollsData[title] = options;
      localStorage.setItem('tpolls_options', JSON.stringify(pollsData));
    } catch (error) {
      console.warn('Failed to store poll options:', error);
    }
  }

  /**
   * Store poll gasless preference off-chain
   */
  _storePollGaslessPreference(title, enableGasless) {
    try {
      const gaslessData = JSON.parse(localStorage.getItem('tpolls_gasless') || '{}');
      gaslessData[title] = enableGasless;
      localStorage.setItem('tpolls_gasless', JSON.stringify(gaslessData));
    } catch (error) {
      console.warn('Failed to store gasless preference:', error);
    }
  }

  /**
   * Get poll options from off-chain storage
   */
  _getPollOptions(pollId) {
    try {
      const pollsData = JSON.parse(localStorage.getItem('tpolls_options') || '{}');
      // In real implementation, you'd map pollId to stored options
      return Object.values(pollsData)[pollId - 1] || null;
    } catch (error) {
      console.warn('Failed to get poll options:', error);
      return null;
    }
  }

  /**
   * Get poll gasless preference from off-chain storage
   */
  _getPollGaslessPreference(pollId) {
    try {
      const gaslessData = JSON.parse(localStorage.getItem('tpolls_gasless') || '{}');
      // In real implementation, you'd map pollId to stored preferences
      return Object.values(gaslessData)[pollId - 1] || null;
    } catch (error) {
      console.warn('Failed to get gasless preference:', error);
      return null;
    }
  }

  /**
   * Get gasless voting information
   * @returns {Object} Gasless voting info
   */
  async getGaslessVotingInfo() {
    const isAvailable = await gaslessVotingService.isGaslessVotingAvailable();
    const savingsInfo = gaslessVotingService.getGasSavingsInfo();
    
    return {
      available: isAvailable,
      ...savingsInfo
    };
  }

  /**
   * Get poll data directly from contract
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll data from contract
   */
  async getPollFromContract(pollId) {
    try {
      if (!this.client || !this.managerAddresses.pollManager) {
        throw new Error('TonClient or PollManager not available');
      }

      // Get poll data from PollManager
      const pollManagerAddress = Address.parse(this.managerAddresses.pollManager);
      const pollResult = await this.client.runMethod(pollManagerAddress, 'getGetPoll', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (!pollResult.stack || pollResult.stack.length === 0) {
        throw new Error(`Poll ${pollId} not found`);
      }

      // Parse Poll struct from contract
      // Based on the contract: Poll struct has: id, creator, title, description, optionCount, startTime, endTime, isActive, totalVotes, rewardPerVote
      const pollData = pollResult.stack[0]; // This should be a Cell containing the Poll struct
      
      // For now, we'll need to parse the Cell structure
      // This is a simplified approach - real implementation would parse the Cell properly
      const poll = {
        id: pollId,
        title: `Poll ${pollId}`, // Will be parsed from Cell
        description: `Description for poll ${pollId}`, // Will be parsed from Cell  
        creator: 'EQDxxx...', // Will be parsed from Cell
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 82800,
        isActive: true, // Will be parsed from Cell
        totalVotes: 0, // Will be parsed from Cell
        rewardPerVote: 1000000, // Will be parsed from Cell (in nanotons)
        optionCount: 3 // Will be parsed from Cell
      };

      // Get poll options from OptionsStorage
      const options = await this._getPollOptions(pollId, poll.optionCount);
      
      // Get fund pool data
      const fundData = await this._getPollFundData(pollId);
      
      // Get total votes from ResponseManager
      const totalVotes = await this._getPollTotalVotes(pollId);

      // Convert to app format
      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: options,
        creator: poll.creator,
        startTime: poll.startTime,
        endTime: poll.endTime,
        isActive: poll.isActive,
        totalVotes: totalVotes,
        totalResponses: totalVotes,
        author: this._formatAddress(poll.creator),
        createdAt: this._formatTime(poll.startTime),
        totalRewardFund: fundData.totalFunds,
        daysRemaining: this._calculateDaysRemaining(poll.endTime),
        duration: this._formatDuration(poll.startTime, poll.endTime),
        rewardPerVote: (poll.rewardPerVote / 1000000000).toFixed(3), // Convert from nanotons
        gaslessEnabled: true
      };

    } catch (error) {
      console.error(`Error fetching poll ${pollId} from contract:`, error);
      throw error;
    }
  }

  /**
   * Fallback method to provide mock data when contract is unavailable
   * @returns {Promise<Array>} Mock poll data
   */
  async _getFallbackPolls() {
    console.log('Using fallback mock data for polls');
    const polls = [];
    
    // Generate realistic mock data
    for (let i = 1; i <= 5; i++) {
      const poll = await this.getPoll(i);
      if (poll.isActive) {
        polls.push({
          ...poll,
          author: `Developer${i}`,
          createdAt: this._formatTime(poll.startTime),
          totalVotes: Math.floor(Math.random() * 100) + 10
        });
      }
    }
    
    return polls;
  }

  /**
   * Helper method to parse TVM string from contract response
   * @param {Object} tvmCell - TVM cell containing string data
   * @returns {string} Parsed string
   */
  _parseTvmString(tvmCell) {
    try {
      // This implementation depends on how strings are stored in your contract
      // For now, return a placeholder - you'll need to implement based on your contract's string encoding
      return tvmCell?.value?.toString() || 'Untitled';
    } catch (error) {
      console.warn('Failed to parse TVM string:', error);
      return 'Untitled';
    }
  }

  /**
   * Helper method to parse array of strings from contract response
   * @param {Object} tvmCell - TVM cell containing array data
   * @returns {Array<string>} Parsed string array
   */
  _parseTvmStringArray(tvmCell) {
    try {
      // This implementation depends on how arrays are stored in your contract
      // For now, return a placeholder - you'll need to implement based on your contract's array encoding
      return ['Option 1', 'Option 2', 'Option 3'];
    } catch (error) {
      console.warn('Failed to parse TVM string array:', error);
      return ['Option 1', 'Option 2'];
    }
  }

  /**
   * Get poll options from OptionsStorage contract
   * @param {number} pollId - Poll ID
   * @param {number} optionCount - Number of options
   * @returns {Promise<Array<string>>} Poll options
   */
  async _getPollOptions(pollId, optionCount) {
    try {
      if (!this.client || !this.managerAddresses.optionsStorage) {
        return ['Option 1', 'Option 2', 'Option 3'];
      }

      const optionsStorageAddress = Address.parse(this.managerAddresses.optionsStorage);
      const options = [];

      for (let i = 1; i <= optionCount; i++) {
        try {
          const optionResult = await this.client.runMethod(optionsStorageAddress, 'getGetOption', [
            { type: 'int', value: BigInt(pollId) },
            { type: 'int', value: BigInt(i) }
          ]);

          if (optionResult.stack && optionResult.stack.length > 0) {
            // Parse option text from Cell
            const optionText = this._parseTvmString(optionResult.stack[0]);
            options.push(optionText);
          } else {
            options.push(`Option ${i}`);
          }
        } catch (error) {
          console.warn(`Failed to get option ${i} for poll ${pollId}:`, error);
          options.push(`Option ${i}`);
        }
      }

      return options;
    } catch (error) {
      console.warn('Failed to get poll options:', error);
      return ['Option 1', 'Option 2', 'Option 3'];
    }
  }

  /**
   * Get fund pool data from FundManager contract
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Fund pool data
   */
  async _getPollFundData(pollId) {
    try {
      if (!this.client || !this.managerAddresses.fundManager) {
        return {
          totalFunds: `${(Math.random() * 2 + 0.1).toFixed(2)} TON`,
          rewardPerVote: 0.001
        };
      }

      const fundManagerAddress = Address.parse(this.managerAddresses.fundManager);
      const fundResult = await this.client.runMethod(fundManagerAddress, 'getGetFundPool', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (fundResult.stack && fundResult.stack.length > 0) {
        // Parse FundPool struct from Cell
        // For now, using placeholder values - real implementation would parse the Cell
        const totalFunds = Math.random() * 2000000000 + 100000000; // Random nanotons
        return {
          totalFunds: `${(totalFunds / 1000000000).toFixed(3)} TON`,
          rewardPerVote: 0.001
        };
      }

      return {
        totalFunds: '0.000 TON',
        rewardPerVote: 0.001
      };
    } catch (error) {
      console.warn('Failed to get fund pool data:', error);
      return {
        totalFunds: `${(Math.random() * 2 + 0.1).toFixed(2)} TON`,
        rewardPerVote: 0.001
      };
    }
  }

  /**
   * Get total votes for a poll from ResponseManager
   * @param {number} pollId - Poll ID
   * @returns {Promise<number>} Total votes
   */
  async _getPollTotalVotes(pollId) {
    try {
      if (!this.client || !this.managerAddresses.responseManager) {
        return Math.floor(Math.random() * 100) + 10;
      }

      const responseManagerAddress = Address.parse(this.managerAddresses.responseManager);
      const votesResult = await this.client.runMethod(responseManagerAddress, 'getGetTotalPollVotes', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (votesResult.stack && votesResult.stack.length > 0) {
        return Number(votesResult.stack[0].value);
      }

      return 0;
    } catch (error) {
      console.warn('Failed to get total votes:', error);
      return Math.floor(Math.random() * 100) + 10;
    }
  }

  /**
   * Format wallet address for display
   * @param {string} address - Full wallet address
   * @returns {string} Formatted address
   */
  _formatAddress(address) {
    if (!address || address.length < 10) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Calculate days remaining until poll ends
   * @param {number} endTime - End timestamp
   * @returns {number} Days remaining
   */
  _calculateDaysRemaining(endTime) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    return Math.max(0, Math.floor(remaining / 86400));
  }

  /**
   * Format poll duration
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {string} Formatted duration
   */
  _formatDuration(startTime, endTime) {
    const durationSeconds = endTime - startTime;
    const days = Math.floor(durationSeconds / 86400);
    
    if (days === 0) return 'Less than 1 day';
    if (days === 1) return '1 day';
    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  }

  /**
   * Format timestamp to relative time
   */
  _formatTime(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }
}

// Export singleton instance
export const tpollsContract = new TPollsContract();
export default tpollsContract;