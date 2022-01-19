import { CacheModule, Module } from '@nestjs/common'
import { WalletResolver } from './wallet.resolver'
import { WalletService } from './wallet.service'
import { MarketService } from '../../market/market.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from '../tx/theta-tx-num-by-hours.entity'
import { WalletEntity } from './wallet.entity'
import { AcitiveWalletsEntity } from './active-wallets.entity'

@Module({
  imports: [CacheModule.register(), TypeOrmModule.forFeature([WalletEntity, AcitiveWalletsEntity])],
  providers: [WalletResolver, WalletService, MarketService],
  exports: [WalletService]
})
export class WalletModule { }
