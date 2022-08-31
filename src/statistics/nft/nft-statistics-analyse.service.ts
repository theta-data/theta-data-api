import { TokenMarketInformationType } from './../../market/market.model'
import { Injectable, Logger } from '@nestjs/common'
import { NftBalanceEntity } from 'src/block-chain/smart-contract/nft/nft-balance.entity'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { SmartContractEntity } from 'src/block-chain/smart-contract/smart-contract.entity'
import { UtilsService } from 'src/common/utils.service'
import { SmartContractProtocolEnum } from 'src/contact/contact.entity'
import { MarketService } from 'src/market/market.service'
import { getConnection, LessThan, MoreThan, QueryRunner, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'
const fs = require('fs')
const moment = require('moment')
const nftLogoConfig = JSON.parse(fs.readFileSync('resources/nft-logo.json'))
const nftIgnore = JSON.parse(fs.readFileSync('resources/nft-ignore.json'))
const stream = require('stream')
const url = require('url')
const { promisify } = require('util')
const got = require('got')
const config = require('config')
@Injectable()
export class NftStatisticsAnalyseService {
  private readonly logger = new Logger('nft statistics analyse service')
  analyseKey = 'under_analyse'

  private smartContractConnection: QueryRunner
  private nftConnection: QueryRunner
  private nftStatisticsConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft-statistics/record.height'
  private tfuelPrice: TokenMarketInformationType

  constructor(private utilsService: UtilsService, private marketService: MarketService) {}

  public async analyseData() {
    try {
      // console.log(config.get('NFT_STATISTICS.ANALYSE_NUMBER'))
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
          startId = Number(data)
        }
      }
      this.tfuelPrice = await this.marketService.getThetaFuelMarketInfo()
      let nftList: Array<string> = []
      const nftTransferRecordList = await this.nftConnection.manager.find(NftTransferRecordEntity, {
        where: {
          id: MoreThan(startId)
        },
        take: config.get('NFT_STATISTICS.ANALYSE_NUMBER'),
        order: { id: 'ASC' }
      })
      await this.setZero()
      // console.log(nftList['a']['b'])

      const promiseArr = []
      this.logger.debug('nftTransferRecordList.length: ' + nftTransferRecordList.length)
      for (const record of nftTransferRecordList) {
        if (!nftList.includes(record.smart_contract_address)) {
          nftList.push(record.smart_contract_address)
        }
      }
      this.logger.debug('nft list length:' + nftList.length)
      for (const nft of nftList) {
        promiseArr.push(this.nftStatistics(nft))
      }
      console.log(111)
      await Promise.all(promiseArr)
      console.log(222)

      // this.logger.debug('start update calltimes by period')

      await this.updateNftsImgUri()
      console.log(333)

      // await this.downloadAllImg()
      await this.nftStatisticsConnection.commitTransaction()

      try {
        if (nftTransferRecordList.length > 0) {
          this.logger.debug(
            'end height:' + Number(nftTransferRecordList[nftTransferRecordList.length - 1].id)
          )
          this.utilsService.updateRecordHeight(
            this.heightConfigFile,
            nftTransferRecordList[nftTransferRecordList.length - 1].id
          )
        }
      } catch (error) {
        console.error(error)
        this.logger.error(error)
      }
      // this.logger.debug('commit success')
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
    this.logger.debug('start nftStatistics:' + smartContractAddress)
    if (nftIgnore.includes(smartContractAddress)) {
      this.logger.debug('no nedd analyse:' + smartContractAddress)
      return
    }
    const smartContract = await this.smartContractConnection.manager.findOne(SmartContractEntity, {
      contract_address: smartContractAddress
    })
    if (!smartContract || smartContract.protocol !== SmartContractProtocolEnum.tnt721) {
      this.logger.debug('no contract or not tnt721 protocol:' + smartContractAddress)
      return
    }

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

    // const tfuelPrice = await this.marketService.getThetaFuelMarketInfo()
    let timestamp = 0
    for (const record of recordList) {
      if (record.timestamp > timestamp) {
        timestamp = record.timestamp
      }
      if (record.timestamp >= moment().subtract(24, 'hours').unix()) {
        !users24H.includes(record.from) && users24H.push(record.from)
        !users24H.includes(record.to) && users24H.push(record.to)
        if (record.tdrop_mined == 0 && smartContract.contract_uri.indexOf('thetadrop.com') > -1) {
          volume24H += record.payment_token_amount
        } else {
          volume24H += record.payment_token_amount * this.tfuelPrice.price
        }

        transactionCount24H += 1
      }
      if (record.timestamp >= moment().subtract(7, 'days').unix()) {
        !users7D.includes(record.from) && users7D.push(record.from)
        !users7D.includes(record.to) && users7D.push(record.to)
        if (record.tdrop_mined == 0 && smartContract.contract_uri.indexOf('thetadrop.com') > -1) {
          volume7D += record.payment_token_amount
        } else {
          volume7D += record.payment_token_amount * this.tfuelPrice.price
        }
        transactionCount7D += 1
      }
      if (record.timestamp >= moment().subtract(30, 'days').unix()) {
        !users30D.includes(record.from) && users30D.push(record.from)
        !users30D.includes(record.to) && users30D.push(record.to)
        if (record.tdrop_mined == 0 && smartContract.contract_uri.indexOf('thetadrop.com') > -1) {
          volume30D += record.payment_token_amount
        } else {
          volume30D += record.payment_token_amount * this.tfuelPrice.price
        }
        transactionCount30D += 1
      }
    }
    const nft = await this.nftStatisticsConnection.manager.findOne(NftStatisticsEntity, {
      smart_contract_address: smartContractAddress
    })
    if (!nft) {
      const nftStatistics = new NftStatisticsEntity()
      if (!smartContract.contract_uri) {
        const firstTokencontractUri = await this.nftConnection.manager.findOne(NftBalanceEntity, {
          where: {
            smart_contract_address: smartContractAddress
          },
          order: {
            token_id: 'ASC'
          }
        })
        if (firstTokencontractUri) {
          nftStatistics.contract_uri = firstTokencontractUri.contract_uri
          nftStatistics.contract_uri_detail = firstTokencontractUri.detail
          if (firstTokencontractUri.detail) {
            const contractDetail = JSON.parse(firstTokencontractUri.detail)
            // nftStatistics.img_uri = contractDetail.image
            nftStatistics.img_uri = await this.utilsService.downloadImage(
              contractDetail.image,
              config.get('NFT_STATISTICS.STATIC_PATH')
            )
          }
        }
      } else {
        nftStatistics.contract_uri = smartContract.contract_uri
        nftStatistics.contract_uri_detail = smartContract.contract_uri_detail
        if (smartContract.contract_uri_detail) {
          const contractDetail = JSON.parse(smartContract.contract_uri_detail)
          nftStatistics.img_uri = contractDetail.image
          await this.utilsService.downloadImage(
            contractDetail.image,
            config.get('NFT_STATISTICS.STATIC_PATH')
          )
        }
      }
      nftStatistics.name = smartContract.name
      nftStatistics.smart_contract_address = smartContractAddress
      nftStatistics.last_24_h_users = users24H.length
      nftStatistics.last_7_days_users = users7D.length
      nftStatistics.last_30_days_users = users30D.length
      nftStatistics.last_24_h_volume = Math.floor(volume24H)
      nftStatistics.last_7_days_volume = Math.floor(volume7D)
      nftStatistics.last_30_days_volume = Math.floor(volume30D)
      nftStatistics.last_24_h_transactions = transactionCount24H
      nftStatistics.last_7_days_transactions = transactionCount7D
      nftStatistics.last_30_days_transactions = transactionCount30D
      nftStatistics.update_timestamp = timestamp
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
      nft.update_timestamp = timestamp
      await this.nftStatisticsConnection.manager.save(nft)
    }
  }

  async setZero() {
    await this.nftStatisticsConnection.manager.update(
      NftStatisticsEntity,
      {
        update_timestamp: LessThan(moment().subtract(1, 'days').unix())
      },
      {
        last_24_h_volume: 0,
        last_24_h_users: 0,
        last_24_h_transactions: 0
      }
    )

    await this.nftStatisticsConnection.manager.update(
      NftStatisticsEntity,
      {
        update_timestamp: LessThan(moment().subtract(7, 'days').unix())
      },
      {
        last_7_days_volume: 0,
        last_7_days_users: 0,
        last_7_days_transactions: 0
      }
    )

    await this.nftStatisticsConnection.manager.update(
      NftStatisticsEntity,
      {
        update_timestamp: LessThan(moment().subtract(30, 'days').unix())
      },
      {
        last_30_days_volume: 0,
        last_30_days_users: 0,
        last_30_days_transactions: 0
      }
    )
  }

  async updateNftsImgUri() {
    // this.logger.debug(JSON.stringify(nftLogoConfig))
    for (const logo of nftLogoConfig) {
      if (logo.length < 2) continue
      const nft = await this.nftStatisticsConnection.manager.findOne(NftStatisticsEntity, {
        smart_contract_address: logo[0].toLowerCase()
      })
      if (nft) {
        const imgUri = await this.utilsService.getPath(
          logo[1],
          config.get('NFT_STATISTICS.STATIC_PATH')
        )
        if (imgUri == nft.img_uri) continue
        nft.img_uri = await this.utilsService.downloadImage(
          logo[1],
          config.get('NFT_STATISTICS.STATIC_PATH')
        )
        await this.nftStatisticsConnection.manager.save(nft)
      }
    }
  }

  // async downloadImage(urlPath: string): Promise<string | null> {
  //   this.logger.debug('url path: ' + urlPath)
  //   if (!urlPath) return null
  //   if (
  //     !urlPath.includes('gif') &&
  //     !urlPath.includes('png') &&
  //     !urlPath.includes('jpg') &&
  //     !urlPath.includes('jpeg')
  //   ) {
  //     return null
  //   }
  //   const pipeline = promisify(stream.pipeline)
  //   // const got: any = await import('got')
  //   // got.default()
  //   var path = require('path')
  //   var parsed = url.parse(urlPath)
  //   // if(!pa)
  //   if (!parsed.hostname) {
  //     return urlPath.replace(config.get('NFT_STATISTICS.STATIC_PATH'), '')
  //   }
  //   // const ext = ['gif', 'png', 'jpg', 'jpeg']

  //   const imgPath =
  //     config.get('NFT_STATISTICS.STATIC_PATH') + '/' + parsed.hostname.replace(/\./g, '-')
  //   const imgStorePath = imgPath + parsed.pathname
  //   const pathArr = imgStorePath.split('/')
  //   pathArr.pop()

  //   if (!fs.existsSync(pathArr.join('/'))) {
  //     fs.mkdirSync(pathArr.join('/'), { recursive: true })
  //   }

  //   console.log(path.basename(parsed.pathname))
  //   if (!fs.existsSync(imgStorePath)) {
  //     try {
  //       await pipeline(got.stream(urlPath), fs.createWriteStream(imgStorePath))
  //       return imgStorePath.replace(config.get('NFT_STATISTICS.STATIC_PATH'), '')
  //     } catch (e) {
  //       console.error(e)
  //       return null
  //     }
  //   } else {
  //     return imgStorePath.replace(config.get('NFT_STATISTICS.STATIC_PATH'), '')
  //   }
  // }

  async downloadAllImg() {
    const nfts = await this.nftStatisticsConnection.manager.find(NftStatisticsEntity)
    for (const nft of nfts) {
      if (nft.img_uri) {
        nft.img_uri = await this.utilsService.downloadImage(
          nft.img_uri,
          config.get('NFT_STATISTICS.STATIC_PATH')
        )
        await this.nftStatisticsConnection.manager.save(nft)
      }
    }
  }
}
