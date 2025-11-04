const { deployments, upgrades, ethers,getNamedAccounts } = require("hardhat");

const fs = require("fs");
const path = require("path");

module.exports = async () => {
    //const [signer] = await ethers.getSigners();
     const { save } = deployments;
    const { deployer } = await getNamedAccounts(); // deployer 是地址字符串（如 0x123...）
    const signers = await ethers.getSigners();
    const deployerSigner = signers[0]; // 第 0 个签名者对应 deployer

    //1、获取已经部署的MetaNode合约地址
    const initMetaNodeToken = await ethers.getContractFactory('MetaNode')
    initMetaNodeTokenDeploy = await initMetaNodeToken.deploy()
    await initMetaNodeTokenDeploy.waitForDeployment();
    const metaNodeTokenAddress = await initMetaNodeTokenDeploy.getAddress();
    console.log("MetaNode地址："+metaNodeTokenAddress);
    //const metaNodeTokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


    // 2. 部署代理合约
    // 2.1 获取MetaNodeStake合约工厂
    const MetaNodeStake = await ethers.getContractFactory("MetaNodeStake");
    // 2.2 设置初始化参数（根据你的initialize函数）
    // 例如:
    // IERC20 _MetaNode, uint256 _startBlock, uint256 _endBlock, uint256 _MetaNodePerBlock
    // 你需要替换下面的参数为实际的MetaNode代币地址和区块参数
    // const metaNodeTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替换为实际MetaNode代币地址
    const startBlock = 1; // 替换为实际起始区块
    const endBlock = 999999999999; // 替换为实际结束区块
    const metaNodePerBlock = ethers.parseUnits("1", 18); // 每区块奖励1个MetaNode（18位精度）
    // 2.3. 部署可升级代理合约
    const stakeProxy = await upgrades.deployProxy(
      MetaNodeStake,
      [metaNodeTokenAddress, startBlock, endBlock, metaNodePerBlock],
      { initializer: "initialize" }
    );
    // 2.4 打印代理合约和实现合约地址
    await stakeProxy.waitForDeployment();
    const stakeProxyAddress = await stakeProxy.getAddress()
    console.log("代理合约地址:", stakeProxyAddress);
    const implAddress = await upgrades.erc1967.getImplementationAddress(stakeProxyAddress)
    console.log("实现合约地址：", implAddress);
    // 2.5 存储代理合约地址到本地缓存文件
    const storePath  = path.join(__dirname, "../cache/stakeAddress.json");
    fs.writeFileSync(
      storePath,
      JSON.stringify({
        stakeProxyAddress,
        implAddress,
        abi: MetaNodeStake.interface.format("json"),
      })
    );
    //2.6 使用hardhat-deploy的save方法保存部署信息
    // 这样可以在后续脚本中通过deployments.get获取到该合约信息
    // 注意这里保存的是代理合约的信息不需要自己保存到本地，本地还不带任何环境区分
    // implAddress 未被写入 JSON 的原因是：hardhat-deploy 的 save 函数只支持预定义的标准字段，自定义字段会被忽略。
    // 可以在本地写，或者写入args中
    await save("MetaNodeStakeProxy", {
      abi: MetaNodeStake.interface.format("json"),
      address: stakeProxyAddress,
      //implAddress: implAddress,

      args: [implAddress],
        // log: true,
    })

    //5. 转移MetaNode代币到Stake代理合约地址
    const MetaNodeToken = await ethers.getContractFactory('MetaNode')
    const metaNodeToken = MetaNodeToken.attach(metaNodeTokenAddress)
    const tokenAmount = await metaNodeToken.balanceOf(deployer)
    console.log("Transferring MetaNode tokens to Stake proxy contract:", tokenAmount.toString());
    let tx = await metaNodeToken.connect(deployerSigner).transfer(stakeProxyAddress, tokenAmount)
    await tx.wait()
};


module.exports.tags = ["metaNodeStake"];