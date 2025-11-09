// staking

// deposit(MyToken) / withdraw(MyToken)

// MyToken : token balance management

// - the balance of TinyBank address

// TonyBank : deposit/withdraw vault

// - user token management

// - user --> deposit --> TinyBank --> transfer(user --> TinyBank)

// Reward

// - reward token : MyToken

// - reward resource : 1 MT/block minting

// - reward strategy : staked[user]/totalStaked distribution

// - signer0 block 0 staking

// - signer1 block 5 staking

// - 0-- 1-- 2-- 3-- 4-- 5--

// | |

// - signer0 10MT siger1 10MT

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

//import "./ManagedAccess.sol";
import "./MultiManagedAccess.sol";

interface IMyToken {
    function transfer(uint256 amount, address to) external;
    function transferFrom(address from, address to, uint256 amount) external;
    function mint(uint256 amount, address owner) external;
}

contract TinyBank is MultiManagedAccess {
    event Staked(address from, uint256 amount);
    event Withdraw(uint256 amount, address to);

    IMyToken public stakingToken;
    mapping(address => uint256) public lastClaimedBlock;
    uint256 defaultRewardPerBlock = 1 * 10 ** 18;
    uint256 rewardPerBlock;
    mapping(address => uint256) public staked;
    uint256 public totalStaked;

    // ManagedAccess를 onlyAllconfirmed

    constructor(
        IMyToken _stakingToken,
        address _owner,
        address[] memory _managers,
        uint _managerNumbers
    ) MultiManagedAccess(_owner, _managers, _managerNumbers) {
        stakingToken = _stakingToken;
        rewardPerBlock = defaultRewardPerBlock;
    }

    // who, when?
    // genesis staking
    modifier updateReward(address to) {
        if (staked[to] > 0) {
            uint256 blocks = block.number - lastClaimedBlock[to];
            uint256 reward = (blocks * rewardPerBlock * staked[to]) /
                totalStaked;
            stakingToken.mint(reward, to);
        }
        lastClaimedBlock[to] = block.number;
        _; // caller's code
    }

    //여기도 onlyManager - > onlyallconfirmed 이런식으로 바꿔서 signers0 ~ signers5 까지 테스트 코드를 만들어서 권한을 분산시키고 reset리워드 퍼블럭을 변경헤보는 과제

    //테스트 제출할때 console.load쓰면 안되고 expect로 테스트 마무리까지 해야함

    function setRewardPerBlock(uint256 _amount) external onlyAllConfirmed {
        rewardPerBlock = _amount;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "cannot stake 0 amount");
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        staked[msg.sender] += _amount;
        totalStaked += _amount;
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(staked[msg.sender] >= _amount, "insufficient staked amount");
        stakingToken.transfer(_amount, msg.sender);
        staked[msg.sender] -= _amount;
        totalStaked -= _amount;
        emit Withdraw(_amount, msg.sender);
    }
}
