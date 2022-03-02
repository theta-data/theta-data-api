import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
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
import { AnalyseLockEntity } from './analyse-lock.entity'

@Injectable()
export class AnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity, 'tx')
    private thetaTxNumByHoursRepository: Repository<ThetaTxNumByHoursEntity>,

    @InjectRepository(StakeStatisticsEntity, 'stake')
    private stakeStatisticsRepository: Repository<StakeStatisticsEntity>,

    @InjectRepository(StakeRewardEntity, 'stake')
    private stakeRewardRepository: Repository<StakeRewardEntity>,

    @InjectRepository(BlockListEntity, 'analyse')
    private blockListRepository: Repository<BlockListEntity>,

    @InjectRepository(AnalyseLockEntity, 'analyse')
    private analyseLockRepository: Repository<AnalyseLockEntity>,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private smartContractService: SmartContractService,

    private walletService: WalletService,

    private eventEmitter: EventEmitter2
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    // const analyseKey = 'under_analyse'
    this.analyseLockRepository
      .update({ lock_key: this.analyseKey }, { status: false })
      .then(() => {
        this.logger.debug('restore analyse lock success')
      })
      .catch((e) => {
        this.logger.debug(e)
      })

    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  @Interval(config.get('ANALYSE_INTERVAL'))
  public async analyseData() {
    this.logger.debug('start analyse')
    // const analyseKey = 'under_analyse'
    const analyseLock = await this.analyseLockRepository.findOne({ lock_key: this.analyseKey })
    if (!analyseLock) {
      try {
        return await this.analyseLockRepository.insert({
          lock_key: this.analyseKey,
          status: false
        })
      } catch (e) {
        return this.logger.debug(e)
        // return
      }
    }
    if (analyseLock.status == false) {
      try {
        await this.analyseLockRepository.update(
          { status: false, lock_key: this.analyseKey },
          { status: true }
        )
      } catch (e) {
        return this.logger.debug(e)
      }
    } else {
      return this.logger.debug('under analyse')
    }

    await this.cacheManager.set(this.analyseKey, true, { ttl: 0 })

    let height: number = 0
    const lastfinalizedHeight = Number(
      (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
    )
    height = lastfinalizedHeight - 1000
    this.logger.debug('analyse Data get latest finalized height from block chain:' + height)
    if (config.get('START_HEIGHT')) {
      height = config.get('START_HEIGHT')
    }
    const latestBlock = await this.blockListRepository.findOne({
      order: {
        block_number: 'DESC'
      }
    })

    if (latestBlock && latestBlock.block_number >= height) {
      height = latestBlock.block_number + 1
    }

    this.logger.debug('get height to analyse: ' + height)

    let endHeight = lastfinalizedHeight
    if (lastfinalizedHeight - height > 4500) {
      endHeight = height + 4500
    }
    this.logger.debug('start height: ' + height + '; end height: ' + endHeight)

    const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
      height.toString(),
      endHeight.toString()
    )
    this.logger.debug('block list length:' + blockList.result.length)

    for (let i = 0; i < blockList.result.length; i++) {
      try {
        const block = blockList.result[i]
        this.logger.debug('analyse height: ' + block.height)
        await this.blockListRepository.insert({
          block_number: Number(block.height),
          status: BlockStatus.inserted
        })
        // await this.cacheManager.set('height', height, { ttl: 0 })
        this.logger.debug('send emit')
        this.eventEmitter.emit('block.analyse', block, lastfinalizedHeight)
        // return
      } catch (e) {
        this.logger.error(e)
      }
    }
    try {
      await this.analyseLockRepository.update({ status: true }, { status: false })
    } catch (e) {
      return this.logger.debug(e)
    }
  }

  @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    try {
      const height = Number(block.height)
      const timestamp = moment(
        moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
      ).unix()
      this.logger.debug(
        'handle height: ' + height + ' last finalized height: ' + latestFinalizedBlockHeight
      )
      if (Number(block.height) % 100 === 1) {
        if (latestFinalizedBlockHeight - Number(block.height) < 5000) {
          await this.updateCheckPoint(block)
        } else {
          this.logger.debug('no need to calculate checkpoint block')
        }
      }

      let coin_base_transaction = 0,
        theta_fuel_burnt_by_smart_contract = 0,
        theta_fuel_burnt_by_transfers = 0,
        deposit_stake_transaction = 0,
        release_fund_transaction = 0,
        reserve_fund_transaction = 0,
        send_transaction = 0,
        service_payment_transaction = 0,
        slash_transaction = 0,
        smart_contract_transaction = 0,
        split_rule_transaction = 0,
        withdraw_stake_transaction = 0,
        block_number = 0,
        active_wallet = 0,
        theta_fuel_burnt = 0
      // }
      for (const transaction of block.transactions) {
        switch (transaction.type) {
          case THETA_TRANSACTION_TYPE_ENUM.coinbase:
            coin_base_transaction++
            for (const output of transaction.raw.outputs) {
              await this.stakeRewardRepository.upsert(
                {
                  reward_amount: Number(
                    new BigNumber(output.coins.tfuelwei).dividedBy('1e18').toFixed()
                  ),
                  wallet_address: output.address.toLocaleLowerCase(),
                  reward_height: height,
                  timestamp: Number(block.timestamp)
                },
                ['wallet_address', 'reward_height']
              )
            }
            break
          case THETA_TRANSACTION_TYPE_ENUM.deposit_stake:
            deposit_stake_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.release_fund:
            release_fund_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
            reserve_fund_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.send:
            send_transaction++
            if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
              theta_fuel_burnt_by_transfers += new BigNumber(transaction.raw.fee.tfuelwei)
                .dividedBy('1e18')
                .toNumber()
            }
            break

          case THETA_TRANSACTION_TYPE_ENUM.service_payment:
            service_payment_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.slash:
            slash_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
            smart_contract_transaction++
            await this.smartContractService.updateSmartContractRecord(
              block.timestamp,
              transaction.receipt.ContractAddress,
              transaction.raw.data,
              JSON.stringify(transaction.receipt),
              height,
              transaction.hash
            )
            if (transaction.raw.gas_limit && transaction.raw.gas_price) {
              theta_fuel_burnt_by_smart_contract += new BigNumber(transaction.raw.gas_price)
                .multipliedBy(transaction.receipt.GasUsed)
                .dividedBy('1e18')
                .toNumber()

              theta_fuel_burnt += new BigNumber(transaction.raw.gas_price)
                .multipliedBy(transaction.receipt.GasUsed)
                .dividedBy('1e18')
                .toNumber()
            }
            break
          case THETA_TRANSACTION_TYPE_ENUM.split_rule:
            split_rule_transaction++
            break
          case THETA_TRANSACTION_TYPE_ENUM.withdraw_stake:
            withdraw_stake_transaction++
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
          theta_fuel_burnt += new BigNumber(transaction.raw.fee.tfuelwei)
            .dividedBy('1e18')
            .toNumber()
        }
      }
      block_number++
      await this.walletService.snapShotActiveWallets(Number(block.timestamp))
      await this.thetaTxNumByHoursRepository.query(
        `INSERT INTO theta_tx_num_by_hours_entity (block_number,theta_fuel_burnt,theta_fuel_burnt_by_smart_contract,theta_fuel_burnt_by_transfers,active_wallet,coin_base_transaction,slash_transaction,send_transaction,reserve_fund_transaction,release_fund_transaction,service_payment_transaction,split_rule_transaction,deposit_stake_transaction,withdraw_stake_transaction,smart_contract_transaction,latest_block_height,timestamp) VALUES (${block_number},${theta_fuel_burnt}, ${theta_fuel_burnt_by_smart_contract},${theta_fuel_burnt_by_transfers},0,${coin_base_transaction},${slash_transaction},${send_transaction},${reserve_fund_transaction},${release_fund_transaction},${service_payment_transaction},${split_rule_transaction},${deposit_stake_transaction},${withdraw_stake_transaction},${smart_contract_transaction},${height},${timestamp})  ON CONFLICT (timestamp) DO UPDATE set block_number=block_number+${block_number},  theta_fuel_burnt=theta_fuel_burnt+${theta_fuel_burnt},theta_fuel_burnt_by_smart_contract=theta_fuel_burnt_by_smart_contract+${theta_fuel_burnt_by_smart_contract},theta_fuel_burnt_by_transfers=theta_fuel_burnt_by_transfers+${theta_fuel_burnt_by_transfers},coin_base_transaction=coin_base_transaction+${coin_base_transaction},slash_transaction=slash_transaction+${slash_transaction},send_transaction=send_transaction+${send_transaction},reserve_fund_transaction=reserve_fund_transaction+${reserve_fund_transaction},release_fund_transaction=release_fund_transaction+${release_fund_transaction},service_payment_transaction=service_payment_transaction+${service_payment_transaction},split_rule_transaction=split_rule_transaction+${split_rule_transaction},deposit_stake_transaction=deposit_stake_transaction+${deposit_stake_transaction},withdraw_stake_transaction=withdraw_stake_transaction+${withdraw_stake_transaction},smart_contract_transaction=smart_contract_transaction+${smart_contract_transaction},latest_block_height=${height};`
      )
      await this.blockListRepository.update(
        {
          status: BlockStatus.inserted,
          block_number: height
        },
        {
          status: BlockStatus.analysed
        }
      )

      this.logger.debug('block ' + height + ' analyse end')
    } catch (e) {
      this.logger.error(e)
    }
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
