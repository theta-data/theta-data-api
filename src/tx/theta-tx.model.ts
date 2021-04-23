import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql'
import { THETA_TX_TYPE_ENUM } from './theta.enum'
import { PeriodStatistics } from './period-statistics.model'

registerEnumType(THETA_TX_TYPE_ENUM, { name: 'THETA_TX_TYPE_ENUM' })

@ObjectType()
export class ThetaTx {
  // @Field(type =>THETA_TX_TYPE_ENUM)
  // tx_type : THETA_TX_TYPE_ENUM
  @Field((type) => Int)
  coin_base_tx: number

  @Field((type) => Int)
  slash_tx: number

  @Field((type) => Int)
  send_tx: number

  @Field((type) => Int)
  reserve_fund_tx: number

  @Field((type) => Int)
  release_fund_tx: number

  @Field((type) => Int)
  service_payment_tx: number

  @Field((type) => Int)
  split_rule_tx: number

  @Field((type) => Int)
  deposit_stake_tx: number

  @Field((type) => Int)
  withdraw_stake_tx: number

  @Field((type) => Int)
  smart_contract_tx: number

  @Field({ nullable: true })
  timestamp: string
}
