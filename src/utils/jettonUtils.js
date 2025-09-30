import { Address, beginCell, Cell, fromNano, toNano } from '@ton/core';
import { TonClient } from '@ton/ton';

// Supported jetton addresses
export const JETTON_ADDRESSES = {
  'jetton-custom': 'EQDiYefKbljzJeBgLAB6Y4AYSRrgnFQnqdCKhHCw8fk987hQ',
  'jetton-usdt': 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
  'jetton-usdc': 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',
  'jetton-not': 'EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT'
};

// Default to custom jetton for backward compatibility
export const CUSTOM_JETTON_ADDRESS = JETTON_ADDRESSES['jetton-custom'];

export const getJettonInfo = (jettonType = 'jetton-custom') => {
  const info = {
    'jetton-custom': { symbol: 'CUSTOM', name: 'Custom Token', decimals: 9 },
    'jetton-usdt': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    'jetton-usdc': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    'jetton-not': { symbol: 'NOT', name: 'Notcoin', decimals: 9 }
  };
  return info[jettonType] || info['jetton-custom'];
};

// Jetton transfer notification opcode
export const JETTON_TRANSFER_NOTIFICATION_OPCODE = 0x7362d09c;

// Jetton transfer opcode
export const JETTON_TRANSFER_OPCODE = 0xf8a7ea5;

/**
 * Get jetton wallet address for a user
 * @param {Address} jettonMasterAddress - Jetton master contract address
 * @param {Address} userAddress - User's wallet address
 * @param {TonClient} tonClient - TON client instance
 * @returns {Promise<Address>} Jetton wallet address
 */
export async function getJettonWalletAddress(jettonMasterAddress, userAddress, tonClient) {
  try {
    const response = await tonClient.runMethod(jettonMasterAddress, 'get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(userAddress).endCell() }
    ]);

    return response.stack.readAddress();
  } catch (error) {
    console.error('Error getting jetton wallet address:', error);
    throw error;
  }
}

/**
 * Get jetton balance for a user
 * @param {Address} jettonWalletAddress - Jetton wallet contract address
 * @param {TonClient} tonClient - TON client instance
 * @returns {Promise<bigint>} Jetton balance
 */
export async function getJettonBalance(jettonWalletAddress, tonClient) {
  try {
    const response = await tonClient.runMethod(jettonWalletAddress, 'get_wallet_data', []);
    const balance = response.stack.readBigNumber();
    return balance;
  } catch (error) {
    console.error('Error getting jetton balance:', error);
    return 0n;
  }
}

/**
 * Get jetton metadata from master contract
 * @param {Address} jettonMasterAddress - Jetton master contract address
 * @param {TonClient} tonClient - TON client instance
 * @returns {Promise<Object>} Jetton metadata
 */
export async function getJettonMetadata(jettonMasterAddress, tonClient) {
  try {
    const response = await tonClient.runMethod(jettonMasterAddress, 'get_jetton_data', []);

    const totalSupply = response.stack.readBigNumber();
    const mintable = response.stack.readBoolean();
    const adminAddress = response.stack.readAddressOpt();
    const jettonContentCell = response.stack.readCell();
    const jettonWalletCode = response.stack.readCell();

    // Parse jetton content (metadata)
    const metadata = parseJettonMetadata(jettonContentCell);

    return {
      totalSupply,
      mintable,
      adminAddress,
      metadata,
      jettonWalletCode
    };
  } catch (error) {
    console.error('Error getting jetton metadata:', error);
    return null;
  }
}

/**
 * Parse jetton metadata from content cell
 * @param {Cell} contentCell - Jetton content cell
 * @returns {Object} Parsed metadata
 */
function parseJettonMetadata(contentCell) {
  try {
    const slice = contentCell.beginParse();
    const prefix = slice.loadUint(8);

    if (prefix === 0x00) {
      // On-chain metadata
      const dict = slice.loadDict(256, (s) => s.loadRef());
      const metadata = {};

      // Common metadata keys (SHA256 hashes)
      const metadataKeys = {
        'name': 'name',
        'description': 'description',
        'symbol': 'symbol',
        'image': 'image',
        'decimals': 'decimals'
      };

      for (const [key, field] of Object.entries(metadataKeys)) {
        const keyHash = Buffer.from(key).toString('hex');
        const value = dict.get(BigInt('0x' + keyHash));
        if (value) {
          const valueSlice = value.beginParse();
          metadata[field] = valueSlice.loadStringTail();
        }
      }

      return metadata;
    } else if (prefix === 0x01) {
      // Off-chain metadata
      const uri = slice.loadStringTail();
      return { uri };
    }

    return {};
  } catch (error) {
    console.error('Error parsing jetton metadata:', error);
    return {};
  }
}

/**
 * Create jetton transfer message
 * @param {Object} params - Transfer parameters
 * @returns {Cell} Transfer message cell
 */
export function createJettonTransferMessage({
  queryId = 0,
  amount,
  destination,
  responseDestination,
  customPayload = null,
  forwardTonAmount = 0n,
  forwardPayload = null
}) {
  const body = beginCell()
    .storeUint(JETTON_TRANSFER_OPCODE, 32)
    .storeUint(queryId, 64)
    .storeCoins(amount)
    .storeAddress(destination)
    .storeAddress(responseDestination)
    .storeMaybeRef(customPayload)
    .storeCoins(forwardTonAmount)
    .storeMaybeRef(forwardPayload)
    .endCell();

  return body;
}

/**
 * Create poll funding message with jetton
 * @param {Object} params - Funding parameters
 * @returns {Cell} Funding message cell
 */
export function createPollFundingMessage({
  pollId,
  amount,
  pollContractAddress,
  userAddress
}) {
  // Create forward payload with poll funding info
  const forwardPayload = beginCell()
    .storeUint(0x12345678, 32) // Custom opcode for poll funding
    .storeUint(pollId, 64)
    .storeCoins(amount)
    .endCell();

  return createJettonTransferMessage({
    queryId: Date.now(),
    amount: amount,
    destination: pollContractAddress,
    responseDestination: userAddress,
    customPayload: null,
    forwardTonAmount: toNano('0.05'), // Gas for processing
    forwardPayload: forwardPayload
  });
}

/**
 * Estimate jetton transfer fee
 * @returns {bigint} Estimated fee in nanotons
 */
export function estimateJettonTransferFee() {
  // Base fee for jetton transfer (gas + forward amount)
  return toNano('0.1'); // 0.1 TON should be sufficient
}

/**
 * Format jetton amount for display
 * @param {bigint} amount - Raw jetton amount
 * @param {number} decimals - Token decimals
 * @returns {string} Formatted amount
 */
export function formatJettonAmount(amount, decimals = 9) {
  if (!amount) return '0';

  const divisor = BigInt(10 ** decimals);
  const beforeDecimal = amount / divisor;
  const afterDecimal = amount % divisor;

  if (afterDecimal === 0n) {
    return beforeDecimal.toString();
  }

  const afterDecimalStr = afterDecimal.toString().padStart(decimals, '0');
  const trimmed = afterDecimalStr.replace(/0+$/, '');

  return `${beforeDecimal.toString()}.${trimmed}`;
}

/**
 * Parse jetton amount from string
 * @param {string} amountStr - Amount string
 * @param {number} decimals - Token decimals
 * @returns {bigint} Raw jetton amount
 */
export function parseJettonAmount(amountStr, decimals = 9) {
  if (!amountStr || amountStr === '0') return 0n;

  const [beforeDecimal = '0', afterDecimal = ''] = amountStr.split('.');
  const afterDecimalPadded = afterDecimal.padEnd(decimals, '0').slice(0, decimals);

  const beforeDecimalBig = BigInt(beforeDecimal);
  const afterDecimalBig = BigInt(afterDecimalPadded);
  const multiplier = BigInt(10 ** decimals);

  return beforeDecimalBig * multiplier + afterDecimalBig;
}

/**
 * Get TON client instance
 * @returns {TonClient} TON client
 */
export function getTonClient() {
  const endpoint = import.meta.env.VITE_TONCENTER_ENDPOINT || 'https://testnet.toncenter.com/api/v2/jsonRPC';
  const apiKey = import.meta.env.VITE_TONCENTER_API_KEY;

  return new TonClient({
    endpoint: endpoint,
    apiKey: apiKey
  });
}

/**
 * Initialize jetton utilities with specified jetton type
 * @param {string} jettonType - Type of jetton to use
 * @returns {Object} Jetton utilities instance
 */
export function initJettonUtils(jettonType = 'jetton-custom') {
  const tonClient = getTonClient();
  const jettonAddress = JETTON_ADDRESSES[jettonType] || CUSTOM_JETTON_ADDRESS;
  const jettonMasterAddress = Address.parse(jettonAddress);
  const jettonInfo = getJettonInfo(jettonType);

  return {
    tonClient,
    jettonMasterAddress,
    jettonType,
    jettonInfo,

    async getUserJettonWallet(userAddress) {
      return getJettonWalletAddress(jettonMasterAddress, userAddress, tonClient);
    },

    async getUserJettonBalance(userAddress) {
      const walletAddress = await this.getUserJettonWallet(userAddress);
      return getJettonBalance(walletAddress, tonClient);
    },

    async getJettonMetadata() {
      return getJettonMetadata(jettonMasterAddress, tonClient);
    },

    createFundingMessage(pollId, amount, pollContractAddress, userAddress) {
      return createPollFundingMessage({
        pollId,
        amount,
        pollContractAddress,
        userAddress
      });
    }
  };
}

export default {
  CUSTOM_JETTON_ADDRESS,
  getJettonWalletAddress,
  getJettonBalance,
  getJettonMetadata,
  createJettonTransferMessage,
  createPollFundingMessage,
  estimateJettonTransferFee,
  formatJettonAmount,
  parseJettonAmount,
  getTonClient,
  initJettonUtils
};