import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { SmartContractEntity } from './smart-contract.entity'

@ObjectType()
export class SmartContractStatisticsType {
  @Field(() => [SmartContractEntity])
  call_rank: Array<SmartContractEntity>
}

export enum RankByEnum {
  call_times,
  last_24h_call_times,
  last_seven_days_call_times
}
registerEnumType(RankByEnum, {
  name: 'RankByEnum'
})
