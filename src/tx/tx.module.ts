import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { TxService } from './tx.service'
import { TxResolver } from './tx.resolver'
@Module({
  imports: [TypeOrmModule.forFeature([ThetaTxNumByHoursEntity])],
  providers: [TxService, TxResolver],
  exports: [TxService]
})
export class TxModule {}
