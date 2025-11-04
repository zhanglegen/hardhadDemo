module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying SimpleToken222...");

  // 构造函数参数
  const tokenName = "SimpleToken";
  const tokenSymbol = "STK";

  // 部署合约
  const args = [tokenName, tokenSymbol, deployer];

  const simpleToken = await deploy("SimpleToken", {
    from: deployer,
    args: args,
    log: true,
  });

  log(`SimpleToken deployed at ${simpleToken.address}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["simple2"];