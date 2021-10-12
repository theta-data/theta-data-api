import { Field, ObjectType } from '@nestjs/graphql'
import { SmartContractEntity } from './smart-contract.entity'
import { GraphQLInt } from 'graphql'

@ObjectType()
export class SmartContractStatisticsType {
  @Field(() => [SmartContractEntity])
  call_rank: Array<SmartContractEntity>

  @Field(() => GraphQLInt)
  total_number: number
}
