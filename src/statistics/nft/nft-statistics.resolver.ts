// import { Query } from '@nestjs/common'
import { Resolver, Query, Args } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'
import { PaginatedNftStatistics } from './nft-statistics.model'
import { NftStatisticsService } from './nft-statistics.service'

@Resolver(() => PaginatedNftStatistics)
export class NftStatisticsResolver {
  constructor(private nftStatisticsService: NftStatisticsService) {}

  // @Query(() => NftType)
  @Query(() => PaginatedNftStatistics)
  async NftStatistics(
    @Args('order_by') orderBy: '24h' | '7days' | '30days' = '24h',
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
      // this.console.log();
      console.log(res[res.length - 1].create_date)
      switch (orderBy) {
        case '24h':
          endCursor = Buffer.from(res[res.length - 1].last_24_h_users.toString()).toString('base64')
          break
        case '7days':
          endCursor = Buffer.from(res[res.length - 1].last_7_days_users.toString()).toString(
            'base64'
          )
          break
        case '30days':
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
