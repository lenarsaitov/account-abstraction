# Solidity API

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

### Recovery

```solidity
struct Recovery {
  bool isActual;
  address candidate;
  uint256 countVotesFor;
  mapping(address => bool) voteUnique;
}
```

### recovery

```solidity
struct AccountRecovery.Recovery recovery
```

### getCountTrustedAccounts

```solidity
function getCountTrustedAccounts() external view returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | count of trusted accounts. |

### isVoted

```solidity
function isVoted(address _voter) external view returns (bool)
```

Only for trusted account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _voter | address | address of trusted account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | does trusted account voted or not |

### isRecoveryInitialized

```solidity
function isRecoveryInitialized() external view returns (bool)
```

Only for trusted account.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | recovery initialized or not |

### _resetVotes

```solidity
function _resetVotes() private
```

### initRecovery

```solidity
function initRecovery(address _candidate) external
```

Execute init of recovery of ownership of the wallet (transfer of ownership), only for trusted account.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _candidate | address | the address of new assumed account (new assumed owner wallets) |

### resetAnyRecovery

```solidity
function resetAnyRecovery() external
```

Execute reset the recovery of ownership of the wallet (only for trusted account).

### voteRecovery

```solidity
function voteRecovery(address _candidate) external
```

Add agreement to transfer of ownership (only for trusted account). Also transfer ownership if all trusted accounts taken agree and finalize recovery proccess.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _candidate | address | the address of new assumed account (new assumed owner wallets) |

### toRevokeTrustedRoleAccount

```solidity
modifier toRevokeTrustedRoleAccount(bytes32 _role, address _accountAddress)
```

### renounceRole

```solidity
function renounceRole(bytes32 _role, address _accountAddress) public
```

Renounce role by account self (permission only for self).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | the role of account |
| _accountAddress | address | the address of account (should be only == msg.sender) |

### revokeRole

```solidity
function revokeRole(bytes32 _role, address _accountAddress) public
```

Revoke role (permission only for admin)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | the role of account |
| _accountAddress | address | the address of account |

### grantRole

```solidity
function grantRole(bytes32 _role, address _accountAddress) public
```

Grant role (permission only for admin).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _role | bytes32 | the role of account |
| _accountAddress | address | the address of account |

## EOAccount

### token

```solidity
contract IERC20 token
```

### constructor

```solidity
constructor(contract IERC20 _token) public
```

### fillFund

```solidity
function fillFund() external payable
```

Fill fund (only by owner).

### withdrawAll

```solidity
function withdrawAll() external
```

Withdraw all funds (only by owner).

### totalAmount

```solidity
function totalAmount() external view returns (uint256)
```

Withdraw all funds (only by owner).

### countTokens

```solidity
function countTokens() public view returns (uint256)
```

Get count of tokens (only by owner).

### getTokens

```solidity
function getTokens(uint256 _amount) external
```

Get tokens (only by owner).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | the amount of tokens |

### enoughTokens

```solidity
modifier enoughTokens(uint256 _amount)
```

### sendTokens

```solidity
function sendTokens(address _recipient, uint256 _amount) external
```

Get tokens (only by owner).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recipient | address | the address of recipient |
| _amount | uint256 | the amount of tokens |

### approveDebitTokens

```solidity
function approveDebitTokens(address _spender, uint256 _amount) external
```

Approve debit tokens (only by owner).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _spender | address | the address of spender |
| _amount | uint256 | the amount of tokens |

