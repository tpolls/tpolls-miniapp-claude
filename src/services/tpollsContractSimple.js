import { toNano, Address, Cell, beginCell, Dictionary } from '@ton/core';
import { TonClient } from '@ton/ton';

/**
 * Simplified TPolls Service
 * Handles ONLY blockchain interactions with the TON contract
 * Pure blockchain service - no backend API calls
 */
class TPollsContractSimple {
  constructor() {
    // TON Configuration - Blockchain only
    this.contractAddress = import.meta.env.VITE_SIMPLE_CONTRACT_ADDRESS || 'EQAcDlO2BaUEtKW0Va2YJShs1pzlgHqz8SG1N9OUnGaL46vN';
    this.tonConnectUI = null;
    this.client = null;
  }


  /**
   * Initialize the service with TonConnect UI
   */
  async init(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
    
    // Initialize TON client for direct blockchain interaction
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
      
      console.log('TON client initialized for blockchain interactions');
    } catch (error) {
      console.error('Failed to initialize TON client:', error);
      this.client = null;
    }
  }

  /**
   * Get contract status from blockchain
   */
  async getContractStatus() {
    if (!this.client) {
      return { deployed: false, error: 'TON client not initialized' };
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      const contractState = await this.client.getContractState(contractAddress);
      
      return {
        deployed: contractState.state === 'active',
        active: contractState.state === 'active',
        state: contractState.state,
        address: this.contractAddress,
        balance: contractState.balance ? Number(contractState.balance) / 1000000000 : 0,
        lastTransaction: contractState.lastTransaction
      };
    } catch (error) {
      console.error('Error checking contract state:', error);
      return { 
        deployed: false, 
        active: false,
        error: error.message,
        address: this.contractAddress 
      };
    }
  }

  /**
   * Create a new poll on blockchain
   * @param {Object} pollData - Poll creation data
   * @returns {Promise<Object>} Poll creation result
   */
  async createPoll(pollData) {
    try {
      // Validate required data
      if (!pollData.options || !Array.isArray(pollData.options) || pollData.options.length < 2) {
        throw new Error('Poll must have at least 2 options');
      }
      
      // Create poll transaction for blockchain
      const pollSubject = pollData.subject || pollData.title || 'New Poll';
      const pollOptions = pollData.options;
      const transactionData = await this._createPollTransaction(pollOptions, pollData.createdBy, pollSubject);
      
      // Send transaction to blockchain
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
      
      // Wait and verify poll creation
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const verification = await this.verifyPollCreation(transactionData.nextPollId);
      
      return {
        success: true,
        pollId: transactionData.nextPollId,
        transactionHash: result.boc,
        aiGenerated: false,
        verified: verification.success,
        verificationMessage: verification.message,
        pollData: verification.pollData,
        metadataStored: false,
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
   * Create poll transaction directly with blockchain
   */
  async _createPollTransaction(pollOptions, createdBy, pollSubject = '') {
    if (!this.client) {
      throw new Error('TON client not available for direct blockchain interaction');
    }

    try {
      // Validate poll options
      if (!Array.isArray(pollOptions) || pollOptions.length < 2 || pollOptions.length > 10) {
        throw new Error('Poll must have 2-10 options');
      }
      
      // Validate that all options have content
      const validOptions = pollOptions.filter(opt => opt && opt.trim().length > 0);
      if (validOptions.length < 2) {
        throw new Error('Poll must have at least 2 non-empty options');
      }

      // Check if contract is deployed and active
      try {
        const contractAddress = Address.parse(this.contractAddress);
        const contractState = await this.client.getContractState(contractAddress);
        if (contractState.state !== 'active') {
          // Contract state not active, proceeding anyway
        }
      } catch (stateError) {
        // Could not check contract state
      }

      // Generate poll ID - use timestamp to avoid conflicts since contract may not have getNextPollId method
      let nextPollId;
      
      try {
        // Try to get next poll ID from contract if the method exists
        const contractAddress = Address.parse(this.contractAddress);
        const result = await this.client.runMethod(contractAddress, 'getNextPollId');
        if (result.stack && result.stack.items.length > 0) {
          nextPollId = Number(result.stack.items[0].value);
          // Retrieved next poll ID from contract
        } else {
          throw new Error('No poll ID returned from contract');
        }
      } catch (error) {
        // Contract method doesn't exist or failed - use timestamp-based ID
        nextPollId = Math.floor(Date.now() / 1000);
        // Contract getNextPollId method not available, using timestamp-based ID
        
        // Try alternative method names that might exist
        try {
          const contractAddress = Address.parse(this.contractAddress);
          const totalPolls = await this.client.runMethod(contractAddress, 'getPollCount');
          if (totalPolls.stack && totalPolls.stack.items.length > 0) {
            nextPollId = Number(totalPolls.stack.items[0].value) + 1;
            // Retrieved next poll ID from getPollCount
          }
        } catch (totalError) {
          // getPollCount method also not available, sticking with timestamp ID
        }
      }

      // Create options dictionary with Cell values (matching updated contract)
      const optionsDict = Dictionary.empty(Dictionary.Keys.Int(257), Dictionary.Values.Cell());
      validOptions.forEach((option, index) => {
        const optionCell = beginCell().storeStringTail(option.trim()).endCell();
        optionsDict.set(index, optionCell);
      });
      
      // Build CreatePoll message payload with subject and options
      const messageBody = beginCell()
        .storeUint(1052480048, 32) // CreatePoll operation code for deployed contract
        .storeStringRefTail(pollSubject || '') // Store poll subject as string
        .storeDict(optionsDict) // Store options dictionary
        .storeUint(0, 257) // Reward per vote (0 for no rewards)
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

      // Vote transaction sent

      // Blockchain-only service - no vote confirmation with backend

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
        .storeUint(pollId, 257) // Changed from storeInt to storeUint for consistency
        .storeUint(optionIndex, 257) // Changed from storeInt to storeUint for consistency
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
   * Get a specific poll from smart contract
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll data
   */
  async getPoll(pollId) {
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
        
        // TON client initialized for getPoll
      } catch (error) {
        console.error('Failed to initialize TON client:', error);
        throw new Error('TON client not available for direct blockchain interaction');
      }
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      
      // First, try to get options directly using the poll ID (same approach as getActivePolls)
      let pollOptions = [];
      let pollSubject = `Poll ${pollId}`;
      let pollCreator = 'Unknown';
      
      // Attempting to fetch options directly
      try {
        const optionsResult = await this.client.runMethod(contractAddress, 'getPollOptions', [
          { type: 'int', value: BigInt(pollId) }
        ]);
        
        // Handle both exit_code formats (0 or undefined for success)
        const isSuccess = (optionsResult.exit_code === 0 || optionsResult.exit_code === undefined) && 
                         optionsResult.stack && optionsResult.stack.remaining > 0;
        
        if (isSuccess) {
          const optionsCell = optionsResult.stack.readCellOpt();
          if (optionsCell) {
            const optionsDict = Dictionary.loadDirect(
              Dictionary.Keys.BigInt(257), 
              Dictionary.Values.Cell(), 
              optionsCell
            );
            
            pollOptions = [];
            for (let i = 0; i < optionsDict.size; i++) {
              const optionCell = optionsDict.get(BigInt(i));
              if (optionCell) {
                const optionText = optionCell.beginParse().loadStringTail();
                pollOptions.push(optionText);
              }
            }
            // Retrieved options successfully
          }
        }
      } catch (optionsError) {
        // This poll might not exist or have no options
        throw new Error(`Poll ${pollId} not found or has no options`);
      }
      
      // Only proceed if we got options (meaning the poll exists)
      if (pollOptions.length === 0) {
        throw new Error(`Poll ${pollId} not found`);
      }
      
      // Now try to get additional poll info (subject, creator)
      try {
        const pollResult = await this.client.runMethod(contractAddress, 'getPoll', [
          { type: 'int', value: BigInt(pollId) }
        ]);
        
        if (pollResult.stack && pollResult.stack.remaining > 0) {
          try {
            const pollTuple = pollResult.stack.readTupleOpt();
            if (pollTuple) {
              const parsedPollId = Number(pollTuple.items[0]);
              const creator = pollTuple.items[1];
              // Parse subject (position 2 in the tuple) using direct access
              let subject = 'No subject';
              try {
                if (pollTuple.items[2]?.type === 'cell') {
                  const subjectSlice = pollTuple.items[2].cell.beginParse();
                  subject = subjectSlice.loadStringTail();
                } else {
                  const subjectSlice = pollTuple.items[2].beginParse();
                  subject = subjectSlice.loadStringTail();
                }
              } catch (e) {
                // Failed to parse subject from getPoll
              }
              
              pollSubject = subject || `Poll ${pollId}`;
              pollCreator = creator.toString();
            }
          } catch (parseError) {
            // Could not parse poll details, using defaults
          }
        }
      } catch (pollError) {
        // Could not get poll details, using defaults
      }
      
      // Get vote counts from contract
      let totalVotes = 0;
      try {
        const totalVotersResult = await this.client.runMethod(contractAddress, 'getPollTotalVoters', [
          { type: 'int', value: BigInt(pollId) }
        ]);
        if (totalVotersResult.stack && totalVotersResult.stack.remaining > 0) {
          totalVotes = Number(totalVotersResult.stack.readBigNumber());
        }
      } catch (voteError) {
        // Could not get vote count, using 0
      }

      // Create transformed poll object using the same format as getActivePolls
      const transformedPoll = {
        id: pollId,
        title: pollSubject,
        description: 'Direct contract poll',
        options: pollOptions,
        category: 'general',
        author: this._formatAddress(pollCreator),
        totalVotes: totalVotes,
        totalResponses: totalVotes,
        isActive: true,
        createdAt: 'Unknown',
        type: 'simple-blockchain',
        optionCount: pollOptions.length,
        hasAiData: false,
        subject: pollSubject,
        // Compatibility fields for UI
        totalRewardFund: '0 TON',
        daysRemaining: 0,
        gaslessEnabled: false,
        rewardPerVote: '0'
      };
      
      return transformedPoll;
      
    } catch (error) {
      console.error(`Error getting poll ${pollId} from contract:`, error);
      throw new Error(`Failed to get poll ${pollId}: ${error.message}`);
    }
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
        
        // TON client initialized for getActivePolls
      } catch (error) {
        console.error('Failed to initialize TON client:', error);
        throw new Error('TON client not available for direct blockchain interaction');
      }
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      
      // Get total number of polls first
      let totalPolls = 0;
      try {
        const result = await this.client.runMethod(contractAddress, 'getPollCount');
        if (result.stack && result.stack.items.length > 0) {
          totalPolls = Number(result.stack.items[0].value);
        }
      } catch (error) {
        // Could not get total polls count, trying alternative approach
        // If getPollCount doesn't exist, try to get contract stats
        try {
          const statsResult = await this.client.runMethod(contractAddress, 'getContractStats');
          if (statsResult.stack && statsResult.stack.items.length > 0) {
            totalPolls = Number(statsResult.stack.items[0].value);
          }
        } catch (statsError) {
          // Could not get contract stats either, using fallback approach
          totalPolls = 100; // reasonable upper limit for scanning
        }
      }

      const activePolls = [];
      
      // Iterate through poll IDs to find active polls
      for (let pollId = 1; pollId <= totalPolls; pollId++) {
        try {
          // First, try to get options directly using the known poll ID
          let pollOptions = [];
          let pollSubject = `Poll ${pollId}`;
          let pollCreator = 'Unknown';
          
          // Attempting to fetch options directly
          try {
            const optionsResult = await this.client.runMethod(contractAddress, 'getPollOptions', [
              { type: 'int', value: BigInt(pollId) }
            ]);
            
            // Handle both exit_code formats (0 or undefined for success)
            const isSuccess = (optionsResult.exit_code === 0 || optionsResult.exit_code === undefined) && 
                             optionsResult.stack && optionsResult.stack.remaining > 0;
            
            if (isSuccess) {
              const optionsCell = optionsResult.stack.readCellOpt();
              if (optionsCell) {
                const optionsDict = Dictionary.loadDirect(
                  Dictionary.Keys.BigInt(257), 
                  Dictionary.Values.Cell(), 
                  optionsCell
                );
                
                pollOptions = [];
                for (let i = 0; i < optionsDict.size; i++) {
                  const optionCell = optionsDict.get(BigInt(i));
                  if (optionCell) {
                    const optionText = optionCell.beginParse().loadStringTail();
                    pollOptions.push(optionText);
                  }
                }
                // Retrieved options successfully
              }
            }
          } catch (optionsError) {
            // This poll might not exist or have no options, skip it
            continue;
          }
          
          // Only proceed if we got options (meaning the poll exists)
          if (pollOptions.length === 0) {
            continue;
          }
          
          // Now try to get additional poll info (subject, creator)
          try {
            const pollResult = await this.client.runMethod(contractAddress, 'getPoll', [
              { type: 'int', value: BigInt(pollId) }
            ]);
            // Debug poll result structure
            
            if (pollResult.stack && pollResult.stack.remaining > 0) {
              try {
                const pollTuple = pollResult.stack.readTupleOpt();
                if (pollTuple) {
                  const parsedPollId = Number(pollTuple.items[0]);
                  const creator = pollTuple.items[1];
                  // Parse subject (position 2 in the tuple) using direct access
                  let subject = 'No subject';
                  try {
                    if (pollTuple.items[2]?.type === 'cell') {
                      const subjectSlice = pollTuple.items[2].cell.beginParse();
                      subject = subjectSlice.loadStringTail();
                    } else {
                      const subjectSlice = pollTuple.items[2].beginParse();
                      subject = subjectSlice.loadStringTail();
                    }
                  } catch (e) {
                    // Failed to parse subject from getPoll
                  }
                  
                  pollSubject = subject || `Poll ${pollId}`;
                  pollCreator = creator.toString();
                  
                  // Retrieved poll info successfully
                }
              } catch (parseError) {
                // Could not parse poll details, using defaults
              }
            }
          } catch (pollError) {
            // Could not get poll details, using defaults
          }
              
          // Get vote counts from contract
          let totalVotes = 0;
          try {
            const totalVotersResult = await this.client.runMethod(contractAddress, 'getPollTotalVoters', [
              { type: 'int', value: BigInt(pollId) }
            ]);
            if (totalVotersResult.stack && totalVotersResult.stack.remaining > 0) {
              totalVotes = Number(totalVotersResult.stack.readBigNumber());
            }
          } catch (voteError) {
            // Could not get vote count, using 0
          }

          // Create a transformed poll object
          const transformedPoll = {
            id: pollId,
            title: pollSubject,
            description: 'Direct contract poll',
            options: pollOptions,
            category: 'general',
            author: this._formatAddress(pollCreator),
            totalVotes: totalVotes,
            totalResponses: totalVotes,
            isActive: true,
            createdAt: 'Unknown',
            type: 'simple-blockchain',
            optionCount: pollOptions.length,
            hasAiData: false,
            subject: pollSubject,
            // Compatibility fields for UI
            totalRewardFund: '0 TON',
            daysRemaining: 0,
            gaslessEnabled: false,
            rewardPerVote: '0'
          };
          
          activePolls.push(transformedPoll);
        } catch (pollError) {
          // Poll doesn't exist or error accessing it, continue to next
          continue;
        }
      }
      return activePolls;
      
    } catch (error) {
      console.error('Error getting active polls from contract:', error);
      throw new Error(`Failed to get active polls: ${error.message}`);
    }
  }

  /**
   * Get poll results directly from blockchain
   * @param {number} pollId - Poll ID
   * @returns {Promise<Object>} Poll results
   */
  async getPollResults(pollId) {
    // Direct contract call only
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
      } catch (error) {
        console.error('Failed to initialize TON client:', error);
        throw new Error('TON client not available for direct blockchain interaction');
      }
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      
      // Get poll data first to get options
      const poll = await this.getPoll(pollId);
      if (!poll) {
        throw new Error(`Poll ${pollId} not found`);
      }

      // Get vote results from contract
      const resultsResponse = await this.client.runMethod(contractAddress, 'getPollResults', [
        { type: 'int', value: BigInt(pollId) }
      ]);

      let voteResults = {};
      let totalVotes = 0;

      // Parse vote results from contract response
      if (resultsResponse.stack && resultsResponse.stack.remaining > 0) {
        try {
          const resultsCell = resultsResponse.stack.readCellOpt();
          if (resultsCell) {
            // The results are stored as a dictionary of Int -> Int (optionIndex -> voteCount)
            const resultsDict = Dictionary.loadDirect(
              Dictionary.Keys.BigInt(257),
              Dictionary.Values.BigInt(257),
              resultsCell
            );

            // Convert dictionary to object and calculate total votes
            for (let i = 0; i < poll.options.length; i++) {
              const votes = resultsDict.get(BigInt(i));
              const voteCount = votes ? Number(votes) : 0;
              voteResults[i] = voteCount;
              totalVotes += voteCount;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse vote results, using empty results:', parseError);
        }
      }

      // Transform results to match frontend expectations
      const options = poll.options.map((optionText, index) => ({
        id: index,
        text: optionText,
        votes: voteResults[index] || 0
      }));

      return {
        success: true,
        totalVotes,
        options,
        pollId: poll.id,
        poll: poll
      };

    } catch (error) {
      console.error('Error getting poll results from contract:', error);
      throw new Error(`Failed to get poll results: ${error.message}`);
    }
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
   * Check if user has already voted on a poll
   * @param {number} pollId - Poll ID
   * @param {string} voterAddress - Voter's wallet address
   * @returns {Promise<boolean>} True if user has voted
   */
  async hasUserVoted(pollId, voterAddress) {
    if (!this.client) {
      throw new Error('TON client not initialized');
    }

    try {
      const contractAddress = Address.parse(this.contractAddress);
      const voterAddr = Address.parse(voterAddress);
      
      // Create a proper cell with the address for the slice parameter
      const addressCell = beginCell().storeAddress(voterAddr).endCell();
      
      const result = await this.client.runMethod(contractAddress, 'hasVoted', [
        { type: 'int', value: BigInt(pollId) },
        { type: 'slice', cell: addressCell }
      ]);

      if (result.stack && result.stack.remaining > 0) {
        const hasVoted = result.stack.readBoolean();
        return hasVoted;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if user has voted:', error);
      // Default to false to allow voting if check fails
      return false;
    }
  }

  /**
   * Get contract statistics from blockchain
   */
  async getContractStats() {
    // Blockchain-only implementation
    try {
      if (!this.client) {
        throw new Error('TON client not initialized');
      }
      
      const contractAddress = Address.parse(this.contractAddress);
      const result = await this.client.runMethod(contractAddress, 'getPollCount');
      
      let totalPolls = 0;
      if (result.stack && result.stack.items.length > 0) {
        totalPolls = Number(result.stack.items[0].value);
      }
      
      return {
        totalPolls,
        activePolls: totalPolls, // All polls are considered active
        nextPollId: totalPolls + 1,
        contractAddress: this.contractAddress
      };
    } catch (error) {
      console.warn('Failed to get contract stats from blockchain:', error);
      return {
        totalPolls: 0,
        activePolls: 0,
        nextPollId: 1,
        contractAddress: this.contractAddress
      };
    }
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
        // Parse according to the updated contract structure:
        // pollId: BigNumber, creator: Address, subject: String, options: Cell (Dictionary), results: Cell (Dictionary)
        // Try to get poll ID from the correct source
        let pollId = 0;
        if (typeof item.items[0] === 'bigint') {
          pollId = Number(item.items[0]);
        } else if (item.items[0]?.value) {
          pollId = Number(item.items[0].value);
        } else if (item.items[0]?.type === 'int') {
          pollId = Number(item.items[0].value || 0);
        }
        
        // If we still don't have a poll ID, we'll need to handle this in getActivePolls
        // Extracted poll ID
        
        // Parse creator address from cell
        let creator = null;
        try {
          const creatorSlice = item.items[1].beginParse();
          const creatorAddress = creatorSlice.loadAddress();
          creator = creatorAddress.toString();
        } catch (e) {
          // Failed to parse creator address
        }
        
        // Parse subject string from cell
        let subject = 'No subject';
        try {
          if (item.items[2]?.type === 'cell') {
            const subjectSlice = item.items[2].cell.beginParse();
            subject = subjectSlice.loadStringTail();
          } else {
            const subjectSlice = item.items[2].beginParse();
            subject = subjectSlice.loadStringTail();
          }
        } catch (e) {
          // Failed to parse subject string
        }
        
        // Parse options dictionary from cell
        const options = [];
        if (item.items[3]?.type === 'cell' && item.items[3].cell) {
          try {
            const optionsDict = Dictionary.loadDirect(
              Dictionary.Keys.BigInt(257), 
              Dictionary.Values.Cell(), 
              item.items[3].cell
            );
            
            // Extract option strings from the dictionary
            for (let i = 0; i < optionsDict.size; i++) {
              const optionCell = optionsDict.get(BigInt(i));
              if (optionCell) {
                const optionText = optionCell.beginParse().loadStringTail();
                options.push(optionText);
              }
            }
            // Parsed options successfully
          } catch (e) {
            // Failed to parse options dictionary
          }
        }
        
        // Parse results dictionary from cell (now item 4)
        const results = {};
        if (item.items[4]?.type === 'cell' && item.items[4].cell) {
          try {
            // Dictionary parsing would go here
            // For now, we'll leave it empty as Dictionary parsing is complex
          } catch (e) {
            // Failed to parse results dictionary
          }
        }
        
        return {
          pollId,
          creator,
          subject,
          options,
          results,
          // Calculate derived fields
          optionCount: options.length,
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