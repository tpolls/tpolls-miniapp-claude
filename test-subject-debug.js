/**
 * Test script to debug subject retrieval from contract
 */

const { Address, Dictionary } = require('@ton/core');
const { TonClient } = require('@ton/ton');
require('dotenv').config();

// Test contract service for debugging subject retrieval
class TestContractService {
  constructor() {
    this.contractAddress = 'EQBTTSiLga3dkYVTrKNFQYxat2UBTkL2RxGOGp4vqjMdPdTG';
    
    // Initialize TON client
    const network = 'testnet';
    const toncenterEndpoint = 'https://testnet.toncenter.com/api/v2/jsonRPC';

    this.client = new TonClient({
      endpoint: toncenterEndpoint,
      apiKey: process.env.VITE_TONCENTER_API_KEY
    });
    
    console.log('TestContractService initialized');
    console.log(`- Contract: ${this.contractAddress}`);
    console.log(`- Network: ${network}`);
  }

  async debugPollRetrieval(pollId) {
    try {
      const contractAddress = Address.parse(this.contractAddress);
      
      console.log(`\n🔍 Debugging poll ${pollId} retrieval...`);
      
      const pollResult = await this.client.runMethod(contractAddress, 'getPoll', [
        { type: 'int', value: BigInt(pollId) }
      ]);
      
      console.log('📊 Raw poll result structure:');
      console.log('  - exit_code:', pollResult.exit_code);
      console.log('  - gas_used:', pollResult.gas_used);
      console.log('  - stack type:', typeof pollResult.stack);
      console.log('  - stack remaining:', pollResult.stack?.remaining);
      console.log('📊 Exit code:', pollResult.exit_code);
      console.log('📊 Stack:', pollResult.stack);
      console.log('📊 Stack remaining:', pollResult.stack?.remaining);
      
      if (pollResult.stack && pollResult.stack.remaining > 0) {
        try {
          const pollTuple = pollResult.stack.readTupleOpt();
          console.log('📊 Poll tuple:', pollTuple);
          console.log('📊 Tuple remaining:', pollTuple?.remaining);
          
          if (pollTuple) {
            // Try to read each field step by step
            console.log('\n🔍 Reading tuple fields...');
            
            const parsedPollId = Number(pollTuple.readBigNumber());
            console.log('1️⃣ Poll ID:', parsedPollId);
            console.log('   Remaining after poll ID:', pollTuple.remaining);
            
            const creator = pollTuple.readAddress();
            console.log('2️⃣ Creator:', creator.toString());
            console.log('   Remaining after creator:', pollTuple.remaining);
            
            // Try different methods to read the subject
            console.log('\n🔍 Attempting to read subject...');
            try {
              const subject = pollTuple.readStringRefTail();
              console.log('3️⃣ Subject (readStringRefTail):', subject);
            } catch (e) {
              console.log('❌ Failed with readStringRefTail:', e.message);
              
              try {
                const subject = pollTuple.readString();
                console.log('3️⃣ Subject (readString):', subject);
              } catch (e2) {
                console.log('❌ Failed with readString:', e2.message);
                
                try {
                  const subjectCell = pollTuple.readCell();
                  console.log('3️⃣ Subject cell:', subjectCell);
                  const subjectSlice = subjectCell.beginParse();
                  const subject = subjectSlice.loadStringTail();
                  console.log('3️⃣ Subject (loadStringTail from cell):', subject);
                } catch (e3) {
                  console.log('❌ Failed with cell approach:', e3.message);
                }
              }
            }
          }
        } catch (parseError) {
          console.log('❌ Could not parse poll tuple:', parseError.message);
        }
      } else {
        console.log('❌ No stack data or empty stack');
      }
      
    } catch (error) {
      console.error('❌ Error debugging poll retrieval:', error.message);
    }
  }
}

async function runDebugTest() {
  console.log('🧪 Testing Subject Retrieval Debug');
  console.log('===================================');
  
  const service = new TestContractService();
  
  // Test a few poll IDs
  for (let pollId = 1; pollId <= 3; pollId++) {
    await service.debugPollRetrieval(pollId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay to avoid rate limiting
  }
}

runDebugTest().catch(console.error);