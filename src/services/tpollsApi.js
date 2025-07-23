/**
 * TPolls API Service
 * Handles all backend API interactions separate from blockchain operations
 */
class TPollsApiService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_TPOLLS_API || 'https://tpolls-api.onrender.com/api';
    this.isAvailable = false;
    
    // Cache for featured polls
    this.featuredPollsCache = null;
    this.featuredPollsCacheTime = 0;
    this.FEATURED_POLLS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
    
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
   * Get featured polls from backend API (optimized for UI)
   * @param {number} limit - Maximum number of polls to return (default: 2)
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} Array of featured polls
   */
  async getFeaturedPolls(limit = 2, category = null) {
    // Check cache first
    const now = Date.now();
    if (this.featuredPollsCache && (now - this.featuredPollsCacheTime) < this.FEATURED_POLLS_CACHE_DURATION) {
      console.log('⚡ Returning cached featured polls');
      return this.featuredPollsCache.slice(0, limit);
    }

    if (!this.isAvailable) {
      console.warn('⚠️ TPolls API not available for featured polls');
      throw new Error('TPolls API not available');
    }

    try {
      console.log('🚀 Fetching featured polls from backend API...');
      
      const params = new URLSearchParams({ limit: limit.toString() });
      if (category) {
        params.append('category', category);
      }
      
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/featured?${params}`);
      
      if (!response.ok) {
        throw new Error(`API responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      
      const featuredPolls = data.polls || [];
      
      // Cache the results
      this.featuredPollsCache = featuredPolls;
      this.featuredPollsCacheTime = now;
      
      console.log(`✅ Loaded ${featuredPolls.length} featured polls from API`);
      return featuredPolls;
      
    } catch (error) {
      console.error('❌ Failed to get featured polls from API:', error.message);
      throw error;
    }
  }

  /**
   * Clear featured polls cache
   */
  clearFeaturedPollsCache() {
    this.featuredPollsCache = null;
    this.featuredPollsCacheTime = 0;
    console.log('🗑️ Featured polls cache cleared');
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
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/stats`);
      
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
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/featured`, {
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
      
      // Clear cache since featured polls changed
      this.clearFeaturedPollsCache();
      
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
      const response = await fetch(`${this.apiBaseUrl}/simple-blockchain/polls/featured/${pollId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }

      const data = await response.json();
      
      // Clear cache since featured polls changed
      this.clearFeaturedPollsCache();
      
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
}

// Export singleton instance
const tpollsApi = new TPollsApiService();
export default tpollsApi;