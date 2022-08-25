import { Injectable, Logger } from '@nestjs/common'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { LoggerService } from 'src/common/logger.service'
import { WalletEntity } from 'src/block-chain/wallet/wallet.entity'
import { UtilsService } from 'src/common/utils.service'

const config = require('config')
const moment = require('moment')
@Injectable()
export class WalletsAnalyseService {
  private readonly logger = new Logger('wallet analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0
  private walletConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'wallet/record.height'

  constructor(private loggerService: LoggerService, private utilsService: UtilsService) {
    // thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
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

      if (config.get('WALLET.START_HEIGHT')) {
        height = config.get('WALLET.START_HEIGHT')
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
      const analyseNumber = config.get('WALLET.ANALYSE_NUMBER')
      if (lastfinalizedHeight - height > analyseNumber) {
        endHeight = height + analyseNumber
      }
      this.logger.debug('start height: ' + height + '; end height: ' + endHeight)

      //   this.startTimestamp = moment().unix()
      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        height.toString(),
        endHeight.toString()
      )
      const actualEndHeight = Number(blockList.result[blockList.result.length - 1].height)
      this.logger.debug('block list length:' + blockList.result.length)
      this.logger.debug('actual end height:' + actualEndHeight)
      this.counter = blockList.result.length
      this.logger.debug('init counter', this.counter)
      const blockArr = {}
      for (const block of blockList.result) {
        const hhTimestamp = moment(
          moment(Number(block.timestamp) * 1000).format('YYYY-MM-DD HH:00:00')
        ).unix()
        if (!blockArr[hhTimestamp]) {
          blockArr[hhTimestamp] = [block]
        } else {
          blockArr[hhTimestamp].push(block)
        }
      }
      const blocksToDeal: Array<Array<THETA_BLOCK_INTERFACE>> = Object.values(blockArr)

      this.logger.debug('blocks Collection lenght: ' + blocksToDeal.length)

      for (const blocks of blocksToDeal) {
        await this.dealBlocks(blocks)
      }

      // for (let i = 0; i < blockList.result.length; i++) {
      //   const block = blockList.result[i]
      //   this.logger.debug(block.height + ' start hanldle')
      //   await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      // }
      // this.logger.debug('start update calltimes by period')
      await this.walletConnection.commitTransaction()
      this.logger.debug('commit success')
      if (blockList.result.length > 0) {
        this.utilsService.updateRecordHeight(this.heightConfigFile, actualEndHeight)
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
    this.logger.debug(block.height + ' start insert, timestamp:' + block.timestamp)

    const height = Number(block.height)

    const wallets = {}
    for (const transaction of block.transactions) {
      if (transaction.raw.inputs && transaction.raw.inputs.length > 0) {
        for (const wallet of transaction.raw.inputs) {
          this.updateWallets(wallets, wallet.address, transaction.hash, Number(block.timestamp))
        }
      }

      if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
        for (const wallet of transaction.raw.outputs) {
          this.updateWallets(wallets, wallet.address, transaction.hash, Number(block.timestamp))
        }
      }
      if (transaction.raw.from) {
        this.updateWallets(
          wallets,
          transaction.raw.from.address,
          transaction.hash,
          Number(block.timestamp)
        )
      }
      if (transaction.raw.to) {
        this.updateWallets(
          wallets,
          transaction.raw.to.address,
          transaction.hash,
          Number(block.timestamp)
        )
      }
      if (transaction.raw.source) {
        this.updateWallets(
          wallets,
          transaction.raw.source.address,
          transaction.hash,
          Number(block.timestamp)
        )
      }
      if (transaction.raw.proposer) {
        this.updateWallets(
          wallets,
          transaction.raw.proposer.address,
          transaction.hash,
          Number(block.timestamp)
        )
      }
    }
    const walletsToUpdate: Array<{
      address: string
      latest_active_time: number
      hashs: Array<string>
    }> = Object.values(wallets)
    this.logger.debug('wallets length: ' + walletsToUpdate.length)
    for (let i = 0; i < walletsToUpdate.length; i++) {
      // this.logger.debug('start upsert wallet')
      const wallet = await this.walletConnection.manager.findOne(WalletEntity, {
        where: {
          address: walletsToUpdate[i].address
        }
      })
      if (!wallet) {
        await this.walletConnection.manager.insert(WalletEntity, {
          address: walletsToUpdate[i].address,
          latest_active_time: walletsToUpdate[i].latest_active_time,
          txs_hash_list: JSON.stringify(walletsToUpdate[i].hashs)
        })
      } else {
        wallet.latest_active_time = walletsToUpdate[i].latest_active_time
        const hashList = JSON.parse(wallet.txs_hash_list)
        for (const hash of walletsToUpdate[i].hashs) {
          if (!hashList.includes(hash)) {
            hashList.push(hash)
          }
        }
        wallet.txs_hash_list = JSON.stringify(hashList)
        await this.walletConnection.manager.save(wallet)
      }
    }
    this.logger.debug(height + ' end upsert wallets')
    await this.snapShotActiveWallets(Number(block.timestamp))
    this.logger.debug(height + ' end update analyse')
    this.counter--
  }

  async dealBlocks(blocks: Array<THETA_BLOCK_INTERFACE>) {
    // this.logger.debug(block.height + ' start insert, timestamp:' + block.timestamp)
    const wallets = {}
    for (const block of blocks) {
      const height = Number(block.height)

      for (const transaction of block.transactions) {
        if (transaction.raw.inputs && transaction.raw.inputs.length > 0) {
          for (const wallet of transaction.raw.inputs) {
            this.updateWallets(wallets, wallet.address, transaction.hash, Number(block.timestamp))
          }
        }

        if (transaction.raw.outputs && transaction.raw.outputs.length > 0) {
          for (const wallet of transaction.raw.outputs) {
            this.updateWallets(wallets, wallet.address, transaction.hash, Number(block.timestamp))
          }
        }
        if (transaction.raw.from) {
          this.updateWallets(
            wallets,
            transaction.raw.from.address,
            transaction.hash,
            Number(block.timestamp)
          )
        }
        if (transaction.raw.to) {
          this.updateWallets(
            wallets,
            transaction.raw.to.address,
            transaction.hash,
            Number(block.timestamp)
          )
        }
        if (transaction.raw.source) {
          this.updateWallets(
            wallets,
            transaction.raw.source.address,
            transaction.hash,
            Number(block.timestamp)
          )
        }
        if (transaction.raw.proposer) {
          this.updateWallets(
            wallets,
            transaction.raw.proposer.address,
            transaction.hash,
            Number(block.timestamp)
          )
        }
      }

      this.logger.debug(height + ' end insert wallet')
      this.counter--
    }
    const walletsToUpdate: Array<{
      address: string
      latest_active_time: number
      hashs: Array<string>
    }> = Object.values(wallets)
    this.logger.debug('wallets length: ' + walletsToUpdate.length)
    for (let i = 0; i < walletsToUpdate.length; i++) {
      // this.logger.debug('start upsert wallet')
      const wallet = await this.walletConnection.manager.findOne(WalletEntity, {
        where: {
          address: walletsToUpdate[i].address
        }
      })
      if (!wallet) {
        await this.walletConnection.manager.insert(WalletEntity, {
          address: walletsToUpdate[i].address,
          latest_active_time: walletsToUpdate[i].latest_active_time,
          txs_hash_list: JSON.stringify(walletsToUpdate[i].hashs)
        })
      } else {
        wallet.latest_active_time = walletsToUpdate[i].latest_active_time
        const hashList = JSON.parse(wallet.txs_hash_list)
        for (const hash of walletsToUpdate[i].hashs) {
          if (!hashList.includes(hash)) {
            hashList.push(hash)
          }
        }
        wallet.txs_hash_list = JSON.stringify(hashList)
        await this.walletConnection.manager.save(wallet)
      }
      this.logger.debug(walletsToUpdate.length - i + ' upsert left')
    }
    this.logger.debug('start snapshot active wallets')
    // this.logger.debug(height + ' end upsert wallets')
    await this.snapShotActiveWallets(Number(blocks[0].timestamp))
    this.logger.debug('end snapshot active wallets')
  }
  async updateWallets(wallets: {}, address: string, hash: string, timestamp: number) {
    if (!wallets[address.toLowerCase()]) {
      wallets[address.toLowerCase()] = {
        address: address.toLowerCase(),
        latest_active_time: timestamp,
        hashs: [hash]
      }
    } else {
      wallets[address.toLowerCase()]['latest_active_time'] = Number(timestamp)
      if (!wallets[address.toLowerCase()]['hashs'].includes(hash)) {
        wallets[address.toLowerCase()]['hashs'].push(hash)
      }
    }
  }

  async snapShotActiveWallets(timestamp: number) {
    if (config.get('IGNORE')) return false
    // if (moment(timestamp * 1000).minutes() < 1) {
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
    // }
  }
}
