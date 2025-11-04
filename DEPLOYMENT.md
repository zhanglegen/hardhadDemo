# 部署指南

本项目使用 `hardhat-deploy` 插件进行生产级部署管理。

## 环境配置

### 1. 环境变量设置

创建 `.env` 文件并配置以下变量：

```bash
# 必需
PRIVATE_KEY=你的私钥
INFURA_API_KEY=你的Infura API密钥

# 可选（用于验证合约）
ETHERSCAN_API_KEY=你的Etherscan API密钥

# Gas报告
REPORT_GAS=true
```

### 2. 网络配置

项目支持以下网络：
- `localhost` - 本地网络 (Hardhat Network)
- `sepolia` - Sepolia测试网
- `mainnet` - 以太坊主网

## 部署命令

### 基本部署

```bash
# 部署到本地网络
npm run deploy:local

# 部署到Sepolia测试网
npm run deploy:sepolia

# 部署到主网
npm run deploy:mainnet
```

### 按标签部署

```bash
# 只部署合约
hardhat deploy --tags shibmeme

# 只配置合约
hardhat deploy --tags configure

# 只设置测试环境
hardhat deploy --tags setup
```

### 导出部署信息

```bash
# 导出本地部署信息
npm run export:local

# 导出测试网部署信息
npm run export:sepolia
```

### 合约验证

```bash
# 验证Sepolia上的合约
npm run verify:sepolia

# 验证主网合约
npm run verify:mainnet
```

## 部署脚本说明

### 001_deploy_shib_meme_token.js
- 部署 ShibMemeToken 合约
- 设置构造函数参数
- 自动验证合约（如配置Etherscan API）

### 002_configure_token.js
- 配置交易限制（最大交易量、最大钱包持有量）
- 设置税费参数
- 启用交易（测试环境）

### 003_setup_environment.js
- 设置测试环境（仅测试网）
- 分配测试代币
- 配置排除列表

## 部署最佳实践

### 1. 测试环境
```bash
# 1. 启动本地节点
npm run node

# 2. 在新终端部署到本地
npm run deploy:local

# 3. 运行测试
npm test
```

### 2. 测试网部署
```bash
# 1. 确保有足够的测试ETH
# 2. 部署到测试网
npm run deploy:sepolia

# 3. 验证合约
npm run verify:sepolia
```

### 3. 主网部署
```bash
# 1. 确保有足够的ETH
# 2. 检查gas价格
# 3. 部署到主网
npm run deploy:mainnet

# 4. 验证合约
npm run verify:mainnet
```

## 部署记录

所有部署记录保存在 `deployments/` 目录中：
- `deployments/localhost/` - 本地部署记录
- `deployments/sepolia/` - Sepolia测试网记录
- `deployments/mainnet/` - 主网记录

## 故障排除

### 常见问题

1. **网络连接失败**
   - 检查网络配置
   - 确认RPC URL正确

2. **gas不足**
   - 增加账户余额
   - 调整gas价格

3. **合约验证失败**
   - 确认Etherscan API密钥正确
   - 等待区块确认
   - 检查构造函数参数

### 重新部署

如果需要重新部署，可以使用 `--reset` 标志：
```bash
hardhat deploy --network sepolia --reset
```

## 生产环境注意事项

1. **私钥安全**：使用硬件钱包或安全存储
2. **多签钱包**：重要操作使用多签
3. **时间锁**：关键参数变更使用时间锁
4. **监控**：部署后设置监控和告警
5. **备份**：保存部署记录和配置