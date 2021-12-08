import { CacheModule, Module } from '@nestjs/common'
import { MarketResolver } from './market.resolver'
// import * as redisStore from 'cache-manager-redis-store'
import { MarketService } from './market.service'
const config = require('config')

@Module({
  imports: [
    CacheModule.register({
      // store: redisStore,
      // host: config.get('REDIS')['host'],
      // port: config.get('REDIS')['port']
    })
  ],
  providers: [MarketResolver, MarketService],
  exports: []
})
export class MarketModule {}
