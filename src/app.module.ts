import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { AuthModule } from './auth/auth.module'
import { TxModule } from './tx/tx.module'
import { TxMonitorSendModule } from './tx-monitor/send/tx-monitor-send.module'
import { MicroTxMonitorModule } from './microservice/tx-monitor/micro-tx-monitor.module'
import { TxMonitorWidrawStakeModule } from './tx-monitor/withdraw-stake/tx-monitor-widraw-stake.module'
import { ScheduleModule } from '@nestjs/schedule'
import { StakeModule } from './block-chain/stake/stake.module'
import { PriceModule } from './block-chain/market/price.module'
import * as redisStore from 'cache-manager-redis-store'
import { RpcModule } from './block-chain/rpc/rpc.module'
import { SmartContractModule } from './block-chain/smart-contract/smart-contract.module'

const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions('THETA_DATA'), config.get('THETA_DATA_DB'))
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: 'schema.gql'
    }),
    CacheModule.register({
      store: redisStore,
      host: config.get('REDIS')['host'],
      port: config.get('REDIS')['port']
    }),
    ScheduleModule.forRoot(),
    // AuthModule,
    TxModule,
    // TxMonitorSendModule,
    MicroTxMonitorModule,
    // TxMonitorWidrawStakeModule,
    StakeModule,
    PriceModule,
    RpcModule,
    SmartContractModule
  ],
  providers: []
})
export class AppModule {}
