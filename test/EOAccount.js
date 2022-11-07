const { expect } = require("chai");
const { ethers } = require("hardhat");
const { string } = require("hardhat/internal/core/params/argumentTypes");

let accounts
let EAAccountsContract
let myEAAccountsContract
let adminRole
let trustedRole
let amount = 1000

describe("EOAccount", function (){
  beforeEach(async function(){
    accounts = await ethers.getSigners();

    EAAccountsContract = await ethers.getContractFactory("EOAccount", accounts[0])
    myEAAccountsContract = await EAAccountsContract.deploy("Test token", "TTN")

    await myEAAccountsContract.deployed()

    adminRole = await myEAAccountsContract.DEFAULT_ADMIN_ROLE()
    trustedRole = await myEAAccountsContract.TRUSTED_ACCOUNT_ROLE()

    expect(await myEAAccountsContract.owner()).to.equal(accounts[0].address)
    await myEAAccountsContract.grantRole(trustedRole, accounts[1].address)
    await myEAAccountsContract.grantRole(trustedRole, accounts[2].address)
    await myEAAccountsContract.grantRole(trustedRole, accounts[3].address)
  })

  describe("Main logic", function(){
    describe("Amount of smart contract functionallity", function(){
      it("Fill amount is correct", async function(){
        await myEAAccountsContract.fillAmount({value: amount})
        expect(await myEAAccountsContract.totalAmount()).to.equal(amount)
      })
  
      it("Fill amount without amount", async function(){
        await myEAAccountsContract.fillAmount()
        expect(await myEAAccountsContract.totalAmount()).to.equal(0)
      })

      it("Withdraw amount is correct", async function(){
        await myEAAccountsContract.fillAmount({value: amount})
        expect(await myEAAccountsContract.withdrawAll())
        expect(await myEAAccountsContract.totalAmount()).to.equal(0)
      })
    })

    describe("Recover voting", function(){
      it("Full recovery correct voting by trusted accounts", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
    
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[3]).voteRecoveryAccount(accounts[10].address)

        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(true)

        expect(await myEAAccountsContract.owner()).to.equal(accounts[10].address)
      })
    
      it("Not full recovery correct voting by trusted accounts", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)

        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)
    
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("See voted trusted account by trusted account", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)

        expect(await myEAAccountsContract.connect(accounts[1]).isVoted(accounts[2].address)).to.equal(true)
      })

      it("Dont see voted trusted account by admin account", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)

        await expect(myEAAccountsContract.connect(accounts[0]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont see voted trusted account by alias account", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)

        await expect(myEAAccountsContract.connect(accounts[10]).isVoted(accounts[2].address)).to.reverted
      })

      it("Dont voting recovery when double votes by trusted account", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        
        await expect(myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })
      
      it("Dont voting recovery (by trusted account) when vote to other candidate than was when start recovery", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)

        await expect(myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[11].address)).to.be.reverted
      })

      it("Dont start recovery (by trusted account) to candidate with the equal to owner", async function(){
        await expect(myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[0].address)).to.be.reverted
      })

      it("Dont voting recovery (by trusted account) when vote to other (admin) candidate than was when start recovery", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await expect(myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[0].address)).to.be.reverted
      })

      it("Dont start recovery by admin account", async function(){
        await expect(myEAAccountsContract.connect(accounts[0]).startRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Dont vote to recovery by admin account", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await expect(myEAAccountsContract.connect(accounts[0]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Dont vote recovery when voting doesnt started", async function(){   
        await expect(myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Reset recovery when voting recovery not finished", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        expect(await myEAAccountsContract.connect(accounts[1]).isVoteStarted()).to.equal(true)
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).resetAnyRecoveryAccount()
    
        expect(await myEAAccountsContract.connect(accounts[1]).isVoteStarted()).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("Reset recovery when voting recovery not started", async function(){
        expect(await myEAAccountsContract.connect(accounts[1]).isVoteStarted()).to.equal(false)
        await myEAAccountsContract.connect(accounts[2]).resetAnyRecoveryAccount()
        expect(await myEAAccountsContract.connect(accounts[1]).isVoteStarted()).to.equal(false)

        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("Reset recovery dont when admin request", async function(){
        await expect(myEAAccountsContract.connect(accounts[0]).resetAnyRecoveryAccount()).to.be.reverted
      })

      it("Reset recovery dont when alias request", async function(){
        await expect(myEAAccountsContract.connect(accounts[10]).resetAnyRecoveryAccount()).to.be.reverted
      })

      it("Is vote started check by trusted account", async function(){
        expect(await myEAAccountsContract.connect(accounts[1]).isVoteStarted()).to.equal(false)
      })

      it("Is vote started dont check by admin account", async function(){
        await expect(myEAAccountsContract.connect(accounts[0]).isVoteStarted()).to.be.reverted
      })

      it("Is vote started dont check by alias account", async function(){
        await expect(myEAAccountsContract.connect(accounts[10]).isVoteStarted()).to.be.reverted
      })

    })
  })

  describe("Standart AccessControl", function(){
    describe("Accounts have correct roles", function(){
      it("Accounts have right role", async function(){
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[2].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[3].address)).to.equal(true)
      })
    
      it("Accounts dont have wrong role", async function(){
        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[0].address)).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[1].address)).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[2].address)).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[3].address)).to.equal(false)
      })  
    })
  
    it("Correct transfer ownership by owner", async function(){
      await myEAAccountsContract.transferOwnership(accounts[5].address)

      expect(await myEAAccountsContract.owner()).to.equal(accounts[5].address)
    })
  
    it("Correct dont transfer ownership by trusted", async function(){
      await expect(myEAAccountsContract.connect(accounts[1]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    it("Correct dont transfer ownership by alias", async function(){
      await expect(myEAAccountsContract.connect(accounts[10]).transferOwnership(accounts[5].address)).to.be.reverted
    })

    describe("Grant role", function(){
      it("Correct grant role by admin", async function(){
        await myEAAccountsContract.grantRole(trustedRole, accounts[5].address)

        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[5].address)).to.equal(true)
        expect(await myEAAccountsContract.getCountTrustedAccounts()).to.equal(4)
      })
    
      it("Correct dont grant role by trusted", async function(){
        await expect(myEAAccountsContract.connect(accounts[2]).grantRole(trustedRole, accounts[5].address)).to.be.reverted
      })
    
      it("Correct dont grant role by alies", async function(){
        await expect(myEAAccountsContract.connect(accounts[7]).grantRole(trustedRole, accounts[5].address)).to.be.reverted
      })  
    })
  
    describe("Revoke role", function(){
      it("Correct revoke trusted account role by admin", async function(){
        await myEAAccountsContract.revokeRole(trustedRole, accounts[1].address)

        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(false)
        expect(await myEAAccountsContract.getCountTrustedAccounts()).to.equal(2)
      })
  
      it("Correct dont revoke trusted account role by this trusted", async function(){
        await expect(myEAAccountsContract.connect(accounts[1]).revokeRole(trustedRole, accounts[1].address)).to.be.reverted
      })
  
      it("Correct dont revoke trusted account role by other trusted", async function(){
        await expect(myEAAccountsContract.connect(accounts[2]).revokeRole(trustedRole, accounts[1].address)).to.be.reverted
      })
    })
  
    describe("Renounce role", function(){
      it("Correct renounce role by trusted account", async function(){
        await myEAAccountsContract.connect(accounts[1]).renounceRole(trustedRole, accounts[1].address)

        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(false)
        expect(await myEAAccountsContract.getCountTrustedAccounts()).to.equal(2)
      })
    
      it("Correct dont renounce role by admin", async function(){
        await expect(myEAAccountsContract.renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    
      it("Correct dont renounce role by alias account", async function(){
        await expect(myEAAccountsContract.connect(accounts[6]).renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    })
  })
});


