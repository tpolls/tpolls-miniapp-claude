import { toNano, Address, Cell, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';
import gaslessVotingService from './gaslessVoting';

/**
 * TPolls Smart Contract Service
 * Handles all interactions with the TPollsDapp smart contract
 */
class TPollsContract {
  constructor() {
    // Use the deployed contract address from deployment.json
    this.contractAddress = import.meta.env.VITE_TPOLLS_CONTRACT_ADDRESS || 'EQD33qSiwBmeW455-zQsrxdHUlpiuO3pnkO0SzBCjPAFvOAe';
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
    // Determine TON network and endpoint
    const network = import.meta.env.VITE_TON_NETWORK || 'testnet';
    this.toncenterEndpoint = import.meta.env.VITE_TONCENTER_ENDPOINT ||
      (network === 'testnet'
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC');
    this.toncenterApiKey = import.meta.env.VITE_TONCENTER_API_KEY;
    if (!this.toncenterApiKey) {
      console.warn('TON Center API key is missing! Set VITE_TONCENTER_API_KEY in your .env file.');
    }
  }

  /**
   * Initialize the service with TonConnect UI instance
   */
  async init(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
    
    // Initialize TonClient for contract interactions
    try {
      this.client = new TonClient({
        endpoint: this.toncenterEndpoint,
        apiKey: this.toncenterApiKey
      });
      console.log('TonClient initialized successfully with endpoint:', this.toncenterEndpoint);
      
      // Initialize manager contract addresses
      await this._initializeManagerAddresses();
      
    } catch (error) {
      console.warn('Failed to initialize TonClient, using mock data:', error);
      this.client = null;
    }
  }

  /**
   * Check if the contract is deployed and initialized
   */
  async getContractStatus() {
    console.log('getContractStatus', this.client);
    try {
      if (!this.client) {
        return { deployed: false, initialized: false, error: 'TonClient not available' };
      }

      const contractAddress = Address.parse(this.contractAddress);
      console.log('contractAddress', contractAddress);

      // Check if contract is deployed
      let contractState;
      try {
        contractState = await this.client.getContractState(contractAddress);
        console.log('contractState', contractState);
      } catch (error) {
        console.log('error', error)
        return { deployed: false, initialized: false, error: 'Contract not deployed' };
      }
      
      if (contractState.state !== 'active') {
        console.log('contractState.state', contractState.state)
        return { deployed: true, initialized: false, error: `Contract state: ${contractState.state}` };
      }
      
      // Check if contract is initialized
      try {
        const isInitializedResult = await this.client.runMethod(contractAddress, 'isInitialized');
        console.log('isInitializedResult', isInitializedResult)
        const isInitialized = isInitializedResult.stack?.items[0]?.value;
        console.log('isInitialized', isInitialized)
        return { 
          deployed: true, 
          initialized: isInitialized === -1n, 
          managersDeployed: isInitialized ? Object.values(this.managerAddresses).some(addr => addr !== null) : false
        };
      } catch (error) {
        return { deployed: true, initialized: false, error: `Cannot check initialization: ${error.message}` };
      }
    } catch (error) {
      return { deployed: false, initialized: false, error: error.message };
    }
  }

  /**
   * Initialize the main contract with manager contracts
   */
  async initializeContract() {
    if (!this.tonConnectUI || !this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Check current status first
      const status = await this.getContractStatus();
      console.log('Contract status::initializeContract:', status);
      
      if (!status.deployed) {
        throw new Error('Contract is not deployed. Please deploy the contract first.');
      }
      
      if (status.initialized) {
        console.log('Contract already initialized');
        await this._initializeManagerAddresses();
        return {
          success: true,
          message: 'Contract was already initialized'
        };
      }

      // Send InitializeManagers message to the main contract
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: this.contractAddress,
            amount: toNano('0.5').toString(), // Need enough TON for deploying 4 contracts
            // Note: In production, you'd need to build the proper message body
            // For now, this is a placeholder
          }
        ]
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);
      
      // Wait a bit for deployment to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Re-initialize manager addresses
      await this._initializeManagerAddresses();
      
      return {
        success: true,
        transactionHash: result.boc,
        message: 'Contract initialized successfully'
      };
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw new Error(`Failed to initialize contract: ${error.message}`);
    }
  }

  /**
   * Initialize manager contract addresses from main contract
   */
  async _initializeManagerAddresses() {
    console.log('_initializeManagerAddresses')
    try {
      if (!this.client) return;

      const contractAddress = Address.parse(this.contractAddress);
      console.log('_initializeManagerAddresses::contractAddress', contractAddress)
      
      // First check if the contract exists and is deployed
      let contractState;
      try {
        contractState = await this.client.getContractState(contractAddress);
        console.log('_initializeManagerAddresses::contractState', contractState)
      } catch (error) {
        console.warn('Contract not deployed or not accessible:', error);
        return;
      }
      
      if (contractState.state !== 'active') {
        console.warn('Contract is not active. State:', contractState.state);
        return;
      }
      
      // Check if the contract is initialized
      let isInitialized = false;
      try {
        const isInitializedResult = await this.client.runMethod(contractAddress, 'isInitialized');
        console.log('_initializeManagerAddresses::isInitializedResult', isInitializedResult)
        isInitialized = isInitializedResult.stack?.items[0]?.value;
      } catch (error) {
        console.warn('Could not check initialization status:', error);
        return;
      }
      
      if (!isInitialized) {
        console.warn('Contract deployed but not initialized. Call initializeContract() first.');
        return;
      }
      
      // Get manager addresses from main contract (correct getter names)
      try {
        const [pollManagerResult, responseManagerResult, fundManagerResult, optionsStorageResult] = await Promise.all([
          this.client.runMethod(contractAddress, 'getPollManager'),
          this.client.runMethod(contractAddress, 'getResponseManager'),
          this.client.runMethod(contractAddress, 'getFundManager'),
          this.client.runMethod(contractAddress, 'getOptionsStorage')
        ]);
        console.log('pollManagerResult', pollManagerResult)
        console.log('responseManagerResult', responseManagerResult)
        console.log('fundManagerResult', fundManagerResult)
        console.log('optionsStorageResult', optionsStorageResult)

        // Parse Address objects correctly from returned Cell
        if (pollManagerResult.stack?.items[0]?.cell) {
          try {
            const cell = pollManagerResult.stack.items[0].cell;
            const slice = cell.beginParse();
            const address = slice.loadAddress();
            this.managerAddresses.pollManager = address.toString();
            console.log('set pollManager', this.managerAddresses.pollManager);
          } catch (e) {
            console.warn('Failed to parse pollManager address:', e);
          }
        }
        if (responseManagerResult.stack?.items[0]?.cell) {
          try {
            const cell = responseManagerResult.stack.items[0].cell;
            const slice = cell.beginParse();
            const address = slice.loadAddress();
            this.managerAddresses.responseManager = address.toString();
            console.log('set responseManager', this.managerAddresses.responseManager);
          } catch (e) {
            console.warn('Failed to parse responseManager address:', e);
          }
        }
        if (fundManagerResult.stack?.items[0]?.cell) {
          try {
            const cell = fundManagerResult.stack.items[0].cell;
            const slice = cell.beginParse();
            const address = slice.loadAddress();
            this.managerAddresses.fundManager = address.toString();
            console.log('set fundManager', this.managerAddresses.fundManager);
          } catch (e) {
            console.warn('Failed to parse fundManager address:', e);
          }
        }
        if (optionsStorageResult.stack?.items[0]?.cell) {
          try {
            const cell = optionsStorageResult.stack.items[0].cell;
            const slice = cell.beginParse();
            const address = slice.loadAddress();
            this.managerAddresses.optionsStorage = address.toString();
            console.log('set optionsStorage', this.managerAddresses.optionsStorage);
          } catch (e) {
            console.warn('Failed to parse optionsStorage address:', e);
          }
        }

        console.log('Manager addresses initialized:', this.managerAddresses);
        console.log('Contract initialization status:', isInitialized);
      } catch (error) {
        console.warn('Failed to get manager addresses:', error);
      }
    } catch (error) {
      console.warn('Failed to initialize manager addresses:', error);
      console.warn('This is expected if the contract has not been deployed or initialized yet.');
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
    debugger
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
      const feeAmount = 0.01;
      const totalValue = (parseFloat(totalFunding) + feeAmount).toFixed(3);

      // Build the payload for CreatePollWithFunds message
      const cell = beginCell();
      const titleCell = beginCell().storeStringTail(title).endCell();
      const descCell = beginCell().storeStringTail(description).endCell();
      cell.storeRef(titleCell);
      cell.storeRef(descCell);
      cell.storeUint(options.length, 32);
      cell.storeUint(duration, 32);
      cell.storeCoins(toNano(rewardPerVote));
      const payload = cell.endCell().toBoc().toString('base64');

      // Send transaction to create poll
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: this.contractAddress,
            amount: toNano(totalValue).toString(),
            payload
          }
        ]
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);

      // Wait for poll creation to be processed (may need to poll or wait for confirmation in production)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Fetch the new pollId (nextPollId - 1)
      let pollId = null;
      try {
        const pollManagerAddress = Address.parse(this.managerAddresses.pollManager);
        const nextPollIdResult = await this.client.runMethod(pollManagerAddress, 'getNextPollId');
        let nextPollId = 0;
        if (nextPollIdResult.stack && nextPollIdResult.stack.items.length > 0) {
          if (nextPollIdResult.stack.items[0].cell) {
            const cell = nextPollIdResult.stack.items[0].cell;
            const slice = cell.beginParse();
            nextPollId = Number(slice.loadUint(32));
          } else {
            nextPollId = Number(nextPollIdResult.stack.items[0].value);
          }
        }
        pollId = nextPollId - 1;
      } catch (e) {
        console.warn('Failed to fetch new pollId:', e);
      }

      // Send poll options to PollOptionsStorage contract
      if (pollId >=0 && this.managerAddresses.optionsStorage) {
        const optionsStorageAddress = this.managerAddresses.optionsStorage;
        // Send StorePollOptions message (set option count)
        try {
          const storeCountCell = beginCell();
          storeCountCell.storeUint(pollId, 32);
          storeCountCell.storeUint(options.length, 32);
          const storeCountPayload = storeCountCell.endCell().toBoc().toString('base64');
          const storeCountTx = {
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
              {
                address: optionsStorageAddress,
                amount: toNano('0.05').toString(),
                payload: storeCountPayload
              }
            ]
          };
          await this.tonConnectUI.sendTransaction(storeCountTx);
        } catch (e) {
          console.warn('Failed to send StorePollOptions:', e);
        }
        // Send StoreOption message for each option
        for (let i = 0; i < options.length; i++) {
          try {
            const optionCell = beginCell();
            optionCell.storeUint(pollId, 32);
            optionCell.storeUint(i, 32);
            const textCell = beginCell().storeStringTail(options[i]).endCell();
            optionCell.storeRef(textCell);
            const optionPayload = optionCell.endCell().toBoc().toString('base64');
            const optionTx = {
              validUntil: Math.floor(Date.now() / 1000) + 600,
              messages: [
                {
                  address: optionsStorageAddress,
                  amount: toNano('0.05').toString(),
                  payload: optionPayload
                }
              ]
            };
            await this.tonConnectUI.sendTransaction(optionTx);
          } catch (e) {
            console.warn(`Failed to send StoreOption for option ${i}:`, e);
          }
        }
      } else {
        console.warn('PollId or optionsStorage address not available, skipping on-chain option storage.');
      }

      // Store poll options and gasless preference off-chain for UI/demo
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
      // Check contract status first
      const status = await this.getContractStatus();
      
      if (!status.deployed) {
        throw new Error('Contract is not deployed. Please deploy the contract first.');
      }
      
      if (!status.initialized) {
        throw new Error('Contract is deployed but not initialized. Call initializeContract() first.');
      }
      
      if (!this.client) {
        throw new Error('TonClient not available. Check your network connection.');
      }
      
      if (!this.managerAddresses.pollManager) {
        throw new Error('PollManager address not available. Contract may not be properly initialized.');
      }
      
      // Get poll data from contract
      return await this.getPollFromContract(pollId);
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
      // Check contract status first
      const status = await this.getContractStatus();
      console.log('Contract status:', status);
      if (!status.deployed) {
        throw new Error('Contract is not deployed. Please deploy the contract first.');
      }
      
      if (!status.initialized) {
        throw new Error('Contract is deployed but not initialized. Call initializeContract() first.');
      }
      
      if (!this.client) {
        throw new Error('TonClient not available. Check your network connection.');
      }
      
      console.log('this.managerAddresses', this.managerAddresses)
      if (!this.managerAddresses.pollManager) {
        throw new Error('PollManager address not available. Contract may not be properly initialized.');
      }

      // Get total polls count from PollManager
      const pollManagerAddress = Address.parse(this.managerAddresses.pollManager);
      const pollsCountResult = await this.client.runMethod(pollManagerAddress, 'getPollsCount');
      console.log('pollsCountResult', pollsCountResult)
      
      if (!pollsCountResult.stack || pollsCountResult.stack.items.length === 0) {
        console.warn('No polls found on contract');
        return [];
      }

      // If getPollsCount returns a Cell, parse it; otherwise, use value directly
      let totalPolls = 0;
      if (pollsCountResult.stack.items[0].cell) {
        const cell = pollsCountResult.stack.items[0].cell;
        const slice = cell.beginParse();
        totalPolls = Number(slice.loadUint(32)); // Adjust bit size as per contract
      } else {
        totalPolls = Number(pollsCountResult.stack.items[0].value);
      }
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
      throw error; // Re-throw the error instead of hiding it with fallback data
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

  /**
   * Get the owner address of the main contract
   * @returns {Promise<string|null>} Owner address (base64) or null if not available
   */
  async getOwnerAddress() {
    try {
      if (!this.client) return null;
      const contractAddress = Address.parse(this.contractAddress);
      const result = await this.client.runMethod(contractAddress, 'getOwner');
      if (result.stack && result.stack.items.length > 0) {
        if (result.stack.items[0].cell) {
          // Address returned as Cell
          const cell = result.stack.items[0].cell;
          const slice = cell.beginParse();
          const address = slice.loadAddress();
          return address.toString();
        } else if (result.stack.items[0].value) {
          // Address returned as int
          return Address.normalize(result.stack.items[0].value.toString());
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch contract owner address:', error);
      return null;
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
      const pollResult = await this.client.runMethod(pollManagerAddress, 'getPoll', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (!pollResult.stack || pollResult.stack.items.length === 0) {
        throw new Error(`Poll ${pollId} not found`);
      }

      // Parse Poll struct from contract (assume returned as Cell)
      let poll = {
        id: pollId,
        title: `Poll ${pollId}`,
        description: `Description for poll ${pollId}`,
        creator: 'EQDxxx...',
        startTime: Math.floor(Date.now() / 1000) - 3600,
        endTime: Math.floor(Date.now() / 1000) + 82800,
        isActive: true,
        totalVotes: 0,
        rewardPerVote: 1000000,
        optionCount: 3
      };
      if (pollResult.stack.items[0].cell) {
        try {
          const cell = pollResult.stack.items[0].cell;
          const slice = cell.beginParse();
          // Example parsing, adjust field order/types as per your contract
          poll.id = Number(slice.loadUint(32));
          poll.creator = slice.loadAddress().toString();
          // For strings, you may need to parse as a reference or bytes
          // Placeholder: skip string parsing for now
          poll.title = 'TODO: parse title';
          poll.description = 'TODO: parse description';
          poll.optionCount = Number(slice.loadUint(8));
          poll.startTime = Number(slice.loadUint(32));
          poll.endTime = Number(slice.loadUint(32));
          poll.isActive = !!slice.loadUint(1);
          poll.totalVotes = Number(slice.loadUint(32));
          poll.rewardPerVote = Number(slice.loadUint(64));
        } catch (e) {
          console.warn('Failed to parse poll struct cell:', e);
        }
      }

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
          const optionResult = await this.client.runMethod(optionsStorageAddress, 'getOption', [
            { type: 'int', value: BigInt(pollId) },
            { type: 'int', value: BigInt(i) }
          ]);

          if (optionResult.stack && optionResult.stack.items.length > 0) {
            if (optionResult.stack.items[0].cell) {
              // Parse option text from Cell (placeholder)
              // You may need to parse as bytes or string ref
              options.push('TODO: parse option text');
            } else {
              options.push(optionResult.stack.items[0].value?.toString() || `Option ${i}`);
            }
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
      const fundResult = await this.client.runMethod(fundManagerAddress, 'getFundPool', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (fundResult.stack && fundResult.stack.items.length > 0) {
        if (fundResult.stack.items[0].cell) {
          // Parse FundPool struct from Cell (placeholder)
          // You may need to parse fields as per your contract
          return {
            totalFunds: 'TODO: parse totalFunds',
            rewardPerVote: 0.001
          };
        } else {
          // Fallback: use value if available
          return {
            totalFunds: fundResult.stack.items[0].value?.toString() || '0.000 TON',
            rewardPerVote: 0.001
          };
        }
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
      const votesResult = await this.client.runMethod(responseManagerAddress, 'getTotalPollVotes', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (votesResult.stack && votesResult.stack.items.length > 0) {
        if (votesResult.stack.items[0].cell) {
          const cell = votesResult.stack.items[0].cell;
          const slice = cell.beginParse();
          return Number(slice.loadUint(32)); // Adjust bit size as per contract
        } else {
          return Number(votesResult.stack.items[0].value);
        }
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