# ThetaRpc
### GetAccount
* code :  the hash of the smart contract bytecode (for smart contract accounts)
* coins : the native token balance
* reserved_funds : fund reserved for micropayment through the off-chain resource-oriented payment pool
* root : the root hash of the data Merkle-Patricia trie (for smart contract accounts)
* sequence : the current sequence number of the account

#### Example
```graphql
{
  ThetaRpc {
    GetAccount(address: "0x96b9b7c2d8b1b5b315155cfb3cd17b54d867c773") {
      code
      coins {
        tfuelwei
        thetawei
      }
      last_updated_block_height
      reserved_funds
      root
      sequence
    }
  }
}
```
**Response**
```json
{
  "data": {
    "ThetaRpc": {
      "GetAccount": {
        "code": "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        "coins": {
          "tfuelwei": "2163521382670000000000",
          "thetawei": "2659783981670000000000"
        },
        "last_updated_block_height": "10444009",
        "reserved_funds": [],
        "root": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "sequence": "7"
      }
    }
  }
}
```