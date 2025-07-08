import { toNano } from '@ton/core';
import gaslessVotingService from './gaslessVoting';

/**
 * TPolls Smart Contract Service
 * Handles all interactions with the TPollsDapp smart contract
 */
class TPollsContract {
  constructor() {
    this.contractAddress = process.env.REACT_APP_TPOLLS_CONTRACT_ADDRESS || 'EQDzYUsVz1PZ4mCOFHYdchV0J0Xs0Qz9DEx7nEMqGJ_OsZ30';
    this.tonConnectUI = null;
    
    // Log which contract address is being used
    const usingDefault = !process.env.REACT_APP_TPOLLS_CONTRACT_ADDRESS;
    console.log(`TPollsContract initialized with address: ${this.contractAddress}${usingDefault ? ' (default)' : ' (from env)'}`);
  }

  /**
   * Initialize the service with TonConnect UI instance
   */
  init(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
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
      
      return {
        id: pollId,
        creator: 'EQDxxx...', // Would come from contract
        title: `Poll ${pollId}`, // Would come from contract
        description: `Description for poll ${pollId}`, // Would come from contract
        options: pollOptions || ['Option 1', 'Option 2', 'Option 3'],
        optionCount: pollOptions?.length || 3,
        startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        endTime: Math.floor(Date.now() / 1000) + 82800, // 23 hours from now
        isActive: true,
        totalVotes: 42,
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
      // Mock implementation - in real app, this would query the contract
      const polls = [];
      
      // Simulate getting polls from contract
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
    } catch (error) {
      console.error('Error getting active polls:', error);
      throw new Error(`Failed to get polls: ${error.message}`);
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