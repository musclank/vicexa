const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VICEXA Token Factory", function () {
  async function deployFactory() {
    const Factory = await ethers.getContractFactory("VicexaTokenFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();
    return factory;
  }

  it("creates a fixed-supply ERC-20 and allocates all supply to its creator", async function () {
    const [creator, recipient] = await ethers.getSigners();
    const factory = await deployFactory();
    const supply = 1_000_000n;
    const decimals = 18;

    const tx = await factory.createToken("Frontier Token", "FRONT", supply, decimals);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find(parsed => parsed && parsed.name === "TokenCreated");

    expect(event).to.not.equal(undefined);
    expect(event.args.creator).to.equal(creator.address);
    expect(event.args.name).to.equal("Frontier Token");
    expect(event.args.symbol).to.equal("FRONT");
    expect(event.args.initialSupply).to.equal(supply);
    expect(event.args.decimals).to.equal(decimals);

    const token = await ethers.getContractAt("VicexaToken", event.args.token);
    expect(await token.name()).to.equal("Frontier Token");
    expect(await token.symbol()).to.equal("FRONT");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(supply * 10n ** 18n);
    expect(await token.balanceOf(creator.address)).to.equal(supply * 10n ** 18n);
    expect(await token.balanceOf(recipient.address)).to.equal(0n);
  });

  it("supports custom decimals and transfers", async function () {
    const [creator, recipient] = await ethers.getSigners();
    const factory = await deployFactory();
    const tx = await factory.createToken("Unit Token", "UNIT", 2500, 6);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find(parsed => parsed && parsed.name === "TokenCreated");
    const token = await ethers.getContractAt("VicexaToken", event.args.token);

    expect(await token.decimals()).to.equal(6);
    expect(await token.totalSupply()).to.equal(2500n * 10n ** 6n);
    await token.transfer(recipient.address, 100n * 10n ** 6n);
    expect(await token.balanceOf(recipient.address)).to.equal(100n * 10n ** 6n);
  });

  it("rejects invalid token symbols", async function () {
    const factory = await deployFactory();
    await expect(factory.createToken("Bad Symbol", "bad!", 1000, 18))
      .to.be.revertedWith("Invalid symbol");
    await expect(factory.createToken("Bad Symbol", "A", 1000, 18))
      .to.be.revertedWith("Invalid symbol");
    await expect(factory.createToken("Bad Symbol", "TOOLONGSYMBOL", 1000, 18))
      .to.be.revertedWith("Invalid symbol");
  });

  it("rejects invalid names, zero supply, and decimals above 18", async function () {
    const factory = await deployFactory();
    await expect(factory.createToken("", "EMPTY", 1000, 18))
      .to.be.revertedWith("Invalid name");
    await expect(factory.createToken("Zero Supply", "ZERO", 0, 18))
      .to.be.revertedWith("Supply must be positive");
    await expect(factory.createToken("Too Many Decimals", "DEC", 1000, 19))
      .to.be.revertedWith("Decimals above 18");
  });

  it("does not expose an additional mint function", async function () {
    const factory = await deployFactory();
    const tx = await factory.createToken("Fixed Token", "FIX", 100, 18);
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => {
      try { return factory.interface.parseLog(log); } catch { return null; }
    }).find(parsed => parsed && parsed.name === "TokenCreated");
    const token = await ethers.getContractAt("VicexaToken", event.args.token);
    expect(token.interface.hasFunction("mint")).to.equal(false);
  });
});
