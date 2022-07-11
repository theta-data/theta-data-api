import { TransactionEntity } from './transaction.entity'
import { BlokcListEntity } from './block-list.entity'
import { UtilsService } from 'src/common/utils.service'
import { getConnection, QueryRunner } from 'typeorm'
import { Injectable, Logger } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/dist/types/interface'
import BigNumber from 'bignumber.js'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'

const config = require('config')
const path = require('path')
// console.log('get path', path.basename(path.resolve(process.cwd())))

@Injectable()
export class ExplorerAnalyseService {
  private explorerConnection: QueryRunner
  private readonly logger = new Logger('analyse service')

  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'explorer/record.height'

  private current: any = {}
  // utilsService: any

  constructor(private utilsService: UtilsService) {}

  async getInitHeight(configPath: string): Promise<[Number, Number]> {
    let height: number = 0
    this.logger.debug(this.heightConfigFile)
    const lastfinalizedHeight = Number(
      (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
    )
    this.logger.debug(JSON.stringify(config.get(configPath.toUpperCase() + '.START_HEIGHT')))
    // height = lastfinalizedHeight - 1000
    if (config.get(configPath.toUpperCase() + '.START_HEIGHT')) {
      height = config.get(configPath.toUpperCase() + '.START_HEIGHT')
    }
    const recordHeight = this.utilsService.getRecordHeight(this.heightConfigFile)
    height = recordHeight > height ? recordHeight : height

    if (height >= lastfinalizedHeight) {
      this.logger.debug('commit success')
      this.logger.debug('no height to analyse')
      return [0, 0]
    }
    // await this.
    let endHeight = lastfinalizedHeight
    const analyseNumber = config.get(configPath.toUpperCase() + '.ANALYSE_NUMBER')
    if (lastfinalizedHeight - height > analyseNumber) {
      endHeight = height + analyseNumber
    }
    return [height, endHeight]
  }

  public async analyseData() {
    try {
      this.explorerConnection = getConnection('explorer').createQueryRunner()
      await this.explorerConnection.connect()
      await this.explorerConnection.startTransaction()
      const [startHeight, endHeight] = await this.getInitHeight('explorer')
      if (endHeight == 0) {
        await this.explorerConnection.commitTransaction()
        await this.explorerConnection.release()
        return
      }
      this.logger.debug(
        'start analyse data, start height:' + startHeight + ', end height:' + endHeight
      )

      const blockList = await thetaTsSdk.blockchain.getBlockSByRange(
        startHeight.toString(),
        endHeight.toString()
      )
      this.logger.debug('get block list length:' + blockList.result.length)
      for (const block of blockList.result) {
        await this.handleData(block)
      }
      if (blockList.result.length > 0) {
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          Number(blockList.result[blockList.result.length - 1].height)
        )
      }
      await this.explorerConnection.commitTransaction()
    } catch (e) {
      this.logger.error(e)
      console.error(e)
      this.logger.debug(JSON.stringify(this.current))
      await this.explorerConnection.rollbackTransaction()
      await this.explorerConnection.release()
      return
    } finally {
      await this.explorerConnection.release()
    }
    //  let height: number = 0
  }

  async handleData(block: THETA_BLOCK_INTERFACE) {
    const tfuelBurnt = block.transactions.reduce((acc, cur) => {
      if (cur.raw.fee && cur.raw.fee.tfuelwei)
        return acc + new BigNumber(cur.raw.fee.tfuelwei).dividedBy('1e18').toNumber()
      else return acc
    }, 0)
    this.logger.debug(block.height)

    for (const transaction of block.transactions) {
      //   this.logger.debug(JSON.stringify(transaction))
      this.current = transaction
      let theta = 0,
        thetaFuel = 0,
        from = '',
        to = ''
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.send:
          if (transaction.raw.inputs.length > 0) {
            theta = transaction.raw.inputs.reduce((curr, item) => {
              return curr + new BigNumber(item.coins.thetawei).dividedBy('1e18').toNumber()
            }, 0)
            thetaFuel = transaction.raw.inputs.reduce((curr, item) => {
              return curr + new BigNumber(item.coins.tfuelwei).dividedBy('1e18').toNumber()
            }, 0)
            // theta = thetaFuel = new BigNumber(transaction.raw.inputs[0].coins.tfuelwei)
            //   .dividedBy('1e18')
            //   .toNumber()
            from = transaction.raw.inputs[0].address
            to = transaction.raw.outputs[0].address
          } else {
            theta = new BigNumber(transaction.raw.from.coins.thetawei).dividedBy('1e18').toNumber()
            thetaFuel = new BigNumber(transaction.raw.from.coins.tfuelwei)
              .dividedBy('1e18')
              .toNumber()
            from = transaction.raw.from.address
            to = transaction.raw.to.address
          }
          break
        case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
          from = transaction.raw.from.address
          to = transaction.raw.to.address
          break
        case THETA_TRANSACTION_TYPE_ENUM.coinbase:
          from = transaction.raw.proposer.address
          break
        case THETA_TRANSACTION_TYPE_ENUM.service_payment:
          from = transaction.raw.source.address
          //@ts-ignore
          to = transaction.raw.target.address
          break
        case THETA_TRANSACTION_TYPE_ENUM.reserve_fund:
          from = transaction.raw.source.address
          break
        case THETA_TRANSACTION_TYPE_ENUM.split_rule:
          //@ts-ignore
          from = transaction.raw.initiator.address
          break
        //@ts-ignore
        case 11:
          //@ts-ignore
          from = transaction.raw.holder.address
          break
        // to =
        default:
          if (transaction.raw.from) from = transaction.raw.from.address
          else {
            from = transaction.raw.source.address
          }
          break
      }
      await this.explorerConnection.manager.insert(TransactionEntity, {
        tx_hash: transaction.hash,
        height: Number(block.height),
        // from
        from: from,
        to: to,
        timestamp: Number(block.timestamp),
        theta: theta,
        theta_fuel: thetaFuel
      })
    }
    return await this.explorerConnection.manager.insert(BlokcListEntity, {
      height: Number(block.height),
      block_hash: block.hash,
      timestamp: Number(block.timestamp),
      tfuel_burnt: tfuelBurnt,
      txns: block.transactions.length
    })
  }
}
