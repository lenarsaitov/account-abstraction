// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract EOAccount is AccessControl{
    bytes32 public constant RELATIVE_ACCOUNTS_ROLE = keccak256("RELATIVE_ACCOUNTS_ROLE");

    constructor(address[] memory relativeAccounts){
        for (uint256 i = 0; i < relativeAccounts.length; ++i) {
            _setupRole(RELATIVE_ACCOUNTS_ROLE, relativeAccounts[i]);
            countAccount++;
        }

        _setupRole(DEFAULT_ADMIN_ROLE, address(this));
    }

    mapping(address => uint256) balanceAccounts;
    mapping(address => uint256) voteRecover;
    uint256 public countAccount;

    // get total amount of contract
    function totalAmount() external view returns(uint256){
        return address(this).balance;
    }

    // fil amount
    function addAmount() external payable{
        balanceAccounts[msg.sender] = msg.value;
    }

    // start voting
    function startRecoveryAccount(address _to) external onlyRole(RELATIVE_ACCOUNTS_ROLE) {
        voteRecover[_to] = 0;
    }

    // add vote
    function voteRecoveryAccount(address _from, address _to) external onlyRole(RELATIVE_ACCOUNTS_ROLE) {
        voteRecover[_to]++;

        if (voteRecover[_to] > countAccount/2){
            _setupRole(RELATIVE_ACCOUNTS_ROLE, _to);
            balanceAccounts[_to] = balanceAccounts[_from];

            balanceAccounts[_from] = 0;
            _revokeRole(RELATIVE_ACCOUNTS_ROLE, _from);
        }
    }
}