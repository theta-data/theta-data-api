import { Injectable, Logger } from '@nestjs/common'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService } from 'src/common/utils.service'
import { SmartContractProtocolEnum } from 'src/contact/contact.entity'
import { getConnection, MoreThan, QueryRunner, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'
const config = require('config')
const fs = require('fs')
const moment = require('moment')

@Injectable()
export class NftStatisticsAnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'

  private smartContractConnection: QueryRunner
  private nftConnection: QueryRunner
  private nftStatisticsConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height'

  constructor(private nftService: NftService, private utilsService: UtilsService) {}

  public async analyseData() {
    try {
      this.logger.debug('start analyse nft data')
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      this.nftConnection = getConnection('nft').createQueryRunner()
      this.nftStatisticsConnection = getConnection('nft-statistics').createQueryRunner()

      await this.smartContractConnection.connect()
      await this.nftConnection.connect()
      await this.nftStatisticsConnection.connect()
      await this.nftStatisticsConnection.startTransaction()
      let startId: number = 0
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data) {
          startId = Number(data) + 1
        }
      }

      let nftList: Array<string> = []
      const nftTransferRecordList = await this.nftConnection.manager.find(NftTransferRecordEntity, {
        where: {
          id: MoreThan(startId)
        },
        take: config.get('NFT_STATISTICS.ANALYSE_NUMBER'),
        order: { id: 'ASC' }
      })

      const promiseArr = []
      for (const record of nftTransferRecordList) {
        if (nftList.indexOf(record.smart_contract_address) === -1) {
          nftList.push(record.smart_contract_address)
        }
      }
      for (const nft of nftList) {
        promiseArr.push(this.nftStatistics(nft))
      }
      await Promise.all(promiseArr)
      this.logger.debug('start update calltimes by period')
      await this.nftStatisticsConnection.commitTransaction()
      if (nftTransferRecordList.length > 0) {
        this.logger.debug(
          'end height:' + Number(nftTransferRecordList[nftTransferRecordList.length - 1].id)
        )
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          nftTransferRecordList[nftTransferRecordList.length - 1].id
        )
      }
      this.logger.debug('commit success')
    } catch (e) {
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.nftStatisticsConnection.rollbackTransaction()
    } finally {
      await this.nftStatisticsConnection.release()
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
    }
  }

  async nftStatistics(smartContractAddress: string) {
    const recordList = await this.nftConnection.manager.find(NftTransferRecordEntity, {
      smart_contract_address: smartContractAddress,
      timestamp: MoreThan(moment().subtract(30, 'days').unix())
    })
    const users24H: Array<string> = []
    const users7D: Array<string> = []
    const users30D: Array<string> = []
    let volume24H = 0,
      volume7D = 0,
      volume30D = 0,
      transactionCount24H = 0,
      transactionCount7D = 0,
      transactionCount30D = 0

    for (const record of recordList) {
      if (record.timestamp >= moment().subtract(24, 'hours').unix()) {
        !users24H.includes(record.from) && users24H.push(record.from)
        !users24H.includes(record.to) && users24H.push(record.to)
        volume24H += record.payment_token_amount
        transactionCount24H += 1
      }
      if (record.timestamp >= moment().subtract(7, 'days').unix()) {
        !users7D.includes(record.from) && users7D.push(record.from)
        !users7D.includes(record.to) && users7D.push(record.to)
        volume7D += record.payment_token_amount
        transactionCount7D += 1
      }
      if (record.timestamp >= moment().subtract(30, 'days').unix()) {
        !users30D.includes(record.from) && users30D.push(record.from)
        !users30D.includes(record.to) && users30D.push(record.to)
        volume30D += record.payment_token_amount
        transactionCount30D += 1
      }
    }
    const nft = await this.nftStatisticsConnection.manager.findOne(NftStatisticsEntity, {
      smart_contract_address: smartContractAddress
    })
    if (!nft) {
      const smartContract = await this.smartContractConnection.manager.findOne(
        SmartContractEntity,
        { contract_address: smartContractAddress }
      )
      if (!smartContract || smartContract.protocol !== SmartContractProtocolEnum.tnt721) return

      const nftStatistics = new NftStatisticsEntity()
      nftStatistics.contract_uri = smartContract.contract_uri
      nftStatistics.contract_uri_detail = smartContract.contract_uri_detail
      nftStatistics.name = smartContract.name
      nftStatistics.smart_contract_address = smartContractAddress
      nftStatistics.last_24_h_users = users24H.length
      nftStatistics.last_7_days_users = users7D.length
      nftStatistics.last_30_days_users = users30D.length
      nftStatistics.last_24_h_volume = volume24H
      nftStatistics.last_7_days_volume = volume7D
      nftStatistics.last_30_days_volume = volume30D
      nftStatistics.last_24_h_transactions = transactionCount24H
      nftStatistics.last_7_days_transactions = transactionCount7D
      nftStatistics.last_30_days_transactions = transactionCount30D
      await this.nftStatisticsConnection.manager.save(nftStatistics)
    } else {
      nft.last_24_h_transactions = transactionCount24H
      nft.last_7_days_transactions = transactionCount7D
      nft.last_30_days_transactions = transactionCount30D
      nft.last_24_h_users = users24H.length
      nft.last_7_days_users = users7D.length
      nft.last_30_days_users = users30D.length
      nft.last_24_h_volume = Math.floor(volume24H)
      nft.last_7_days_volume = Math.floor(volume7D)
      nft.last_30_days_volume = Math.floor(volume30D)
      await this.nftStatisticsConnection.manager.save(nft)
    }
  }
}
