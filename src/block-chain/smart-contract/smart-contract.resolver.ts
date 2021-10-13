import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { SmartContractService } from './smart-contract.service'
import { SmartContractEntity } from './smart-contract.entity'
import { RankByEnum, SmartContractStatisticsType } from './smart-contract.model'
import { GraphQLInt } from 'graphql'

@Resolver(() => SmartContractStatisticsType)
export class SmartContractResolver {
  constructor(private smartContractService: SmartContractService) {}

  @Query(() => SmartContractStatisticsType)
  async SmartContractStatistics() {
    return {}
  }

  @ResolveField()
  async call_rank(
    @Args('rank_by', { type: () => RankByEnum, nullable: true }) rank_by: RankByEnum,
    @Args('take', { type: () => GraphQLInt, nullable: false, defaultValue: 500 }) take: number
  ) {
    return await this.smartContractService.getSmartContract(rank_by, take)
  }

  @ResolveField()
  async total_number() {
    return await this.smartContractService.getSmartContractNum()
  }

  // @Query(() => [SmartContractEntity])
  // async smartContract() {
  //   return await this.smartContractService.getSmartContract()
  // }

  // @Query(() => Int)
  // async smartContractNum() {
  //   return await this.smartContractService.getSmartContractNum()
  // }
}
