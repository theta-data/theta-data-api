import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { TxService } from './tx.service'
import { TxResolver } from './tx.resolver'
import { WalletModule } from '../wallet/wallet.module'
import { TxAnalyseService } from './tx-analyse.service'
import { CommonModule } from 'src/common/common.module'
@Module({
  imports: [TypeOrmModule.forFeature([ThetaTxNumByHoursEntity], 'tx'), WalletModule, CommonModule],
  providers: [TxService, TxResolver, TxAnalyseService],
  exports: [TxService]
})
export class TxModule {}
