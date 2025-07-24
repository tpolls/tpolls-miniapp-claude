# TPolls Contract Opcodes Documentation

This document provides a comprehensive reference of all operation codes (opcodes) used in the TPolls smart contract system.

## Contract Information

- **Contract Address**: `EQAcDlO2BaUEtKW0Va2YJShs1pzlgHqz8SG1N9OUnGaL46vN`
- **Contract Name**: TPollsDapp
- **Network**: Testnet
- **Deployed**: 2025-07-24T07:20:13.171Z

## Opcodes Used in Frontend (`tpollsContractSimple.js`)

### 1. CreatePoll Operation
- **Opcode**: `1052480048`
- **Hex**: `0x3EC80050`
- **Location**: `src/services/tpollsContractSimple.js:293`
- **Purpose**: Creates a new poll on the blockchain
- **Message Structure**:
  ```javascript
  const messageBody = beginCell()
    .storeUint(1052480048, 32) // CreatePoll operation code
    .storeStringRefTail(pollSubject || '') // Poll subject
    .storeDict(optionsDict) // Options dictionary
    .storeUint(0, 257) // Reward per vote (0 for no rewards)
    .endCell();
  ```

### 2. Vote Operation
- **Opcode**: `1011836453`
- **Hex**: `0x3C4E0025`
- **Location**: `src/services/tpollsContractSimple.js:423`
- **Purpose**: Submits a vote for a specific poll option
- **Message Structure**:
  ```javascript
  const messageBody = beginCell()
    .storeUint(1011836453, 32) // Vote operation code
    .storeUint(pollId, 257) // Poll ID
    .storeUint(optionIndex, 257) // Selected option index
    .endCell();
  ```

## Complete Contract ABI Opcodes

The following opcodes are defined in the deployed contract ABI but may not all be implemented in the frontend:

### Message Types (Receivers)

| Message Type | Opcode | Hex | Purpose | Frontend Status |
|-------------|--------|-----|---------|----------------|
| `CreatePoll` | `1052480048` | `0x3EC80050` | Create a new poll | ✅ **Implemented** |
| `Vote` | `1011836453` | `0x3C4E0025` | Vote on a poll | ✅ **Implemented** |
| `ClaimReward` | `2912590077` | `0xAD9F7F7D` | Claim voting rewards | ❌ **Not Implemented** |
| `Deploy` | `2490013878` | `0x94665226` | Deploy contract | ❌ **Not Implemented** |
| `DeployOk` | `2952335191` | `0xAFFE05D7` | Deploy confirmation | ❌ **Not Implemented** |
| `FactoryDeploy` | `1829761339` | `0x6D0FF13B` | Factory deployment | ❌ **Not Implemented** |
| `ChangeOwner` | `2174598809` | `0x819DBEAB` | Change contract owner | ❌ **Not Implemented** |
| `ChangeOwnerOk` | `846932810` | `0x327B2B4A` | Owner change confirmation | ❌ **Not Implemented** |

### Event Types

| Event Type | Opcode | Hex | Purpose |
|-----------|--------|-----|---------|
| `VoteEvent` | `129220796` | `0x7B4CD3C` | Emitted when a vote is cast |

### Getter Methods (Method IDs)

| Method Name | Method ID | Purpose |
|------------|-----------|---------|
| `getPoll` | `66507` | Get poll data by ID |
| `getPollCount` | `70689` | Get total number of polls |
| `getPollResults` | `88698` | Get vote results for a poll |
| `getAllPolls` | `68479` | Get all polls |
| `getPollCreator` | `80454` | Get poll creator address |
| `getPollSubject` | `126287` | Get poll subject/title |
| `getPollOptions` | `88103` | Get poll options |
| `hasVoted` | `105179` | Check if address has voted |
| `getPollTotalVoters` | `69111` | Get total voter count |
| `getPollRewardPool` | `111814` | Get reward pool amount |
| `getPollRewardPerVote` | `79465` | Get reward per vote |
| `owner` | `83229` | Get contract owner |

## Frontend Implementation Status

### ✅ Implemented Operations
1. **Poll Creation** (`1052480048`) - Fully implemented with options support
2. **Voting** (`1011836453`) - Fully implemented with validation

### ❌ Not Implemented Operations
1. **Reward Claiming** (`2912590077`) - Contract supports rewards but frontend doesn't implement claiming
2. **Contract Management** - Owner operations not exposed in frontend

## Transaction Parameters

### CreatePoll Transaction
- **Gas Amount**: `0.05 TON`
- **Required Fields**: 
  - Subject (string)
  - Options (dictionary of cells)
  - Reward per vote (uint257)

### Vote Transaction
- **Gas Amount**: `0.02 TON`
- **Required Fields**:
  - Poll ID (uint257)
  - Option Index (uint257)

## Error Codes

The contract defines the following error codes:

| Code | Message |
|------|---------|
| `6923` | Poll does not exist |
| `19001` | Already voted in this poll |
| `40422` | No reward for this poll |
| `47054` | Option does not exist |
| `51965` | Insufficient reward pool |
| `56702` | Did not vote in this poll |

## Version History

### Current Version (2025-07-24)
- ✅ CreatePoll opcode: `1052480048` (corrected from `1810031829`)
- ✅ Vote opcode: `1011836453` (verified correct)
- ✅ Contract address: `EQAcDlO2BaUEtKW0Va2YJShs1pzlgHqz8SG1N9OUnGaL46vN`

### Previous Issues Fixed
- **Opcode Mismatch**: Frontend was using `1810031829` for CreatePoll, causing transaction failures
- **Contract Address**: Ensured frontend uses correct deployed contract address

## Notes for Developers

1. **Opcode Verification**: Always verify opcodes against the deployed contract ABI
2. **Transaction Failures**: Incorrect opcodes will cause "Failed" status in wallet
3. **Future Features**: Reward claiming functionality can be added using opcode `2912590077`
4. **Testing**: Use testnet contract for development and testing

## File Locations

- **Frontend Service**: `src/services/tpollsContractSimple.js`
- **Contract Source**: `../tpolls-contract-simple/contracts/main.tact`
- **Contract ABI**: `../tpolls-contract-simple/build/TPollsDapp_TPollsDapp.abi`
- **Deployment Info**: `../tpolls-contract-simple/deployments/testnet-deployment.json`