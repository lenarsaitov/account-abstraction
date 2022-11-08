// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Account recovery implementation
/// @author Lenar Saitov
contract AccountRecovery is Ownable, AccessControl{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");
    address[] private trustedAccounts;

    constructor(){
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    struct Voting{
        bool isActual;
        address candidate;
        uint256 countVotesFor;
        mapping(address => bool) voteUnique;
    }

    Voting private voting;

    /**
     * @return count of trusted accounts.
     */
    function getCountTrustedAccounts() external view returns (uint256){
        return trustedAccounts.length;
    }

    /**
     * Only for trusted account
     * @return does trusted account voted or not.
     * @param _voter address of trusted account
     */
    function isVoted(address _voter) external onlyRole(TRUSTED_ACCOUNT_ROLE) view returns (bool){
        return voting.voteUnique[_voter];
    }

    /**
     * Only for trusted account
     * @return voting started or not.
     */
    function isVoteStarted() external onlyRole(TRUSTED_ACCOUNT_ROLE) view returns (bool){
        return voting.isActual;
    }

    function _resetVotes() private{
        voting.countVotesFor = 0;

        for (uint256 i = 0; i < trustedAccounts.length; ++i) {
            voting.voteUnique[trustedAccounts[i]] = false;
        }
    }

    /**
     * Execute init of recovery of ownership of the wallet (change of ownership), only for trusted account
     * @param _candidate the address of new assumed account (new assumed owner wallets)
     */
    function initRecovery(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(this.owner() != _candidate, "There is the same address");
        _resetVotes();

        voting.isActual = true;
        voting.candidate = _candidate;
    }

    /**
     * Execute reset the recovery of ownership of the wallet (only for trusted account)
     */
    function resetAnyRecovery() external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        _resetVotes();

        voting.isActual = false;
        voting.candidate = address(0);
    }

    /**
     * Add agreement to change of ownership (only for trusted account)
     * @param _candidate the address of new assumed account (new assumed owner wallets)
     */
    function voteRecovery(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(voting.isActual, "Recovery was not inited");
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

    // Modifier for revoke (see AccessControl docs) trusted role and delete account from trusted accounts set
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


    /**
     * Renounce role by account self (permission only for self)
     * @param _role the role of account
     * @param _accountAddress the address of account (should be only == msg.sender)
     */
    function renounceRole(bytes32 _role, address _accountAddress) public override onlyRole(TRUSTED_ACCOUNT_ROLE) toRevokeTrustedRoleAccount(_role, _accountAddress){
        require(_accountAddress == _msgSender(), "AccessControl: can only renounce roles for self");
    }

    /**
     * Revoke role (permission only for admin)
     * @param _role the role of account
     * @param _accountAddress the address of account
     */
    function revokeRole(bytes32 _role, address _accountAddress) public override onlyRole(DEFAULT_ADMIN_ROLE) toRevokeTrustedRoleAccount(_role, _accountAddress){
    }

    /**
     * Grant role (permission only for admin)
     * @param _role the role of account
     * @param _accountAddress the address of account
     */
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

/**
 * @title Basic smart contract-based wallet implementation
 * @author Lenar Saitov
*/
contract EOAccount is AccountRecovery{
    IERC20 public token;

    constructor (IERC20 _token) {
        token = _token;
    }


    /**
     * Fill fund (only by owner)
     */
    function fillFund() external onlyOwner payable{
    }

    /**
     * Withdraw all funds (only by owner)
     */
    function withdrawAll() external onlyOwner{
        payable(address(msg.sender)).transfer(address(this).balance);
    }

    /**
     * Withdraw all funds (only by owner)
     */
    function totalAmount() external view onlyOwner returns(uint256){
        return address(this).balance;
    }

    /**
     * Get count of tokens (only by owner)
     */
    function countTokens() public view onlyOwner returns(uint256) {
        return token.balanceOf(msg.sender);
    }

    /**
     * Get tokens (only by owner)
     * @param _amount the amount of tokens
     */
    function getTokens(uint256 _amount) external onlyOwner{
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= token.balanceOf(address(this)), "Not enough tokens in token balance");

        token.transfer(msg.sender, _amount);
    }

    /**
     * Get tokens (only by owner)
     * @param _recipient the address of recipient
     * @param _amount the amount of tokens
     */
    function sendTokens(address _recipient, uint256 _amount) external onlyOwner{
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= countTokens(), "Not enough tokens");

        token.transferFrom(msg.sender, _recipient, _amount);
    }

    /**
     * approveDebitTokens (only by owner)
     * @param _spender the address of spender
     * @param _amount the amount of tokens
     */
    function approveDebitTokens(address _spender, uint256 _amount) external onlyOwner {
        require(_amount > 0, "Need to send at least some tokens");
        require(_amount <= countTokens(), "Not enough tokens");

        token.approve(_spender, _amount);
    }
}