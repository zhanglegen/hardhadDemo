// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MetaNode is ERC20{
    // 这里可以添加 MetaNode 合约的具体实现
    constructor() ERC20("MetaNode", "MNODE") {
        _mint(msg.sender, 1000000 * 10**18); // 初始铸造 100 万个代币给合约部署者
    }
}