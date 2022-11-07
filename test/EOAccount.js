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
  
      it("Withdraw amount is correct", async function(){
        await myEAAccountsContract.fillAmount({value: 2*amount})
        expect(await myEAAccountsContract.withdrawAmount(amount))
        expect(await myEAAccountsContract.totalAmount()).to.equal(amount)
      })
  
      it("Withdraw amount is correct if ask amount more than total", async function(){
        await myEAAccountsContract.fillAmount({value: amount})
        await expect(myEAAccountsContract.withdrawAmount(2*amount)).to.be.rejected
      })
    })

    describe("Recover voting", function(){
      it("Correct full recovery voting", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
    
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[3]).voteRecoveryAccount(accounts[10].address)

        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(false)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(true)

        expect(await myEAAccountsContract.owner()).to.equal(accounts[10].address)
      })
    
      it("Correct not full recovery voting", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)

        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)
    
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
      })

      it("See voted by address", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[10].address)

        expect(await myEAAccountsContract.connect(accounts[1]).isVoted(accounts[2].address)).to.equal(true)
      })

      it("Incorrect double votes", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        
        await expect(myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Incorrect other candidate vote", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)

        await expect(myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[11].address)).to.be.reverted
      })

      it("Incorrect the start recovery by the equal same owner", async function(){
        await expect(myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[0].address)).to.be.reverted
      })

      it("Incorrect the same candidate (equal to owner) vote", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await expect(myEAAccountsContract.connect(accounts[2]).voteRecoveryAccount(accounts[0].address)).to.be.reverted
      })

      it("Incorrect the owner start recovery", async function(){   
        await expect(myEAAccountsContract.connect(accounts[0]).startRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Incorrect the owner do vote recovery", async function(){   
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)    
        await expect(myEAAccountsContract.connect(accounts[0]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Incorrect when vote recovery doesnt started", async function(){   
        await expect(myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)).to.be.reverted
      })

      it("Reset voting", async function(){
        await myEAAccountsContract.connect(accounts[1]).startRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[1]).voteRecoveryAccount(accounts[10].address)
        await myEAAccountsContract.connect(accounts[2]).resetAnyRecoveryAccount()
    
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[0].address)).to.equal(true)
        expect(await myEAAccountsContract.hasRole(adminRole, accounts[10].address)).to.equal(false)
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
  
    it("Correct transfer Ownership", async function(){
      await myEAAccountsContract.transferOwnership(accounts[5].address)

      expect(await myEAAccountsContract.owner()).to.equal(accounts[5].address)
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
      it("Correct renounce role by right person", async function(){
        await myEAAccountsContract.connect(accounts[1]).renounceRole(trustedRole, accounts[1].address)

        expect(await myEAAccountsContract.hasRole(trustedRole, accounts[1].address)).to.equal(false)
        expect(await myEAAccountsContract.getCountTrustedAccounts()).to.equal(2)
      })
    
      it("Correct dont renounce role by admin", async function(){
        await expect(myEAAccountsContract.renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    
      it("Correct dont renounce role by other person", async function(){
        await expect(myEAAccountsContract.connect(accounts[6]).renounceRole(trustedRole, accounts[2].address)).to.be.reverted
      })
    })
  })
});


