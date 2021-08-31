import { Query, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
import { StakeEntity } from './stake.entity'

@Resolver()
export class StakeResolver {
  constructor(private stakeService: StakeService) {}

  @Query(() => StakeEntity)
  async stakeEntity() {
    return this.stakeService.getNodeList()
  }
}
