const { deployments, upgrades, ethers,getNamedAccounts } = require("hardhat");

const fs = require("fs");
const path = require("path");

module.exports = async () => {
    const { save } = deployments
    const { deployer } = await getNamedAccounts(); // deployer 是地址字符串（如 0x123...）
    console.log("部署者地址:", deployer);
    //1、读取之前部署的代理合约地址
    //用 deployments.get 获取已保存的记录
    const proxyRecord = await deployments.get("MetaNodeStakeProxy");
    const proxyAddress = proxyRecord.address;
    console.log("获取到的代理合约地址：", proxyAddress);

    //2、拿到升级版的合约
    const metaNodeStakeV2 = await ethers.getContractFactory("MetaNodeStakeV2");
    //3、执行升级
    const upgraded = await upgrades.upgradeProxy(proxyAddress, metaNodeStakeV2);
    await upgraded.waitForDeployment();
    const upgradedAddress = await upgraded.getAddress();
    console.log("升级后的代理合约地址(无变化)：", upgradedAddress);
    //4、获取新的实现合约地址
    const newImplAddress = await upgrades.erc1967.getImplementationAddress(upgradedAddress);
    console.log("新的实现合约地址：", newImplAddress);
    //5、保存升级后合约信息到hardhat-deploy的记录中
    const abi = metaNodeStakeV2.interface.format("json");
    await save("MetaNodeStakeProxyV2", {
      abi,
      address: upgradedAddress,
      args:[newImplAddress]
    })
};


module.exports.tags = ["metaNodeStakeUpgrade"];