import { Args, Float, Int, Query, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
// import { StakeEntity } from './stake.entity'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'
import BigNumber from 'bignumber.js'

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

  @Query(() => Float)
  async getThetaStakeRatio() {
    let totalThetaWei = new BigNumber(0)
    let latestHeight = await this.stakeService.getLatestFinalizedBlock()
    let validatorList = await this.stakeService.getNodeList(STAKE_NODE_TYPE_ENUM.validator)
    let guardianList = await this.stakeService.getNodeList(STAKE_NODE_TYPE_ENUM.guardian)

    validatorList.forEach((node) => {
      node.stakes.forEach((stake) => {
        if (stake.withdrawn === false) {
          totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
          // console.log('add theta wei', new BigNumber(stake.amount).toFixed())
        } else {
          if (stake.return_height > latestHeight) {
            totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
          }
        }
      })
    })
    console.log('total validator theta wei', totalThetaWei.toFixed())
    let guardianThetaWei = new BigNumber(0)
    console.log('guardian length', guardianList.length)
    guardianList.forEach((node) => {
      node.stakes.forEach((stake) => {
        if (stake.withdrawn === false) {
          guardianThetaWei = guardianThetaWei.plus(new BigNumber(stake.amount))
          // console.log('add theta wei', new BigNumber(stake.amount).toFixed())
        } else {
          if (stake.return_height > latestHeight) {
            guardianThetaWei = guardianThetaWei.plus(new BigNumber(stake.amount))
          }
        }
      })
    })
    console.log('total validator theta wei', totalThetaWei.toString())
    console.log('total guardian wei', guardianThetaWei.toString())

    return totalThetaWei.plus(guardianThetaWei).dividedBy('1e27').toFixed()
  }
}
