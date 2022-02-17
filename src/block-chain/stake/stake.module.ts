import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StakeEntity } from './stake.entity'
import { StakeService } from './stake.service'
import { StakeResolver } from './stake.resolver'
import { StakeStatisticsEntity } from './stake-statistics.entity'
import { StakeRewardEntity } from './stake-reward.entity'
import { WalletModule } from '../wallet/wallet.module'
import { WalletEntity } from '../wallet/wallet.entity'
import { MarketModule } from '../../market/market.module'

@Module({
  imports: [
    WalletModule,
    MarketModule,
    TypeOrmModule.forFeature([StakeEntity, StakeStatisticsEntity, StakeRewardEntity, WalletEntity]),
    CacheModule.register()
  ],
  providers: [StakeService, StakeResolver],
  exports: [StakeService]
})
export class StakeModule {}
