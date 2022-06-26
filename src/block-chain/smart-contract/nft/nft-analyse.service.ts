import { Injectable, Logger } from '@nestjs/common'
import { getConnection, MoreThan, QueryRunner } from 'typeorm'
import { SmartContractCallRecordEntity } from 'src/block-chain/smart-contract/smart-contract-call-record.entity'
import {
  SmartContractEntity,
  SmartContractProtocolEnum
} from 'src/block-chain/smart-contract/smart-contract.entity'
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

  public async analyseData() {
    try {
      this.logger.debug('start analyse nft data')
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
          startId = Number(data) + 1
        }
      }

      // this.startTimestamp = moment().unix()
      let smartContractList: { [key: string]: SmartContractEntity } = {}
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
      // await this.smartContractConnection.commitTransaction()
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
