const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy ShibMemeToken
  const ShibMemeToken = await hre.ethers.getContractFactory("ShibMemeToken");

  // Set up wallet addresses for tax distribution
  // In production, these should be different addresses
  const marketingWallet = deployer.address;
  const developmentWallet = deployer.address;
  const liquidityWallet = deployer.address;

  console.log("Deploying ShibMemeToken...");
  const token = await ShibMemeToken.deploy(
    marketingWallet,
    developmentWallet,
    liquidityWallet
  );

  await token.deployed();

  console.log("ShibMemeToken deployed to:", token.address);
  console.log("Contract owner:", deployer.address);
  console.log("Marketing wallet:", marketingWallet);
  console.log("Development wallet:", developmentWallet);
  console.log("Liquidity wallet:", liquidityWallet);

  // Get initial token stats
  const stats = await token.getTokenStats();
  console.log("\nInitial Token Stats:");
  console.log("Total Supply:", ethers.utils.formatEther(stats.currentSupply), "SHIBME");
  console.log("Buy Tax Rate:", stats.buyTaxRate.toString(), "basis points");
  console.log("Sell Tax Rate:", stats.sellTaxRate.toString(), "basis points");
  console.log("Transfer Tax Rate:", stats.transferTaxRate.toString(), "basis points");
  console.log("Trading Active:", stats.tradingActive);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: token.address,
    deployerAddress: deployer.address,
    marketingWallet: marketingWallet,
    developmentWallet: developmentWallet,
    liquidityWallet: liquidityWallet,
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${hre.network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });