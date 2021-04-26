import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TxMonitorSendListEntity } from '../../tx-monitor/send/tx-monitor-send-list.entity'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { MicroTxMonitorController } from './micro-tx-monitor.controller'
const config = require('config')
@Module({
  imports: [
    TypeOrmModule.forFeature([TxMonitorSendListEntity]),
    ClientsModule.register([
      {
        name: 'MAIL_SERVICE',
        transport: Transport.REDIS,
        options: {
          url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
        }
      }
    ])
  ],
  providers: [],
  controllers: [MicroTxMonitorController],
  exports: []
})
export class MicroTxMonitorModule {}
