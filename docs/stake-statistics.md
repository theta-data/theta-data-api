# StakeStatistics
返回代币质押的相关统计信息
### block_height 
进行质押统计的区块高度 
### effective_guardian_node_number
在线的守护节点数量 
### effective_guardian_stake_amount
在线的守护节点的总的theta质押数量
### effective_validator_node_number
在线的验证节点数量 
### effective_validator_stake_amount
在线的验证节点质押的代币数量
### stakes ： 质押详情
**参数**
* node_type
  * validator : 验证节点
  * guardian ： 守护节点
  * edge_cache ：精英边缘节点

**字段**
  * holder : 节点地址
  * last_signature ： 最后的签名时间
  * node_type ： 节点类型，包括 validator、guardian、edge_cache
  * stakes ：质押到这个节点的所有钱包信息
    * amount : 质押的代币数量
    * return_height : 代币返还区块高度，只有质押在提币的状态才有意义
    * source ： 质押的钱包地址
    * withdrawn ： 是否在提币状态
    * 
  
  