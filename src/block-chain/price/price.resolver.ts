import { Query, Resolver } from '@nestjs/graphql'
import { ThetaPriceModel } from './price.model'
import { CmcHttpProvider } from 'theta-ts-sdk'
import { CACHE_MANAGER, Inject } from '@nestjs/common'
import { Cache } from 'cache-manager'

@Resolver()
export class PriceResolver {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  @Query(() => ThetaPriceModel)
  async theta() {
    if (await this.cacheManager.get('theta-price'))
      return await this.cacheManager.get('theta-price')
    const cmc = new CmcHttpProvider('57a40db8-5488-4ed4-ab75-152fec2ed608')
    const res = await cmc.getInformation()
    if (res.theta.price) {
      await this.cacheManager.set('theta-price', res, { ttl: 60 * 60 })
    }
    return res.theta
  }

  @Query(() => ThetaPriceModel)
  async tfuel() {
    if (await this.cacheManager.get('tfuel-price'))
      return await this.cacheManager.get('tfuel-price')
    const cmc = new CmcHttpProvider('57a40db8-5488-4ed4-ab75-152fec2ed608')
    const res = await cmc.getInformation()
    if (res.theta.price) {
      await this.cacheManager.set('tfuel-price', res, { ttl: 60 * 60 })
    }
    return res.tfuel
  }
}
