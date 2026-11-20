const hre = require("hardhat");

async function main() {
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Set DEPLOYER_PRIVATE_KEY in your local environment before deploying.");
  }

  const network = await hre.ethers.provider.getNetwork();
  if (Number(network.chainId) !== 84532) {
    throw new Error(`Refusing deployment: expected Base Sepolia (84532), got chain ${network.chainId}.`);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying VICEXA Token Factory from:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("VicexaTokenFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const address = await factory.getAddress();
  console.log("VICEXA Token Factory deployed to:", address);
  console.log(`Verify on BaseScan: https://sepolia.basescan.org/address/${address}`);
  console.log("Add this address to Cloudflare Pages as VITE_BASE_SEPOLIA_FACTORY_ADDRESS.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
