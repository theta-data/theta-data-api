import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { TxModule } from './block-chain/tx/tx.module'
import { ScheduleModule } from '@nestjs/schedule'
import { StakeModule } from './block-chain/stake/stake.module'
import { MarketModule } from './market/market.module'
import * as redisStore from 'cache-manager-redis-store'
import { RpcModule } from './block-chain/rpc/rpc.module'
import { SmartContractModule } from './block-chain/smart-contract/smart-contract.module'
import { join } from 'path'
import { ServeStaticModule } from '@nestjs/serve-static'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { GqlThrottlerBehindProxyGuard } from './guard/gql-throttler-behind-proxy-guard'
import { WalletModule } from './block-chain/wallet/wallet.module'

const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(
          Object.assign(await getConnectionOptions('THETA_DATA'), config.get('THETA_DATA_DB')),
          { entities: [join(__dirname, '**', '*.entity.{ts,js}')] }
        )
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: 'schema.gql',
      introspection: true,
      context: ({ req, res }) => ({ req, res })
    }),
    CacheModule.register({
      store: redisStore,
      host: config.get('REDIS')['host'],
      port: config.get('REDIS')['port']
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'playground'),
      // serveRoot: 'playground',
      exclude: ['/graphql*']
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: config.get('RATE_LIMIT')['ttl'],
      limit: config.get('RATE_LIMIT')['limit']
    }),
    TxModule,
    StakeModule,
    MarketModule,
    RpcModule,
    SmartContractModule,
    WalletModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerBehindProxyGuard
    }
  ]
})
export class AppModule {}
