import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { getConnection, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractService } from '../block-chain/smart-contract/smart-contract.service'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
const config = require('config')
const moment = require('moment')
import { Interval } from '@nestjs/schedule'
import { BlockListEntity, BlockStatus } from './block-list.entity'
import { LoggerService } from 'src/common/logger.service'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { WalletEntity } from 'src/block-chain/wallet/wallet.entity'

@Injectable()
export class AnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0

  private txConnection: QueryRunner
  private analyseConnection: QueryRunner
  private stakeConnection: QueryRunner
  private smartContractConnection: QueryRunner
  private walletConnection: QueryRunner

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private loggerService: LoggerService
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  @Interval(config.get('ANALYSE_INTERVAL'))
  public async analyseData() {
    const analyseKey = await this.cacheManager.get(this.analyseKey)
    if (!analyseKey) {
      this.logger.debug('start analyse')
      await this.cacheManager.set(this.analyseKey, true, { ttl: 10000 })
    } else {
      return this.logger.debug('under analyse')
    }
    try {
      this.txConnection = getConnection('tx').createQueryRunner()

      this.analyseConnection = getConnection('analyse').createQueryRunner()

      this.stakeConnection = getConnection('stake').createQueryRunner()

      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()

      this.walletConnection = getConnection('wallet').createQueryRunner()

      await this.txConnection.connect()
      await this.analyseConnection.connect()
      await this.stakeConnection.connect()
      await this.smartContractConnection.connect()
      await this.walletConnection.connect()

      await this.txConnection.startTransaction()
      await this.analyseConnection.startTransaction()
      await this.stakeConnection.startTransaction()
      await this.smartContractConnection.startTransaction()
      await this.walletConnection.startTransaction()

      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('START_HEIGHT')) {
        height = config.get('START_HEIGHT')
      }
      const latestBlock = await this.analyseConnection.manager.findOne(BlockListEntity, {
        order: {
          block_number: 'DESC'
        }
      })

      if (latestBlock && latestBlock.block_number >= height) {
        height = latestBlock.block_number + 1
      }

      let endHeight = lastfinalizedHeight
      const analyseNumber = config.get('ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)
      this.startTimestamp = moment().unix()
      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        height.toString(),
        endHeight.toString()
      )
      this.logger.debug('block list length:' + blockList.result.length)
      this.counter = blockList.result.length
      // this.logger.debug
      this.logger.debug('init counter', this.counter)
      for (let i = 0; i < blockList.result.length; i++) {
        // try {
        const block = blockList.result[i]
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }
      await this.txConnection.commitTransaction()
      await this.analyseConnection.commitTransaction()
      await this.stakeConnection.commitTransaction()
      await this.smartContractConnection.commitTransaction()
      await this.walletConnection.commitTransaction()
      this.logger.debug('commit success')
      // blockList = null
      // delete(blockList)
    } catch (e) {
      this.logger.error(e)
      this.logger.error('rollback')
      await this.txConnection.rollbackTransaction()
      await this.analyseConnection.rollbackTransaction()
      await this.stakeConnection.rollbackTransaction()
      await this.smartContractConnection.rollbackTransaction()
      await this.walletConnection.rollbackTransaction()
      // process.exit(0)
    } finally {
      await this.txConnection.release()
      await this.analyseConnection.release()
      await this.stakeConnection.release()
      await this.smartContractConnection.release()
      await this.walletConnection.release()
      this.logger.debug('release success')

      await this.cacheManager.del(this.analyseKey)
    }
  }

  // @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + 'start insert')
    await this.analyseConnection.manager.insert(BlockListEntity, {
      block_number: Number(block.height),
      status: BlockStatus.inserted
    })
    const height = Number(block.height)
    const timestamp = moment(
      moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
    ).unix()

    if (
      Number(block.height) % 100 === 1 &&
      latestFinalizedBlockHeight - Number(block.height) < 5000
    ) {
      await this.updateCheckPoint(block)
    } else {
      this.logger.debug(height + ' no need to calculate checkpoint block')
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
          const stakeRewardStart = moment().unix()
          const transacitonToBeUpserted = []
          for (const output of transaction.raw.outputs) {
            // this.logger.debug('upsert coinbae transaction')
            transacitonToBeUpserted.push({
              reward_amount: Number(
                new BigNumber(output.coins.tfuelwei).dividedBy('1e18').toFixed()
              ),
              wallet_address: output.address.toLocaleLowerCase(),
              reward_height: height,
              timestamp: Number(block.timestamp)
            })
            if (transacitonToBeUpserted.length > 900) {
              await this.stakeConnection.manager.upsert(
                StakeRewardEntity,
                transacitonToBeUpserted,
                ['wallet_address', 'reward_height']
              )

              this.loggerService.timeMonitor(height + ': stake reward upsert ', stakeRewardStart)
              transacitonToBeUpserted.length = 0
            }
          }
          await this.stakeConnection.manager.upsert(StakeRewardEntity, transacitonToBeUpserted, [
            'wallet_address',
            'reward_height'
          ])
          this.loggerService.timeMonitor(
            height + ': complete stake reward upsert',
            stakeRewardStart
          )
          this.logger.debug(height + ' end upsert stake reward')
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
          await this.smartContractConnection.query(
            `INSERT INTO smart_contract_entity(contract_address,height) VALUES ('${transaction.receipt.ContractAddress}',${height})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1;`
          )
          const smartContract = await this.smartContractConnection.manager.findOne(
            SmartContractEntity,
            {
              contract_address: transaction.receipt.ContractAddress
            }
          )
          await this.smartContractConnection.manager.insert(SmartContractCallRecordEntity, {
            timestamp: Number(timestamp),
            data: transaction.raw.data,
            receipt: JSON.stringify(transaction.receipt),
            height: height,
            tansaction_hash: transaction.hash,
            contract_id: smartContract.id
          })
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
      const startUpdateWallets = moment().unix()
      const wallets = []
      if (transaction.raw.inputs && transaction.raw.inputs.length > 0) {
        for (const wallet of transaction.raw.inputs) {
          wallets.push({
            address: wallet.address,
            latest_active_time: Number(block.timestamp)
          })
          await this.walletConnection.manager.upsert(WalletEntity, wallets, ['address'])
          if (wallets.length > 900) {
            await this.walletConnection.manager.upsert(WalletEntity, wallets, ['address'])
            wallets.length = 0
          }
        }
      }

      if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
        for (const wallet of transaction.raw.outputs) {
          wallets.push({
            address: wallet.address,
            latest_active_time: Number(block.timestamp)
          })
          if (wallets.length > 900) {
            await this.walletConnection.manager.upsert(WalletEntity, wallets, ['address'])
            wallets.length = 0
          }
        }
      }
      await this.walletConnection.manager.upsert(WalletEntity, wallets, ['address'])
      this.loggerService.timeMonitor(block.height + ' insert or update wallets', startUpdateWallets)
      this.logger.debug(height + ' end upsert wallets')

      if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
        theta_fuel_burnt += new BigNumber(transaction.raw.fee.tfuelwei).dividedBy('1e18').toNumber()
      }
    }
    block_number++
    const startSnapShot = moment().unix()
    this.logger.debug(height + ' end snap shot')
    this.loggerService.timeMonitor('snapshot', startSnapShot)

    await this.txConnection.query(
      `INSERT INTO theta_tx_num_by_hours_entity (block_number,theta_fuel_burnt,theta_fuel_burnt_by_smart_contract,theta_fuel_burnt_by_transfers,active_wallet,coin_base_transaction,slash_transaction,send_transaction,reserve_fund_transaction,release_fund_transaction,service_payment_transaction,split_rule_transaction,deposit_stake_transaction,withdraw_stake_transaction,smart_contract_transaction,latest_block_height,timestamp) VALUES (${block_number},${theta_fuel_burnt}, ${theta_fuel_burnt_by_smart_contract},${theta_fuel_burnt_by_transfers},0,${coin_base_transaction},${slash_transaction},${send_transaction},${reserve_fund_transaction},${release_fund_transaction},${service_payment_transaction},${split_rule_transaction},${deposit_stake_transaction},${withdraw_stake_transaction},${smart_contract_transaction},${height},${timestamp})  ON CONFLICT (timestamp) DO UPDATE set block_number=block_number+${block_number},  theta_fuel_burnt=theta_fuel_burnt+${theta_fuel_burnt},theta_fuel_burnt_by_smart_contract=theta_fuel_burnt_by_smart_contract+${theta_fuel_burnt_by_smart_contract},theta_fuel_burnt_by_transfers=theta_fuel_burnt_by_transfers+${theta_fuel_burnt_by_transfers},coin_base_transaction=coin_base_transaction+${coin_base_transaction},slash_transaction=slash_transaction+${slash_transaction},send_transaction=send_transaction+${send_transaction},reserve_fund_transaction=reserve_fund_transaction+${reserve_fund_transaction},release_fund_transaction=release_fund_transaction+${release_fund_transaction},service_payment_transaction=service_payment_transaction+${service_payment_transaction},split_rule_transaction=split_rule_transaction+${split_rule_transaction},deposit_stake_transaction=deposit_stake_transaction+${deposit_stake_transaction},withdraw_stake_transaction=withdraw_stake_transaction+${withdraw_stake_transaction},smart_contract_transaction=smart_contract_transaction+${smart_contract_transaction},latest_block_height=${height};`
    )
    this.logger.debug(height + ' end update theta tx num by hours')

    await this.analyseConnection.manager.update(
      BlockListEntity,
      {
        status: BlockStatus.inserted,
        block_number: height
      },
      {
        status: BlockStatus.analysed
      }
    )
    this.logger.debug(height + ' end update analyse')

    this.counter--
    this.loggerService.timeMonitor('counter:' + this.counter, this.startTimestamp)
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
      let res = await this.stakeConnection.manager.findOne(StakeStatisticsEntity, {
        block_height: Number(block.height)
      })
      if (!res) {
        this.logger.debug(
          'total guardian stake:' + parseInt(guTotalThetaWei.dividedBy('1e27').toFixed())
        )
        try {
          return await this.stakeConnection.manager.insert(StakeStatisticsEntity, {
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
