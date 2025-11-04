// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 导入父合约（路径根据实际文件位置调整，例如同目录下）
import "./MetaNodeStake.sol"; 

contract MetaNodeStakeV2 is MetaNodeStake {
    // 升级后的新功能（即使暂时为空，也需要正确继承）
    function testHello() public pure returns (string memory) {
        return "Hello, World!";
    }

}