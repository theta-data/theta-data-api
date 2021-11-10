import { CacheModule, Module } from '@nestjs/common'
import * as redisStore from 'cache-manager-redis-store'
import { WalletResolver } from './wallet.resolver'
import { WalletService } from './wallet.service'
import { MarketService } from '../../market/market.service'
const config = require('config')

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: config.get('REDIS')['host'],
      port: config.get('REDIS')['port']
    })
  ],
  providers: [WalletResolver, WalletService, MarketService],
  exports: []
})
export class WalletModule {}
