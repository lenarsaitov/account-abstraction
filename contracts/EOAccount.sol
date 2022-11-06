// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EOAccount is AccessControl, Ownable{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");

    constructor(address[] memory relativeAccounts){
        for (uint256 i = 0; i < relativeAccounts.length; ++i) {
            _setupRole(TRUSTED_ACCOUNT_ROLE, relativeAccounts[i]);
            countAccount++;
        }

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    mapping(address => uint256) voteRecover;
    uint256 public countAccount;

    // fill amount
    function fillAmount() external payable{
    }

    // get total amount of contract
    function totalAmount() external view returns(uint256){
        return address(this).balance;
    }

    // start voting
    function startRecoveryAccount(address _to) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        voteRecover[_to] = 0;
    }

    // add vote
    function voteRecoveryAccount(address _from, address _to) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        voteRecover[_to]++;

        if (voteRecover[_to] == countAccount){
            _setupRole(DEFAULT_ADMIN_ROLE, _to);
            _revokeRole(DEFAULT_ADMIN_ROLE, _from);
        }
    }
}