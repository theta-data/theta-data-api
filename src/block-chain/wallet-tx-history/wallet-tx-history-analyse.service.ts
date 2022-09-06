import { TransactionEntity } from './../explorer/transaction.entity'
import { Injectable, Logger } from '@nestjs/common'
import { UtilsService, writeFailExcuteLog, writeSucessExcuteLog } from 'src/common/utils.service'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from '../tx/theta.enum'
import { WalletTxHistoryEntity } from './wallet-tx-history.entity'
const fs = require('fs')
const config = require('config')
@Injectable()
export class WalletTxHistoryAnalyseService {
  private readonly logger = new Logger('wallet tx history analyse service')
  private walletConnection: QueryRunner
  private explorerConnection: QueryRunner
  private walletTxHistoryConnection: QueryRunner
  private heightConfigFile =
    config.get('ORM_CONFIG')['database'] + 'wallet-tx-history/record.height'

  constructor(private utilsService: UtilsService) {}

  public async analyseData() {
    try {
      // console.log(config.get('NFT_STATISTICS.ANALYSE_NUMBER'))
      this.logger.debug('start analyse nft data')
      this.walletConnection = getConnection('wallet').createQueryRunner()
      this.explorerConnection = getConnection('explorer').createQueryRunner()
      this.walletTxHistoryConnection = getConnection('wallet-tx-history').createQueryRunner()
      await this.walletConnection.connect()
      await this.explorerConnection.connect()
      await this.walletTxHistoryConnection.connect()
      await this.walletTxHistoryConnection.startTransaction()
      let startId: number = 0
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data) {
          startId = Number(data)
        }
      }
      const txRecords = await this.explorerConnection.manager.find(TransactionEntity, {
        where: {
          id: MoreThan(startId)
        },
        take: config.get('WALLET-TX-HISTORY.ANALYSE_NUMBER'),
        order: { id: 'ASC' }
      })
      const walletToUpdates: { [index: string]: Array<number> } = {}

      for (const record of txRecords) {
        await this.addWallet(record, walletToUpdates)
      }
      await this.updateWalletTxHistory(walletToUpdates)
      // await this.downloadAllImg()
      await this.walletTxHistoryConnection.commitTransaction()

      // try {
      if (txRecords.length > 0) {
        this.logger.debug('end height:' + Number(txRecords[txRecords.length - 1].id))
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          txRecords[txRecords.length - 1].id
        )
      }
    } catch (e) {
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.walletTxHistoryConnection.rollbackTransaction()
      writeFailExcuteLog(config.get('WALLET-TX-HISTORY.MONITOR_PATH'))
    } finally {
      await this.walletTxHistoryConnection.release()
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
      writeSucessExcuteLog(config.get('WALLET-TX-HISTORY.MONITOR_PATH'))
    }
  }

  async addWallet(record: TransactionEntity, walletsToupdate: { [index: string]: Array<number> }) {
    if (record.tx_type === THETA_TRANSACTION_TYPE_ENUM.send) {
      for (const addr of [...record.from, ...record.to]) {
        if (addr === '0x0000000000000000000000000000000000000000') continue
        if (!walletsToupdate[addr]) {
          walletsToupdate[addr] = []
        }
        !walletsToupdate[addr].includes(record.id) && walletsToupdate[addr].push(record.id)
      }
    } else {
      if (record.from && record.from != '0x0000000000000000000000000000000000000000') {
        if (!walletsToupdate[record.from]) {
          walletsToupdate[record.from] = []
        }
        walletsToupdate[record.from].push(record.id)
      }
      if (record.to && record.to != '0x0000000000000000000000000000000000000000') {
        if (!walletsToupdate[record.to]) {
          walletsToupdate[record.to] = []
        }
        walletsToupdate[record.to].push(record.id)
      }
    }
  }

  async updateWalletTxHistory(walletsToupdate: { [index: string]: Array<number> }) {
    const wallets = Object.keys(walletsToupdate)
    for (const wallet of wallets) {
      const tx = await this.walletTxHistoryConnection.manager.findOne(WalletTxHistoryEntity, {
        where: { wallet: wallet }
      })
      if (tx) {
        tx.tx_ids = JSON.stringify([
          ...new Set([...JSON.parse(tx.tx_ids), ...walletsToupdate[wallet]])
        ])
        await this.walletTxHistoryConnection.manager.save(tx)
      } else {
        const newTx = new WalletTxHistoryEntity()
        newTx.wallet = wallet
        newTx.tx_ids = JSON.stringify(walletsToupdate[wallet])
        await this.walletTxHistoryConnection.manager.save(newTx)
      }
    }
  }
}
