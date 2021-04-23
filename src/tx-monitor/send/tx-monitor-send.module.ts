import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TxMonitorSendListEntity } from './tx-monitor-send-list.entity'
import { TxMonitorSendService } from './tx-monitor-send.service'
import { TxMonitorSendResolver } from './tx-monitor-send.resolver'
import { UsersEntity } from '../../users/users.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TxMonitorSendListEntity, UsersEntity])],
  providers: [TxMonitorSendService, TxMonitorSendResolver],
  exports: [TxMonitorSendService]
})
export class TxMonitorSendModule {}
