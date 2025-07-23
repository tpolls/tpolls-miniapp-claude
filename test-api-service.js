/**
 * Test TPolls API Service
 * Tests the new separated API service
 */

// Mock import.meta.env for Node.js
globalThis.import = {
  meta: {
    env: {
      VITE_TPOLLS_API: process.env.VITE_TPOLLS_API || 'https://tpolls-api.onrender.com/api'
    }
  }
};

import tpollsApi from './src/services/tpollsApi.js';

async function testApiService() {
  console.log('🧪 Testing TPolls API Service');
  console.log('=============================');
  
  try {
    // Test health status
    console.log('1️⃣ Testing API health status...');
    const health = await tpollsApi.getHealthStatus();
    console.log(`✅ API Available: ${health.available}`);
    console.log(`📊 Health Status:`, health);
    
    if (!health.available) {
      console.log('⚠️ API not available, skipping featured polls test');
      return;
    }
    
    // Test featured polls
    console.log('\n2️⃣ Testing featured polls retrieval...');
    const featuredPolls = await tpollsApi.getFeaturedPolls(2);
    
    console.log(`📊 Retrieved ${featuredPolls.length} featured polls:`);
    featuredPolls.forEach(poll => {
      console.log(`   📌 Poll ${poll.id}: "${poll.title}" (${poll.category || 'unknown'})`);
    });
    
    // Test cache
    console.log('\n3️⃣ Testing cache functionality...');
    const start = Date.now();
    await tpollsApi.getFeaturedPolls(2);
    const cachedTime = Date.now() - start;
    console.log(`⚡ Cached request took: ${cachedTime}ms`);
    
    // Test stats
    console.log('\n4️⃣ Testing API stats...');
    try {
      const stats = await tpollsApi.getStats();
      console.log(`📊 API Stats:`, stats);
    } catch (error) {
      console.log('⚠️ Stats not available:', error.message);
    }
    
    console.log('\n🎉 API Service tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApiService();