const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleToken", function () {
  let simpleToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const SimpleToken = await ethers.getContractFactory("SimpleToken");
    simpleToken = await SimpleToken.deploy("SimpleToken", "STK", owner.address);
    await simpleToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await simpleToken.name()).to.equal("SimpleToken");
      expect(await simpleToken.symbol()).to.equal("STK");
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await simpleToken.balanceOf(owner.address);
      expect(await simpleToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct decimals", async function () {
      expect(await simpleToken.decimals()).to.equal(18);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await simpleToken.transfer(addr1.address, ethers.parseEther("50"));
      const addr1Balance = await simpleToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.parseEther("50"));

      // Transfer 50 tokens from addr1 to addr2
      await simpleToken.connect(addr1).transfer(addr2.address, ethers.parseEther("50"));
      const addr2Balance = await simpleToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.parseEther("50"));
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await simpleToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens)
      await expect(
        simpleToken.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.reverted;

      // Owner balance shouldn't have changed
      expect(await simpleToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Minting and Burning", function () {
    it("Should mint new tokens", async function () {
      const initialSupply = await simpleToken.totalSupply();

      await simpleToken.mint(addr1.address, ethers.parseEther("1000"));

      expect(await simpleToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("1000"));
      expect(await simpleToken.totalSupply()).to.equal(initialSupply + ethers.parseEther("1000"));
    });

    it("Should burn tokens", async function () {
      const initialSupply = await simpleToken.totalSupply();

      // First transfer some tokens to addr1
      await simpleToken.transfer(addr1.address, ethers.parseEther("1000"));

      // Then burn them
      await simpleToken.connect(addr1).burn(ethers.parseEther("500"));

      expect(await simpleToken.balanceOf(addr1.address)).to.equal(ethers.parseEther("500"));
      expect(await simpleToken.totalSupply()).to.equal(initialSupply - ethers.parseEther("500"));
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        simpleToken.connect(addr1).mint(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(simpleToken, "OwnableUnauthorizedAccount");
    });
  });
});