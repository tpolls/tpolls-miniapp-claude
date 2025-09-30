# Jetton Poll Creation Test Suite

This directory contains comprehensive test scripts for testing jetton poll creation functionality.

## 🧪 Test Files

### 1. `jettonPollCreationTest.js`
**Comprehensive Node.js Test Suite**
- Full test coverage for jetton utilities
- Mock contract interactions
- Performance testing
- Analytics validation
- Data transformation testing

**Usage:**
```javascript
import { runJettonPollCreationTests } from './jettonPollCreationTest.js';
await runJettonPollCreationTests();
```

### 2. `browserJettonTest.js`
**Browser-based Testing**
- Interactive browser console tests
- Real-time transaction simulation
- Visual feedback
- Development environment integration

**Usage in Browser Console:**
```javascript
// Load the script and run tests
testJettonPolls.runAll();

// Run individual tests
testJettonPolls.testAddresses();
testJettonPolls.testTransformation();
testJettonPolls.testTransactions();
```

### 3. `../public/test-jetton-polls.html`
**Interactive Test Dashboard**
- Visual test interface
- Real-time results display
- Interactive controls
- Browser-based testing

**Access:**
```bash
npm run test:jetton
# Then open: http://localhost:3000/test-jetton-polls.html
```

## 🎯 Test Coverage

### Jetton Address Validation
- ✅ Custom Jetton: `EQDiYefKbljzJeBgLAB6Y4AYSRrgnFQnqdCKhHCw8fk987hQ`
- ✅ USDT on TON: `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`
- ✅ USDC on TON: `EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728`
- ✅ Notcoin: `EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT`

### Poll Data Transformation
- ✅ TON native token polls
- ✅ Custom jetton polls
- ✅ USDT stablecoin polls
- ✅ Notcoin community polls
- ✅ Reward amount validation
- ✅ Address mapping verification

### Transaction Flow Testing
- ✅ Mock transaction creation
- ✅ Payload generation
- ✅ Contract interaction simulation
- ✅ Error handling validation
- ✅ Success response processing

### Analytics Integration
- ✅ Token selection tracking
- ✅ Poll creation events
- ✅ Transaction events
- ✅ Error tracking
- ✅ Performance metrics

## 🚀 Quick Start

### Method 1: Interactive Dashboard (Recommended)
```bash
npm run test:jetton
```
Open `http://localhost:3000/test-jetton-polls.html` and click "Run All Tests"

### Method 2: Browser Console
1. Start development server: `npm run dev`
2. Open browser console
3. Load the browser test script
4. Run: `testJettonPolls.runAll()`

### Method 3: Node.js (Advanced)
```bash
cd src/tests
node jettonPollCreationTest.js
```

## 📊 Test Results

### Expected Output
```
🧪 Jetton Address Mapping Test
✅ jetton-custom: Valid address
✅ jetton-usdt: Valid address
✅ jetton-usdc: Valid address
✅ jetton-not: Valid address

🔄 Poll Data Transformation Test
✅ TON Native Poll: Transformation successful
✅ Custom Jetton Poll: Transformation successful
✅ USDT Poll: Transformation successful
✅ Notcoin Poll: Transformation successful

💰 Transaction Flow Test
✅ All transaction simulations passed

📊 Analytics Tracking Test
✅ All events tracked correctly

🏁 Test Suite Complete: 16/16 passed (100.0%)
🎉 All tests passed! Jetton poll creation is ready.
```

## 🛠️ Test Scenarios

### 1. TON Native Token Poll
```javascript
{
  subject: 'Should we implement dark mode?',
  options: ['Yes', 'No', 'Maybe'],
  rewardToken: 'ton',
  rewardAmount: '0.1'
}
```

### 2. Custom Jetton Poll
```javascript
{
  subject: 'Best blockchain game?',
  options: ['Telegram Mini Apps', 'Web3 Games', 'NFT Games'],
  rewardToken: 'jetton-custom',
  jettonRewardAmount: '1000'
}
```

### 3. USDT Stablecoin Poll
```javascript
{
  subject: 'Preferred payment method?',
  options: ['Credit Card', 'Crypto', 'Bank Transfer'],
  rewardToken: 'jetton-usdt',
  jettonRewardAmount: '5.00'
}
```

### 4. Notcoin Community Poll
```javascript
{
  subject: 'Best meme coin feature?',
  options: ['Tap to Earn', 'Community Mining', 'Viral Marketing'],
  rewardToken: 'jetton-not',
  jettonRewardAmount: '100000'
}
```

## 🔧 Troubleshooting

### Common Issues

**❌ Address validation fails**
- Check jetton addresses in `jettonUtils.js`
- Verify addresses start with "EQ" and are 48+ characters

**❌ Transformation tests fail**
- Ensure reward amounts are valid numbers
- Check token type mapping in contract transformer

**❌ Transaction tests fail**
- Verify mock contract address is valid
- Check transaction payload format

**❌ Analytics tests fail**
- Ensure analytics utilities are properly imported
- Check event tracking function availability

### Debug Mode
Enable verbose logging by setting:
```javascript
window.DEBUG_JETTON_TESTS = true;
```

## 📈 Performance Benchmarks

- **Address Validation**: < 1ms per address
- **Data Transformation**: < 0.5ms per poll
- **Transaction Creation**: < 5ms per transaction
- **Full Test Suite**: < 10 seconds

## 🔄 Continuous Testing

Add to your CI/CD pipeline:
```yaml
test:
  script:
    - npm run build
    - npm run test:jetton
    - # Add automated test verification
```

## 📋 Test Checklist

Before deployment, ensure:
- [ ] All jetton addresses are valid
- [ ] Token symbol mapping is correct
- [ ] Decimal places are properly handled
- [ ] Contract integration works
- [ ] Analytics events are tracked
- [ ] Error handling is robust
- [ ] Performance is acceptable

## 🎯 Next Steps

1. **Manual Testing**: Create actual polls with different jettons
2. **Integration Testing**: Test with real TON Connect wallet
3. **Contract Testing**: Deploy and test on TON testnet
4. **User Testing**: Get feedback from beta users

---

**Happy Testing! 🚀**