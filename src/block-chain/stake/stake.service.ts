import { thetaTsSdk } from 'theta-ts-sdk'
import { InjectRepository } from '@nestjs/typeorm'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'
import { MoreThan, MoreThanOrEqual, Repository } from 'typeorm'
import { StakeStatisticsEntity } from './stake-statistics.entity'
import { Injectable, Logger } from '@nestjs/common'
import { StakeRewardEntity } from './stake-reward.entity'
const moment = require('moment')
const config = require('config')

@Injectable()
export class StakeService {
  logger = new Logger()
  constructor(
    @InjectRepository(StakeEntity, 'stake') private stakeRepository: Repository<StakeEntity>,
    @InjectRepository(StakeStatisticsEntity, 'stake')
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>,
    @InjectRepository(StakeRewardEntity, 'stake')
    private stakeRewardRepository: Repository<StakeRewardEntity>
  ) {
    // thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }

  async getNodeList(nodeType: STAKE_NODE_TYPE_ENUM | undefined) {
    this.logger.debug('node type:' + nodeType)
    if (typeof nodeType !== 'undefined')
      return await this.stakeRepository.find({
        node_type: nodeType
      })
    return await this.stakeRepository.find()
  }

  async getNodeNum(latestBlock: string, nodeType: STAKE_NODE_TYPE_ENUM) {
    let effectNodeNum = 0
    let stakeList = await this.stakeRepository.find({
      node_type: nodeType
    })
    stakeList.forEach((node) => {
      node.stakes.some((stake) => {
        if (
          stake.withdrawn == false ||
          (stake.withdrawn == true && Number(latestBlock) < Number(stake.return_height))
        ) {
          effectNodeNum++
          return true
        }
      })
    })
    return effectNodeNum
  }

  async updateVcp(height: string) {
    let vcpList = await thetaTsSdk.blockchain.getVcpByHeight(height)
    for (const validator of vcpList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates) {
      let res = await this.stakeRepository.findOne({
        holder: validator.Holder,
        node_type: STAKE_NODE_TYPE_ENUM.validator
      })
      if (!res)
        await this.stakeRepository.insert({
          node_type: STAKE_NODE_TYPE_ENUM.validator,
          holder: validator.Holder,
          stakes: validator.Stakes
        })
      else
        await this.stakeRepository.update(
          { holder: validator.Holder, node_type: STAKE_NODE_TYPE_ENUM.validator },
          {
            stakes: validator.Stakes
          }
        )
    }
  }

  async updateGcp(height: string) {
    let gcpList = await thetaTsSdk.blockchain.getGcpByHeight(height)
    for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
      let res = await this.stakeRepository.findOne({
        node_type: STAKE_NODE_TYPE_ENUM.guardian,
        holder: guardian.Holder
      })
      if (!res)
        await this.stakeRepository.insert({
          node_type: STAKE_NODE_TYPE_ENUM.guardian,
          holder: guardian.Holder,
          stakes: guardian.Stakes
        })
      else
        await this.stakeRepository.update(
          { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: guardian.Holder },
          { stakes: guardian.Stakes }
        )
    }
  }

  async updateEenp(height: string) {
    let eenpList = await thetaTsSdk.blockchain.getEenpByHeight(height)
    for (const een of eenpList.result.BlockHashEenpPairs[0].EENs) {
      let res = await this.stakeRepository.findOne({
        node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
        holder: een.Holder
      })
      if (!res)
        await this.stakeRepository.insert({
          node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
          holder: een.Holder,
          stakes: een.Stakes
        })
      else
        await this.stakeRepository.update(
          {
            node_type: STAKE_NODE_TYPE_ENUM.edge_cache,
            holder: een.Holder
          },
          { stakes: een.Stakes }
        )
    }
  }

  async getLatestFinalizedBlock() {
    let nodeInfo = await thetaTsSdk.blockchain.getStatus()
    return nodeInfo.result.latest_finalized_block_height
  }

  async getLatestStakeStatics() {
    const latestStakeInfo = await this.stakeStatisticsRepository.findOne({
      order: {
        block_height: 'DESC'
      }
    })
    const stakeInfo = await this.stakeStatisticsRepository.find({
      block_height: MoreThanOrEqual(latestStakeInfo.block_height - 13800 * 7)
    })
    const stakeToReturn = [stakeInfo[0]]
    for (let i = 1; i < stakeInfo.length; i++) {
      if (latestStakeInfo.block_height - stakeInfo[i].block_height == 13800) {
        stakeToReturn.push(stakeInfo[i])
      }
    }
    return stakeToReturn
  }

  async updateGcpStatus(address: string, time: number) {
    await this.stakeRepository.update(
      { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: address },
      {
        last_signature: time
      }
    )
  }

  async updateEenpStatus(address: string, time: number) {
    await this.stakeRepository.update(
      { node_type: STAKE_NODE_TYPE_ENUM.edge_cache, holder: address },
      {
        last_signature: time
      }
    )
  }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  async updateStakeInfo() {
    let nodeInfo = await thetaTsSdk.blockchain.getStatus()
    // console.log('node info', JSON.stringify(nodeInfo))
    await this.updateVcp(nodeInfo.result.latest_finalized_block_height)
    await this.updateGcp(nodeInfo.result.latest_finalized_block_height)
    await this.updateEenp(nodeInfo.result.latest_finalized_block_height)
  }

  async getStakeReward(
    wallet_address: string,
    period: 'last_24_hour' | 'last_3_days' | 'last_7_days' | 'last_30_days'
  ) {
    let rewardList: Array<StakeRewardEntity> = []
    this.logger.debug('period:' + period)
    this.logger.debug('wallet:' + wallet_address)
    switch (period) {
      case 'last_24_hour':
        rewardList = await this.stakeRewardRepository.find({
          timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
          wallet_address: wallet_address
        })
        break
      case 'last_7_days':
        rewardList = await this.stakeRewardRepository.find({
          timestamp: MoreThan(moment().subtract(7, 'days').unix()),
          wallet_address: wallet_address
        })
        break
      case 'last_3_days':
        rewardList = await this.stakeRewardRepository.find({
          timestamp: MoreThan(moment().subtract(3, 'days').unix()),
          wallet_address: wallet_address
        })
        break
      case 'last_30_days':
        rewardList = await this.stakeRewardRepository.find({
          timestamp: MoreThan(moment().subtract(3, 'days').unix()),
          wallet_address: wallet_address
        })
        break
      default:
        break
    }
    return rewardList.reduce((oldValue, reward) => {
      return oldValue + reward.reward_amount
    }, 0)
  }
}
