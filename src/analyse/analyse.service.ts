import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { ClientProxy } from '@nestjs/microservices'
import { ThetaTxNumByHoursEntity } from '../tx/theta-tx-num-by-hours.entity'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'

const moment = require('moment')
const sleep = require('await-sleep')
thetaTsSdk.blockchain.setUrl('https://theta-bridge-rpc.thetatoken.org/rpc')

@Injectable()
export class AnalyseService {
  // doLoop = true
  private readonly logger = new Logger('analyse service')
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumByHoursRepository: Repository<ThetaTxNumByHoursEntity>,
    @Inject('SEND_TX_MONITOR_SERVICE') private client: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  // public stopQueryData() {
  //   this.doLoop = false
  // }

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
      }
      record.latest_block_height = Number(row.height)
      record.block_number++
      await this.thetaTxNumByHoursRepository.save(record)
      height++
      await sleep(10)
    }
  }
}
