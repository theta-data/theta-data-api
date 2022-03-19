import { CACHE_MANAGER, Inject, Injectable, Logger, SerializeOptions } from '@nestjs/common'
import { getConnection, LessThan, MoreThan, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import BigNumber from 'bignumber.js'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import * as sleep from 'await-sleep'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
const config = require('config')
const moment = require('moment')
import { Interval } from '@nestjs/schedule'
import { BlockListEntity, BlockStatus } from './block-list.entity'
import { LoggerService } from 'src/common/logger.service'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { WalletEntity } from 'src/block-chain/wallet/wallet.entity'
import { UtilsService } from 'src/common/utils.service'
// import { SmartContractScType } from 'src/block-chain/smart-contract/smart-contract.model'
import { SmartContractService } from 'src/block-chain/smart-contract/smart-contract.service'
import fetch from 'cross-fetch'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
// import { rmSync } from 'fs'

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
  private nftConnection: QueryRunner

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private loggerService: LoggerService,
    private utilsService: UtilsService,
    private nftService: NftService,
    private smartContractService: SmartContractService
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

      this.nftConnection = getConnection('nft').createQueryRunner()

      await this.txConnection.connect()
      await this.analyseConnection.connect()
      await this.stakeConnection.connect()
      await this.smartContractConnection.connect()
      await this.walletConnection.connect()

      await this.nftConnection.connect()

      await this.txConnection.startTransaction()
      await this.analyseConnection.startTransaction()
      await this.stakeConnection.startTransaction()
      await this.smartContractConnection.startTransaction()
      await this.walletConnection.startTransaction()
      await this.nftConnection.startTransaction()

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
      if (height >= lastfinalizedHeight) throw new Error('no height to analyse')

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
      this.logger.debug('init counter', this.counter)
      for (let i = 0; i < blockList.result.length; i++) {
        const block = blockList.result[i]
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }
      this.logger.debug('start update calltimes by period')
      await this.txConnection.commitTransaction()
      await this.analyseConnection.commitTransaction()
      await this.stakeConnection.commitTransaction()
      await this.smartContractConnection.commitTransaction()
      await this.walletConnection.commitTransaction()
      await this.nftConnection.commitTransaction()
      this.logger.debug('commit success')
    } catch (e) {
      this.logger.error(e)
      this.logger.error('rollback')
      await this.txConnection.rollbackTransaction()
      await this.analyseConnection.rollbackTransaction()
      await this.stakeConnection.rollbackTransaction()
      await this.smartContractConnection.rollbackTransaction()
      await this.walletConnection.rollbackTransaction()
      await this.nftConnection.rollbackTransaction()
      // process.exit(0)
    } finally {
      await this.txConnection.release()
      await this.analyseConnection.release()
      await this.stakeConnection.release()
      await this.smartContractConnection.release()
      await this.walletConnection.release()
      await this.nftConnection.release()
      this.logger.debug('release success')
      await this.cacheManager.del(this.analyseKey)
    }
  }

  // @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')
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
      this.logger.debug('update checkpoint')
      await this.updateCheckPoint(block)
      await this.clearCallTimeByPeriod()
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
    const wallets = {}
    const smartContractToDeal: { [index: string]: SmartContractEntity } = {}
    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.coinbase:
          coin_base_transaction++
          if (latestFinalizedBlockHeight - height < 30 * 15000) {
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
          await this.smartContractConnection.query(
            `INSERT INTO smart_contract_entity(contract_address,height,call_times_update_timestamp) VALUES ('${
              transaction.receipt.ContractAddress
            }',${height},${moment().unix()})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1,call_times_update_timestamp=${moment().unix()};`
          )
          const smartContract = await this.smartContractConnection.manager.findOne(
            SmartContractEntity,
            {
              contract_address: transaction.receipt.ContractAddress
            }
          )
          if (
            smartContract.call_times > 10 &&
            !smartContract.verified &&
            moment().unix() - smartContract.verification_check_timestamp > 3600 * 24 * 30
          ) {
            const checkInfo = await this.verifyWithThetaExplorer(smartContract.contract_address)
            if (checkInfo) {
              Object.assign(smartContract, checkInfo)
              smartContract.verification_check_timestamp = moment().unix()
            } else {
              smartContract.verification_check_timestamp = moment().unix()
            }
            await this.smartContractConnection.manager.save(SmartContractEntity, smartContract)
          }
          // const record = await this.smartContractConnection.manager.find(
          //   SmartContractCallRecordEntity,
          //   {
          //     transaction_hash: transaction.hash
          //   }
          // )
          // if (!record) {
          //   await this.smartContractConnection.manager.insert(SmartContractCallRecordEntity, {
          //     timestamp: Number(block.timestamp),
          //     data: transaction.raw.data,
          //     receipt: JSON.stringify(transaction.receipt),
          //     height: height,
          //     transaction_hash: transaction.hash,
          //     contract_id: smartContract.id
          //   })
          // }
          await this.smartContractConnection.manager.upsert(
            SmartContractCallRecordEntity,
            {
              timestamp: Number(block.timestamp),
              data: transaction.raw.data,
              receipt: JSON.stringify(transaction.receipt),
              height: height,
              transaction_hash: transaction.hash,
              contract_id: smartContract.id
            },
            ['transaction_hash']
          )
          this.logger.debug('start parse nft record')
          smartContractToDeal[smartContract.contract_address] = smartContract
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
          if (!wallets[wallet.address.toLowerCase()]) {
            wallets[wallet.address.toLowerCase()] = {
              address: wallet.address.toLowerCase(),
              latest_active_time: Number(block.timestamp)
            }
          } else {
            wallets[wallet.address.toLowerCase()]['latest_active_time'] = Number(block.timestamp)
          }
        }
      }

      if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
        for (const wallet of transaction.raw.outputs) {
          if (!wallets[wallet.address.toLowerCase()]) {
            wallets[wallet.address.toLowerCase()] = {
              address: wallet.address.toLowerCase(),
              latest_active_time: Number(block.timestamp)
            }
          } else {
            wallets[wallet.address.toLowerCase()]['latest_active_time'] = Number(block.timestamp)
          }
        }
      }

      if (transaction.raw.fee && transaction.raw.fee.tfuelwei != '0') {
        theta_fuel_burnt += new BigNumber(transaction.raw.fee.tfuelwei).dividedBy('1e18').toNumber()
      }
    }
    const walletsToUpdate = Object.values(wallets)
    for (let i = 0; i < walletsToUpdate.length; i += 900) {
      this.logger.debug('start upsert wallet')
      await this.walletConnection.manager.upsert(WalletEntity, walletsToUpdate.slice(i, i + 900), [
        'address'
      ])
    }
    this.logger.debug(height + ' end upsert wallets')
    block_number++
    await this.txConnection.query(
      `INSERT INTO theta_tx_num_by_hours_entity (block_number,theta_fuel_burnt,theta_fuel_burnt_by_smart_contract,theta_fuel_burnt_by_transfers,active_wallet,coin_base_transaction,slash_transaction,send_transaction,reserve_fund_transaction,release_fund_transaction,service_payment_transaction,split_rule_transaction,deposit_stake_transaction,withdraw_stake_transaction,smart_contract_transaction,latest_block_height,timestamp) VALUES (${block_number},${theta_fuel_burnt}, ${theta_fuel_burnt_by_smart_contract},${theta_fuel_burnt_by_transfers},0,${coin_base_transaction},${slash_transaction},${send_transaction},${reserve_fund_transaction},${release_fund_transaction},${service_payment_transaction},${split_rule_transaction},${deposit_stake_transaction},${withdraw_stake_transaction},${smart_contract_transaction},${height},${timestamp})  ON CONFLICT (timestamp) DO UPDATE set block_number=block_number+${block_number},  theta_fuel_burnt=theta_fuel_burnt+${theta_fuel_burnt},theta_fuel_burnt_by_smart_contract=theta_fuel_burnt_by_smart_contract+${theta_fuel_burnt_by_smart_contract},theta_fuel_burnt_by_transfers=theta_fuel_burnt_by_transfers+${theta_fuel_burnt_by_transfers},coin_base_transaction=coin_base_transaction+${coin_base_transaction},slash_transaction=slash_transaction+${slash_transaction},send_transaction=send_transaction+${send_transaction},reserve_fund_transaction=reserve_fund_transaction+${reserve_fund_transaction},release_fund_transaction=release_fund_transaction+${release_fund_transaction},service_payment_transaction=service_payment_transaction+${service_payment_transaction},split_rule_transaction=split_rule_transaction+${split_rule_transaction},deposit_stake_transaction=deposit_stake_transaction+${deposit_stake_transaction},withdraw_stake_transaction=withdraw_stake_transaction+${withdraw_stake_transaction},smart_contract_transaction=smart_contract_transaction+${smart_contract_transaction},latest_block_height=${height};`
    )
    const smartContractList = Object.values(smartContractToDeal)
    for (const smartContract of smartContractList) {
      await this.nftService.parseRecordByContractAddressWithConnection(
        this.nftConnection,
        this.smartContractConnection,
        smartContract,
        height
      )
      await this.updateCallTimesByPeriod(smartContract.contract_address)
    }

    this.logger.debug(height + ' end update theta tx num by hours')
    await this.snapShotActiveWallets(Number(block.timestamp))

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

  async updateCallTimesByPeriod(contractAddress: string) {
    this.logger.debug('start update call times by period')
    if (config.get('IGNORE')) return false
    const contract = await this.smartContractConnection.manager.findOne(SmartContractEntity, {
      contract_address: contractAddress
    })

    contract.last_24h_call_times = await this.smartContractConnection.manager.count(
      SmartContractCallRecordEntity,
      {
        timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
        contract_id: contract.id
      }
    )
    contract.last_seven_days_call_times = await this.smartContractConnection.manager.count(
      SmartContractCallRecordEntity,
      {
        timestamp: MoreThan(moment().subtract(7, 'days').unix()),
        contract_id: contract.id
      }
    )
    await this.smartContractConnection.manager.save(contract)
    this.logger.debug('end update call times by period')
  }

  async clearCallTimeByPeriod() {
    if (config.get('IGNORE')) return false
    await this.smartContractConnection.manager.update(
      SmartContractEntity,
      {
        call_times_update_timestamp: LessThan(moment().subtract(24, 'hours').unix())
      },
      { last_24h_call_times: 0 }
    )
    await this.smartContractConnection.manager.update(
      SmartContractEntity,
      {
        call_times_update_timestamp: LessThan(moment().subtract(7, 'days').unix())
      },
      { last_seven_days_call_times: 0 }
    )
  }

  async snapShotActiveWallets(timestamp: number) {
    if (config.get('IGNORE')) return false
    if (moment(timestamp * 1000).minutes() < 1) {
      const hhTimestamp = moment(moment(timestamp * 1000).format('YYYY-MM-DD HH:00:00')).unix()
      const statisticsStartTimeStamp = moment(hhTimestamp * 1000)
        .subtract(24, 'hours')
        .unix()
      const totalAmount = await this.walletConnection.manager.count(WalletEntity, {
        latest_active_time: MoreThan(statisticsStartTimeStamp)
      })
      const activeWalletLastHour = await this.walletConnection.manager.count(WalletEntity, {
        latest_active_time: MoreThan(
          moment(hhTimestamp * 1000)
            .subtract(1, 'hours')
            .unix()
        )
      })
      await this.walletConnection.manager.query(
        `INSERT INTO active_wallets_entity(snapshot_time,active_wallets_amount,active_wallets_amount_last_hour) VALUES(${hhTimestamp}, ${totalAmount}, ${activeWalletLastHour}) ON CONFLICT (snapshot_time) DO UPDATE set active_wallets_amount = ${totalAmount},active_wallets_amount_last_hour=${activeWalletLastHour}`
      )
    }
  }

  async verifyWithThetaExplorer(address: string) {
    this.logger.debug('start verify: ' + address)
    const httpRes = await fetch(
      'https://explorer.thetatoken.org:8443/api/smartcontract/' + address,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (httpRes.status >= 400) {
      this.logger.error('Get smart contract ' + address + ': Bad response from server')
      return false
      // throw new Error('Get smart contract Info: Bad response from server')
    }
    const res: any = await httpRes.json()
    if (res.body.verification_date == '') return false
    // console.log('theta explorer res optimizer ', res.body.optimizer)
    const optimizer = res.body.optimizer === 'disabled' ? false : true
    // console.log('optimizer', optimizer)
    const optimizerRuns = res.body.optimizerRuns ? res.body.optimizerRuns : 200
    const sourceCode = res.body.source_code
    const version = res.body.compiler_version.match(/[\d,\.]+/g)[0]
    const versionFullName = 'soljson-' + res.body.compiler_version + '.js'
    const byteCode = res.body.bytecode

    address = this.utilsService.normalize(address.toLowerCase())
    return this.smartContractService.getVerifyInfo(
      address,
      sourceCode,
      byteCode,
      version,
      versionFullName,
      optimizer,
      optimizerRuns
    )
  }
}
