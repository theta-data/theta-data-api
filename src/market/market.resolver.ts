import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { KLINE_INTERVAL, MarketInformationType, TOKEN_PAIR_TYPE } from './market.model'
// import { thetaTsSdk } from 'theta-ts-sdk'
import { CACHE_MANAGER, Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { MarketService } from './market.service'
// thetaTsSdk.cmc.setKey('57a40db8-5488-4ed4-ab75-152fec2ed608')

@Resolver(() => MarketInformationType)
export class MarketResolver {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private marketService: MarketService
  ) {}

  @Query(() => MarketInformationType)
  async MarketInformation() {
    return {}
  }

  @ResolveField()
  async Theta() {
    return this.marketService.getThetaMarketInfo()
  }

  @ResolveField()
  async ThetaFuel() {
    return this.marketService.getThetaFuelMarketInfo()
  }

  @ResolveField()
  async Kline(
    @Args('token_type', { type: () => TOKEN_PAIR_TYPE }) tokenType,
    @Args('interval', { type: () => KLINE_INTERVAL }) klineInterval
  ) {
    return this.marketService.getKline(tokenType, klineInterval)
  }
}
