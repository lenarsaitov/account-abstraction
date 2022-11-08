const { expect } = require("chai");
const { ethers } = require("hardhat");
const { string } = require("hardhat/internal/core/params/argumentTypes");

const { deployMockContract } = require('@ethereum-waffle/mock-contract');
const IERC20 = require('../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json');

let accounts
let CAWalletContract
let myCAWalletContract
let amount = 1000
let mockERC20

describe("CAWallet", function (){
  beforeEach(async function(){
    accounts = await ethers.getSigners();

    mockERC20 = await deployMockContract(accounts[10], IERC20.abi);

    CAWalletContract = await ethers.getContractFactory("CAWallet", accounts[0])
    myCAWalletContract = await CAWalletContract.deploy(mockERC20.address)

    await myCAWalletContract.deployed()

    expect(await myCAWalletContract.owner()).to.equal(accounts[0].address)
    await myCAWalletContract.grantTrustedRole(accounts[1].address)
    await myCAWalletContract.grantTrustedRole(accounts[2].address)
    await myCAWalletContract.grantTrustedRole(accounts[3].address)
  })

  describe("Main logic", function(){
    describe("Fund balance", function(){
      it("Fill amount by owner", async function(){
        await myCAWalletContract.fillFund({value: amount})
        expect(await myCAWalletContract.totalAmount()).to.equal(amount)
      })
  
      it("Fill amount without amount by owner", async function(){
        await myCAWalletContract.fillFund()
        expect(await myCAWalletContract.totalAmount()).to.equal(0)
      })

      it("Dont fill amount by other", async function(){
        await expect(myCAWalletContract.connect(accounts[1]).fillFund({value: amount})).to.be.reverted
      })

      it("Withdraw amount by owner", async function(){
        await myCAWalletContract.fillFund({value: amount})
        expect(await myCAWalletContract.withdrawAll())
        expect(await myCAWalletContract.totalAmount()).to.equal(0)
      })

      it("Dont withdraw amount by other", async function(){
        await myCAWalletContract.fillFund({value: amount})
        await expect(myCAWalletContract.connect(accounts[1]).withdrawAll()).to.be.reverted
      })

      it("Dont get total amount by other", async function(){
        await expect(myCAWalletContract.connect(accounts[1]).totalAmount()).to.be.reverted
      })
    })

    describe("Token interaction", function(){
      it("Token amount", async function(){
        await mockERC20.mock.balanceOf.returns(amount)
        expect(await myCAWalletContract.totalAmountTokens()).to.equal(amount)
      })

      it("Withdraw all tokens", async function(){
        await mockERC20.mock.transferFrom.returns(true)
        await mockERC20.mock.balanceOf.returns(0)
        await myCAWalletContract.withdrawAllTokens()
        expect(await myCAWalletContract.totalAmountTokens()).to.equal(0)
      })

      it("Get tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.transfer.returns(true)
        await myCAWalletContract.getTokens(amount)
      })

      it("Dont get 0 tokens by owner", async function(){
        await expect(myCAWalletContract.getTokens(0)).to.be.reverted
      })

      it("Dont get tokens when by other", async function(){
        await expect(myCAWalletContract.connect(accounts[2]).getTokens(amount)).to.be.reverted
      })

      it("Send tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.transferFrom.returns(true)
        await myCAWalletContract.sendTokens(accounts[1].address, amount)
      })

      it("Dont send 0 tokens by owner", async function(){
        await expect(myCAWalletContract.sendTokens(accounts[1].address, 0)).to.be.reverted
      })

      it("Dont send tokens when by other", async function(){
        await expect(myCAWalletContract.connect(accounts[2]).sendTokens(accounts[1].address, amount)).to.be.reverted
      })

      it("Approve debbiting tokens by owner", async function(){
        await mockERC20.mock.balanceOf.returns(2*amount)
        await mockERC20.mock.approve.withArgs(accounts[1].address, amount).returns(true)
        await myCAWalletContract.approveDebitTokens(accounts[1].address, amount)
      })

      it("Dont approve debbiting tokens when by other", async function(){
        await expect(myCAWalletContract.approveDebitTokens(accounts[1].address, amount)).to.be.reverted
      })
    })

    describe("Recover ownership", function(){
      it("Full recovery correct voting by trusted accounts", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
    
        await myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[3]).voteRecovery(accounts[10].address)

        expect(await myCAWalletContract.hasAdminRole(accounts[0].address)).to.equal(false)
        expect(await myCAWalletContract.hasAdminRole(accounts[10].address)).to.equal(true)

        expect(await myCAWalletContract.owner()).to.equal(accounts[10].address)
      })
    
      it("Not full recovery correct voting by trusted accounts", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)

        await myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[10].address)
    
        expect(await myCAWalletContract.hasAdminRole(accounts[0].address)).to.equal(true)
        expect(await myCAWalletContract.hasAdminRole(accounts[10].address)).to.equal(false)
      })

      it("See voted trusted account by trusted account", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        expect(await myCAWalletContract.connect(accounts[1]).isVoted(accounts[2].address)).to.equal(true)
      })

      it("Dont see voted trusted account by admin account", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        await expect(myCAWalletContract.connect(accounts[0]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont see voted trusted account by alias account", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[10].address)

        await expect(myCAWalletContract.connect(accounts[10]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont voting recovery when double votes by trusted account", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        
        await expect(myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)).to.be.reverted
      })
      
      it("Dont voting recovery (by trusted account) when vote to other candidate than was when init recovery", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)

        await expect(myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[11].address)).to.be.reverted
      })

      it("Dont init recovery (by trusted account) to candidate with the equal to owner", async function(){
        await expect(myCAWalletContract.connect(accounts[1]).initRecovery(accounts[0].address)).to.be.reverted
      })

      it("Dont voting recovery (by trusted account) when vote to other (admin) candidate than was when init recovery", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await expect(myCAWalletContract.connect(accounts[2]).voteRecovery(accounts[0].address)).to.be.reverted
      })

      it("Dont init recovery by admin account", async function(){
        await expect(myCAWalletContract.connect(accounts[0]).initRecovery(accounts[10].address)).to.be.reverted
      })

      it("Dont vote to recovery by admin account", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)    
        await expect(myCAWalletContract.connect(accounts[0]).voteRecovery(accounts[10].address)).to.be.reverted
      })

      it("Dont vote recovery when recovery wasnt initialized", async function(){   
        await expect(myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)).to.be.reverted
      })

      it("Reset recovery when recovery not finished", async function(){
        await myCAWalletContract.connect(accounts[1]).initRecovery(accounts[10].address)
        expect(await myCAWalletContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(true)
        await myCAWalletContract.connect(accounts[1]).voteRecovery(accounts[10].address)
        await myCAWalletContract.connect(accounts[2]).resetAnyRecovery()
    
        expect(await myCAWalletContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
        expect(await myCAWalletContract.hasAdminRole(accounts[0].address)).to.equal(true)
        expect(await myCAWalletContract.hasAdminRole(accounts[10].address)).to.equal(false)
      })

      it("Reset recovery when recovery not initialized", async function(){
        expect(await myCAWalletContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
        await myCAWalletContract.connect(accounts[2]).resetAnyRecovery()
        expect(await myCAWalletContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)

        expect(await myCAWalletContract.hasAdminRole(accounts[0].address)).to.equal(true)
        expect(await myCAWalletContract.hasAdminRole(accounts[10].address)).to.equal(false)
      })

      it("Reset recovery dont when admin request", async function(){
        await expect(myCAWalletContract.connect(accounts[0]).resetAnyRecovery()).to.be.reverted
      })

      it("Reset recovery dont when alias request", async function(){
        await expect(myCAWalletContract.connect(accounts[10]).resetAnyRecovery()).to.be.reverted
      })

      it("Is recovery initialized check by trusted account", async function(){
        expect(await myCAWalletContract.connect(accounts[1]).isRecoveryInitialized()).to.equal(false)
      })

      it("Is recovery initialized dont check by admin account", async function(){
        await expect(myCAWalletContract.connect(accounts[0]).isRecoveryInitialized()).to.be.reverted
      })

      it("Is recovery initialized dont check by alias account", async function(){
        await expect(myCAWalletContract.connect(accounts[10]).isRecoveryInitialized()).to.be.reverted
      })

    })
  })

  describe("Standart AccessControl", function(){
    describe("Accounts have correct roles", function(){
      it("Accounts have right role", async function(){
        expect(await myCAWalletContract.hasAdminRole(accounts[0].address)).to.equal(true)
        expect(await myCAWalletContract.hasTrustedRole(accounts[1].address)).to.equal(true)
        expect(await myCAWalletContract.hasTrustedRole(accounts[2].address)).to.equal(true)
        expect(await myCAWalletContract.hasTrustedRole(accounts[3].address)).to.equal(true)
      })
    
      it("Accounts dont have wrong role", async function(){
        expect(await myCAWalletContract.hasTrustedRole(accounts[0].address)).to.equal(false)
        expect(await myCAWalletContract.hasAdminRole(accounts[1].address)).to.equal(false)
        expect(await myCAWalletContract.hasAdminRole(accounts[2].address)).to.equal(false)
        expect(await myCAWalletContract.hasAdminRole(accounts[3].address)).to.equal(false)
      })  
    })
  
    it("Transfer ownership by owner", async function(){
      await myCAWalletContract.transferOwnership(accounts[5].address)

      expect(await myCAWalletContract.owner()).to.equal(accounts[5].address)
    })
  
    it("Dont transfer ownership by trusted", async function(){
      await expect(myCAWalletContract.connect(accounts[1]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    it("Dont transfer ownership by alias", async function(){
      await expect(myCAWalletContract.connect(accounts[10]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    describe("Grant role", function(){
      it("Grant trusted role by admin", async function(){
        await myCAWalletContract.grantTrustedRole(accounts[5].address)
        expect(await myCAWalletContract.hasTrustedRole(accounts[5].address)).to.equal(true)
        expect(await myCAWalletContract.getCountTrustedAccounts()).to.equal(4)
      })

      it("Dont grant trusted role by admin to slef", async function(){
        await expect(myCAWalletContract.grantTrustedRole(accounts[0].address)).to.be.reverted
      })

      it("Dont grant trusted role by admin, becouse double granting", async function(){
        await myCAWalletContract.grantTrustedRole(accounts[5].address)
        expect(await myCAWalletContract.hasTrustedRole(accounts[5].address)).to.equal(true)
        await expect(myCAWalletContract.grantTrustedRole(accounts[5].address)).to.be.reverted
      })

      it("Dont grant trusted role by trusted", async function(){
        await expect(myCAWalletContract.connect(accounts[2]).grantTrustedRole(accounts[5].address)).to.be.reverted
      })
    
      it("Dont grant trusted role by alies", async function(){
        await expect(myCAWalletContract.connect(accounts[7]).grantTrustedRole(accounts[5].address)).to.be.reverted
      })  
    })
  
    describe("Revoke role", function(){
      it("Revoke trusted account role by admin", async function(){
        await myCAWalletContract.revokeTrustedRole(accounts[1].address)

        expect(await myCAWalletContract.hasTrustedRole(accounts[1].address)).to.equal(false)
        expect(await myCAWalletContract.getCountTrustedAccounts()).to.equal(2)
      })
  
      it("Dont revoke trusted account role by this trusted", async function(){
        await expect(myCAWalletContract.connect(accounts[1]).revokeTrustedRole(accounts[1].address)).to.be.reverted
      })
  
      it("Dont revoke trusted account role by other trusted", async function(){
        await expect(myCAWalletContract.connect(accounts[2]).revokeTrustedRole(accounts[1].address)).to.be.reverted
      })
    })
  })
});


