import { Int, Query, Resolver } from '@nestjs/graphql'
import { SmartContractService } from './smart-contract.service'
import { SmartContractEntity } from './smart-contract.entity'

@Resolver()
export class SmartContractResolver {
  constructor(private smartContractService: SmartContractService) {}

  @Query(() => [SmartContractEntity])
  async smartContract() {
    return await this.smartContractService.getSmartContract()
  }

  @Query(() => Int)
  async smartContractNum() {
    return await this.smartContractService.getSmartContractNum()
  }
}
