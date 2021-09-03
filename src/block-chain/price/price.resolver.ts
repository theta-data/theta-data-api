import { Query, Resolver } from '@nestjs/graphql'
import { ThetaPriceModel } from './price.model'
import { thetaTsSdk } from 'theta-ts-sdk'
import { CACHE_MANAGER, Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'
thetaTsSdk.cmc.setKey('57a40db8-5488-4ed4-ab75-152fec2ed608')

@Resolver()
export class PriceResolver {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  @Query(() => ThetaPriceModel)
  async theta() {
    const key = 'theta-price-info'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const res = await thetaTsSdk.cmc.getInformation()
    if (res.theta.price) {
      await this.cacheManager.set(key, res.theta, { ttl: 60 * 60 })
    }
    return res.theta
  }

  @Query(() => ThetaPriceModel)
  async tfuel() {
    const key = 'tfuel-price-info'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const res = await thetaTsSdk.cmc.getInformation()
    if (res.tfuel.price) {
      await this.cacheManager.set(key, res.tfuel, { ttl: 60 * 60 })
    }
    return res.tfuel
  }
}
