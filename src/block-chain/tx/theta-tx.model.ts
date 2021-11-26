import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
// import { ThetaTxNumByDateModel } from './theta-tx-num-by-date.model'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'

@ObjectType()
export class ThetaTransactionStatisticsType {
  @Field(() => [ThetaTxNumByDateModel])
  ByDate: Array<ThetaTxNumByDateModel>

  @Field(() => [ThetaTxNumByHoursEntity])
  ByHour: ThetaTxNumByHoursEntity
}

@ObjectType()
export class ThetaTxNumByDateModel {
  @Field(() => Int)
  year: number

  @Field(() => Int)
  month: number

  @Field(() => Int)
  date: number

  @Field(() => Int)
  block_number: number

  @Field(() => Float)
  theta_fuel_burnt: number

  @Field(() => Int)
  active_wallet: number

  @Field(() => Int)
  coin_base_transaction: number

  @Field(() => Int)
  slash_transaction: number

  @Field(() => Int)
  send_transaction: number

  @Field(() => Int)
  reserve_fund_transaction: number

  @Field(() => Int)
  release_fund_transaction: number

  @Field(() => Int)
  service_payment_transaction: number

  @Field(() => Int)
  split_rule_transaction: number

  @Field(() => Int)
  deposit_stake_transaction: number

  @Field(() => Int)
  withdraw_stake_transaction: number

  @Field(() => Int)
  smart_contract_transaction: number

  @Field(() => Int)
  latest_block_height: number

  @Field()
  timestamp: string
}
