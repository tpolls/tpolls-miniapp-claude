class TpollsIndexerApi {
    constructor() {
      this.baseUrl = process.env.REACT_APP_INDEXER_API_URL || 'http://localhost:3001/api';
    }
  
    async getVotesForPoll(pollId) {
      const response = await fetch(`${this.baseUrl}/polls/${pollId}/votes`);
      return await response.json();
    }
  
    async getVoterHistory(address) {
      const response = await fetch(`${this.baseUrl}/voters/${address}/votes`);
      return await response.json();
    }
  
    async getUnclaimedRewards(address) {
      const response = await fetch(`${this.baseUrl}/voters/${address}/rewards`);
      return await response.json();
    }
  }
  
  export default new TpollsIndexerApi();