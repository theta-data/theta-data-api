import { CacheModule, Module } from '@nestjs/common'
import { WalletResolver } from './wallet.resolver'
import { WalletService } from './wallet.service'
import { MarketService } from '../../market/market.service'

@Module({
  imports: [CacheModule.register()],
  providers: [WalletResolver, WalletService, MarketService],
  exports: []
})
export class WalletModule {}
