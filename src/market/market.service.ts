import { TokenMarketInformationType } from './market.model'
import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
import { Cache } from 'cache-manager'
import { CMC_PRICE_INFORMATION } from 'theta-ts-sdk/dist/types/interface'
import { BinanceService } from 'src/exchange/binance.service'

@Injectable()
export class MarketService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private exchangeService: BinanceService
  ) {
    // thetaTsSdk.cmc.setKey('57a40db8-5488-4ed4-ab75-152fec2ed608')
  }
  public async getThetaMarketInfo(): Promise<TokenMarketInformationType> {
    const key = 'theta-market-info'
    // if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const res = await this.exchangeService.tickerPriceChange('THETAUSDT')
    const kline = await this.exchangeService.kLine('THETAUSDT')
    const marketInfo = {
      name: 'THETA',
      price: Number(res.lastPrice),
      volume_24h: Number(res.priceChangePercent),
      price_change_percent: Number(res.priceChangePercent),
      kline: kline
    }
    await this.cacheManager.set(key, marketInfo, { ttl: 60 })
    return marketInfo
  }

  public async getThetaFuelMarketInfo(): Promise<TokenMarketInformationType> {
    const key = 'tfuel-market-info'
    const res = await this.exchangeService.tickerPriceChange('TFUELUSDT')
    const kline = await this.exchangeService.kLine('TFUELUSDT')
    const marketInfo = {
      name: 'TFUEL',
      price: Number(res.lastPrice),
      volume_24h: Number(res.priceChangePercent),
      price_change_percent: Number(res.priceChangePercent),
      kline: kline
    }

    await this.cacheManager.set(key, marketInfo, { ttl: 60 })
    return marketInfo
  }

  public async getPrice(ticker: string): Promise<number> {
    const res = await this.exchangeService.tickerPriceChange(ticker.toUpperCase() + 'USDT')
    return Number(res.lastPrice)
  }
}
