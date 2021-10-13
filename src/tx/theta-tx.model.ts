import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import { THETA_TX_TYPE_ENUM } from './theta.enum'

@ObjectType()
export class ThetaTx {
  // @Field(type =>THETA_TX_TYPE_ENUM)
  // tx_type : THETA_TX_TYPE_ENUM
  @Field((type) => Int)
  coin_base_transaction: number

  @Field((type) => Int)
  slash_transaction: number

  @Field((type) => Int)
  send_transaction: number

  @Field((type) => Int)
  reserve_fund_transaction: number

  @Field((type) => Int)
  release_fund_transaction: number

  @Field((type) => Int)
  service_payment_transaction: number

  @Field((type) => Int)
  split_rule_transaction: number

  @Field((type) => Int)
  deposit_stake_transaction: number

  @Field((type) => Int)
  withdraw_stake_transaction: number

  @Field((type) => Int)
  smart_contract_transaction: number

  @Field({ nullable: true })
  timestamp: string
}
