import { Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
// import { StakeEntity } from './stake.entity'
import { stakeInfo } from './stake.model'
import { StakeEntity } from './stake.entity'

@Resolver((of) => stakeInfo)
export class StakeResolver {
  constructor(private stakeService: StakeService) {}

  @Query(() => stakeInfo)
  async stakeInfo() {
    // let node = await this.stakeService.getNodeList()
    return {}
  }

  @ResolveField('node_info', (returns) => [StakeEntity])
  async getNodeInfo() {
    return await this.stakeService.getNodeList()
  }

  @ResolveField('statistics.elite_edge_node_num', () => Int)
  async getEliteEdgeNodeNum() {
    return await this.stakeService.getEdgeNodeNum()
  }
}
