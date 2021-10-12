import { CacheModule, Module } from '@nestjs/common'
import { PriceResolver } from './market.resolver'
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
  providers: [PriceResolver],
  exports: []
})
export class PriceModule {}
