const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying SimpleToken111...");

  // 构造函数参数
  const tokenName = "SimpleToken";
  const tokenSymbol = "STK";

  // 部署合约
  const args = [tokenName, tokenSymbol, deployer];

  const simpleToken = await deploy("SimpleToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log(`SimpleToken deployed at ${simpleToken.address}`);

  // 验证合约（只在测试网和主网）
  if (network.config.chainId !== 1337 && process.env.ETHERSCAN_API_KEY) {
    log("Verifying contract...");
    await verify(simpleToken.address, args);
  }

  log("----------------------------------------------------");
};

module.exports.tags = ["simple1"];