import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
// import { StakeEntity } from './stake.entity'
import { stakeStatistics } from './stake.model'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'

@Resolver()
export class StakeResolver {
  constructor(private stakeService: StakeService) {}

  @Query(() => [StakeEntity])
  async stakeInfo(
    @Args('node_type', { type: () => STAKE_NODE_TYPE_ENUM, nullable: true })
    node_type: STAKE_NODE_TYPE_ENUM | undefined
  ) {
    return await this.stakeService.getNodeList(node_type)
  }

  @Query(() => Int)
  async getEdgeNodeNum() {
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

  @Query(() => Int)
  async getCurrentHeight() {
    return await this.stakeService.getLatestFinalizedBlock()
  }
}
