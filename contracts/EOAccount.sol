// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EOAccount is AccessControl, Ownable{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");
    IERC20 public token;

    constructor(string memory _name, string memory _symbol, address[] memory _relativeAccounts){
        for (uint256 i = 0; i < _relativeAccounts.length; ++i) {
            _setupRole(TRUSTED_ACCOUNT_ROLE, _relativeAccounts[i]);
            countAccount++;
        }

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        token = new ERC20(_name, _symbol);
    }

    mapping(address => uint256) voteRecover;
    uint256 public countAccount;

    // Fill amount
    function fillAmount() external payable{
    }

    // Get total amount of contract
    function totalAmount() external view returns(uint256){
        return address(this).balance;
    }

    // Start voting to recovery account
    function startRecoveryAccount(address _to) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        voteRecover[_to] = 0;
    }

    // Add vote to recovery account
    function voteRecoveryAccount(address _from, address _to) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        voteRecover[_to]++;

        if (voteRecover[_to] == countAccount){
            _setupRole(DEFAULT_ADMIN_ROLE, _to);
            _revokeRole(DEFAULT_ADMIN_ROLE, _from);
        }
    }
}