import { toNano, Address, Cell, beginCell } from '@ton/core';
import { TonClient } from '@ton/ton';

/**
 * Simplified TPolls Service
 * Handles interactions with the new simplified TON contract
 * Contract only stores: poll creator, poll ID, and vote results
 */
class TPollsContractSimple {
  constructor() {
    // API Configuration
    this.apiBaseUrl = import.meta.env.VITE_TPOLLS_API || 'https://tpolls-api.onrender.com/api';
    
    // TON Configuration
    this.contractAddress = import.meta.env.VITE_SIMPLE_CONTRACT_ADDRESS || 'EQB8vk2NXopO6RIyX6ShDDumyOH2l3y9UQywI2RjYV3BfUOh';
    this.tonConnectUI = null;
    this.client = null;
    
    // Service state
    this.isBackendAvailable = false;
    this.isBlockchainAvailable = false;
    
    console.log(`SimpleTpolls Service initialized:`);
    console.log(`- API: ${this.apiBaseUrl}/simple-blockchain`);
    console.log(`- Contract: ${this.contractAddress}`);
    
    // Test backend availability
    this._testBackendConnection();
  }

  /**
   * Test backend API connection
   */
  async _testBackendConnection() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/../health`);
      if (response.ok) {
        this.isBackendAvailable = true;
        console.log('✅ Backend API available for SimpleTpolls');
        
        // Test simple blockchain status
        await this._testSimpleBlockchainStatus();
      } else {
        this.isBackendAvailable = false;
        console.warn('⚠️ Backend API not available for SimpleTpolls');
      }
    } catch (error) {
      this.isBackendAvailable = false;
      console.warn('⚠️ SimpleTpolls backend connection failed:', error.message);
    }
  }

  /**
   * Test simple blockchain connection
   */
  async _testSimpleBlockchainStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/status`);
      if (response.ok) {
        const data = await response.json();
        this.isBlockchainAvailable = data.success && data.status.deployed;
        console.log('✅ Simple blockchain available:', data.status);
      }
    } catch (error) {
      this.isBlockchainAvailable = false;
      console.warn('⚠️ Simple blockchain connection failed:', error.message);
    }
  }

  /**
   * Initialize the service with TonConnect UI
   */
  async init(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
    
    // Test backend if not already done
    if (!this.isBackendAvailable) {
      await this._testBackendConnection();
    }
    
    // Initialize direct TON client as fallback
    try {
      const network = import.meta.env.VITE_TON_NETWORK || 'testnet';
      const toncenterEndpoint = import.meta.env.VITE_TONCENTER_ENDPOINT ||
        (network === 'testnet'
          ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
          : 'https://toncenter.com/api/v2/jsonRPC');

      this.client = new TonClient({
        endpoint: toncenterEndpoint,
        apiKey: import.meta.env.VITE_TONCENTER_API_KEY
      });
      
      console.log('SimpleTpolls TonClient initialized');
    } catch (error) {
      console.warn('Failed to initialize SimpleTpolls TonClient:', error);
      this.client = null;
    }
  }

  /**
   * Get contract status
   */
  async getContractStatus() {
    // Try backend first if available
    if (this.isBackendAvailable) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/status`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return data.status;
          }
        }
      } catch (error) {
        console.warn('Failed to get contract status from backend:', error);
      }
    }

    // Fallback to direct blockchain check
    if (this.client) {
      try {
        const contractAddress = Address.parse(this.contractAddress);
        const contractState = await this.client.getContractState(contractAddress);
        
        return {
          deployed: contractState.state === 'active',
          active: contractState.state === 'active',
          state: contractState.state,
          address: this.contractAddress,
          balance: contractState.balance ? Number(contractState.balance) / 1000000000 : 0, // Convert from nanotons
          lastTransaction: contractState.lastTransaction
        };
      } catch (error) {
        console.error('Error checking contract state directly:', error);
        return { 
          deployed: false, 
          active: false,
          error: error.message,
          address: this.contractAddress 
        };
      }
    }

    return { deployed: false, error: 'No client available' };
  }

  /**
   * Create a new poll with AI content (simplified blockchain-first approach)
   * @param {Object} pollData - Poll creation data
   * @returns {Promise<Object>} Poll creation result
   */
  async createPoll(pollData) {
    try {
      // Step 1: Generate AI content if prompt provided
      let optionCount = 2;
      let aiData = null;
      
      if (pollData.prompt) {
        console.log('Generating AI poll content...');
        const aiResult = await this.createAIPoll(pollData.prompt);
        aiData = aiResult.poll;
        optionCount = aiData.options ? aiData.options.length : 2;
      } else if (pollData.options) {
        optionCount = pollData.options.length;
      }
      
      // Step 2: Create poll transaction for blockchain
      console.log('Creating poll on blockchain...');
      const pollSubject = aiData?.subject || pollData.title || pollData.subject || 'New Poll';
      const transactionData = await this._createPollTransaction(optionCount, pollData.createdBy, pollSubject);
      
      // Step 3: Send transaction to blockchain
      const result = await this.tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: transactionData.contractAddress,
            amount: transactionData.amount,
            payload: transactionData.payload
          }
        ]
      });
      
      console.log('Poll creation transaction sent:', result);
      
      // Step 4: Wait a bit and verify poll creation
      console.log('Waiting for blockchain confirmation...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const verification = await this.verifyPollCreation(transactionData.nextPollId);
      console.log('Poll creation verification:', verification);
      
      // Step 5: Store metadata in backend only after successful blockchain submission
      if (this.isBackendAvailable && verification.success) {
        try {
          console.log('Blockchain submission verified, storing metadata...');
          
          // Create poll metadata object from pollData
          const pollMetadata = aiData || {
            subject: pollData.title || 'New Poll',
            description: pollData.description || 'No description provided',
            options: pollData.options || Array.from({ length: optionCount }, (_, i) => `Option ${i + 1}`),
            category: pollData.category || 'other',
            originalPrompt: pollData.prompt || 'Manual poll creation'
          };
          
          await this._storePollMetadata(transactionData.nextPollId, result.boc, pollMetadata);
          console.log('Poll metadata stored successfully in backend');
        } catch (metadataError) {
          console.error('Poll created on blockchain but metadata storage failed:', metadataError);
        }
      } else if (!verification.success) {
        console.warn('Blockchain submission not verified, skipping metadata storage');
      }
      
      return {
        success: true,
        pollId: transactionData.nextPollId,
        transactionHash: result.boc,
        aiGenerated: !!aiData,
        verified: verification.success,
        verificationMessage: verification.message,
        pollData: verification.pollData,
        metadataStored: this.isBackendAvailable && verification.success,
        message: verification.success 
          ? `Poll ${transactionData.nextPollId} created and verified on blockchain`
          : `Poll ${transactionData.nextPollId} transaction sent (verification: ${verification.message})`
      };
      
    } catch (error) {
      console.error('Error creating poll:', error);
      throw new Error(`Failed to create poll: ${error.message}`);
    }
  }

  /**
   * Create AI-generated poll content
   */
  async createAIPoll(prompt) {
    if (!this.isBackendAvailable) {
      throw new Error('Backend API not available for AI poll generation');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/poll-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate AI poll' }));
        throw new Error(errorData.message || 'Failed to generate AI poll');
      }

      const data = await response.json();
      return {
        success: true,
        poll: data.data.poll,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating AI poll:', error);
      throw new Error(`Failed to create AI poll: ${error.message}`);
    }
  }

  /**
   * Create poll transaction directly with blockchain
   */
  async _createPollTransaction(optionCount, createdBy, pollSubject = '') {
    if (!this.client) {
      throw new Error('TON client not available for direct blockchain interaction');
    }

    try {
      // Validate option count
      if (optionCount < 2 || optionCount > 10) {
        throw new Error('Poll must have 2-10 options');
      }

      // Check if contract is deployed and active
      try {
        const contractAddress = Address.parse(this.contractAddress);
        const contractState = await this.client.getContractState(contractAddress);
        if (contractState.state !== 'active') {
          console.warn(`Contract state is ${contractState.state}, proceeding with transaction anyway`);
        }
      } catch (stateError) {
        console.warn('Could not check contract state:', stateError.message);
      }

      // Generate poll ID - use timestamp to avoid conflicts since contract may not have getNextPollId method
      let nextPollId;
      
      try {
        // Try to get next poll ID from contract if the method exists
        const contractAddress = Address.parse(this.contractAddress);
        const result = await this.client.runMethod(contractAddress, 'getNextPollId');
        if (result.stack && result.stack.items.length > 0) {
          nextPollId = Number(result.stack.items[0].value);
          console.log('Retrieved next poll ID from contract:', nextPollId);
        } else {
          throw new Error('No poll ID returned from contract');
        }
      } catch (error) {
        // Contract method doesn't exist or failed - use timestamp-based ID
        nextPollId = Math.floor(Date.now() / 1000);
        console.log('Contract getNextPollId method not available, using timestamp-based ID:', nextPollId);
        
        // Try alternative method names that might exist
        try {
          const contractAddress = Address.parse(this.contractAddress);
          const totalPolls = await this.client.runMethod(contractAddress, 'getPollCount');
          if (totalPolls.stack && totalPolls.stack.items.length > 0) {
            nextPollId = Number(totalPolls.stack.items[0].value) + 1;
            console.log('Retrieved next poll ID from getPollCount:', nextPollId);
          }
        } catch (totalError) {
          console.log('getPollCount method also not available, sticking with timestamp ID');
        }
      }

      // Build CreatePoll message payload with subject
      const messageBody = beginCell()
        .storeUint(1060918784, 32) // CreatePoll operation code from ABI
        .storeStringRefTail(pollSubject || '') // Store poll subject as string
        .endCell();

      const payload = messageBody.toBoc().toString('base64');

      return {
        nextPollId,
        contractAddress: this.contractAddress,
        amount: toNano('0.05').toString(), // 0.05 TON for gas
        payload
      };
    } catch (error) {
      console.error('Error creating poll transaction:', error);
      throw new Error(`Failed to create poll transaction: ${error.message}`);
    }
  }

  /**
   * Store poll metadata after blockchain creation
   */
  async _storePollMetadata(pollId, transactionHash, aiData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/store-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchainPollId: pollId,
          transactionHash,
          contractAddress: this.contractAddress,
          aiData,
          pollData: {
            optionCount: aiData.options ? aiData.options.length : 2
          },
          createdBy: this.tonConnectUI.account?.address
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Poll metadata stored successfully:', data);
      return data;
    } catch (error) {
      console.error('Error storing poll metadata:', error);
      throw error;
    }
  }

  /**
   * Vote on a poll
   * @param {number} pollId - Poll ID
   * @param {number} optionIndex - Option index (0-based)
   * @returns {Promise<Object>} Vote result
   */
  async voteOnPoll(pollId, optionIndex) {
    if (!this.tonConnectUI || !this.tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const voterAddress = this.tonConnectUI.account?.address;
      if (!voterAddress) {
        throw new Error('Voter address not available');
      }

      // Create vote transaction via backend
      const voteData = await this._createVoteTransaction(pollId, optionIndex, voterAddress);

      // Send transaction
      const result = await this.tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: voteData.contractAddress,
            amount: voteData.amount,
            payload: voteData.payload
          }
        ]
      });

      console.log('Vote transaction sent:', result);

      // Confirm vote with backend
      if (this.isBackendAvailable) {
        try {
          await this._confirmVote(voteData.voteId, result.boc);
        } catch (confirmError) {
          console.warn('Failed to confirm vote with backend:', confirmError);
        }
      }

      return {
        success: true,
        transactionHash: result.boc,
        voteId: voteData.voteId,
        pollId,
        selectedOption: optionIndex,
        message: 'Vote submitted successfully'
      };
    } catch (error) {
      console.error('Error voting on poll:', error);
      throw new Error(`Failed to vote: ${error.message}`);
    }
  }

  /**
   * Create vote transaction directly with blockchain
   */
  async _createVoteTransaction(pollId, optionIndex, voterAddress) {
    if (!this.client) {
      throw new Error('TON client not available for direct blockchain interaction');
    }

    try {
      // Validate inputs
      if (pollId < 1) {
        throw new Error('Invalid poll ID');
      }

      if (optionIndex < 0) {
        throw new Error('Invalid option index');
      }

      // Build Vote message payload
      const messageBody = beginCell()
        .storeUint(1011836453, 32) // Vote operation code from ABI
        .storeInt(pollId, 257)
        .storeInt(optionIndex, 257)
        .endCell();

      const payload = messageBody.toBoc().toString('base64');

      // Generate a simple vote ID for tracking
      const voteId = `vote_${pollId}_${voterAddress}_${Date.now()}`;

      return {
        voteId,
        contractAddress: this.contractAddress,
        amount: toNano('0.02').toString(), // 0.02 TON for gas
        payload
      };
    } catch (error) {
      console.error('Error creating vote transaction:', error);
      throw new Error(`Failed to create vote transaction: ${error.message}`);
    }
  }

  /**
   * Confirm vote with backend
   */
  async _confirmVote(voteId, txHash) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/votes/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteId, txHash }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Vote confirmed with backend:', data);
        return data;
      }
    } catch (error) {
      console.error('Error confirming vote:', error);
      throw error;
    }
  }

  /**
   * Get a specific poll
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll data
   */
  async getPoll(pollId) {
    if (this.isBackendAvailable) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/${pollId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return this._transformPollData(data.poll);
          }
        }
      } catch (error) {
        console.warn('Failed to get poll from backend:', error);
      }
    }

    throw new Error('Poll data not available');
  }

  /**
   * Get all active polls
   * @returns {Promise<Array>} Array of active polls
   */
  async getActivePolls() {
    if (!this.client) {
      // Initialize TON client if not already done
      try {
        const network = import.meta.env.VITE_TON_NETWORK || 'testnet';
        const toncenterEndpoint = import.meta.env.VITE_TONCENTER_ENDPOINT ||
          (network === 'testnet'
            ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
            : 'https://toncenter.com/api/v2/jsonRPC');

        this.client = new TonClient({
          endpoint: toncenterEndpoint,
          apiKey: import.meta.env.VITE_TONCENTER_API_KEY
        });
        
        console.log('TON client initialized for getActivePolls');
      } catch (error) {
        console.error('Failed to initialize TON client:', error);
        throw new Error('TON client not available for direct blockchain interaction');
      }
    }

    try {
      debugger
      const contractAddress = Address.parse(this.contractAddress);
      
      // Get total number of polls first
      let totalPolls = 0;
      try {
        const result = await this.client.runMethod(contractAddress, 'getPollCount');
        if (result.stack && result.stack.items.length > 0) {
          totalPolls = Number(result.stack.items[0].value);
        }
      } catch (error) {
        console.warn('Could not get total polls count, trying alternative approach:', error);
        // If getPollCount doesn't exist, try to get contract stats
        try {
          const statsResult = await this.client.runMethod(contractAddress, 'getContractStats');
          if (statsResult.stack && statsResult.stack.items.length > 0) {
            totalPolls = Number(statsResult.stack.items[0].value);
          }
        } catch (statsError) {
          console.warn('Could not get contract stats either, using fallback approach');
          // Fallback: try to get polls starting from ID 1 until we fail
          totalPolls = 100; // reasonable upper limit for scanning
        }
      }

      const activePolls = [];
      
      // Iterate through poll IDs to find active polls
      for (let pollId = 1; pollId <= totalPolls; pollId++) {
        try {
          const pollResult = await this.client.runMethod(contractAddress, 'getPoll', [
            { type: 'int', value: BigInt(pollId) }
          ]);
          
          if (pollResult.stack && pollResult.stack.items.length > 0) {
            const pollData = this._parsePollFromStack(pollResult.stack);
            
            if (pollData) {
              // Create a transformed poll object
              const transformedPoll = {
                id: pollData.pollId,
                title: pollData.subject || `Poll ${pollData.pollId}`,
                description: 'Direct contract poll',
                options: Array.from({ length: pollData.optionCount }, (_, i) => `Option ${i + 1}`),
                category: 'general',
                author: this._formatAddress(pollData.creator),
                totalVotes: pollData.totalVotes,
                totalResponses: pollData.totalVotes,
                isActive: pollData.isActive,
                createdAt: 'Unknown',
                type: 'simple-blockchain',
                optionCount: pollData.optionCount,
                hasAiData: false,
                subject: pollData.subject,
                // Compatibility fields for UI
                totalRewardFund: '0 TON',
                daysRemaining: 0,
                gaslessEnabled: false,
                rewardPerVote: '0'
              };
              
              activePolls.push(transformedPoll);
            }
          }
        } catch (pollError) {
          // Poll doesn't exist or error accessing it, continue to next
          console.log(`Poll ${pollId} not accessible:`, pollError.message);
          continue;
        }
      }

      console.log(`Found ${activePolls.length} active polls via direct contract call`);
      return activePolls;
      
    } catch (error) {
      console.error('Error getting active polls from contract:', error);
      throw new Error(`Failed to get active polls: ${error.message}`);
    }
  }

  /**
   * Get poll results
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll results
   */
  async getPollResults(pollId) {
    if (this.isBackendAvailable) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/${pollId}/results`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return data;
          }
        }
      } catch (error) {
        console.warn('Failed to get poll results from backend:', error);
      }
    }

    throw new Error('Poll results not available');
  }

  /**
   * Transform poll data to frontend format
   */
  _transformPollData(poll) {
    return {
      id: poll.id,
      title: poll.title || `Poll ${poll.id}`,
      description: poll.description || 'No description available',
      options: poll.options || Array.from({ length: poll.optionCount }, (_, i) => `Option ${i + 1}`),
      category: poll.category || 'general',
      author: this._formatAddress(poll.creator),
      totalVotes: poll.totalVotes || 0,
      totalResponses: poll.totalVotes || 0,
      isActive: poll.isActive,
      createdAt: poll.startTime ? new Date(poll.startTime).toLocaleDateString() : 'Unknown',
      type: 'simple-blockchain',
      optionCount: poll.optionCount,
      hasAiData: poll.hasAiData || false,
      // Compatibility fields for UI
      totalRewardFund: '0 TON',
      daysRemaining: 0,
      gaslessEnabled: false,
      rewardPerVote: '0'
    };
  }

  /**
   * Format wallet address for display
   */
  _formatAddress(address) {
    if (!address || address.length < 10) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Calculate total votes from results map
   */
  _calculateTotalVotes(results) {
    if (!results || typeof results !== 'object') return 0;
    
    let totalVotes = 0;
    for (const votes of Object.values(results)) {
      if (typeof votes === 'number') {
        totalVotes += votes;
      }
    }
    return totalVotes;
  }

  /**
   * Get contract statistics
   */
  async getContractStats() {
    if (this.isBackendAvailable) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return data.stats;
          }
        }
      } catch (error) {
        console.warn('Failed to get contract stats:', error);
      }
    }

    return {
      totalPolls: 0,
      activePolls: 0,
      nextPollId: 1,
      contractAddress: this.contractAddress
    };
  }

  /**
   * Check if a transaction was successful by hash
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction status
   */
  async checkTransactionStatus(txHash) {
    if (!this.client) {
      throw new Error('TON client not available');
    }

    try {
      // Get transaction info using the transaction hash
      const transactions = await this.client.getTransactions(Address.parse(this.contractAddress), {
        limit: 100
      });

      // Find the transaction by hash
      const transaction = transactions.find(tx => tx.hash().toString('hex') === txHash);
      
      if (!transaction) {
        return {
          found: false,
          message: 'Transaction not found'
        };
      }

      return {
        found: true,
        success: !transaction.description.aborted,
        exitCode: transaction.description.computePhase?.exitCode || 0,
        gasUsed: transaction.description.computePhase?.gasUsed || 0,
        message: transaction.description.aborted ? 'Transaction failed' : 'Transaction successful'
      };
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return {
        found: false,
        error: error.message
      };
    }
  }

  /**
   * Verify poll creation by checking if poll ID exists
   * @param {number} pollId - Poll ID to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyPollCreation(pollId) {
    if (!this.client) {
      throw new Error('TON client not available');
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      const result = await this.client.runMethod(contractAddress, 'getPoll', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      if (result.stack && result.stack.items.length > 0) {
        // Parse the poll data from the result
        const pollExists = result.stack.items[0].type !== 'null';
        
        if (pollExists) {
          return {
            success: true,
            pollId,
            message: `Poll ${pollId} successfully created on blockchain`,
            pollData: this._parsePollFromStack(result.stack)
          };
        } else {
          return {
            success: false,
            pollId,
            message: `Poll ${pollId} not found on blockchain`
          };
        }
      } else {
        return {
          success: false,
          pollId,
          message: 'No data returned from contract'
        };
      }
    } catch (error) {
      console.error('Error verifying poll creation:', error);
      return {
        success: false,
        pollId,
        error: error.message
      };
    }
  }

  /**
   * Parse poll data from TVM stack (helper method)
   * @private
   */
  _parsePollFromStack(stack) {
    try {
      if (!stack.items || stack.items.length === 0) {
        return null;
      }

      const item = stack.items[0];
      
      if (item.type === 'tuple' && item.items) {
        // Parse according to the generated loadGetterTuplePoll function:
        // pollId: BigNumber, creator: Address, subject: String, results: Cell (Dictionary)
        const pollId = item.items[0]?.value ? Number(item.items[0].value) : 0;
        
        // Parse creator address from cell
        debugger
        let creator = null;
        try {
          const creatorSlice = item.items[1].beginParse();
          const creatorAddress = creatorSlice.loadAddress();
          creator = creatorAddress.toString();
        } catch (e) {
          console.warn('Failed to parse creator address:', e);
        }
        console.log('creator', creator)
        
        // Parse subject string from cell
        let subject = 'No subject';
        try {
          const subjectSlice = item.items[2].beginParse();
          subject = subjectSlice.loadStringTail();
        } catch (e) {
          console.warn('Failed to parse subject string:', e);
        }
        console.log('subject', subject)
        
        // Parse results dictionary from cell (simplified for now)
        const results = {};
        if (item.items[3]?.type === 'cell' && item.items[3].cell) {
          try {
            // Dictionary parsing would go here
            // For now, we'll leave it empty as Dictionary parsing is complex
          } catch (e) {
            console.warn('Failed to parse results dictionary:', e);
          }
        }
        
        return {
          pollId,
          creator,
          subject,
          results,
          // Calculate derived fields
          totalVotes: this._calculateTotalVotes(results),
          isActive: true // All polls are active by default in this simple contract
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing poll from stack:', error);
      return null;
    }
  }
}

// Export singleton instance
const tpollsContractSimple = new TPollsContractSimple();
export default tpollsContractSimple;