/**
 * Contract Configuration
 * Manages which contract service to use throughout the application
 */

// Import both contract services
import simpleTpollsContract from '../services/tpollsContractSimple';

/**
 * Contract service configuration
 * Set USE_SIMPLE_CONTRACT to true to use the new simplified contract
 * Set to false to use the old complex contract
 */
export const USE_SIMPLE_CONTRACT = import.meta.env.VITE_USE_SIMPLE_CONTRACT === 'true' || false;

/**
 * Get the active contract service based on configuration
 * @returns {Object} Active contract service instance
 */
export const getActiveContract = () => {
  return simpleTpollsContract;
};

/**
 * Contract service instances for direct access
 */
export const contracts = {
  simple: simpleTpollsContract,
  active: getActiveContract()
};

/**
 * Contract-specific configuration
 */
export const contractConfig = {
  simple: {
    name: 'SimpleTpolls',
    apiPath: '/simple-blockchain',
    features: {
      hasGaslessVoting: false,
      hasFundingOptions: false,
      hasComplexRewards: false,
      hasMinimalData: true
    }
  },
  complex: {
    name: 'TPolls',
    apiPath: '/blockchain', 
    features: {
      hasGaslessVoting: true,
      hasFundingOptions: true,
      hasComplexRewards: true,
      hasMinimalData: false
    }
  }
};

/**
 * Get configuration for the active contract
 */
export const getActiveConfig = () => {
  return USE_SIMPLE_CONTRACT ? contractConfig.simple : contractConfig.complex;
};

export default {
  USE_SIMPLE_CONTRACT,
  getActiveContract,
  contracts,
  contractConfig,
  getActiveConfig
};