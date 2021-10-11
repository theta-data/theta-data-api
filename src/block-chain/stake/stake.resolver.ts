import { Args, Float, Int, Query, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from './stake-statistics.entity'

@Resolver()
export class StakeResolver {
  constructor(private stakeService: StakeService) {}

  @Query(() => [StakeEntity], { name: 'stake', description: 'get stake info' })
  async stakeInfo(
    @Args('node_type', { type: () => STAKE_NODE_TYPE_ENUM, nullable: true })
    node_type: STAKE_NODE_TYPE_ENUM | undefined
  ) {
    return await this.stakeService.getNodeList(node_type)
  }

  // @Query(() => Int)
  // async edgeNodeNum() {
  //   return await this.stakeService.getNodeNum(
  //     await this.stakeService.getLatestFinalizedBlock(),
  //     STAKE_NODE_TYPE_ENUM.edge_cache
  //   )
  // }

  // @Query(() => Int)
  // async guardianNodeNum() {
  //   return await this.stakeService.getNodeNum(
  //     await this.stakeService.getLatestFinalizedBlock(),
  //     STAKE_NODE_TYPE_ENUM.guardian
  //   )
  // }

  // @Query(() => Int)
  // async validatorNodeNum() {
  //   return await this.stakeService.getNodeNum(
  //     await this.stakeService.getLatestFinalizedBlock(),
  //     STAKE_NODE_TYPE_ENUM.validator
  //   )
  // }

  // @Query(() => Int)
  // async currentHeight() {
  //   return await this.stakeService.getLatestFinalizedBlock()
  // }

  @Query(() => Float)
  async thetaStakeRatio() {
    let totalThetaWei = new BigNumber(0)
    let latestHeight = await this.stakeService.getLatestFinalizedBlock()
    let validatorList = await this.stakeService.getNodeList(STAKE_NODE_TYPE_ENUM.validator)
    let guardianList = await this.stakeService.getNodeList(STAKE_NODE_TYPE_ENUM.guardian)

    validatorList.concat(guardianList).forEach((node) => {
      node.stakes.forEach((stake) => {
        if (stake.withdrawn === false) {
          totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
          // console.log('add theta wei', new BigNumber(stake.amount).toFixed())
        } else {
          if (Number(latestHeight) < Number(stake.return_height)) {
            totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
          }
        }
      })
    })
    return totalThetaWei.dividedBy('1e27').toFixed()
  }

  @Query(() => Float)
  async tfuelStakeRatio() {
    let nodeList = await this.stakeService.getNodeList(STAKE_NODE_TYPE_ENUM.edge_cache)
    let totalTfuelStaked = new BigNumber(0)
    let latestHeight = await this.stakeService.getLatestFinalizedBlock()

    nodeList.forEach((node) => {
      node.stakes.forEach((stake) => {
        if (stake.withdrawn === false) {
          totalTfuelStaked = totalTfuelStaked.plus(new BigNumber(stake.amount))
        } else {
          if (Number(latestHeight) < Number(stake.return_height)) {
            totalTfuelStaked = totalTfuelStaked.plus(new BigNumber(stake.amount))
          }
        }
      })
    })
    return totalTfuelStaked.dividedBy('5.399646029e27').toFixed()
  }

  @Query(() => StakeStatisticsEntity)
  async stakeStatistics() {
    return await this.stakeService.getLatestStakeStatics()
  }
}
