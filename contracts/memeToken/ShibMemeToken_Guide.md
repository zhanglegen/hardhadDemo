# ShibMemeToken (SHIBME) - 部署和使用指南

## 概述

ShibMemeToken 是一个全面的 SHIB 风格 Meme 代币实现，包含以下功能：
- **代币税机制** - 针对买入、卖出和转账交易的税费
- **流动性池集成** - 与 Uniswap V2 兼容
- **交易限制** - 包括交易限额和反机器人措施
- **全面的安全功能** 和访问控制

## 合约功能

### 1. 代币税系统
- **买入税**: 3% (可配置) - 购买代币时收取
- **卖出税**: 5% (可配置) - 出售代币时收取
- **转账税**: 1% (可配置) - 点对点转账时收取
- **税费分配**: 40% 流动性，30% 营销，30% 开发

### 2. 交易限制
- **最大交易数量**: 每笔交易最多为总供应量的 1%
- **最大钱包数量**: 每个钱包最多持有总供应量的 1%
- **每日交易限制**: 每个钱包每天最多 10 笔交易
- **反机器人保护**: 防止同区块交易

### 3. 流动性池集成
- **Uniswap V2 兼容**: 与标准 DEX 路由器兼容
- **自动税费分配**: 税费自动分配到指定钱包
- **交换阈值**: 总供应量的 0.1% 触发税费分配

## 部署说明

### 前提条件
- 已安装 Node.js 和 npm
- MetaMask 或类似钱包，包含测试 ETH
- 访问以太坊测试网（Goerli、Sepolia 等）

### 步骤 1: 安装依赖

```bash
npm install @openzeppelin/contracts
npm install --save-dev hardhat
npm install --save-dev @nomiclabs/hardhat-ethers
npm install --save-dev @nomiclabs/hardhat-waffle
```

### 步骤 2: 配置 Hardhat

创建 `hardhat.config.js`:

```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
};
```

### 步骤 3: 部署合约

创建 `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("使用账户部署合约:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  const ShibMemeToken = await hre.ethers.getContractFactory("ShibMemeToken");

  // 使用税费分配的钱包地址进行部署
  const token = await ShibMemeToken.deploy(
    "0x...", // 营销钱包地址
    "0x...", // 开发钱包地址
    "0x..."  // 流动性钱包地址
  );

  await token.deployed();

  console.log("ShibMemeToken 部署到:", token.address);
  console.log("合约所有者:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

运行部署:

```bash
npx hardhat run scripts/deploy.js --network goerli
```

### 步骤 4: 配置交易参数 1

部署后，配置交易参数:

```javascript
// 启用交易
await token.setTradingEnabled(true);

// 设置 Uniswap 交易对（创建流动性池后）
await token.setUniswapPair("UNISWAP_PAIR_ADDRESS");

// 设置 Uniswap 路由器
await token.setUniswapRouter("UNISWAP_ROUTER_ADDRESS");

// 为重要地址配置豁免
await token.setFeeExempt("LIQUIDITY_POOL_ADDRESS", true);
await token.setTxLimitExempt("LIQUIDITY_POOL_ADDRESS", true);
```

## 使用指南

### 对于代币持有者

#### 1. 购买代币
```javascript
// 连接到 Uniswap 并购买代币
const amountIn = ethers.utils.parseEther("1"); // 1 ETH
const path = [WETH_ADDRESS, TOKEN_ADDRESS];
const deadline = Math.floor(Date.now() / 1000) + 300; // 5 分钟

await uniswapRouter.swapExactETHForTokens(
  0, // 最少代币输出
  path,
  recipientAddress,
  deadline,
  { value: amountIn }
);
```

#### 2. 出售代币
```javascript
// 批准代币给 Uniswap
await token.approve(UNISWAP_ROUTER_ADDRESS, amountIn);

// 出售代币
const path = [TOKEN_ADDRESS, WETH_ADDRESS];
await uniswapRouter.swapExactTokensForETH(
  amountIn,
  0, // 最少 ETH 输出
  path,
  recipientAddress,
  deadline
);
```

#### 3. 转账代币
```javascript
// 转账代币到另一个地址（收取 1% 税费）
await token.transfer(recipientAddress, amount);
```

### 对于合约所有者

#### 1. 更新税率
```javascript
// 更新买入税率为 2%
await token.setBuyTax(200);

// 更新卖出税率为 4%
await token.setSellTax(400);

// 更新转账税率为 0.5%
await token.setTransferTax(50);
```

#### 2. 调整交易限制
```javascript
// 设置最大交易为供应量的 2%
const maxTxAmount = await token.TOTAL_SUPPLY().div(50);
await token.setMaxTransactionAmount(maxTxAmount);

// 设置最大钱包为供应量的 3%
const maxWalletAmount = await token.TOTAL_SUPPLY().div(33);
await token.setMaxWalletAmount(maxWalletAmount);

// 设置每日交易限制为 20
await token.setDailyTransactionLimit(20);
```

#### 3. 管理豁免
```javascript
// 豁免地址税费
await token.setFeeExempt("ADDRESS", true);

// 豁免地址交易限制
await token.setTxLimitExempt("ADDRESS", true);

// 豁免地址钱包限制
await token.setWalletLimitExempt("ADDRESS", true);
```

#### 4. 机器人管理
```javascript
// 标记地址为机器人
await token.setBotStatus("SUSPICIOUS_ADDRESS", true);

// 移除机器人状态
await token.setBotStatus("ADDRESS", false);

// 更新反机器人区块数（0 为禁用）
await token.setAntiBotBlocks(3);
```

### 对于流动性提供者

#### 1. 添加流动性
```javascript
// 批准代币给路由器
await token.approve(UNISWAP_ROUTER_ADDRESS, tokenAmount);

// 添加流动性
await uniswapRouter.addLiquidityETH(
  TOKEN_ADDRESS,
  tokenAmount,
  tokenAmountMin,
  ethAmountMin,
  recipientAddress,
  deadline,
  { value: ethAmount }
);
```

#### 2. 移除流动性
```javascript
// 批准 LP 代币
await lpToken.approve(UNISWAP_ROUTER_ADDRESS, lpAmount);

// 移除流动性
await uniswapRouter.removeLiquidityETH(
  TOKEN_ADDRESS,
  lpAmount,
  tokenAmountMin,
  ethAmountMin,
  recipientAddress,
  deadline
);
```

## 监控和分析

### 监控的关键函数

#### 1. 获取代币统计
```javascript
const stats = await token.getTokenStats();
console.log("总供应量:", stats.totalSupply.toString());
console.log("买入税率:", stats.buyTaxRate.toString());
console.log("卖出税率:", stats.sellTaxRate.toString());
console.log("交易活跃:", stats.tradingActive);
```

#### 2. 检查每日交易限制
```javascript
const remainingTx = await token.getRemainingDailyTransactions("ADDRESS");
console.log("剩余每日交易:", remainingTx.toString());
```

#### 3. 检查豁免状态
```javascript
const isFeeExempt = await token.isFeeExempt("ADDRESS");
const isTxLimitExempt = await token.isTxLimitExempt("ADDRESS");
const isWalletLimitExempt = await token.isWalletLimitExempt("ADDRESS");
```

## 安全考虑

### 1. 访问控制
- 只有合约所有者可以修改关键参数
- 生产部署使用多重签名钱包
- 实施参数更改的时间锁

### 2. 反机器人措施
- 监控可疑交易模式
- 根据市场条件调整反机器人参数
- 使用机器人检测服务提供额外保护

### 3. 流动性管理
- 确保足够的流动性以维持健康交易
- 监控税费分配以防止积累
- 定期审查和调整税费分配

### 4. 合规性
- 确保符合当地法规
- 如需要，实施 KYC/AML
- 考虑证券法影响

## 故障排除

### 常见问题

#### 1. 交易回退
- 检查交易是否已启用
- 验证交易金额是否在限制范围内
- 确保足够的余额和授权

#### 2. 高 Gas 费用
- 优化合约调用
- 使用适当的 Gas 价格设置
- 考虑批量操作

#### 3. 税费计算问题
- 验证税率设置是否正确
- 检查地址的豁免状态
- 监控税费分配钱包

#### 4. 流动性池问题
- 确保正确的路由器和交易对地址
- 验证足够的代币和 ETH 余额
- 检查滑点容忍度设置

## 最佳实践

### 1. 测试
- 在主网部署前在测试网上彻底测试
- 使用自动化测试框架
- 进行安全审计

### 2. 监控
- 设置异常活动警报
- 定期监控税费分配
- 跟踪交易量和模式

### 3. 社区管理
- 清楚传达参数更改
- 提供透明报告
- 与社区反馈互动

### 4. 文档
- 保持文档更新
- 提供清晰的用户指南
- 维护变更日志

## 支持和资源

- **合约地址**: [您的部署合约地址]
- **Etherscan**: [合约在 Etherscan 上的链接]
- **社区**: [Discord/Telegram 链接]
- **文档**: [完整文档链接]

## 免责声明

此代币合约按原样提供，用于教育目的。用户应：
- 在投资前进行自己的研究
- 了解 DeFi 中涉及的风险
- 只投资他们能承受的损失
- 遵守当地法规

合约所有者和开发者不对因使用此代币而导致的任何损失或损害负责。