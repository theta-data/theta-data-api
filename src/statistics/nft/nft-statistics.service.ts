import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, LessThan, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'

@Injectable()
export class NftStatisticsService {
  logger = new Logger()

  constructor(
    @InjectRepository(NftStatisticsEntity, 'nft-statistics')
    private nftStatisticsRepository: Repository<NftStatisticsEntity>
  ) {}

  async getNft(
    orderBy: '24h' | '7days' | '30days' = '24h',
    take: number = 20,
    after: string | undefined
  ): Promise<[boolean, number, Array<NftStatisticsEntity>]> {
    const condition: FindManyOptions<NftStatisticsEntity> = {
      where: {
        //   owner: address
      },
      take: take + 1,
      order: {
        // id: 'ASC',
        // id: 'DESC'
      }
    }
    switch (orderBy) {
      case '24h':
        condition.order.last_24_h_users = 'DESC'
        break
      case '7days':
        condition.order.last_7_days_users = 'DESC'
        break
      case '30days':
        condition.order.last_30_days_users = 'DESC'
        break
      default:
        condition.order.last_24_h_users = 'DESC'
        break
    }

    if (after) {
      const num = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + num)
      switch (orderBy) {
        case '24h':
          condition.where['last_24_h_users'] = LessThan(num)
          break
        case '7days':
          condition.where['last_7_days_users'] = LessThan(num)
          break
        case '30days':
          condition.where['last_30_days_users'] = LessThan(num)
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
