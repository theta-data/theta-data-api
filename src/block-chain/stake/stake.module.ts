import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StakeEntity } from './stake.entity'
import { StakeService } from './stake.service'
import { StakeResolver } from './stake.resolver'
import { StakeStatisticsEntity } from './stake-statistics.entity'
import { StakeRewardEntity } from './stake-reward.entity'
import { MarketService } from '../../market/market.service'
import { WalletService } from '../wallet/wallet.service'
import { WalletModule } from '../wallet/wallet.module'
import { WalletEntity } from '../wallet/wallet.entity'
import { MarketModule } from '../../market/market.module'
// import config from 'config'
// import * as redisStore from 'cache-manager-redis-store'
const config = require('config')

@Module({
  imports: [
    WalletModule,
    MarketModule,
    TypeOrmModule.forFeature([StakeEntity, StakeStatisticsEntity, StakeRewardEntity, WalletEntity]),
    CacheModule.register({
      // store: redisStore,
      // host: config.get('REDIS')['host'],
      // port: config.get('REDIS')['port']
    })
  ],
  providers: [StakeService, StakeResolver],
  exports: [StakeService]
})
export class StakeModule {}
