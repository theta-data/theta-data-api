import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { ClientProxy } from '@nestjs/microservices'
import { ThetaTxNumByHoursEntity } from '../tx/theta-tx-num-by-hours.entity'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { StakeService } from '../block-chain/stake/stake.service'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractService } from '../block-chain/smart-contract/smart-contract.service'

const moment = require('moment')
const sleep = require('await-sleep')
// thetaTsSdk.blockchain.setUrl('https://theta-bridge-rpc.thetatoken.org/rpc')
thetaTsSdk.blockchain.setUrl(' http://localhost:16888/rpc')

@Injectable()
export class AnalyseService {
  private readonly logger = new Logger('analyse service')
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumByHoursRepository: Repository<ThetaTxNumByHoursEntity>,
    @InjectRepository(StakeStatisticsEntity)
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>,
    @Inject('SEND_TX_MONITOR_SERVICE') private client: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private stakeService: StakeService,
    private smartContractService: SmartContractService
  ) {}

  public async queryDataFromBlockChain() {
    let height = 9883000
    const latestBlock = await this.thetaTxNumByHoursRepository.findOne({
      order: {
        latest_block_height: 'DESC'
      }
    })

    if (latestBlock) {
      height = latestBlock.latest_block_height + 1
    }

    while (1) {
      // console.log('get height', height)
      this.logger.debug('get height: ' + height)
      const block = await thetaTsSdk.blockchain.getBlockByHeight(height.toString())
      const row = block.result
      if (!row || JSON.stringify(row) == '{}') {
        await sleep(3000)
        this.logger.error('no data, height')
        continue
      }
      if (Number(block.result.height) % 100 === 1) {
        await this.updateCheckPoint(block)
      }

      const year = Number(moment(Number(row.timestamp) * 1000).format('YYYY'))
      const month = Number(moment(Number(row.timestamp) * 1000).format('MM'))
      const day = Number(moment(Number(row.timestamp) * 1000).format('DD'))
      const hour = Number(moment(Number(row.timestamp) * 1000).format('HH'))
      const hhStr = moment(Number(row.timestamp) * 1000).format('YYYY-MM-DD')
      let record = await this.thetaTxNumByHoursRepository.findOne({
        where: {
          year: Number(year),
          month: Number(month),
          day: Number(day),
          hour: Number(hour)
        }
      })

      if (!record) {
        record = new ThetaTxNumByHoursEntity()
        record.year = year
        record.month = month
        record.day = day
        record.hour = hour
        record.timestamp = moment(Number(row.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
        record.coin_base_tx = 0
        record.deposit_stake_tx = 0
        record.release_fund_tx = 0
        record.reserve_fund_tx = 0
        record.send_tx = 0
        record.service_payment_tx = 0
        record.slash_tx = 0
        record.smart_contract_tx = 0
        record.split_rule_tx = 0
        record.withdraw_stake_tx = 0
        record.block_number = 0
        record.active_wallet = 0
        record.tfuel_burnt = 0
      }
      for (const transaction of row.transactions) {
        switch (transaction.type) {
          case THETA_TRANSACTION_TYPE_ENUM.coinbase:
            record.coin_base_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.deposit_stake:
            record.deposit_stake_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.release_fund:
            record.release_fund_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
            record.reserve_fund_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.send:
            record.send_tx++
            transaction.raw.outputs.forEach((tx, index) => {
              if (tx.coins.thetawei !== '0') {
                // console.log('theta emit send')
                this.client.emit('send-tx-monitor', {
                  token_type: 0,
                  amount: Number(tx.coins.thetawei) / Math.pow(10, 18),
                  from: transaction.raw.inputs[0].address,
                  to: tx.address,
                  hash: transaction.hash
                })
              }
              if (tx.coins.tfuelwei !== '0') {
                // console.log('tf emit send')
                this.client.emit('send-tx-monitor', {
                  token_type: 1,
                  amount: Number(tx.coins.tfuelwei) / Math.pow(10, 18),
                  from: transaction.raw.inputs[0].address,
                  to: tx.address,
                  hash: transaction.hash
                })
              }
            })
            // if (transaction.raw.proposer.coins.thetawei !== '0') {
            // }
            // transaction.raw.proposer.address
            // transaction.
            break
          case THETA_TRANSACTION_TYPE_ENUM.service_payment:
            record.service_payment_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.slash:
            record.slash_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
            record.smart_contract_tx++
            this.logger.debug('row:' + JSON.stringify(row))
            await this.smartContractService.updateSmartContractRecord(
              row.timestamp,
              transaction.receipt.ContractAddress
            )
            break
          case THETA_TRANSACTION_TYPE_ENUM.split_rule:
            record.split_rule_tx++
            break
          case THETA_TRANSACTION_TYPE_ENUM.withdraw_stake:
            record.withdraw_stake_tx++
            break
          default:
            this.logger.error('no transaction.tx_type:' + transaction.type)
            break
        }
        if (transaction.raw.inputs && transaction.raw.inputs.length > 0) {
          for (const wallet of transaction.raw.inputs) {
            if (!(await this.cacheManager.get(hhStr + wallet.address))) {
              await this.cacheManager.set(hhStr + wallet.address, 1, { ttl: 3600 * 24 })
              record.active_wallet++
            }
          }
        }

        if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
          for (const wallet of transaction.raw.outputs) {
            if (!(await this.cacheManager.get(hhStr + wallet.address))) {
              await this.cacheManager.set(hhStr + wallet.address, 1, { ttl: 3600 * 24 })
              record.active_wallet++
            }
          }
        }

        if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
          record.tfuel_burnt += Number(
            new BigNumber(transaction.raw.fee.tfuelwei).dividedBy('1e18').toFixed()
          )
        }
      }

      record.latest_block_height = Number(row.height)
      record.block_number++
      await this.thetaTxNumByHoursRepository.save(record)
      height++
      await sleep(10)
    }
  }

  async updateCheckPoint(block: THETA_BLOCK_INTERFACE) {
    // block.result.
    // block.result.guardian_votes.result
    if (Number(block.result.height) % 100 !== 1) {
      return
    }
    const [
      vaTotalNodeNum,
      vaEffectiveNodeNum,
      vaTotalThetaWei,
      vaEffectiveThetaWei
    ] = await this.updateValidator(block)

    const [
      guTotalNodeNum,
      guEffectiveNodeNum,
      guTotalThetaWei,
      guEffectiveThetaWei
    ] = await this.updateGuardian(block)

    const [eenpTotalNodeNum, eenpEffectiveNodeNum, eenpTotalTfWei, eenpEffectiveTfWei]: [
      number,
      number,
      BigNumber,
      BigNumber
    ] = await this.updateEenp(block)
    let res = await this.stakeStatisticsRepository.findOne({
      block_height: Number(block.result.height)
    })
    if (!res) {
      this.logger.debug(
        'total guardian stake:' + parseInt(guTotalThetaWei.dividedBy('1e27').toFixed())
      )
      return await this.stakeStatisticsRepository.insert({
        block_height: Number(block.result.height),

        total_edge_node_num: eenpTotalNodeNum,
        effective_edge_node_num: eenpEffectiveNodeNum,
        total_edge_node_stake: parseInt(eenpTotalTfWei.dividedBy('1e18').toFixed()),
        effective_edge_node_stake: parseInt(eenpEffectiveTfWei.dividedBy('1e18').toFixed()),

        total_guardian_node_num: guTotalNodeNum,
        effective_guardian_node_num: guEffectiveNodeNum,
        total_guardian_stake: parseInt(guTotalThetaWei.dividedBy('1e18').toFixed()),
        effective_guardian_stake: parseInt(guEffectiveThetaWei.dividedBy('1e18').toFixed()),

        total_validator_node_num: vaTotalNodeNum,
        effective_validator_node_num: vaEffectiveNodeNum,
        effective_validator_stake: parseInt(vaEffectiveThetaWei.dividedBy('1e18').toFixed()),
        total_validator_stake: parseInt(vaTotalThetaWei.dividedBy('1e18').toFixed())
      })
    }
  }

  async updateValidator(
    block: THETA_BLOCK_INTERFACE
  ): Promise<[number, number, BigNumber, BigNumber]> {
    let totalNodeNum = 0,
      effectiveNodeNum = 0,
      totalThetaWei = new BigNumber(0),
      effectiveThetaWei = new BigNumber(0)
    const validatorList = await thetaTsSdk.blockchain.getVcpByHeight(block.result.height)
    validatorList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates.forEach((node) => {
      totalNodeNum++
      node.Stakes.forEach((stake) => {
        // if (stake.withdrawn === false) {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
        block.result.hcc.Votes.forEach((vote) => {
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

    const gcpList = await thetaTsSdk.blockchain.getGcpByHeight(block.result.height)
    for (const guardian of gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians) {
      totalNodeNum++
      guardian.Stakes.forEach((stake) => {
        totalThetaWei = totalThetaWei.plus(new BigNumber(stake.amount))
      })
    }
    for (let i = 0; i < block.result.guardian_votes.Multiplies.length; i++) {
      if (block.result.guardian_votes.Multiplies[i] !== 0) {
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
    const eenpList = await thetaTsSdk.blockchain.getEenpByHeight(block.result.height)
    eenpList.result.BlockHashEenpPairs[0].EENs.forEach((eenp) => {
      totalNodeNum++
      let isEffectiveNode = false
      block.result.elite_edge_node_votes.Multiplies.forEach((value, index) => {
        if (block.result.elite_edge_node_votes.Addresses[index] == eenp.Holder && value !== 0) {
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
