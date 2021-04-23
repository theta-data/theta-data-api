import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersEntity } from '../../users/users.entity'
import { TxMonitorWithdrawStakeService } from './tx-monitor-withdraw-stake.service'
import { TxMonitorWithdrawStakeResolver } from './tx-monitor-withdraw-stake.resolver'
import { TxMonitorWithdrawStakeListEntity } from './tx-monitor-withdraw-stake-list.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TxMonitorWithdrawStakeListEntity, UsersEntity])],
  providers: [TxMonitorWithdrawStakeService, TxMonitorWithdrawStakeResolver],
  exports: []
})
export class TxMonitorWidrawStakeModule {}
