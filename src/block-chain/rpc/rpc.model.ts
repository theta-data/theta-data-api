import { Field, Int, ObjectType } from '@nestjs/graphql'
import { THETA_BLOCK_STATUS_ENUM, THETA_TX_TYPE_ENUM } from '../../tx/theta.enum'

@ObjectType()
export class GetVersionType {
  @Field()
  version: string //"1.0",

  @Field()
  git_hash: string //"9d7669a735063a283ae8b6f0826183e3830c00a5",

  @Field()
  timestamp: string //'Tue Feb 19 23:31:32 UTC 2019'
}

@ObjectType()
export class TokenType {
  @Field()
  thetawei: string // "994999990000000000000000000",

  tfuelwei: string //"4999999979999999000000000000"
}

@ObjectType()
export class GetAccountType {
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
export class BlockType {
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
}

@ObjectType()
export class proposerType {
  @Field()
  address: string //'0x2e833968e5bb786ae419c4d13189fb081cc43bab'

  @Field(() => TokenType)
  coins: TokenType

  @Field()
  sequence: string //"0",

  @Field()
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

  @Field(() => [inputOutputType], { nullable: true })
  outputs: Array<inputOutputType>

  @Field(() => [inputOutputType], { nullable: true })
  inputs: Array<inputOutputType>

  @Field({ nullable: true })
  gas_limit: string

  @Field({ nullable: true })
  gas_price: string

  @Field(() => [proposerType], { nullable: true })
  from: Array<proposerType>

  @Field(() => [proposerType], { nullable: true })
  to: Array<proposerType>

  @Field({ nullable: true })
  data: string

  @Field()
  block_height: string
}

@ObjectType()
export class transactionType {
  @Field(() => transactionRawType)
  raw: transactionRawType

  @Field(() => THETA_TX_TYPE_ENUM)
  type: THETA_TX_TYPE_ENUM

  @Field(() => TokenType, { nullable: true })
  fee: TokenType

  @Field()
  hash: string
}

@ObjectType()
export class GetTransactionType {
  @Field()
  block_hash: string //"0x9f1e77b08c9fa8984096a735d0aae6b0e43aee297e42c54ce36334103ddd67a7",

  @Field()
  block_height: string //"3",

  @Field()
  status: string //"finalized",

  @Field()
  hash: string //"0xf3cc94af7a1520b384999ad106ade9738b6cde66e2377ceab37067329d7173a0",

  @Field(() => [transactionType])
  transaction: Array<transactionType>
}
