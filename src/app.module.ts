import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { AuthModule } from './auth/auth.module'
import { TxModule } from './tx/tx.module'
import { TxMonitorSendModule } from './tx-monitor/send/tx-monitor-send.module'
import { MicroTxMonitorModule } from './microservice/tx-monitor/micro-tx-monitor.module'
import { TxMonitorWidrawStakeModule } from './tx-monitor/withdraw-stake/tx-monitor-widraw-stake.module'
// import {} from '@nesjs/mi'
const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions('RONG_DB'), config.get('RONG_DB'))
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: 'schema.gql'
    }),
    AuthModule,
    TxModule,
    TxMonitorSendModule,
    MicroTxMonitorModule,
    TxMonitorWidrawStakeModule
  ],
  // controllers: [AppController],
  providers: []
})
export class AppModule {}
