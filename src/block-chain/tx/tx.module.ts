import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { TxService } from './tx.service'
import { TxResolver } from './tx.resolver'
import { WalletModule } from '../wallet/wallet.module'
@Module({
  imports: [TypeOrmModule.forFeature([ThetaTxNumByHoursEntity], 'tx'), WalletModule],
  providers: [TxService, TxResolver],
  exports: [TxService]
})
export class TxModule {}
