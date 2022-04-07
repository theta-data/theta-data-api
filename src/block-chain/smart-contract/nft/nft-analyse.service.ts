import { Injectable, Logger } from '@nestjs/common'
import { Between, getConnection, MoreThanOrEqual, QueryRunner } from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import {
  SmartContractEntity,
  smartContractProtocol
} from 'src/block-chain/smart-contract/smart-contract.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { UtilsService } from 'src/common/utils.service'
const config = require('config')
const moment = require('moment')
const fs = require('fs')
@Injectable()
export class NftAnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'
  private counter = 0
  private startTimestamp = 0

  private smartContractConnection: QueryRunner
  private nftConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height'

  constructor(private nftService: NftService, private utilsService: UtilsService) {}

  //   @Interval(config.get('ANALYSE_INTERVAL'))
  public async analyseData() {
    try {
      this.logger.debug('start analyse nft data')
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      this.nftConnection = getConnection('nft').createQueryRunner()

      await this.smartContractConnection.connect()
      await this.nftConnection.connect()

      // await this.smartContractConnection.startTransaction()
      await this.nftConnection.startTransaction()

      let height: number = 0,
        endHeight = 0,
        lastfinalizedHeight = 0

      const smartContractEntity = await this.smartContractConnection.manager.findOne(
        SmartContractCallRecordEntity,
        {
          order: {
            height: 'DESC'
          }
        }
      )
      if (smartContractEntity) lastfinalizedHeight = smartContractEntity.height

      if (config.get('START_HEIGHT')) {
        height = config.get('START_HEIGHT')
      }
      // try {
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data && Number(data) > height) {
          height = Number(data) + 1
        }
      }
      if (height >= lastfinalizedHeight) {
        // await this.smartContractConnection.commitTransaction()
        await this.nftConnection.commitTransaction()
        this.logger.debug('commit success')
        this.logger.debug('no height to analyse')
        return
      }

      this.startTimestamp = moment().unix()
      let smartContractList: { [key: string]: SmartContractEntity } = {}
      const contractRecordList = await this.smartContractConnection.manager.find(
        SmartContractCallRecordEntity,
        {
          where: {
            height: MoreThanOrEqual(height)
          },
          take: config.get('NFT.ANALYSE_NUMBER'),
          order: { height: 'ASC' }
        }
      )
      // this.l
      // if (contractRecordList.length == 0) return
      const promiseArr = []
      for (const record of contractRecordList) {
        if (!smartContractList.hasOwnProperty(record.contract_id)) {
          smartContractList[record.contract_id] =
            await this.smartContractConnection.manager.findOne(SmartContractEntity, {
              id: record.contract_id
            })
        }
        if (smartContractList[record.contract_id].protocol !== smartContractProtocol.tnt721)
          continue
        promiseArr.push(
          this.nftService.updateNftRecord(
            this.nftConnection,
            this.smartContractConnection,
            record,
            smartContractList[record.contract_id]
          )
        )
        await Promise.all(promiseArr)
        // await this.nftService.updateNftRecord(
        //   this.nftConnection,
        //   this.smartContractConnection,
        //   record,
        //   smartContractList[record.contract_id]
        // )
      }
      // const data = fs.writeFileSync(this.heightConfigFile, height.toString())
      // console.log(data)
      this.logger.debug('start update calltimes by period')
      // await this.smartContractConnection.commitTransaction()
      await this.nftConnection.commitTransaction()
      this.logger.debug(
        'end height:' + Number(contractRecordList[contractRecordList.length - 1].height)
      )
      if (contractRecordList.length > 0) {
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          Number(contractRecordList[contractRecordList.length - 1].height)
        )
      }
      this.logger.debug('commit success')
    } catch (e) {
      // console.log(e)
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')

      // await this.smartContractConnection.rollbackTransaction()
      await this.nftConnection.rollbackTransaction()
      // process.exit(0)
    } finally {
      // await this.smartContractConnection.release()
      await this.nftConnection.release()
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
    }
  }
}
