import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { TxModule } from './tx/tx.module'
import { MicroTxMonitorModule } from './microservice/tx-monitor/micro-tx-monitor.module'
import { ScheduleModule } from '@nestjs/schedule'
import { StakeModule } from './block-chain/stake/stake.module'
import { MarketModule } from './block-chain/market/market.module'
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
    TxModule,
    // MicroTxMonitorModule,
    StakeModule,
    MarketModule,
    RpcModule,
    SmartContractModule
  ],
  providers: []
})
export class AppModule {}
