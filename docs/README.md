# Contract API

## OwnershipRecovery

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

### grantTrustedRole

```solidity
function grantTrustedRole(address _accountAddress) external
```

Grant trusted role (permission only for admin).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _accountAddress | address | the address of account |

### revokeTrustedRole

```solidity
function revokeTrustedRole(address _accountAddress) external
```

Revoke trusted role (permission only for admin)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _accountAddress | address | the address of account |

### hasTrustedRole

```solidity
function hasTrustedRole(address _accountAddress) external view returns (bool)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _accountAddress | address | the address of account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Returns `true` if `account` has been granted `trusted role`. |

### hasAdminRole

```solidity
function hasAdminRole(address _accountAddress) external view returns (bool)
```

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _accountAddress | address | the address of account |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Returns `true` if `account` has been granted `admin role`. |

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

### totalAmount

```solidity
function totalAmount() external view returns (uint256)
```

Get amount of funds available in the contract (only by owner).

### withdrawAll

```solidity
function withdrawAll() external
```

Withdraw all funds (only by owner).

### totalAmountTokens

```solidity
function totalAmountTokens() public view returns (uint256)
```

Get amount of tokens available in the contract (only by owner).

### withdrawAllTokens

```solidity
function withdrawAllTokens() external
```

Withdraw all tokens from contract (only by owner).

### enoughTokens

```solidity
modifier enoughTokens(uint256 _amount)
```

### getTokens

```solidity
function getTokens(uint256 _amount) external
```

Get tokens (only by owner).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _amount | uint256 | the amount of tokens |

### sendTokens

```solidity
function sendTokens(address _recipient, uint256 _amount) external
```

Send tokens (only by owner).

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

