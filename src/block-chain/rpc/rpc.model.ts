import { Field, Int, ObjectType } from '@nestjs/graphql'
import { THETA_BLOCK_STATUS_ENUM, THETA_TX_TYPE_ENUM } from '../tx/theta.enum'
import { GraphQLBoolean, GraphQLInt, GraphQLString } from 'graphql'
import { GetVcpByHeightModel } from './rpc-vcp.model'
import { GetGcpByHeightModel } from './rpc-gcp.model'
import { GetEenpByHeightModel } from './rpc-eenp.model'
import { BlockHashStakeRewardDistributionRuleSetPairsModel } from './rpc-stake-reward-distribution-by-height.model'

@ObjectType({ description: 'This API returns the version of the blockchain software.\n' + '\n' })
export class GetVersionModel {
  @Field({ description: 'the version number' })
  version: string //"1.0",

  @Field({ description: 'the git commit hash of the code base' })
  git_hash: string //"9d7669a735063a283ae8b6f0826183e3830c00a5",

  @Field({ description: 'the build timestamp' })
  timestamp: string //'Tue Feb 19 23:31:32 UTC 2019'
}

@ObjectType()
export class TokenType {
  @Field()
  thetawei: string // "994999990000000000000000000",

  @Field()
  tfuelwei: string //"4999999979999999000000000000"
}

@ObjectType()
export class receiptType {
  @Field()
  TxHash: string

  @Field(() => [receiptLogType], { nullable: true })
  Logs: Array<receiptLogType>

  @Field({ nullable: true })
  EvmRet: string

  @Field()
  ContractAddress: string

  @Field(() => GraphQLInt)
  GasUsed: number

  @Field({ nullable: true })
  EvmErr: string
}

@ObjectType()
export class receiptLogType {
  @Field()
  address: string

  @Field(() => [GraphQLString])
  topics: Array<string>

  @Field({ nullable: true })
  data: string
}

@ObjectType()
export class GetAccountModel {
  @Field()
  sequence: string // "1",

  @Field()
  coins: TokenType

  @Field(() => [String])
  reserved_funds: []

  @Field()
  last_updated_block_height: string //'0'

  @Field()
  root: string //'0x0000000000000000000000000000000000000000000000000000000000000000'

  @Field()
  code: string //'0x0000000000000000000000000000000000000000000000000000000000000000'
}

@ObjectType()
export class HccVoteType {
  @Field()
  Block: string

  @Field(() => Int)
  Height: number

  @Field(() => Int)
  Epoch: number

  @Field()
  ID: string

  @Field()
  Signature: string
}

@ObjectType()
export class HccType {
  @Field(() => [HccVoteType])
  Votes: Array<HccVoteType>

  @Field()
  BlockHash: string
}

@ObjectType()
export class GuardianVotesType {
  @Field()
  Block: string

  @Field()
  Gcp: string

  @Field(() => [Int])
  Multiplies: Array<number>
}

@ObjectType()
export class EliteEdgeNodeVotesType {
  @Field()
  Block: string

  @Field(() => [Int])
  Multiplies: Array<number>

  @Field(() => [GraphQLString])
  Addresses: Array<string>
}

@ObjectType()
export class BlockModel {
  @Field()
  chain_id: string //"privatenet",

  @Field()
  epoch: string // "5",

  @Field()
  height: string //"3",

  @Field()
  parent: string // "0x724b0f68d8e45f930b95bac224fa7d67eef243307b4e84f0f666198d1d70e9d7",

  @Field()
  transactions_hash: string //"0x2bf2c62185fceed239a55bd27ada030cf75970f09122addb2e419e70cafebdf0",

  @Field()
  state_hash: string //"0xd41742c2b0d70e3bac1d88b2af69a2491d8c65c650af6ec4d2b8873897f8becc",

  @Field()
  timestamp: string //"1548102762",

  @Field()
  proposer: string //"0x2e833968e5bb786ae419c4d13189fb081cc43bab",

  @Field(() => [String])
  children: Array<string> //["0x21d3c2bb25d0c85a1f5c3ff81bc7eeae998bf98db1dba461fb3f69a434feb90c"],

  @Field(() => THETA_BLOCK_STATUS_ENUM)
  status: THETA_BLOCK_STATUS_ENUM //4,

  @Field()
  hash: string // "0x9f1e77b08c9fa8984096a735d0aae6b0e43aee297e42c54ce36334103ddd67a7",

  @Field(() => [transactionType])
  transactions: Array<transactionType>

  @Field(() => HccType, { nullable: true })
  hcc: HccType

  @Field(() => GuardianVotesType, { nullable: true })
  guardian_votes: GuardianVotesType

  @Field(() => EliteEdgeNodeVotesType, { nullable: true })
  elite_edge_node_votes: EliteEdgeNodeVotesType
}

@ObjectType()
export class proposerType {
  @Field({ nullable: true })
  address: string //'0x2e833968e5bb786ae419c4d13189fb081cc43bab'

  @Field(() => TokenType, { nullable: true })
  coins: TokenType

  @Field({ nullable: true })
  sequence: string //"0",

  @Field({ nullable: true })
  signature: string // "0x31af035f0dc47ded00eb5139fd5e4bb76f82e89e2
}

@ObjectType()
export class inputOutputType {
  @Field()
  address: string //"0x2e833968e5bb786ae419c4d13189fb081cc43bab",

  @Field(() => TokenType)
  coins: TokenType
}

@ObjectType()
export class transactionRawType {
  @Field(() => proposerType, { nullable: true })
  proposer: proposerType

  @Field(() => [inputOutputType], { nullable: 'itemsAndList' })
  outputs: Array<inputOutputType>

  @Field(() => [inputOutputType], { nullable: 'itemsAndList' })
  inputs: Array<inputOutputType>

  @Field({ nullable: true })
  gas_limit: string

  @Field({ nullable: true })
  gas_price: string

  @Field((type) => proposerType, { nullable: true })
  from: proposerType

  @Field((type) => proposerType, { nullable: true })
  to: proposerType

  @Field({ nullable: true })
  data: string

  @Field({ nullable: true })
  block_height: string
}

@ObjectType()
export class transactionType {
  @Field(() => transactionRawType, { nullable: true })
  raw: transactionRawType

  @Field(() => THETA_TX_TYPE_ENUM)
  type: THETA_TX_TYPE_ENUM

  @Field(() => TokenType, { nullable: true })
  fee: TokenType

  @Field()
  hash: string

  @Field(() => receiptType, { nullable: true })
  receipt: receiptType
}

@ObjectType()
export class GetTransactionModel {
  @Field()
  block_hash: string //"0x9f1e77b08c9fa8984096a735d0aae6b0e43aee297e42c54ce36334103ddd67a7",

  @Field()
  block_height: string //"3",

  @Field(() => THETA_TX_TYPE_ENUM)
  type: THETA_TX_TYPE_ENUM

  @Field()
  status: string //"finalized",

  @Field()
  hash: string //"0xf3cc94af7a1520b384999ad106ade9738b6cde66e2377ceab37067329d7173a0",

  @Field(() => transactionRawType)
  transaction: transactionRawType

  @Field(() => receiptType, { nullable: true })
  receipt: receiptType
}

@ObjectType()
export class NodeStatusModel {
  @Field()
  address: string //'0x1676d4D39cbC7519De75878765Fdde964B432732'

  @Field()
  chain_id: string //'mainnet'

  @Field()
  peer_id: string //'0x1676d4D39cbC7519De75878765Fdde964B432732'

  @Field()
  latest_finalized_block_hash: string //'0x6fc056d88b59285d3c1fadf192cb6aab7128ba3eb110bc076f69fd2230101117'

  @Field()
  latest_finalized_block_height: string //'11798375'

  @Field()
  latest_finalized_block_time: string //'1630400947'

  @Field()
  latest_finalized_block_epoch: string //'11880229'

  @Field()
  current_epoch: string //'11880231'

  @Field()
  current_height: string //'11798375'

  @Field()
  current_time: string //'1630400964'

  @Field(() => GraphQLBoolean)
  syncing: false

  @Field()
  genesis_block_hash: string
}

@ObjectType()
export class GetPendingTransactionsModel {
  @Field(() => [String])
  tx_hashes: Array<string>
}

@ObjectType()
export class ThetaRpcModel {
  @Field(() => GetVersionModel)
  GetVersion: GetVersionModel

  @Field(() => GetAccountModel)
  GetAccount: GetAccountModel

  @Field(() => BlockModel)
  GetBlock: BlockModel

  @Field(() => BlockModel)
  GetBlockByHeight: BlockModel

  @Field(() => NodeStatusModel)
  GetStatus: NodeStatusModel

  @Field(() => GetTransactionModel)
  GetTransaction: GetTransactionModel

  @Field(() => GetVcpByHeightModel)
  GetVcpByHeight: GetVcpByHeightModel

  @Field(() => GetGcpByHeightModel)
  GetGcpByHeight: GetGcpByHeightModel

  @Field(() => GetEenpByHeightModel)
  GetEenpByHeight: GetEenpByHeightModel

  @Field(() => GetPendingTransactionsModel)
  GetPendingTransactions: GetPendingTransactionsModel

  @Field(() => BlockHashStakeRewardDistributionRuleSetPairsModel)
  GetStakeRewardDistributionByHeight: BlockHashStakeRewardDistributionRuleSetPairsModel
}
