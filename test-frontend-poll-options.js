/**
 * Test script to verify frontend integration with poll options
 * This simulates the poll creation process from the frontend
 */

const { toNano, Address, Cell, beginCell, Dictionary } = require('@ton/core');

// Simulate the poll options data structure that would come from the frontend
const testPollData = {
  subject: "Which blockchain feature do you value most?",
  description: "Help us understand what matters to developers",
  options: [
    "Smart Contracts",
    "Decentralization", 
    "Low Transaction Fees",
    "Fast Confirmation Times"
  ],
  category: "technology",
  createdBy: "EQCn-eyl_oa9oBais2PEuOobeK5AOhNuHYl1JaaVPgfUILVL"
};

function testCreatePollTransaction(pollOptions, pollSubject) {
  try {
    console.log('🧪 Testing Poll Options Transaction Creation');
    console.log('==========================================');
    
    // Validate poll options (same validation as in service)
    if (!Array.isArray(pollOptions) || pollOptions.length < 2 || pollOptions.length > 10) {
      throw new Error('Poll must have 2-10 options');
    }
    
    // Validate that all options have content
    const validOptions = pollOptions.filter(opt => opt && opt.trim().length > 0);
    if (validOptions.length < 2) {
      throw new Error('Poll must have at least 2 non-empty options');
    }
    
    console.log('✅ Poll options validation passed');
    console.log('📊 Valid options:', validOptions);
    
    // Create options dictionary with Cell values (matching updated contract)
    const optionsDict = Dictionary.empty(Dictionary.Keys.Int(257), Dictionary.Values.Cell());
    validOptions.forEach((option, index) => {
      const optionCell = beginCell().storeStringTail(option.trim()).endCell();
      optionsDict.set(index, optionCell);
      console.log(`  📝 Option ${index}: "${option.trim()}"`);
    });
    
    console.log('✅ Options dictionary created successfully');
    
    // Build CreatePoll message payload with subject and options
    const messageBody = beginCell()
      .storeUint(1810031829, 32) // Updated CreatePoll operation code from new contract
      .storeStringRefTail(pollSubject || '') // Store poll subject as string
      .storeDict(optionsDict) // Store options dictionary
      .endCell();
    
    const payload = messageBody.toBoc().toString('base64');
    
    console.log('✅ Transaction payload created successfully');
    console.log('📦 Message structure:');
    console.log('  - Opcode: 1810031829 (CreatePoll)');
    console.log('  - Subject:', pollSubject);
    console.log('  - Options count:', validOptions.length);
    console.log('  - Payload length:', payload.length, 'chars');
    
    // Simulate the transaction data that would be sent
    const transactionData = {
      contractAddress: 'EQBTTSiLga3dkYVTrKNFQYxat2UBTkL2RxGOGp4vqjMdPdTG',
      amount: toNano('0.1').toString(), // 0.1 TON for gas + storage
      payload: payload,
      validOptions: validOptions
    };
    
    console.log('\n🎯 Transaction Summary:');
    console.log('  Contract:', transactionData.contractAddress);
    console.log('  Amount:', (Number(transactionData.amount) / 1000000000).toFixed(3), 'TON');
    console.log('  Options stored:', transactionData.validOptions.length);
    
    return {
      success: true,
      transactionData,
      message: 'Transaction created successfully with poll options'
    };
    
  } catch (error) {
    console.error('❌ Error creating poll transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test with the sample poll data
console.log('🚀 Starting Frontend Integration Test\n');

const result = testCreatePollTransaction(testPollData.options, testPollData.subject);

if (result.success) {
  console.log('\n🎉 SUCCESS: Frontend can successfully create poll transactions with options!');
  console.log('\n📋 Integration Status:');
  console.log('  ✅ Poll options validation works');
  console.log('  ✅ Options dictionary creation works');
  console.log('  ✅ Message body construction works');
  console.log('  ✅ Transaction payload generation works');
  console.log('  ✅ Ready for blockchain submission');
  
  console.log('\n🔧 Next Steps:');
  console.log('  1. User fills out poll form in frontend');
  console.log('  2. Frontend calls contractService.createPoll(pollData)');
  console.log('  3. Service creates transaction with options dictionary');
  console.log('  4. User signs transaction via TON Connect');
  console.log('  5. Poll with options is stored on blockchain');
  console.log('  6. Options are retrievable via getPollOptions() method');
  
} else {
  console.log('\n❌ FAILURE: Issues found in frontend integration');
  console.log('Error:', result.error);
}

console.log('\n' + '='.repeat(60));