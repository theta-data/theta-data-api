import { thetaTsSdk } from 'theta-ts-sdk'
import { InjectRepository } from '@nestjs/typeorm'
import { STAKE_NODE_TYPE_ENUM, StakeEntity } from './stake.entity'
import { Repository } from 'typeorm'
import { Cron, CronExpression } from '@nestjs/schedule'
import { StakeStatisticsEntity } from './stake-statistics.entity'

thetaTsSdk.blockchain.setUrl('http://localhost:16888/rpc')

export class StakeService {
  constructor(
    @InjectRepository(StakeEntity) private stakeRepository: Repository<StakeEntity>,
    @InjectRepository(StakeStatisticsEntity)
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>
  ) {}

  async getNodeList(nodeType: STAKE_NODE_TYPE_ENUM | undefined) {
    if (typeof nodeType !== undefined)
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
    console.log('height', height, 'vcp list', JSON.stringify(vcpList))
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
    return await this.stakeStatisticsRepository.findOne({
      order: {
        block_height: 'DESC'
      }
    })
  }

  async updateGcpStatus(address: string, time: string) {
    await this.stakeRepository.update(
      { node_type: STAKE_NODE_TYPE_ENUM.guardian, holder: address },
      {
        last_signature: time
      }
    )
  }

  async updateEenpStatus(address: string, time: string) {
    await this.stakeRepository.update(
      { node_type: STAKE_NODE_TYPE_ENUM.edge_cache, holder: address },
      {
        last_signature: time
      }
    )
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateStakeInfo() {
    let nodeInfo = await thetaTsSdk.blockchain.getStatus()
    console.log('node info', JSON.stringify(nodeInfo))

    await this.updateVcp(nodeInfo.result.latest_finalized_block_height)
    await this.updateGcp(nodeInfo.result.latest_finalized_block_height)
    await this.updateEenp(nodeInfo.result.latest_finalized_block_height)
  }
}
