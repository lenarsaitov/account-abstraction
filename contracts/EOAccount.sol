// SPDX-License-Identifier: MIT

pragma solidity^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EOAccount is AccessControl, Ownable{
    bytes32 public constant TRUSTED_ACCOUNT_ROLE = keccak256("TRUSTED_ACCOUNT_ROLE");
    address[] public trustedAccounts;
    IERC20 public token;

    struct Voting{
        bool isActual;
        address candidate;
        uint256 countVotesFor;
        mapping(address => bool) voteUnique;
    }

    Voting public voting;

    constructor(string memory _name, string memory _symbol, address[] memory _trustedAccounts){
        for (uint256 i = 0; i < _trustedAccounts.length; ++i) {
            _setupRole(TRUSTED_ACCOUNT_ROLE, _trustedAccounts[i]);
            trustedAccounts.push(_trustedAccounts[i]);
        }

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        token = new ERC20(_name, _symbol);
    }

    // Fill amount
    function fillAmount() external payable{
    }

    // Get total amount of contract
    function totalAmount() external view returns(uint256){
        return address(this).balance;
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
    function endAnyRecoveryAccount() external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        _resetVotes();

        voting.isActual = false;
        voting.candidate = address(0);
    }

    // End voting to recovery account
    function _endAnyRecoveryAccount() private {
        _resetVotes();

        voting.isActual = false;
        voting.candidate = address(0);
    }

    // Add vote to recovery account
    function voteRecoveryAccount(address _candidate) external onlyRole(TRUSTED_ACCOUNT_ROLE) {
        require(voting.isActual, "Vote recovery was not started");
        require(!voting.voteUnique[msg.sender], "You already voted");

        if (_candidate != voting.candidate){
            _endAnyRecoveryAccount();

            require(false, "There is not actual candidate for recover, this voting is canceling, so start new voting");
        }

        voting.countVotesFor++;
        voting.voteUnique[msg.sender] = true;

        if (voting.countVotesFor == trustedAccounts.length){
            _revokeRole(DEFAULT_ADMIN_ROLE, this.owner());
            _setupRole(DEFAULT_ADMIN_ROLE, _candidate);
            _transferOwnership(_candidate);

            voting.isActual = false;
        }
    }

    //TODO revoke and renounce logic (delete from trustedAccounts and voting.voteUnique)
    //TODO grant role logic (add to trustedAccounts and voting.voteUnique)
}