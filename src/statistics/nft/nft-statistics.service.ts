import { Injectable, Logger } from '@nestjs/common'
import { registerEnumType } from '@nestjs/graphql'
import { InjectRepository } from '@nestjs/typeorm'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { FindManyOptions, LessThan, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'
import { NftDetailType } from './nft-statistics.model'

export enum NftStatisticsOrderByType {
  last_24_hours_users,
  last_7_days_users,
  last_30_days_users,
  last_24_h_transactions,
  last_7_days_transactions,
  last_30_days_transactions,
  last_24_h_volume,
  last_7_days_volume,
  last_30_days_volume
}
registerEnumType(NftStatisticsOrderByType, {
  name: 'NftStatisticsOrderByType',
  description: 'NftStatisticsOrderByType'
})
const moment = require('moment')
@Injectable()
export class NftStatisticsService {
  logger = new Logger()

  constructor(
    @InjectRepository(NftStatisticsEntity, 'nft-statistics')
    private nftStatisticsRepository: Repository<NftStatisticsEntity>,
    @InjectRepository(NftTransferRecordEntity, 'nft')
    private nftTransferRecordRepository: Repository<NftTransferRecordEntity>
  ) {}

  async getNft(
    orderBy: NftStatisticsOrderByType = NftStatisticsOrderByType.last_24_hours_users,
    take: number = 20,
    after: string | undefined,
    skip = 0
  ): Promise<[boolean, number, Array<NftStatisticsEntity>]> {
    const condition: FindManyOptions<NftStatisticsEntity> = {
      where: {},
      take: take + 1,
      skip: skip,
      order: {}
    }
    switch (orderBy) {
      case NftStatisticsOrderByType.last_24_hours_users:
        condition.order.last_24_h_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_users:
        condition.order.last_7_days_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_users:
        condition.order.last_30_days_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_24_h_transactions:
        condition.order.last_24_h_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_transactions:
        condition.order.last_30_days_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_transactions:
        condition.order.last_30_days_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_24_h_volume:
        condition.order.last_24_h_volume = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_volume:
        condition.order.last_7_days_volume = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_volume:
        condition.order.last_30_days_volume = 'DESC'
        break
      default:
        condition.order.last_24_h_users = 'DESC'
        break
    }

    if (after) {
      const num = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + num)
      switch (orderBy) {
        case NftStatisticsOrderByType.last_24_hours_users:
          condition.where['last_24_h_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_users:
          condition.where['last_7_days_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_users:
          condition.where['last_30_days_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_24_h_transactions:
          condition.where['last_24_h_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_transactions:
          condition.where['last_7_days_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_30_days_transactions:
          condition.where['last_30_days_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_24_h_volume:
          condition.where['last_24_h_volume'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_volume:
          condition.where['last_7_days_volume'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_30_days_volume:
          condition.where['last_30_days_volume'] = LessThan(num)
          break
        default:
          condition.where['last_24_h_users'] = LessThan(num)
          break
      }
    }
    const totalNft = await this.nftStatisticsRepository.count()
    let nftList = await this.nftStatisticsRepository.find(condition)
    let hasNextPage = false
    if (nftList.length > take) {
      hasNextPage = true
      nftList = nftList.slice(0, take)
    }
    return [hasNextPage, totalNft, nftList]
  }

  async updateNftImg(contractAddress: string, imgUri: string) {
    const nftStatistics = await this.nftStatisticsRepository.findOne({
      where: { smart_contract_address: contractAddress }
    })
    if (nftStatistics) {
      nftStatistics.img_uri = imgUri
      return await this.nftStatisticsRepository.save(nftStatistics)
    }
    return {}
  }

  async nftDetail(contractAddress): Promise<NftDetailType> {
    const nftDetail = await this.nftStatisticsRepository.findOne({
      where: { smart_contract_address: contractAddress }
    })
    if (!nftDetail) {
      return {
        name: '',
        externel_url: '',
        by_date: []
      }
    }

    const nftStatistics = await this.nftTransferRecordRepository.find({
      where: { smart_contract_address: contractAddress },
      order: { timestamp: 'ASC' }
    })
    if (nftStatistics) {
      const statisticsObj: {
        [index: string]: {
          volume: number
          users: number
          transactions: number
          date: string
        }
      } = {}
      for (const record of nftStatistics) {
        const date = moment(record.timestamp * 1000).format('YYYY-MM-DD')
        if (statisticsObj[date]) {
          statisticsObj[date].volume += record.payment_token_amount
          statisticsObj[date].users += 1
          statisticsObj[date].transactions += 1
        } else {
          statisticsObj[date] = {
            volume: record.payment_token_amount,
            users: 1,
            transactions: 1,
            date: date
          }
        }
      }
      return {
        name: nftDetail.name,
        externel_url: nftDetail.contract_uri_detail,
        by_date: Object.values(statisticsObj)
      }
      // return nftStatistics
    }
    return {
      name: nftDetail.name,
      externel_url: nftDetail.contract_uri_detail,
      by_date: []
    }
  }
}
