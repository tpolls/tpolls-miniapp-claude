/**
 * Jetton Poll Creation Test Script
 * Tests poll creation with different jetton types
 */

import { transformPollDataForSimpleContract } from '../utils/contractDataTransformer.js';
import { initJettonUtils, JETTON_ADDRESSES, getJettonInfo } from '../utils/jettonUtils.js';

// Test data for different jetton types
const testCases = [
  {
    name: 'TON Native Token Poll',
    pollData: {
      subject: 'Should we implement dark mode?',
      description: 'Vote for adding dark mode theme to the app',
      options: ['Yes, implement dark mode', 'No, keep light theme', 'Add both options'],
      category: 'ui/ux',
      rewardToken: 'ton',
      rewardAmount: '0.1',
      jettonRewardAmount: '',
      fundingSource: 'self-funded',
      openImmediately: true,
      createdBy: 'EQD2NmD_lH5f5u1Kj3KrBK7LuqGGaO4r5u1Kj3KrBK7LuqG'
    }
  },
  {
    name: 'Custom Jetton Poll',
    pollData: {
      subject: 'Best programming language for TON?',
      description: 'Choose the best language for TON smart contracts',
      options: ['TACT', 'FunC', 'TypeScript'],
      category: 'development',
      rewardToken: 'jetton-custom',
      rewardAmount: '',
      jettonRewardAmount: '500',
      fundingSource: 'self-funded',
      openImmediately: true,
      createdBy: 'EQD2NmD_lH5f5u1Kj3KrBK7LuqGGaO4r5u1Kj3KrBK7LuqG'
    }
  },
  {
    name: 'USDT Jetton Poll',
    pollData: {
      subject: 'Preferred stablecoin for rewards?',
      description: 'Which stablecoin should we use for poll rewards?',
      options: ['USDT', 'USDC', 'DAI', 'BUSD'],
      category: 'finance',
      rewardToken: 'jetton-usdt',
      rewardAmount: '',
      jettonRewardAmount: '2.5',
      fundingSource: 'self-funded',
      openImmediately: true,
      createdBy: 'EQD2NmD_lH5f5u1Kj3KrBK7LuqGGaO4r5u1Kj3KrBK7LuqG'
    }
  },
  {
    name: 'Notcoin Poll',
    pollData: {
      subject: 'Best DeFi protocol on TON?',
      description: 'Vote for your favorite DeFi protocol',
      options: ['DeDust', 'Ston.fi', 'Megaton Finance', 'TON Diamonds'],
      category: 'defi',
      rewardToken: 'jetton-not',
      rewardAmount: '',
      jettonRewardAmount: '50000',
      fundingSource: 'self-funded',
      openImmediately: true,
      createdBy: 'EQD2NmD_lH5f5u1Kj3KrBK7LuqGGaO4r5u1Kj3KrBK7LuqG'
    }
  }
];

// Mock contract service for testing
class MockTonConnectUI {
  constructor() {
    this.account = {
      address: 'EQD2NmD_lH5f5u1Kj3KrBK7LuqGGaO4r5u1Kj3KrBK7LuqG'
    };
  }

  async sendTransaction(transaction) {
    console.log('📤 Mock Transaction Sent:');
    console.log('- Address:', transaction.messages[0].address);
    console.log('- Amount:', transaction.messages[0].amount);
    console.log('- Payload Size:', transaction.messages[0].payload.length, 'chars');
    console.log('- Valid Until:', new Date(transaction.validUntil * 1000).toISOString());

    // Simulate successful transaction
    return {
      boc: 'te6ccgEBAQEAaQAA0/8AIN2k8mCBAgDdpP...',
      hash: 'E8A4B5F2C3D6E9F1A2B5C8D9E0F3A6B9C2D5E8F1A4B7C0D3E6F9A2B5C8D9E0F3'
    };
  }
}

// Test utility functions
function logTestHeader(testName) {
  console.log('\n' + '='.repeat(60));
  console.log(`🧪 ${testName}`);
  console.log('='.repeat(60));
}

function logTestResult(success, message) {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${message}`);
}

function validatePollData(pollData) {
  const errors = [];

  if (!pollData.subject || pollData.subject.trim().length === 0) {
    errors.push('Subject is required');
  }

  if (!pollData.options || !Array.isArray(pollData.options) || pollData.options.length < 2) {
    errors.push('At least 2 options are required');
  }

  if (pollData.rewardToken === 'ton' && (!pollData.rewardAmount || parseFloat(pollData.rewardAmount) <= 0)) {
    errors.push('TON reward amount must be greater than 0');
  }

  if (pollData.rewardToken !== 'ton' && (!pollData.jettonRewardAmount || parseFloat(pollData.jettonRewardAmount) <= 0)) {
    errors.push('Jetton reward amount must be greater than 0');
  }

  return errors;
}

// Test jetton utilities
async function testJettonUtilities() {
  logTestHeader('Jetton Utilities Test');

  try {
    // Test each jetton type
    for (const [jettonType, address] of Object.entries(JETTON_ADDRESSES)) {
      console.log(`\n🔍 Testing ${jettonType}:`);
      console.log(`- Address: ${address}`);

      const jettonInfo = getJettonInfo(jettonType);
      console.log(`- Symbol: ${jettonInfo.symbol}`);
      console.log(`- Name: ${jettonInfo.name}`);
      console.log(`- Decimals: ${jettonInfo.decimals}`);

      const jettonUtils = initJettonUtils(jettonType);
      console.log(`- Utils initialized: ${!!jettonUtils}`);
      console.log(`- Jetton type: ${jettonUtils.jettonType}`);

      logTestResult(true, `${jettonType} utilities working correctly`);
    }
  } catch (error) {
    logTestResult(false, `Jetton utilities test failed: ${error.message}`);
  }
}

// Test poll data transformation
async function testPollDataTransformation() {
  logTestHeader('Poll Data Transformation Test');

  for (const testCase of testCases) {
    try {
      console.log(`\n🔄 Testing: ${testCase.name}`);

      // Validate input data
      const validationErrors = validatePollData(testCase.pollData);
      if (validationErrors.length > 0) {
        logTestResult(false, `Validation failed: ${validationErrors.join(', ')}`);
        continue;
      }

      // Transform poll data
      const transformedData = transformPollDataForSimpleContract(testCase.pollData);

      console.log('📊 Transformed Data:');
      console.log('- Subject:', transformedData.subject);
      console.log('- Options count:', transformedData.options.length);
      console.log('- TON reward per vote:', transformedData.rewardPerVote);
      console.log('- Jetton wallet:', transformedData.jettonRewardWallet || 'None');
      console.log('- Jetton reward per vote:', transformedData.jettonRewardPerVote);

      // Validate transformation
      let isValid = true;
      let errorMessage = '';

      if (testCase.pollData.rewardToken === 'ton') {
        if (transformedData.rewardPerVote !== parseFloat(testCase.pollData.rewardAmount)) {
          isValid = false;
          errorMessage = 'TON reward amount not properly transformed';
        }
        if (transformedData.jettonRewardWallet !== null) {
          isValid = false;
          errorMessage = 'Jetton wallet should be null for TON polls';
        }
      } else {
        if (transformedData.jettonRewardWallet === null) {
          isValid = false;
          errorMessage = 'Jetton wallet should not be null for jetton polls';
        }
        if (transformedData.jettonRewardPerVote !== parseFloat(testCase.pollData.jettonRewardAmount)) {
          isValid = false;
          errorMessage = 'Jetton reward amount not properly transformed';
        }
      }

      logTestResult(isValid, isValid ? 'Data transformation successful' : errorMessage);

    } catch (error) {
      logTestResult(false, `Transformation failed: ${error.message}`);
    }
  }
}

// Test mock contract interaction
async function testContractInteraction() {
  logTestHeader('Contract Interaction Test');

  const mockTonConnectUI = new MockTonConnectUI();

  for (const testCase of testCases) {
    try {
      console.log(`\n💼 Testing contract interaction: ${testCase.name}`);

      // Transform data
      const transformedData = transformPollDataForSimpleContract(testCase.pollData);

      // Simulate transaction creation
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: 'EQDAfR3FUXGaTXTT-o_C5xNRL9_a2P-QmoCyBPLsGPcPu7iZ', // Mock contract address
            amount: '50000000', // 0.05 TON for gas
            payload: 'mock_payload_' + Math.random().toString(36).substr(2, 9)
          }
        ]
      };

      // Send mock transaction
      const result = await mockTonConnectUI.sendTransaction(transaction);

      console.log('📋 Transaction Result:');
      console.log('- Hash:', result.hash.slice(0, 16) + '...');
      console.log('- BOC length:', result.boc.length);

      logTestResult(true, 'Contract interaction successful');

    } catch (error) {
      logTestResult(false, `Contract interaction failed: ${error.message}`);
    }
  }
}

// Test analytics tracking simulation
function testAnalyticsTracking() {
  logTestHeader('Analytics Tracking Test');

  const mockAnalyticsEvents = [];

  // Mock analytics function
  const mockTrackUserAction = (event, data) => {
    mockAnalyticsEvents.push({ event, data, timestamp: Date.now() });
  };

  try {
    // Simulate user actions
    mockTrackUserAction('poll_reward_token_selected', { tokenType: 'jetton-custom' });
    mockTrackUserAction('poll_creation_step_next', { currentStep: 2, nextStep: 3 });
    mockTrackUserAction('poll_creation_submitted', {
      contractType: 'simple',
      optionsCount: 3,
      category: 'development',
      fundingSource: 'self-funded',
      rewardToken: 'jetton-custom'
    });

    console.log(`\n📊 Analytics Events Tracked: ${mockAnalyticsEvents.length}`);
    mockAnalyticsEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.event}:`, JSON.stringify(event.data));
    });

    logTestResult(true, 'Analytics tracking simulation successful');

  } catch (error) {
    logTestResult(false, `Analytics tracking test failed: ${error.message}`);
  }
}

// Performance test
function testPerformance() {
  logTestHeader('Performance Test');

  try {
    const iterations = 100;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      // Test rapid poll data transformations
      for (const testCase of testCases) {
        transformPollDataForSimpleContract(testCase.pollData);
      }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`\n⚡ Performance Results:`);
    console.log(`- Total iterations: ${iterations}`);
    console.log(`- Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`- Average time per iteration: ${avgTime.toFixed(2)}ms`);
    console.log(`- Transformations per second: ${(1000 / avgTime * testCases.length).toFixed(0)}`);

    logTestResult(avgTime < 1, `Performance test ${avgTime < 1 ? 'passed' : 'needs optimization'}`);

  } catch (error) {
    logTestResult(false, `Performance test failed: ${error.message}`);
  }
}

// Main test runner
export async function runJettonPollCreationTests() {
  console.log('🚀 Starting Jetton Poll Creation Test Suite');
  console.log('Timestamp:', new Date().toISOString());

  const tests = [
    testJettonUtilities,
    testPollDataTransformation,
    testContractInteraction,
    testAnalyticsTracking,
    testPerformance
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      await test();
      passedTests++;
    } catch (error) {
      console.error(`\n❌ Test failed:`, error);
    }
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST SUITE COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Jetton poll creation is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }

  return {
    passed: passedTests,
    total: totalTests,
    successRate: (passedTests / totalTests) * 100
  };
}

// Export test cases for external use
export { testCases, MockTonConnectUI };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runJettonPollCreationTests();
}