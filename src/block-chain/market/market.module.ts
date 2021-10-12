import { CacheModule, Module } from '@nestjs/common'
import { MarketResolver } from './market.resolver'
import * as redisStore from 'cache-manager-redis-store'
const config = require('config')

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: config.get('REDIS')['host'],
      port: config.get('REDIS')['port']
    })
  ],
  providers: [MarketResolver],
  exports: []
})
export class MarketModule {}
