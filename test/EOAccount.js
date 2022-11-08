const { expect } = require("chai");
const { ethers } = require("hardhat");
const { string } = require("hardhat/internal/core/params/argumentTypes");

const { deployMockContract } = require('@ethereum-waffle/mock-contract');
const IERC20 = require('../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json');

let accounts
let EOAccountsContract
let myEOAccountsContract
let adminRole
let trustedRole
let amount = 1000
let mockERC20

describe("EOAccount", function (){
  beforeEach(async function(){
    accounts = await ethers.getSigners();

    mockERC20 = await deployMockContract(accounts[10], IERC20.abi);

    EOAccountsContract = await ethers.getContractFactory("EOAccount", accounts[0])
    myEOAccountsContract = await EOAccountsContract.deploy(mockERC20.address)

    await myEOAccountsContract.deployed()
    adminRole = await myEOAccountsContract.DEFAULT_ADMIN_ROLE()
    trustedRole = await myEOAccountsContract.TRUSTED_ACCOUNT_ROLE()

    expect(await myEOAccountsContract.owner()).to.equal(accounts[0].address)
    await myEOAccountsContract.grantRole(trustedRole, accounts[1].address)
    await myEOAccountsContract.grantRole(trustedRole, accounts[2].address)
    await myEOAccountsContract.grantRole(trustedRole, accounts[3].address)
  })

  describe("Main logic", function(){
    describe("Balance", function(){
      it("Fill amount by owner", async function(){
        await myEOAccountsContract.fillFund({value: amount})
        expect(await myEOAccountsContract.totalAmount()).to.equal(amount)
      })
  
      it("Fill amount without amount by owner", async function(){
        await myEOAccountsContract.fillFund()
        expect(await myEOAccountsContract.totalAmount()).to.equal(0)
      })

      it("Dont fill amount by other", async function(){
        await expect(myEOAccountsContract.connect(accounts[1]).fillFund({value: amount})).to.be.reverted
      })

      it("Withdraw amount by owner", async function(){
        await myEOAccountsContract.fillFund({value: amount})
        expect(await myEOAccountsContract.withdrawAll())
        expect(await myEOAccountsContract.totalAmount()).to.equal(0)
      })

      it("Dont withdraw amount by other", async function(){
        await myEOAccountsContract.fillFund({value: amount})
        await expect(myEOAccountsContract.connect(accounts[1]).withdrawAll()).to.be.reverted
      })

      it("Dont get total amount by other", async function(){
        await expect(myEOAccountsContract.connect(accounts[1]).totalAmount()).to.be.reverted
      })
    })

    describe("Token interaction", function(){
      it("Token amount", async function(){
        await mockERC20.mock.balanceOf.returns(amount)
        expect(await myEOAccountsContract.totalAmountTokens()).to.equal(amount)
      })

      it("Withdraw all tokens", async function(){
        await mockERC20.mock.transferFrom.returns(true)
        await mockERC20.mock.balanceOf.returns(0)
        await myEOAccountsContract.withdrawAllTokens()
        expect(await myEOAccountsContract.totalAmountTokens()).to.equal(0)
      })

      it("Get tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.transfer.returns(true)
        await myEOAccountsContract.getTokens(amount)
      })

      it("Dont get 0 tokens by owner", async function(){
        await expect(myEOAccountsContract.getTokens(0)).to.be.reverted
      })

      it("Dont get tokens when by other", async function(){
        await expect(myEOAccountsContract.connect(accounts[2]).getTokens(amount)).to.be.reverted
      })

      it("Send tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.transferFrom.returns(true)
        await myEOAccountsContract.sendTokens(accounts[1].address, amount)
      })

      it("Dont send 0 tokens by owner", async function(){
        await expect(myEOAccountsContract.sendTokens(accounts[1].address, 0)).to.be.reverted
      })

      it("Dont send tokens when by other", async function(){
        await expect(myEOAccountsContract.connect(accounts[2]).sendTokens(accounts[1].address, amount)).to.be.reverted
      })

      it("Approve debbiting tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.approve.withArgs(accounts[1].address, amount).returns(true)
        await myEOAccountsContract.approveDebitTokens(accounts[1].address, amount)
      })

      it("Dont approve debbiting tokens when by other", async function(){
        await expect(myEOAccountsContract.approveDebitTokens(accounts[1].address, amount)).to.be.reverted
      })
    })

    describe("Recover ownership", function(){
      it("Full recovery correct voting by trusted accounts", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
    
        await myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[3]).voteRecovery(accounts[10].address)

        expect(await myEOAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(false)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(true)

        expect(await myEOAccountsContract.owner()).to.equal(accounts[10].address)
      })
    
      it("Not full recovery correct voting by trusted accounts", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)

        await myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[10].address)
    
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("See voted trusted account by trusted account", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        expect(await myEOAccountsContract.connect(accounts[1]).isVoted(accounts[2].address)).to.equal(true)
      })

      it("Dont see voted trusted account by admin account", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        await expect(myEOAccountsContract.connect(accounts[0]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont see voted trusted account by alias account", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        await expect(myEOAccountsContract.connect(accounts[10]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont voting recovery when double votes by trusted account", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        
        await expect(myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)).to.be.reverted
      })
      
      it("Dont voting recovery (by trusted account) when vote to other candidate than was when init recovery", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)

        await expect(myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[11].address)).to.be.reverted
      })

      it("Dont init recovery (by trusted account) to candidate with the equal to owner", async function(){
        await expect(myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[0].address)).to.be.reverted
      })

      it("Dont voting recovery (by trusted account) when vote to other (admin) candidate than was when init recovery", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await expect(myEOAccountsContract.connect(accounts[2]).voteRecovery(accounts[0].address)).to.be.reverted
      })

      it("Dont init recovery by admin account", async function(){
        await expect(myEOAccountsContract.connect(accounts[0]).initRecovery(accounts[10].address)).to.be.reverted
      })

      it("Dont vote to recovery by admin account", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await expect(myEOAccountsContract.connect(accounts[0]).voteRecovery(accounts[10].address)).to.be.reverted
      })

      it("Dont vote recovery when recovery wasnt initialized", async function(){   
        await expect(myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)).to.be.reverted
      })

      it("Reset recovery when recovery not finished", async function(){
        await myEOAccountsContract.connect(accounts[1]).initRecovery(accounts[10].address)
        expect(await myEOAccountsContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(true)
        await myEOAccountsContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myEOAccountsContract.connect(accounts[2]).resetAnyRecovery()
    
        expect(await myEOAccountsContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("Reset recovery when recovery not initialized", async function(){
        expect(await myEOAccountsContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
        await myEOAccountsContract.connect(accounts[2]).resetAnyRecovery()
        expect(await myEOAccountsContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)

        expect(await myEOAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("Reset recovery dont when admin request", async function(){
        await expect(myEOAccountsContract.connect(accounts[0]).resetAnyRecovery()).to.be.reverted
      })

      it("Reset recovery dont when alias request", async function(){
        await expect(myEOAccountsContract.connect(accounts[10]).resetAnyRecovery()).to.be.reverted
      })

      it("Is recovery initialized check by trusted account", async function(){
        expect(await myEOAccountsContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
      })

      it("Is recovery initialized dont check by admin account", async function(){
        await expect(myEOAccountsContract.connect(accounts[0]).isRecoveryInitialized()).to.be.reverted
      })

      it("Is recovery initialized dont check by alias account", async function(){
        await expect(myEOAccountsContract.connect(accounts[10]).isRecoveryInitialized()).to.be.reverted
      })

    })
  })

  describe("Standart AccessControl", function(){
    describe("Accounts have correct roles", function(){
      it("Accounts have right role", async function(){
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[2].address)).to.equal(true)
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[3].address)).to.equal(true)
      })
    
      it("Accounts dont have wrong role", async function(){
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[0].address)).to.equal(false)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[1].address)).to.equal(false)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[2].address)).to.equal(false)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[3].address)).to.equal(false)
      })  
    })
  
    it("Transfer ownership by owner", async function(){
      await myEOAccountsContract.transferOwnership(accounts[5].address)

      expect(await myEOAccountsContract.owner()).to.equal(accounts[5].address)
    })
  
    it("Dont transfer ownership by trusted", async function(){
      await expect(myEOAccountsContract.connect(accounts[1]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    it("Dont transfer ownership by alias", async function(){
      await expect(myEOAccountsContract.connect(accounts[10]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    describe("Grant role", function(){
      it("Grant trusted role by admin", async function(){
        await myEOAccountsContract.grantRole(trustedRole, accounts[5].address)
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[5].address)).to.equal(true)
        expect(await myEOAccountsContract.getCountTrustedAccounts()).to.equal(4)
      })
    
      it("Grant admin role by admin", async function(){
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[5].address)).to.equal(false)
        await myEOAccountsContract.grantRole(adminRole, accounts[5].address)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[5].address)).to.equal(true)
      })

      it("Dont grant trusted role by admin, becouse double granting", async function(){
        await myEOAccountsContract.grantRole(trustedRole, accounts[5].address)
        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[5].address)).to.equal(true)
        await expect(myEOAccountsContract.grantRole(trustedRole, accounts[5].address)).to.be.reverted
      })

      it("Dont grant trusted role by trusted", async function(){
        await expect(myEOAccountsContract.connect(accounts[2]).grantRole(trustedRole, accounts[5].address)).to.be.reverted
      })
    
      it("Dont grant trusted role by alies", async function(){
        await expect(myEOAccountsContract.connect(accounts[7]).grantRole(trustedRole, accounts[5].address)).to.be.reverted
      })  
    })
  
    describe("Revoke role", function(){
      it("Revoke trusted account role by admin", async function(){
        await myEOAccountsContract.revokeRole(trustedRole, accounts[1].address)

        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(false)
        expect(await myEOAccountsContract.getCountTrustedAccounts()).to.equal(2)
      })
  
      it("Dont revoke trusted account role by this trusted", async function(){
        await expect(myEOAccountsContract.connect(accounts[1]).revokeRole(trustedRole, accounts[1].address)).to.be.reverted
      })
  
      it("Dont revoke trusted account role by other trusted", async function(){
        await expect(myEOAccountsContract.connect(accounts[2]).revokeRole(trustedRole, accounts[1].address)).to.be.reverted
      })
    })
  
    describe("Renounce role", function(){
      it("Renounce role by trusted account", async function(){
        await myEOAccountsContract.connect(accounts[1]).renounceRole(trustedRole, accounts[1].address)

        expect(await myEOAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(false)
        expect(await myEOAccountsContract.getCountTrustedAccounts()).to.equal(2)
      })
    
      it("Renounce not exists role by trusted account", async function(){
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[1].address)).to.equal(false)
        myEOAccountsContract.connect(accounts[1]).renounceRole(adminRole, accounts[1].address)
        expect(await myEOAccountsContract.hasRole(adminRole, accounts[1].address)).to.equal(false)
      })

      it("Dont renounce role by admin", async function(){
        await expect(myEOAccountsContract.renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    
      it("Dont renounce trusted role by other trusted account", async function(){
        await expect(myEOAccountsContract.connect(accounts[1]).renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })

      it("Dont renounce role by alias account", async function(){
        await expect(myEOAccountsContract.connect(accounts[6]).renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    })
  })
});


