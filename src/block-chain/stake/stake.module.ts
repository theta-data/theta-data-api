import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StakeEntity } from './stake.entity'
import { StakeService } from './stake.service'
import { StakeResolver } from './stake.resolver'
// import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
// import { TxService } from './tx.service'
// import { TxResolver } from './tx.resolver'
@Module({
  imports: [TypeOrmModule.forFeature([StakeEntity])],
  providers: [StakeService, StakeResolver],
  exports: [StakeService]
})
export class StakeModule {}
