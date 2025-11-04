module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log("----------------------------------------------------");
  log("Deploying MetaNode...");


  // 部署合约
  const metaNode = await deploy("MetaNode", {
    from: deployer,
    log: true,
  });

  log(`MetaNode deployed at ${metaNode.address}`);
  log("----------------------------------------------------");
};

module.exports.tags = ["metaNode"];