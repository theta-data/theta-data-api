import { NftBalanceEntity } from './nft-balance.entity'
import { Injectable, Logger } from '@nestjs/common'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import { NftService } from 'src/block-chain/smart-contract/nft/nft.service'
import { UtilsService } from 'src/common/utils.service'
const config = require('config')
const fs = require('fs')

@Injectable()
export class NftAnalyseService {
  private readonly logger = new Logger('analyse service')
  analyseKey = 'under_analyse'

  private smartContractConnection: QueryRunner
  private nftConnection: QueryRunner
  private heightConfigFile = config.get('ORM_CONFIG')['database'] + 'nft/record.height'

  constructor(private nftService: NftService, private utilsService: UtilsService) {}

  public async analyseData(loop: number) {
    try {
      this.logger.debug(loop + ' start analyse nft data')
      // this.logger.debug(logoConfig)
      this.smartContractConnection = getConnection('smart_contract').createQueryRunner()
      this.nftConnection = getConnection('nft').createQueryRunner()

      await this.smartContractConnection.connect()
      await this.nftConnection.connect()
      await this.nftConnection.startTransaction()
      let startId: number = 0
      if (!fs.existsSync(this.heightConfigFile)) {
        fs.writeFileSync(this.heightConfigFile, '0')
      } else {
        const data = fs.readFileSync(this.heightConfigFile, 'utf8')
        if (data) {
          startId = Number(data)
        }
      }

      const contractRecordList = await this.smartContractConnection.manager.find(
        SmartContractCallRecordEntity,
        {
          where: {
            id: MoreThan(startId)
          },
          take: config.get('NFT.ANALYSE_NUMBER'),
          order: { id: 'ASC' }
        }
      )

      const promiseArr = []
      for (const record of contractRecordList) {
        promiseArr.push(
          this.nftService.updateNftRecord(this.nftConnection, this.smartContractConnection, record)
        )
        await Promise.all(promiseArr)
      }

      this.logger.debug('start update calltimes by period')
      if (config.get('NFT.DL_ALL_NFT_IMG') && config.get('NFT.DL_ALL_NFT_IMG') == true) {
        await this.downloadAllImg(loop)
      }

      await this.nftConnection.commitTransaction()
      if (contractRecordList.length > 0) {
        this.logger.debug(
          'end height:' + Number(contractRecordList[contractRecordList.length - 1].height)
        )
        this.utilsService.updateRecordHeight(
          this.heightConfigFile,
          contractRecordList[contractRecordList.length - 1].id
        )
      }
      this.logger.debug('commit success')
    } catch (e) {
      console.error(e.message)
      this.logger.error(e.message)
      this.logger.error('rollback')
      await this.nftConnection.rollbackTransaction()
    } finally {
      await this.nftConnection.release()
      this.logger.debug('end analyse nft data')
      this.logger.debug('release success')
    }
  }

  async downloadAllImg(loop: number) {
    const total = await this.nftConnection.manager.count(NftBalanceEntity)
    const pageSize = 5000
    const pageCount = Math.ceil(total / pageSize)
    if (loop > pageCount) {
      return
    }
    // for (let i = 0; i < pageCount; i++) {
    const list = await this.nftConnection.manager.find(NftBalanceEntity, {
      skip: loop * pageSize,
      take: pageSize,
      order: {
        id: 'DESC'
      }
    })
    for (const item of list) {
      this.logger.debug('start download ' + item.img_uri)
      const imgPath = await this.utilsService.downloadImage(
        item.img_uri,
        config.get('NFT.STATIC_PATH')
      )
      this.logger.debug('loop ' + loop + ': ' + item.img_uri + ' ' + imgPath)
      if (imgPath == item.img_uri) continue
      item.img_uri = imgPath
      await this.nftConnection.manager.save(item)
    }
    // }
    // const nfts = await this.nftConnection.manager.find(NftBalanceEntity)
  }
}
