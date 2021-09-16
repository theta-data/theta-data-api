import { Resolver } from '@nestjs/graphql'
import { SmartContractService } from './smart-contract.service'

@Resolver()
export class SmartContractResolver {
  constructor(private smartContractService: SmartContractService) {}
}
