import { Inject, Injectable, Logger } from '@nestjs/common'
import { registerEnumType } from '@nestjs/graphql'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, LessThan, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'

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

@Injectable()
export class NftStatisticsService {
  logger = new Logger()

  constructor(
    @InjectRepository(NftStatisticsEntity, 'nft-statistics')
    private nftStatisticsRepository: Repository<NftStatisticsEntity>
  ) {}

  async getNft(
    orderBy: NftStatisticsOrderByType = NftStatisticsOrderByType.last_24_hours_users,
    take: number = 20,
    after: string | undefined
  ): Promise<[boolean, number, Array<NftStatisticsEntity>]> {
    const condition: FindManyOptions<NftStatisticsEntity> = {
      where: {},
      take: take + 1,
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
}
