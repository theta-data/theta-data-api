import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { CMC_PRICE_INFORMATION } from 'theta-ts-sdk/dist/types/interface'

@Injectable()
export class MarketService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    thetaTsSdk.cmc.setKey('57a40db8-5488-4ed4-ab75-152fec2ed608')
  }
  public async getThetaMarketInfo(): Promise<CMC_PRICE_INFORMATION> {
    const key = 'theta-market-info'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const res = await thetaTsSdk.cmc.getInformation()
    if (res.theta.price) {
      await this.cacheManager.set(key, res.theta, { ttl: 60 * 60 })
    }
    return res.theta
  }

  public async getThetaFuelMarketInfo(): Promise<CMC_PRICE_INFORMATION> {
    const key = 'tfuel-market-info'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    console.log('get cmc price')
    const res = await thetaTsSdk.cmc.getInformation()
    console.log('cmc', res)
    if (res.tfuel.price) {
      await this.cacheManager.set(key, res.tfuel, { ttl: 60 * 60 })
    }
    return res.tfuel
  }
}
