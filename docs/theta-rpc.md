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

### GetBlock
**Query Parameters**
* hash: the block hash
**Fields**
* chain_id : ID of the chain
* epoch : epoch of the block
* height : height of the block
* parent : hash of the parent block
* transactions_hash : root hash of the transaction Merkle-Patricia trie
* state_hash : root hash of the state Merkle-Patricia trie
* timestamp : timestamp when the block was proposed
* proposer :  address of the proposer validator
* children : children blocks
* hash :  the block hash
* transactions :  json representation of the transactions contained in the block
* raw : transaction details
* type : type of the transaction (see the Transaction Types note below)
  * TxCoinbase : coinbase transaction, for validator/guardian reward
  * TxSlash : slash transaction, for slashing malicious actors
  * TxSend : send transaction, for sending tokens among accounts
  * TxReserveFund : reserve fund transaction, for off-chain micropayment
  * TxReleaseFund : release fund transaction, for off-chain micropayment
  * TxServicePayment : service payment transaction, for off-chain micropayment
  * TxSplitRule :  split rule transaction, for the "split rule" special smart contract
  * TxSmartContract : smart contract transaction, for general purpose smart contract
  * TxDepositStake :  deposit stake transaction, for depositing stake to validators/guardians
  * TxWithdrawStake :  withdraw stake transaction, for withdrawing stake from validators/guardians
  * TxDepositStakeV2 : 
  * TxStakeRewardDistribution : 
* hash :  hash of the transaction
* status :  status of the block (see the Block Status note below)
  * pending
  * valid
  * invalid
  * committed
  * directly_finalized
  * indirectly_finalized
  * trusted
#### Example
```graphql
{
  ThetaRpc {
    GetBlock(
      hash: "0x4af27e43da47a7398fe904967f002268e14d48f6e226a15f0333997aaa37ce7b"
    ) {
      chain_id
      children
      epoch
      hash
      height
      parent
      proposer
      state_hash
      status
      timestamp
      transactions_hash
      transactions {
        type
        hash
      }
    }
  }
}
```
**Response**
```json
{
  "data": {
    "ThetaRpc": {
      "GetBlock": {
        "chain_id": "mainnet",
        "children": [
          "0x232ee6c1901c6ddd960aacded97268664b2d83d034f1a828585948f71314b757"
        ],
        "epoch": "12895514",
        "hash": "0x4af27e43da47a7398fe904967f002268e14d48f6e226a15f0333997aaa37ce7b",
        "height": "12812680",
        "parent": "0x1d6721f1e2d88bf5c8c89a6ee00d96d5b0b065706a4d60d3972ba0a27d1c16ef",
        "proposer": "0xcbcef62ca7a2e367a9c93aba07ea4e63139da99d",
        "state_hash": "0x63fb02fa46694160c31485628da6d7830db438817f402d817ad661c4e2617f98",
        "status": "directly_finalized",
        "timestamp": "1636722729",
        "transactions_hash": "0x6166e704b2cf37e4c85faa9ed00a176161c8fc835b1c9b812f58266c2c961b24",
        "transactions": [
          {
            "type": "TxCoinbase",
            "hash": "0x16df2d1fd50fe2bbe3c0ff0b15bdd69dd0ddb3e4bb751d9772e38e8cb3440c76"
          },
          {
            "type": "TxSmartContract",
            "hash": "0x37670692b97a9fb5ff018b5e9f38f6e793078bfe38565c9ec1b064bde13f6db4"
          },
          {
            "type": "TxSmartContract",
            "hash": "0xb592df01962244c7e31a5a3d40976340b9705bf3e61f5d3623df634396e55a3e"
          }
        ]
      }
    }
  }
}
```