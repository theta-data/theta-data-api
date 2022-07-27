import { BinanceService } from './../exchange/binance.service'
import { Query, ResolveField, Resolver } from '@nestjs/graphql'
import { MarketInformationType } from './market.model'
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
}
