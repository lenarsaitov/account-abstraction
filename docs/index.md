# Solidity API

## Balance

### fillAmount

```solidity
function fillAmount() external payable
```

Fill amount

### withdrawAll

```solidity
function withdrawAll() external
```

Withdraw amount

### totalAmount

```solidity
function totalAmount() external view returns (uint256)
```

Returns total amount of contract

## AccountRecovery

### TRUSTED_ACCOUNT_ROLE

```solidity
bytes32 TRUSTED_ACCOUNT_ROLE
```

### trustedAccounts

```solidity
address[] trustedAccounts
```

### constructor

```solidity
constructor() public
```

### Voting

```solidity
struct Voting {
  bool isActual;
  address candidate;
  uint256 countVotesFor;
  mapping(address => bool) voteUnique;
}
```

### voting

```solidity
struct AccountRecovery.Voting voting
```

### getCountTrustedAccounts

```solidity
function getCountTrustedAccounts() external view returns (uint256)
```

Returns count of trusted accounts

### isVoted

```solidity
function isVoted(address _voter) external view returns (bool)
```

Returns bool: understand whether he voted or not

### isVoteStarted

```solidity
function isVoteStarted() external view returns (bool)
```

Returns bool: voting started or not

### _resetVotes

```solidity
function _resetVotes() private
```

### startRecoveryAccount

```solidity
function startRecoveryAccount(address _candidate) external
```

Start voting to recovery account

### resetAnyRecoveryAccount

```solidity
function resetAnyRecoveryAccount() external
```

End voting to recovery account

### voteRecoveryAccount

```solidity
function voteRecoveryAccount(address _candidate) external
```

Add vote to recovery account

### toRevokeTrustedRoleAccount

```solidity
modifier toRevokeTrustedRoleAccount(bytes32 _role, address _accountAddress)
```

Modifier for revoke (see AccessControl docs) and delete account from trusted accounts set

### renounceRole

```solidity
function renounceRole(bytes32 _role, address _accountAddress) public
```

Renounce some role from account (only by self account)

### revokeRole

```solidity
function revokeRole(bytes32 _role, address _accountAddress) public
```

Revoke some role from account (only by admin)

### grantRole

```solidity
function grantRole(bytes32 _role, address _accountAddress) public
```

Grant some role to account (only by admin)

## EOAccount

### token

```solidity
contract IERC20 token
```

### constructor

```solidity
constructor(contract IERC20 _token) public
```

### countTokens

```solidity
function countTokens() public view returns (uint256)
```

Returns count of tokens in this smart-contract

### getTokens

```solidity
function getTokens(uint256 _amount) external
```

Get tokens

### sendTokens

```solidity
function sendTokens(address recipient, uint256 _amount) external
```

Send tokens

### approveDebitTokens

```solidity
function approveDebitTokens(address spender, uint256 _amount) external
```

Approve debit transaction

