import { Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
// import { StakeEntity } from './stake.entity'
import { stakeStatistics } from './stake.model'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'

@Resolver()
export class StakeResolver {
  constructor(private stakeService: StakeService) {}

  @Query(() => [StakeEntity])
  async stakeInfo() {
    return await this.stakeService.getNodeList()
    // let node = await this.stakeService.getNodeList()
    // return {}
  }

  @Query(() => Int)
  async getEdgeNodeNum() {
    // let latestBlock =
    return await this.stakeService.getNodeNum(
      await this.stakeService.getLatestFinalizedBlock(),
      STAKE_NODE_TYPE_ENUM.edge_cache
    )
  }

  @Query(() => Int)
  async getGuardianNodeNum() {
    return await this.stakeService.getNodeNum(
      await this.stakeService.getLatestFinalizedBlock(),
      STAKE_NODE_TYPE_ENUM.guardian
    )
  }

  @Query(() => Int)
  async getValidatorNodeNum() {
    return await this.stakeService.getNodeNum(
      await this.stakeService.getLatestFinalizedBlock(),
      STAKE_NODE_TYPE_ENUM.validator
    )
  }
}
