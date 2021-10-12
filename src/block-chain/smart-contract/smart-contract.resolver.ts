import { Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { SmartContractService } from './smart-contract.service'
import { SmartContractEntity } from './smart-contract.entity'
import { SmartContractStatisticsType } from './smart-contract.model'

@Resolver(() => SmartContractStatisticsType)
export class SmartContractResolver {
  constructor(private smartContractService: SmartContractService) {}

  @Query(() => SmartContractStatisticsType)
  async SmartContractStatistics() {
    return {}
  }

  @ResolveField()
  async call_rank() {
    return await this.smartContractService.getSmartContract()
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
