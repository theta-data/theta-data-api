import { Resolver, Query, Args } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'
import { PaginatedNftStatistics } from './nft-statistics.model'
import { NftStatisticsOrderByType, NftStatisticsService } from './nft-statistics.service'

@Resolver(() => PaginatedNftStatistics)
export class NftStatisticsResolver {
  constructor(private nftStatisticsService: NftStatisticsService) {}

  @Query(() => PaginatedNftStatistics)
  async NftStatistics(
    @Args('order_by', { type: () => NftStatisticsOrderByType })
    orderBy: NftStatisticsOrderByType,
    @Args('take', { type: () => GraphQLInt, defaultValue: 10 }) take: number,
    @Args('after', { nullable: true }) after: string
  ) {
    const [hasNextPage, totalNumber, res] = await this.nftStatisticsService.getNft(
      orderBy,
      take,
      after
    )
    let endCursor = ''
    if (res.length > 0) {
      switch (orderBy) {
        case NftStatisticsOrderByType.last_24_hours:
          endCursor = Buffer.from(res[res.length - 1].last_24_h_users.toString()).toString('base64')
          break
        case NftStatisticsOrderByType.last_7_days:
          endCursor = Buffer.from(res[res.length - 1].last_7_days_users.toString()).toString(
            'base64'
          )
          break
        case NftStatisticsOrderByType.last_30_days:
          endCursor = Buffer.from(res[res.length - 1].last_30_days_users.toString()).toString(
            'base64'
          )
          break
        default:
          endCursor = Buffer.from(res[res.length - 1].last_24_h_users.toString()).toString('base64')
          break
      }
    }
    return {
      endCursor: endCursor,
      hasNextPage: hasNextPage,
      nodes: res,
      totalCount: totalNumber
    }
  }
}
