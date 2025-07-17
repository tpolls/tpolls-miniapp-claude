/**
 * Gasless Voting Service
 * Handles meta-transactions for poll responses without requiring users to pay gas fees
 */

class GaslessVotingService {
  constructor() {
    this.relayerEndpoint = import.meta.env.VITE_DPOLLS_API ? `${import.meta.env.VITE_DPOLLS_API}/api/relay` : 'http://localhost:3001/api/relay';
    this.contractAddress = import.meta.env.VITE_TPOLLS_CONTRACT_ADDRESS || 'EQDzYUsVz1PZ4mCOFHYdchV0J0Xs0Qz9DEx7nEMqGJ_OsZ30';
  }

  /**
   * Create a gasless vote using meta-transaction pattern
   * @param {Object} voteData - Vote information
   * @param {number} voteData.pollId - Poll ID
   * @param {number} voteData.optionId - Selected option ID
   * @param {string} voteData.userAddress - User's wallet address
   * @param {Object} tonConnectUI - TonConnect UI instance for signing
   * @returns {Promise<Object>} Vote result
   */
  async submitGaslessVote(voteData, tonConnectUI) {
    try {
      const { pollId, optionId, userAddress } = voteData;

      // Create the vote message to be signed
      const voteMessage = {
        pollId,
        optionId,
        userAddress,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: this.generateNonce()
      };

      console.log('Creating gasless vote message:', voteMessage);

      // Create message for signing (TON format)
      const messageToSign = this.createSigningMessage(voteMessage);
      
      // Get user signature (this is free - no transaction)
      const signature = await this.getMessageSignature(messageToSign, tonConnectUI);
      
      if (!signature) {
        throw new Error('User cancelled signing');
      }

      // Submit to relayer service
      const relayerPayload = {
        voteMessage,
        signature,
        messageHash: messageToSign
      };

      console.log('Submitting to relayer:', relayerPayload);

      // In a real implementation, this would call your backend relayer
      const relayerResponse = await this.submitToRelayer(relayerPayload);

      return {
        success: true,
        transactionHash: relayerResponse.txHash,
        gasless: true,
        pollId,
        selectedOption: optionId,
        message: 'Vote submitted successfully (gasless)'
      };

    } catch (error) {
      console.error('Error in gasless voting:', error);
      throw new Error(`Gasless voting failed: ${error.message}`);
    }
  }

  /**
   * Create a message for signing that represents the vote
   * @param {Object} voteMessage - Vote data to sign
   * @returns {string} Message to be signed
   */
  createSigningMessage(voteMessage) {
    // Create a structured message for signing
    const message = `Vote on tPolls
Poll ID: ${voteMessage.pollId}
Option: ${voteMessage.optionId}
Address: ${voteMessage.userAddress}
Timestamp: ${voteMessage.timestamp}
Nonce: ${voteMessage.nonce}`;

    return message;
  }

  /**
   * Get user signature for the vote message
   * @param {string} message - Message to sign
   * @param {Object} tonConnectUI - TonConnect UI instance
   * @returns {Promise<string>} Signature
   */
  async getMessageSignature(message, tonConnectUI) {
    try {
      // For TON, we'll use a proof-of-ownership approach
      // In a real implementation, you'd use tonConnectUI.signMessage() or similar
      
      // Simulate message signing for now
      console.log('Requesting signature for message:', message);
      
      // In production, this would be:
      // const signature = await tonConnectUI.signMessage(message);
      
      // For demo purposes, create a mock signature
      const mockSignature = this.createMockSignature(message);
      
      return mockSignature;
    } catch (error) {
      console.error('Error getting signature:', error);
      return null;
    }
  }

  /**
   * Submit the signed vote to the relayer service
   * @param {Object} payload - Signed vote payload
   * @returns {Promise<Object>} Relayer response
   */
  async submitToRelayer(payload) {
    try {
      console.log('Submitting to relayer service...');
      
      // Make actual HTTP request to relayer service
      const response = await fetch(this.relayerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Relayer processing failed');
      }

      console.log('Relayer response:', result);

      // Transform relayer response to expected format
      return {
        success: true,
        txHash: result.voteId || `gasless_${Date.now()}`, // Use voteId as transaction reference
        gasUsed: '0', // User pays no gas
        relayerAddress: 'EQRelayer...',
        voteId: result.voteId,
        status: result.status,
        estimatedProcessTime: result.estimatedProcessTime
      };
      
    } catch (error) {
      console.error('Relayer submission failed:', error);
      
      // Check if it's a network error and fallback might be appropriate
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        throw new Error('Unable to connect to relayer service. Please check your connection.');
      }
      
      throw new Error(`Relayer service error: ${error.message}`);
    }
  }


  /**
   * Create a mock signature for demo purposes
   * @param {string} message - Message that was signed
   * @returns {string} Mock signature
   */
  createMockSignature(message) {
    // In production, this would be a real cryptographic signature
    const hash = btoa(message).slice(0, 32);
    return `sig_${hash}_${Date.now()}`;
  }

  /**
   * Generate a unique nonce for the transaction
   * @returns {string} Unique nonce
   */
  generateNonce() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if gasless voting is available
   * @returns {Promise<boolean>} Whether gasless voting is available
   */
  async isGaslessVotingAvailable() {
    try {
      // Check relayer service health
      const healthEndpoint = this.relayerEndpoint.replace('/relay', '/health');
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn('Relayer health check failed:', response.status);
        return false;
      }

      const healthData = await response.json();
      const isHealthy = healthData.status === 'healthy' || healthData.status === 'warning';
      
      if (!isHealthy) {
        console.warn('Relayer service is unhealthy:', healthData.status);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Gasless voting service unavailable:', error);
      return false;
    }
  }

  /**
   * Get estimated gas savings for the user
   * @returns {Object} Gas savings information
   */
  getGasSavingsInfo() {
    return {
      estimatedGasSaved: '0.05 TON',
      description: 'Transaction fees paid by tPolls relayer',
      benefitMessage: 'Vote for free - no transaction fees!'
    };
  }

  /**
   * Verify a gasless vote signature (for relayer service)
   * @param {Object} voteData - Vote data
   * @param {string} signature - Signature to verify
   * @param {string} message - Original message
   * @returns {boolean} Whether signature is valid
   */
  verifyVoteSignature(voteData, signature, message) {
    try {
      // In production, this would verify the cryptographic signature
      // For demo, we'll do basic validation
      const expectedMessage = this.createSigningMessage(voteData);
      return message === expectedMessage && signature.startsWith('sig_');
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const gaslessVotingService = new GaslessVotingService();
export default gaslessVotingService;