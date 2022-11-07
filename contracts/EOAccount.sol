// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Balance contract for interact with real ethers
/// @author Lenar Saitov
contract Balance is Ownable{
    /// @notice Fill amount
    function fillAmount() external onlyOwner payable{
    }

    /// @notice Withdraw amount
    function withdrawAll() external onlyOwner{
        payable(address(msg.sender)).transfer(address(this).balance);
    }

    /// @notice Returns total amount of contract
    function totalAmount() external view onlyOwner returns(uint256){
        return address(this).balance;
    }

}

/// @title AccountRecovery contract for implement recovery account by trusted accounts
/// @author Lenar Saitov
contract AccountRecovery is Ownable, AccessControl{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");
    address[] private trustedAccounts;

    constructor(){
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Struct for voting accounting
    struct Voting{
        bool isActual;
        address candidate;
        uint256 countVotesFor;
        mapping(address => bool) voteUnique;
    }

    Voting private voting;

    /// @notice Returns count of trusted accounts
    function getCountTrustedAccounts() external view returns (uint256){
        return trustedAccounts.length;
    }

    /// @notice Returns bool: understand whether he voted or not
    function isVoted(address _voter) external onlyRole(TRUSTED_ACCOUNT_ROLE) view returns (bool){
        return voting.voteUnique[_voter];
    }

    /// @notice Returns bool: voting started or not
    function isVoteStarted() external onlyRole(TRUSTED_ACCOUNT_ROLE) view returns (bool){
        return voting.isActual;
    }

    function _resetVotes() private{
        voting.countVotesFor = 0;

        for (uint256 i = 0; i < trustedAccounts.length; ++i) {
            voting.voteUnique[trustedAccounts[i]] = false;
        }
    }

    /// @notice Start voting to recovery account
    function startRecoveryAccount(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(this.owner() != _candidate, "There is the same address");
        _resetVotes();

        voting.isActual = true;
        voting.candidate = _candidate;
    }

    /// @notice End voting to recovery account
    function resetAnyRecoveryAccount() external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        _resetVotes();

        voting.isActual = false;
        voting.candidate = address(0);
    }

    /// @notice Add vote to recovery account
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

    /// @notice Modifier for revoke (see AccessControl docs) and delete account from trusted accounts set
    modifier toRevokeTrustedRoleAccount(bytes32 _role, address _accountAddress){
        _;
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

    /// @notice Renounce some role from account (only by self account)
    function renounceRole(bytes32 _role, address _accountAddress) public override onlyRole(TRUSTED_ACCOUNT_ROLE) toRevokeTrustedRoleAccount(_role, _accountAddress){
        require(_accountAddress == _msgSender(), "AccessControl: can only renounce roles for self");
    }

    /// @notice Revoke some role from account (only by admin)
    function revokeRole(bytes32 _role, address _accountAddress) public override onlyRole(DEFAULT_ADMIN_ROLE) toRevokeTrustedRoleAccount(_role, _accountAddress){
    }

    /// @notice Grant some role to account (only by admin)
    function grantRole(bytes32 _role, address _accountAddress) public override onlyRole(DEFAULT_ADMIN_ROLE){
        _grantRole(_role, _accountAddress);

        if (_role == TRUSTED_ACCOUNT_ROLE){
            for (uint256 i = 0; i < trustedAccounts.length; ++i) {
                require(_accountAddress != trustedAccounts[i], "This account address is already trusted account role");
            }
        }

        trustedAccounts.push(_accountAddress);
    }
}


/// @title EOAccount wallet contract for emulate account abstraction concept
/// @author Lenar Saitov
contract EOAccount is Balance, AccountRecovery{
    IERC20 public token;

    constructor (IERC20 _token) {
        token = _token;
    }

    /// @notice Returns count of tokens in this smart-contract
    function countTokens() public view onlyOwner returns(uint256) {
        return token.balanceOf(msg.sender);
    }

    /// @notice Get tokens
    function getTokens(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= token.balanceOf(address(this)), "Not enough tokens in token balance");

        token.transfer(msg.sender, _amount);
    }

    /// @notice Send tokens
    function sendTokens(address recipient, uint256 _amount) external onlyOwner{
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= countTokens(), "Not enough tokens");

        token.transferFrom(msg.sender, recipient, _amount);
    }

    /// @notice Approve debit transaction
    function approveDebitTokens(address spender, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= countTokens(), "Not enough tokens");

        token.approve(spender, _amount);
    }
}