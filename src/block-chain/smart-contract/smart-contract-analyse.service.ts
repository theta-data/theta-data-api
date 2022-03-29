import { Injectable, Logger } from '@nestjs/common'
import { getConnection, LessThan, MoreThan, QueryRunner } from 'typeorm'
import { THETA_TRANSACTION_TYPE_ENUM } from 'theta-ts-sdk/dist/types/enum'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { THETA_BLOCK_INTERFACE } from 'theta-ts-sdk/src/types/interface'
import { LoggerService } from 'src/common/logger.service'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService } from 'src/common/utils.service'
import { SmartContractService } from 'src/block-chain/smart-contract/smart-contract.service'
import fetch from 'cross-fetch'
const config = require('config')
const moment = require('moment')
@Injectable()
export class SmartContractAnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0
  private smartContractConnection: QueryRunner
  constructor(
    private loggerService: LoggerService,
    private utilsService: UtilsService,
    private smartContractService: SmartContractService
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
    this.logger.debug(config.get('THETA_NODE_HOST'))
  }

  public async analyseData() {
    try {
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      await this.smartContractConnection.connect()
      await this.smartContractConnection.startTransaction()
      let height: number = 0
      const lastfinalizedHeight = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
      height = lastfinalizedHeight - 1000

      if (config.get('START_HEIGHT')) {
        height = config.get('START_HEIGHT')
      }
      const latestBlock = await this.smartContractConnection.manager.findOne(SmartContractEntity, {
        order: {
          height: 'DESC'
        }
      })

      if (latestBlock && latestBlock.height >= height) {
        height = latestBlock.height + 1
      }
      if (height >= lastfinalizedHeight) {
        await this.smartContractConnection.commitTransaction()
        this.logger.debug('commit success')
        this.logger.debug('no height to analyse')
        return
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
      this.logger.debug('init counter', this.counter)
      for (let i = 0; i < blockList.result.length; i++) {
        const block = blockList.result[i]
        this.logger.debug(block.height + ' start hanldle')
        await this.handleOrderCreatedEvent(block, lastfinalizedHeight)
      }
      await this.smartContractConnection.commitTransaction()
    } catch (e) {
      // console.log(e)
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.smartContractConnection.rollbackTransaction()
    } finally {
      await this.smartContractConnection.release()
      this.logger.debug('release success')
    }
    // await this.
  }

  async handleOrderCreatedEvent(block: THETA_BLOCK_INTERFACE, latestFinalizedBlockHeight: number) {
    this.logger.debug(block.height + ' start insert')
    const height = Number(block.height)
    for (const transaction of block.transactions) {
      switch (transaction.type) {
        case THETA_TRANSACTION_TYPE_ENUM.smart_contract:
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
            smartContract.call_times > config.get('SMART_CONTRACT_VERIFY_DETECT_TIMES') &&
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
          await this.smartContractConnection.manager.insert(
            SmartContractCallRecordEntity,
            {
              timestamp: Number(block.timestamp),
              data: transaction.raw.data,
              receipt: JSON.stringify(transaction.receipt),
              height: height,
              transaction_hash: transaction.hash,
              contract_id: smartContract.id
            }
            // ['transaction_hash']
          )
          break
      }
    }
    this.logger.debug(height + ' end update analyse')
    this.counter--
    this.loggerService.timeMonitor('counter:' + this.counter, this.startTimestamp)
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
