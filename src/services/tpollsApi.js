/**
 * TPolls API Service
 * Handles all backend API interactions separate from blockchain operations
 */
class TPollsApiService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_TPOLLS_API || 'https://tpolls-api.onrender.com/api';
    this.isAvailable = false;
    
    console.log(`TPolls API Service initialized: ${this.apiBaseUrl}`);
    
    // Test API availability
    this._testConnection();
  }

  /**
   * Test API connection
   */
  async _testConnection() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/../health`);
      if (response.ok) {
        this.isAvailable = true;
        console.log('✅ TPolls API available');
      } else {
        this.isAvailable = false;
        console.warn('⚠️ TPolls API not available');
      }
    } catch (error) {
      this.isAvailable = false;
      console.warn('⚠️ TPolls API connection failed:', error.message);
    }
  }

  /**
   * Get featured poll IDs from backend API (optimized for UI)
   * @param {number} limit - Maximum number of poll IDs to return (default: 2)
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} Array of featured poll IDs
   */
  async getFeaturedPollIds(limit = 2, category = null) {
    if (!this.isAvailable) {
      console.warn('⚠️ TPolls API not available for featured poll IDs');
      throw new Error('TPolls API not available');
    }

    try {
      console.log('🚀 Fetching featured poll IDs from backend API...');
      
      const params = new URLSearchParams({ limit: limit.toString() });
      if (category) {
        params.append('category', category);
      }
      
      const response = await fetch(`${this.apiBaseUrl}/database/polls/featured?${params}`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      
      // Extract just the poll IDs from the response
      // Database controller returns FeaturedPoll objects with blockchainPollId field
      const featuredPollIds = (data.polls || []).map(poll => {
        return poll.blockchainPollId;
      }).filter(id => id !== undefined && id !== null && !isNaN(id));
      
      console.log(`✅ Loaded ${featuredPollIds.length} featured poll IDs from API:`, featuredPollIds);
      console.log('Raw API response polls:', data.polls);
      return featuredPollIds;
      
    } catch (error) {
      console.error('❌ Failed to get featured polls from API:', error.message);
      throw error;
    }
  }


  /**
   * Get API health status
   */
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/../health`);
      const data = await response.json();
      return {
        available: response.ok,
        status: data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get API statistics
   */
  async getStats() {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/stats`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      return data.success ? data.stats : null;
      
    } catch (error) {
      console.error('Error getting API stats:', error);
      throw error;
    }
  }

  /**
   * Admin: Add poll to featured list
   * @param {number} pollId - Poll ID to feature
   * @param {Object} options - Feature options (priority, category, reason, etc.)
   */
  async addFeaturedPoll(pollId, options = {}) {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/polls/featured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pollId,
          priority: options.priority || 0,
          category: options.category || 'curated',
          reason: options.reason,
          featuredUntil: options.featuredUntil,
          adminAddress: options.adminAddress
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();
      
      return data;
      
    } catch (error) {
      console.error('Error adding featured poll:', error);
      throw error;
    }
  }

  /**
   * Admin: Remove poll from featured list
   * @param {number} pollId - Poll ID to unfeature
   */
  async removeFeaturedPoll(pollId) {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/polls/featured/${pollId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();
      
      return data;
      
    } catch (error) {
      console.error('Error removing featured poll:', error);
      throw error;
    }
  }

  /**
   * Create AI-generated poll content
   */
  async createAIPoll(prompt) {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available for AI poll generation');
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
   * Store poll metadata after blockchain creation
   * @param {number} pollId - Blockchain poll ID
   * @param {string} transactionHash - Transaction hash
   * @param {Object} aiData - AI-generated poll data
   * @param {Object} pollData - Additional poll data
   * @param {string} createdBy - Creator address
   */
  async storePollMetadata(pollId, transactionHash, aiData, pollData = {}, createdBy = null) {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available for metadata storage');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/polls/store-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockchainPollId: pollId,
          transactionHash,
          contractAddress: null, // Will be filled by backend if needed
          aiData,
          pollData,
          createdBy
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error storing poll metadata:', error);
      throw error;
    }
  }

  /**
   * Confirm vote with backend for tracking
   * @param {string} voteId - Vote ID for tracking
   * @param {string} txHash - Transaction hash
   */
  async confirmVote(voteId, txHash) {
    if (!this.isAvailable) {
      console.warn('TPolls API not available for vote confirmation');
      return null;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/votes/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteId, txHash }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error confirming vote:', error);
      return null;
    }
  }

  /**
   * Get poll results from backend (if available)
   * @param {number} pollId - Poll ID
   */
  async getPollResults(pollId) {
    if (!this.isAvailable) {
      throw new Error('TPolls API not available for poll results');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/database/polls/${pollId}/results`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data;
        }
      }
      throw new Error('Poll results not available from backend');
    } catch (error) {
      console.warn('Failed to get poll results from backend:', error);
      throw error;
    }
  }

  /**
   * Get poll metadata from database
   * @param {number} pollId - Poll ID
   */
  async getPollMetadata(pollId) {
    if (!this.isAvailable) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/database/polls/${pollId}/metadata`);
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.metadata?.ai : null;
      }
    } catch (error) {
      console.warn('Metadata not available:', error);
    }
    
    return null;
  }
}

// Export singleton instance
const tpollsApi = new TPollsApiService();
export default tpollsApi;