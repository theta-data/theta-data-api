import { NftDetailType } from './nft-statistics.model'
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { NftStatisticsService } from './nft-statistics.service'
import { GraphQLString } from 'graphql'

@Resolver((of) => NftDetailType)
export class NftDetailResolver {
  constructor(private nftStatisticsService: NftStatisticsService) {}

  @Query(() => NftDetailType)
  async NftDetail(
    @Args('contract_address', { type: () => GraphQLString }) contractAddress: string
  ) {
    return await this.nftStatisticsService.getNftInfo(contractAddress)
  }

  @ResolveField()
  async by_24_hours(
    @Parent() nftDetail: NftDetailType
    // @Args('contract_address', { type: () => GraphQLString }) contractAddress: string
  ) {
    const { contract_uri, smart_contract_address } = nftDetail
    return await this.nftStatisticsService.nftStatistics24H(smart_contract_address, contract_uri)
  }

  @ResolveField()
  async by_7_days(
    @Parent() nftDetail: NftDetailType
    // @Args('contract_address', { type: () => GraphQLString }) contractAddress: string
  ) {
    const { contract_uri, smart_contract_address } = nftDetail
    return await this.nftStatisticsService.nftStatistics7Days(smart_contract_address, contract_uri)
  }

  @ResolveField()
  async by_30_days(
    @Parent() nftDetail: NftDetailType
    // @Args('contract_address', { type: () => GraphQLString }) contractAddress: string
  ) {
    const { contract_uri, smart_contract_address } = nftDetail
    return await this.nftStatisticsService.nftStatistics30Days(smart_contract_address, contract_uri)
  }
}
