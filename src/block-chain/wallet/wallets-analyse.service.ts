import { Injectable, Logger } from '@nestjs/common'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { LoggerService } from 'src/common/logger.service'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { WalletEntity } from 'src/block-chain/wallet/wallet.entity'
import { UtilsService } from 'src/common/utils.service'

const config = require('config')
const moment = require('moment')
@Injectable()
export class WalletsAnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0
  private walletConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'wallet/record.height'

  constructor(private loggerService: LoggerService, private utilsService: UtilsService) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  public async analyseData() {
    try {
      this.walletConnection = getConnection('wallet').createQueryRunner()

      await this.walletConnection.connect()
      await this.walletConnection.startTransaction()

      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('STAKE_ANALYSE_START_HEIGHT')) {
        height = config.get('STAKE_ANALYSE_START_HEIGHT')
      }
      const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile)
      height = recordHeight > height ? recordHeight : height
      if (height >= lastfinalizedHeight) {
        await this.walletConnection.commitTransaction()
        this.logger.debug(height + ': commit success')
        this.logger.debug('no height to analyse')
        return
      }
      // await this.
      let endHeight = lastfinalizedHeight
      const analyseNumber = config.get('ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)
      //   this.startTimestamp = moment().unix()
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
      await this.walletConnection.commitTransaction()
      this.logger.debug('commit success')
      if (blockList.result.length > 0) {
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          Number(blockList.result[blockList.result.length - 1].height)
        )
      }
    } catch (e) {
      // console.log(e)
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.walletConnection.rollbackTransaction()
      // process.exit(0)
    } finally {
      await this.walletConnection.release()
      this.logger.debug('release success')
    }
  }

  // @OnEvent('block.analyse')
  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')

    const height = Number(block.height)
    const timestamp = moment(
      moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
    ).unix()

    const wallets = {}
    const smartContractToDeal: { [index: string]: SmartContractEntity } = {}
    for (const transaction of block.transactions) {
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
    }
    const walletsToUpdate = Object.values(wallets)
    for (let i = 0; i < walletsToUpdate.length; i += 900) {
      this.logger.debug('start upsert wallet')
      await this.walletConnection.manager.upsert(WalletEntity, walletsToUpdate.slice(i, i + 900), [
        'address'
      ])
    }
    this.logger.debug(height + ' end upsert wallets')
    this.logger.debug(height + ' end update theta tx num by hours')
    await this.snapShotActiveWallets(Number(block.timestamp))
    this.logger.debug(height + ' end update analyse')
    this.counter--
    this.loggerService.timeMonitor('counter:' + this.counter, this.startTimestamp)
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
}
