// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EOAccount is AccessControl, Ownable{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");
    address[] private trustedAccounts;
    IERC20 private token;

    constructor(string memory _name, string memory _symbol){
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        token = new ERC20(_name, _symbol);
    }

    struct Voting{
        bool isActual;
        address candidate;
        uint256 countVotesFor;
        mapping(address => bool) voteUnique;
    }

    Voting private voting;

    // Fill amount
    function fillAmount() external payable{
    }

    // Withdraw amount
    function withdrawAmount(uint amount) external onlyOwner{
        require(amount < address(this).balance, "Amount of contract less than sended amount");

        payable(address(msg.sender)).transfer(amount);
    }

    // Get total amount of contract
    function totalAmount() external view returns(uint256){
        return address(this).balance;
    }

    // Get count of trusted accounts
    function getCountTrustedAccounts() external view returns (uint256){
        return trustedAccounts.length;
    }

    // Get understand whether he voted or not
    function isVoted(address _voter) external onlyRole(TRUSTED_ACCOUNT_ROLE) view returns (bool){
        return voting.voteUnique[_voter];
    }

    function _resetVotes() private{
        voting.countVotesFor = 0;

        for (uint256 i = 0; i < trustedAccounts.length; ++i) {
            voting.voteUnique[trustedAccounts[i]] = false;
        }
    }

    // Start voting to recovery account
    function startRecoveryAccount(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(this.owner() != _candidate, "There is the same address");
        _resetVotes();

        voting.isActual = true;
        voting.candidate = _candidate;
    }

    // End voting to recovery account
    function resetAnyRecoveryAccount() external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        _resetVotes();

        voting.isActual = false;
        voting.candidate = address(0);
    }

    // Add vote to recovery account
    function voteRecoveryAccount(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(voting.isActual, "Vote recovery was not started");
        require(!voting.voteUnique[msg.sender], "You already voted");
        require(_candidate == voting.candidate, "There is not actual candidate for recover, this voting is canceling, so start new voting");

        voting.countVotesFor++;
        voting.voteUnique[msg.sender] = true;

        if (voting.countVotesFor == trustedAccounts.length){
            _revokeRole(DEFAULT_ADMIN_ROLE, this.owner());
            _setupRole(DEFAULT_ADMIN_ROLE, _candidate);
            _transferOwnership(_candidate);

            voting.isActual = false;
        }
    }

    function _revokeTrustedRoleAccount(bytes32 _role, address _accountAddress) private{
        _revokeRole(_role, _accountAddress);
        if (_role == TRUSTED_ACCOUNT_ROLE){
            for (uint256 i = 0; i < trustedAccounts.length; ++i) {
                if (_accountAddress == trustedAccounts[i]){
                    voting.voteUnique[_accountAddress] = false;
                    trustedAccounts[i] = trustedAccounts[trustedAccounts.length-1];
                    trustedAccounts.pop();

                    break;
                }
            }
        }
    }

    function renounceRole(bytes32 _role, address _accountAddress) public virtual override{
        require(_accountAddress == _msgSender(), "AccessControl: can only renounce roles for self");

        _revokeTrustedRoleAccount(_role, _accountAddress);
    }

    function revokeRole(bytes32 _role, address _accountAddress) public virtual override{
        require(hasRole(getRoleAdmin(_role), _msgSender()), "AccessControl: sender must be an admin to revoke");

        _revokeTrustedRoleAccount(_role, _accountAddress);
    }

    function grantRole(bytes32 _role, address _accountAddress) public virtual override{
        require(hasRole(getRoleAdmin(_role), _msgSender()), "AccessControl: sender must be an admin to grant");

        _grantRole(_role, _accountAddress);
        if (_role == TRUSTED_ACCOUNT_ROLE){
            for (uint256 i = 0; i < trustedAccounts.length; ++i) {
                require(_accountAddress != trustedAccounts[i], "This account address is already trusted account role");
            }
        }

        trustedAccounts.push(_accountAddress);
    }
}