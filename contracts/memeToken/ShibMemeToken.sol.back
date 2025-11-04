// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShibMemeToken
 * @dev SHIB风格的Meme代币，具有税收机制、流动性池集成和交易限制
 * @notice 本合约实现了一个具有高级功能的综合Meme代币
 */
contract ShibMemeToken is ERC20, Ownable, ReentrancyGuard {

    // 税费配置
    uint256 public buyTax = 300; // 3% 买入税（基点）
    uint256 public sellTax = 500; // 5% 卖出税（基点）
    uint256 public transferTax = 100; // 1% 转账税（基点）
    uint256 public constant TAX_DENOMINATOR = 10000; // 10000 基点 = 100%

    // 税费分配
    uint256 public liquidityShare = 4000; // 40% 税费分配给流动性
    uint256 public marketingShare = 3000; // 30% 分配给营销
    uint256 public developmentShare = 3000; // 30% 分配给开发

    // 交易限制
    uint256 public maxTransactionAmount;
    uint256 public maxWalletAmount;
    uint256 public dailyTransactionLimit;
    mapping(address => uint256) public dailyTransactions;
    mapping(address => uint256) public lastTransactionDay;
    mapping(address => uint256) public transactionCount;
    uint256 public constant DAY_IN_SECONDS = 86400;

    // 反机器人措施
    mapping(address => bool) public isBot;
    mapping(address => uint256) public lastTransactionBlock;
    uint256 public antiBotBlocks = 2; // 防止同区块交易

    // 流动性池集成
    address public uniswapV2Pair;
    address public uniswapV2Router;
    bool public tradingEnabled = false;
    bool public swapEnabled = false;
    uint256 public swapThreshold;

    // 费用钱包
    address public marketingWallet;
    address public developmentWallet;
    address public liquidityWallet;

    // 豁免
    mapping(address => bool) public isFeeExempt;
    mapping(address => bool) public isTxLimitExempt;
    mapping(address => bool) public isWalletLimitExempt;

    // 代币元数据
    string constant TOKEN_NAME = "ShibMemeToken";
    string constant TOKEN_SYMBOL = "SHIBME";
    uint256 constant TOTAL_SUPPLY = 1000000 * 10**18; // 100万代币
    uint8 constant DECIMALS = 18;

    // 事件
    event TaxUpdated(string taxType, uint256 oldTax, uint256 newTax);
    event TradingEnabled(bool enabled);
    event SwapEnabled(bool enabled);
    event MaxTransactionAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event MaxWalletAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event BotStatusUpdated(address indexed bot, bool isBot);
    event FeeExemptionUpdated(address indexed account, bool exempt);
    event TransactionLimitExemptionUpdated(address indexed account, bool exempt);
    event WalletLimitExemptionUpdated(address indexed account, bool exempt);

    /**
     * @dev 构造函数，使用初始参数设置代币
     * @param _marketingWallet 接收营销费用的地址
     * @param _developmentWallet 接收开发费用的地址
     * @param _liquidityWallet 接收流动性费用的地址
     */
    constructor(
        address _marketingWallet,
        address _developmentWallet,
        address _liquidityWallet
    ) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
        require(_marketingWallet != address(0), "Invalid marketing wallet");
        require(_developmentWallet != address(0), "Invalid development wallet");
        require(_liquidityWallet != address(0), "Invalid liquidity wallet");

        marketingWallet = _marketingWallet;
        developmentWallet = _developmentWallet;
        liquidityWallet = _liquidityWallet;

        // 初始化限制（最大交易和钱包为总供应量的 1%）
        maxTransactionAmount = TOTAL_SUPPLY/100;
        maxWalletAmount = TOTAL_SUPPLY/100;
        dailyTransactionLimit = 10; // 每个钱包每天最多 10 笔交易
        swapThreshold = TOTAL_SUPPLY/1000; // 总供应量的 0.1%

        // 所有者免除费用和限制
        isFeeExempt[msg.sender] = true;
        isTxLimitExempt[msg.sender] = true;
        isWalletLimitExempt[msg.sender] = true;

        // 向所有者铸造总供应量
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @dev 重写小数位数返回 18
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    function getAaa() public view returns (uint256) {
         uint256 currentDay = block.timestamp/DAY_IN_SECONDS;
        return currentDay;
    }

    // 在合约中
    function getDailyTransactions(address user) public view returns (uint256) {
        return dailyTransactions[user];
    }

    /**
     * @dev 重写转账函数以实现税费和限制
     */
    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        require(sender != address(0), "Transfer from zero address");
        require(recipient != address(0), "Transfer to zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        require(!isBot[sender] && !isBot[recipient], "Bot detected");

        // 检查交易是否已启用
        // if (!tradingEnabled) {
        //     require(isFeeExempt[sender] || isFeeExempt[recipient], "Trading not enabled");
        // }

        // 反机器人措施
        if (antiBotBlocks > 0) {
            require(
                lastTransactionBlock[sender] < block.number,
                "Same block transaction not allowed"
            );
            lastTransactionBlock[sender] = block.number;
        }

        // 检查交易限制
        if (!isTxLimitExempt[sender] && !isTxLimitExempt[recipient]) {
            require(amount <= maxTransactionAmount, "Max transaction amount exceeded");

            // 检查每日交易限制
            uint256 currentDay = block.timestamp/DAY_IN_SECONDS;
            if (lastTransactionDay[sender] != currentDay) {
                dailyTransactions[sender] = 0;
                lastTransactionDay[sender] = currentDay;
            }
            require(
                dailyTransactions[sender] < dailyTransactionLimit,
                "Daily transaction limit exceeded"
            );
            dailyTransactions[sender]++;
       }

        // 检查钱包限制
        if (!isWalletLimitExempt[recipient]) {
            require(
                balanceOf(recipient)+amount <= maxWalletAmount,
                "Max wallet amount exceeded"
            );
        }

        // 计算并应用税费
        uint256 taxAmount = 0;
        if (!isFeeExempt[sender] && !isFeeExempt[recipient]) {
            taxAmount = calculateTax(sender, recipient, amount);
        }

        uint256 transferAmount = amount-taxAmount;

        // 处理税费分配
        if (taxAmount > 0) {
            distributeTax(taxAmount);
        }

        // 执行转账
        super._transfer(sender, recipient, transferAmount);
    }

    /**
     * @dev 根据交易类型计算税费
     */
    function calculateTax(
        address sender,
        address recipient,
        uint256 amount
    ) internal view returns (uint256) {
        uint256 taxRate = 0;

        if (sender == uniswapV2Pair) {
            // 买入交易
            taxRate = buyTax;
        } else if (recipient == uniswapV2Pair) {
            // 卖出交易
            taxRate = sellTax;
        } else {
            // 转账交易
            taxRate = transferTax;
        }
        return (amount * taxRate) / TAX_DENOMINATOR;

    }

    /**
     * @dev 根据分配比例将税费分配到不同钱包
     */
    function distributeTax(uint256 taxAmount) internal {
        uint256 liquidityAmount = taxAmount*(liquidityShare)/(TAX_DENOMINATOR);
        uint256 marketingAmount = taxAmount*(marketingShare)/(TAX_DENOMINATOR);
        uint256 developmentAmount = taxAmount-(liquidityAmount)-(marketingAmount);

        if (liquidityAmount > 0) {
            _mint(liquidityWallet, liquidityAmount);
        }
        if (marketingAmount > 0) {
            _mint(marketingWallet, marketingAmount);
        }
        if (developmentAmount > 0) {
            _mint(developmentWallet, developmentAmount);
        }
    }

    /**
     * @dev 启用或禁用交易
     */
    function setTradingEnabled(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
        emit TradingEnabled(_enabled);
    }

    /**
     * @dev 更新买入税
     */
    function setBuyTax(uint256 _tax) external onlyOwner {
        require(_tax <= 1000, "Tax too high"); // 最高 10%
        uint256 oldTax = buyTax;
        buyTax = _tax;
        emit TaxUpdated("buy", oldTax, _tax);
    }

    /**
     * @dev 更新卖出税
     */
    function setSellTax(uint256 _tax) external onlyOwner {
        require(_tax <= 1000, "Tax too high"); // 最高 10%
        uint256 oldTax = sellTax;
        sellTax = _tax;
        emit TaxUpdated("sell", oldTax, _tax);
    }

    /**
     * @dev 更新转账税
     */
    function setTransferTax(uint256 _tax) external onlyOwner {
        require(_tax <= 500, "Tax too high"); // 最高 5%
        uint256 oldTax = transferTax;
        transferTax = _tax;
        emit TaxUpdated("transfer", oldTax, _tax);
    }

    /**
     * @dev 更新税费分配比例
     */
    function setTaxShares(
        uint256 _liquidityShare,
        uint256 _marketingShare,
        uint256 _developmentShare
    ) external onlyOwner {
        require(
            _liquidityShare+(_marketingShare)+(_developmentShare) == TAX_DENOMINATOR,
            "Shares must sum to 100%"
        );
        liquidityShare = _liquidityShare;
        marketingShare = _marketingShare;
        developmentShare = _developmentShare;
    }

    /**
     * @dev 设置最大交易金额
     */
    function setMaxTransactionAmount(uint256 _amount) external onlyOwner {
        require(_amount >= TOTAL_SUPPLY/(1000), "Amount too low"); // 最低 0.1%
        uint256 oldAmount = maxTransactionAmount;
        maxTransactionAmount = _amount;
        emit MaxTransactionAmountUpdated(oldAmount, _amount);
    }

    /**
     * @dev 设置最大钱包金额
     */
    function setMaxWalletAmount(uint256 _amount) external onlyOwner {
        require(_amount >= TOTAL_SUPPLY/(1000), "Amount too low"); // 最低 0.1%
        uint256 oldAmount = maxWalletAmount;
        maxWalletAmount = _amount;
        emit MaxWalletAmountUpdated(oldAmount, _amount);
    }

    /**
     * @dev 设置每日交易限制
     */
    function setDailyTransactionLimit(uint256 _limit) external onlyOwner {
        require(_limit > 0, "Limit must be greater than 0");
        dailyTransactionLimit = _limit;
    }

    /**
     * @dev 设置地址的机器人状态
     */
    function setBotStatus(address _address, bool _isBot) external onlyOwner {
        require(_address != address(0), "Invalid address");
        isBot[_address] = _isBot;
        emit BotStatusUpdated(_address, _isBot);
    }

    /**
     * @dev 设置反机器人区块数
     */
    function setAntiBotBlocks(uint256 _blocks) external onlyOwner {
        antiBotBlocks = _blocks;
    }

    /**
     * @dev 设置费用豁免状态
     */
    function setFeeExempt(address _address, bool _exempt) external onlyOwner {
        require(_address != address(0), "Invalid address");
        isFeeExempt[_address] = _exempt;
        emit FeeExemptionUpdated(_address, _exempt);
    }

    /**
     * @dev 设置交易限制豁免状态
     */
    function setTxLimitExempt(address _address, bool _exempt) external onlyOwner {
        require(_address != address(0), "Invalid address");
        isTxLimitExempt[_address] = _exempt;
        emit TransactionLimitExemptionUpdated(_address, _exempt);
    }

    /**
     * @dev 设置钱包限制豁免状态
     */
    function setWalletLimitExempt(address _address, bool _exempt) external onlyOwner {
        require(_address != address(0), "Invalid address");
        isWalletLimitExempt[_address] = _exempt;
        emit WalletLimitExemptionUpdated(_address, _exempt);
    }

    /**
     * @dev 设置 Uniswap 交易对地址
     */
    function setUniswapPair(address _pair) external onlyOwner {
        require(_pair != address(0), "Invalid pair address");
        uniswapV2Pair = _pair;
    }

    /**
     * @dev 设置 Uniswap 路由器地址
     */
    function setUniswapRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        uniswapV2Router = _router;
    }

    /**
     * @dev 更新营销钱包
     */
    function setMarketingWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        marketingWallet = _wallet;
    }

    /**
     * @dev 更新开发钱包
     */
    function setDevelopmentWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        developmentWallet = _wallet;
    }

    /**
     * @dev 更新流动性钱包
     */
    function setLiquidityWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        liquidityWallet = _wallet;
    }

    /**
     * @dev 获取当前日期用于每日限制跟踪
     */
    function getCurrentDay() public view returns (uint256) {
        return block.timestamp/(DAY_IN_SECONDS);
    }

    /**
     * @dev 获取地址的剩余每日交易次数
     */
    function getRemainingDailyTransactions(address _address) public view returns (uint256) {
        uint256 currentDay = getCurrentDay();
        if (lastTransactionDay[_address] != currentDay) {
            return dailyTransactionLimit;
        }
        return dailyTransactionLimit > dailyTransactions[_address]
            ? dailyTransactionLimit-(dailyTransactions[_address])
            : 0;
    }

    /**
     * @dev 获取交易类型的总税费百分比
     */
    function getTotalTaxPercentage() external view returns (uint256) {
        return buyTax+(sellTax)+(transferTax);
    }

    /**
     * @dev 获取代币统计信息
     */
    function getTokenStats() external view returns (
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 maxTxAmount,
        uint256 maxWalletAmount,
        uint256 buyTaxRate,
        uint256 sellTaxRate,
        uint256 transferTaxRate,
        bool tradingActive
    ) {
        return (
            TOTAL_SUPPLY,
            totalSupply(),  // 调用继承的 totalSupply() 函数
            maxTransactionAmount,
            maxWalletAmount,
            buyTax,
            sellTax,
            transferTax,
            tradingEnabled
        );
    }
}