import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { StakeService } from '../block-chain/stake/stake.service'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractService } from '../block-chain/smart-contract/smart-contract.service'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
const config = require('config')
const moment = require('moment')
import { Interval } from '@nestjs/schedule'
import { WalletService } from '../block-chain/wallet/wallet.service'
import { BlockListEntity, BlockStatus } from './block-list.entity'

@Injectable()
export class AnalyseService {
  private readonly logger = new Logger('analyse service')
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumByHoursRepository: Repository<ThetaTxNumByHoursEntity>,

    @InjectRepository(StakeStatisticsEntity)
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>,

    @InjectRepository(StakeRewardEntity)
    private stakeRewardRepository: Repository<StakeRewardEntity>,

    @InjectRepository(BlockListEntity)
    private blockListRepository: Repository<BlockListEntity>,

    // @Inject('SEND_TX_MONITOR_SERVICE') private client: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private stakeService: StakeService,
    private smartContractService: SmartContractService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  @Interval(config.get('ANALYSE_INTERVAL'))
  public async analyseData() {
    this.logger.debug('start analyse')
    // let tempHeight = await this.cacheManager.get('height')
    let height: number = 0
    // if (!tempHeight) {
    const lastfinalizedHeight = Number(
      (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
    )
    height = lastfinalizedHeight - 1000
    this.logger.debug('analyse Data get latest finalized height from block chain:' + height)

    height = 8000000
    const latestBlock = await this.blockListRepository.findOne({
      order: {
        block_number: 'DESC'
      }
    })

    if (latestBlock && latestBlock.block_number >= height) {
      height = latestBlock.block_number + 1
    }
    // } else {
    //   height = Number(tempHeight) + 1
    // }

    this.logger.debug('get height to analyse: ' + height)
    // const blockCahce = await this.cacheManager.get('block_' + height)
    // let block
    // if (blockCahce) {
    //   block = blockCahce
    // } else {
    let endHeight = lastfinalizedHeight
    if (lastfinalizedHeight - height > 4500) {
      endHeight = height + 4500
    }
    this.logger.debug('start height: ' + height + '; end height: ' + endHeight)

    const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
      height.toString(),
      endHeight.toString()
    )
    // await this.cacheManager.set('block_' + height, block, { ttl: 10 })
    // }
    for (const block of blockList.result) {
      try {
        this.logger.debug('analyse height: ' + block.height)
        await this.blockListRepository.insert({
          block_number: Number(block.height),
          status: BlockStatus.inserted
        })
        // await this.cacheManager.set('height', height, { ttl: 0 })
        this.logger.debug('send emit')
        this.eventEmitter.emit('block.analyse', block)
        return
      } catch (e) {
        this.logger.error(e)
      }
      // }
    }
  }

  @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE) {
    // const row = block
    const height = Number(block.height)
    this.logger.debug('handle height: ' + height)
    if (Number(block.height) % 100 === 1) {
      const latestFinalizedBlockHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      if (latestFinalizedBlockHeight - Number(block.height) < 5000) {
        await this.updateCheckPoint(block)
      } else {
        this.logger.debug('no need to calculate checkpoint block')
      }
    }

    const year = Number(moment(Number(block.timestamp) * 1000).format('YYYY'))
    const month = Number(moment(Number(block.timestamp) * 1000).format('MM'))
    const date = Number(moment(Number(block.timestamp) * 1000).format('DD'))
    const hour = Number(moment(Number(block.timestamp) * 1000).format('HH'))
    const hhStr = moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD')
    let record = await this.thetaTxNumByHoursRepository.findOne({
      where: {
        timestamp: moment(
          moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
        ).unix()
      }
    })

    if (!record) {
      record = new ThetaTxNumByHoursEntity()
      record.year = year
      record.month = month
      record.date = date
      record.hour = hour
      record.timestamp = moment(
        moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
      ).unix()
      record.coin_base_transaction = 0
      record.theta_fuel_burnt_by_smart_contract = 0
      record.theta_fuel_burnt_by_transfers = 0
      record.deposit_stake_transaction = 0
      record.release_fund_transaction = 0
      record.reserve_fund_transaction = 0
      record.send_transaction = 0
      record.service_payment_transaction = 0
      record.slash_transaction = 0
      record.smart_contract_transaction = 0
      record.split_rule_transaction = 0
      record.withdraw_stake_transaction = 0
      record.block_number = 0
      record.active_wallet = 0
      record.theta_fuel_burnt = 0
    }
    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.coinbase:
          record.coin_base_transaction++
          for (const output of transaction.raw.outputs) {
            // this.logger.debug('timestamp:' + row.timestamp)
            const stakeReard = await this.stakeRewardRepository.findOne({
              wallet_address: output.address,
              reward_height: height
            })
            if (!stakeReard) {
              await this.stakeRewardRepository.insert({
                reward_amount: Number(
                  new BigNumber(output.coins.tfuelwei).dividedBy('1e18').toFixed()
                ),
                wallet_address: output.address.toLocaleLowerCase(),
                reward_height: height,
                timestamp: Number(block.timestamp)
              })
            }
          }
          break
        case THETA_TRANSACTION_TYPE_ENUM.deposit_stake:
          record.deposit_stake_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.release_fund:
          record.release_fund_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
          record.reserve_fund_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.send:
          record.send_transaction++
          if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
            record.theta_fuel_burnt_by_transfers += new BigNumber(transaction.raw.fee.tfuelwei)
              .dividedBy('1e18')
              .toNumber()
          }
          break

        case THETA_TRANSACTION_TYPE_ENUM.service_payment:
          record.service_payment_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.slash:
          record.slash_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
          record.smart_contract_transaction++
          await this.smartContractService.updateSmartContractRecord(
            block.timestamp,
            transaction.receipt.ContractAddress,
            transaction.raw.data,
            JSON.stringify(transaction.receipt),
            height,
            transaction.hash
          )
          if (transaction.raw.gas_limit && transaction.raw.gas_price) {
            record.theta_fuel_burnt_by_smart_contract += new BigNumber(transaction.raw.gas_price)
              .multipliedBy(transaction.receipt.GasUsed)
              .dividedBy('1e18')
              .toNumber()

            record.theta_fuel_burnt += new BigNumber(transaction.raw.gas_price)
              .multipliedBy(transaction.receipt.GasUsed)
              .dividedBy('1e18')
              .toNumber()
          }
          break
        case THETA_TRANSACTION_TYPE_ENUM.split_rule:
          record.split_rule_transaction++
          break
        case THETA_TRANSACTION_TYPE_ENUM.withdraw_stake:
          record.withdraw_stake_transaction++
          break
        default:
          this.logger.error('no transaction.tx_type:' + transaction.type)
          break
      }
      if (transaction.raw.inputs && transaction.raw.inputs.length > 0) {
        for (const wallet of transaction.raw.inputs) {
          await this.walletService.markActive(wallet.address, Number(block.timestamp))
        }
      }

      if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
        for (const wallet of transaction.raw.outputs) {
          await this.walletService.markActive(wallet.address, Number(block.timestamp))
        }
      }

      if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
        record.theta_fuel_burnt += new BigNumber(transaction.raw.fee.tfuelwei)
          .dividedBy('1e18')
          .toNumber()
      }
    }

    record.latest_block_height = Number(block.height)
    record.block_number++
    // console.log(record)
    await this.thetaTxNumByHoursRepository.save(record)
    await this.walletService.snapShotActiveWallets(Number(block.timestamp))
    await this.blockListRepository.update(
      {
        status: BlockStatus.inserted,
        block_number: height
      },
      {
        status: BlockStatus.analysed
      }
    )
    const status = await this.blockListRepository.findOne({ block_number: height })
    this.logger.debug('block ' + height + ' analyse end, status:' + status.status)
    // handle and process "OrderCreatedEvent" event
  }

  async updateCheckPoint(block: THETA_BLOCK_INTERFACE) {
    try {
      if (Number(block.height) % 100 !== 1) {
        return
      }
      const [vaTotalNodeNum, vaEffectiveNodeNum, vaTotalThetaWei, vaEffectiveThetaWei] =
        await this.updateValidator(block)

      const [guTotalNodeNum, guEffectiveNodeNum, guTotalThetaWei, guEffectiveThetaWei] =
        await this.updateGuardian(block)

      const [eenpTotalNodeNum, eenpEffectiveNodeNum, eenpTotalTfWei, eenpEffectiveTfWei]: [
        number,
        number,
        BigNumber,
        BigNumber
      ] = await this.updateEenp(block)
      let res = await this.stakeStatisticsRepository.findOne({
        block_height: Number(block.height)
      })
      if (!res) {
        this.logger.debug(
          'total guardian stake:' + parseInt(guTotalThetaWei.dividedBy('1e27').toFixed())
        )
        try {
          return await this.stakeStatisticsRepository.insert({
            block_height: Number(block.height),

            total_elite_edge_node_number: eenpTotalNodeNum,
            effective_elite_edge_node_number: eenpEffectiveNodeNum,
            total_edge_node_stake_amount: parseInt(eenpTotalTfWei.dividedBy('1e18').toFixed()),
            effective_elite_edge_node_stake_amount: parseInt(
              eenpEffectiveTfWei.dividedBy('1e18').toFixed()
            ),
            theta_fuel_stake_ratio: Number(eenpTotalTfWei.dividedBy('5.399646029e27').toFixed()),
            timestamp: Number(block.timestamp),

            total_guardian_node_number: guTotalNodeNum,
            effective_guardian_node_number: guEffectiveNodeNum,
            total_guardian_stake_amount: parseInt(guTotalThetaWei.dividedBy('1e18').toFixed()),
            effective_guardian_stake_amount: Number(
              guEffectiveThetaWei.dividedBy('1e18').toFixed()
            ),

            theta_stake_ratio: Number(
              guTotalThetaWei.plus(vaTotalThetaWei).dividedBy('1e27').toFixed()
            ),

            total_validator_node_number: vaTotalNodeNum,
            effective_validator_node_number: vaEffectiveNodeNum,
            effective_validator_stake_amount: parseInt(
              vaEffectiveThetaWei.dividedBy('1e18').toFixed()
            ),
            total_validator_stake_amount: parseInt(vaTotalThetaWei.dividedBy('1e18').toFixed())
          })
        } catch (e) {
          this.logger.debug('insert stake statistics error')
          console.log(e)
        }
      }
    } catch (e) {
      this.logger.debug('updateCheckPoint error')
      console.log(e)
    }
  }

  async updateValidator(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber]> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalThetaWei = new BigNumber(0),
      effectiveThetaWei = new BigNumber(0)
    const validatorList = await thetaTsSdk.blockchain.getVcpByHeight(block.height)
    if (!validatorList.result || !validatorList.result.BlockHashVcpPairs) {
      throw new Error('no validator BlockHashVcpPairs')
    }
    validatorList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates.forEach((node) => {
      totalNodeNum++
      node.Stakes.forEach((stake) => {
        // if (stake.withdrawn === false) {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
        block.hcc.Votes.forEach((vote) => {
          if (vote.ID === node.Holder && !stake.withdrawn) {
            effectiveNodeNum++
            effectiveThetaWei = effectiveThetaWei.plus(new BigNumber(stake.amount))
          }
        })
      })
    })
    return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei]
  }

  async updateGuardian(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber]> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalThetaWei = new BigNumber(0),
      effectiveThetaWei = new BigNumber(0)

    const gcpList = await thetaTsSdk.blockchain.getGcpByHeight(block.height)
    for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
      totalNodeNum++
      guardian.Stakes.forEach((stake) => {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
      })
    }
    for (let i = 0; i < block.guardian_votes.Multiplies.length; i++) {
      if (block.guardian_votes.Multiplies[i] !== 0) {
        // await this.stakeService.updateGcpStatus(
        gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians[i].Stakes.forEach((stake) => {
          if (stake.withdrawn == false) {
            effectiveThetaWei = effectiveThetaWei.plus(new BigNumber(stake.amount))
          }
        })
        effectiveNodeNum++
      }
    }
    return [totalNodeNum, effectiveNodeNum, totalThetaWei, effectiveThetaWei]
  }

  async updateEenp(block: THETA_BLOCK_INTERFACE): Promise<[number, number, BigNumber, BigNumber]> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalTfuelWei = new BigNumber(0),
      effectiveTfuelWei = new BigNumber(0)
    const eenpList = await thetaTsSdk.blockchain.getEenpByHeight(block.height)
    eenpList.result.BlockHashEenpPairs[0].EENs.forEach((eenp) => {
      totalNodeNum++
      let isEffectiveNode = false
      block.elite_edge_node_votes.Multiplies.forEach((value, index) => {
        if (block.elite_edge_node_votes.Addresses[index] == eenp.Holder && value !== 0) {
          isEffectiveNode = true
          effectiveNodeNum++
        }
      })
      eenp.Stakes.forEach((stake) => {
        totalTfuelWei = totalTfuelWei.plus(new BigNumber(stake.amount))
        if (isEffectiveNode && !stake.withdrawn) {
          effectiveTfuelWei = effectiveTfuelWei.plus(new BigNumber(stake.amount))
        }
      })
    })
    return [totalNodeNum, effectiveNodeNum, totalTfuelWei, effectiveTfuelWei]
  }
}
