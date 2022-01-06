import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { GraphQLModule } from '@nestjs/graphql'
import { TxModule } from './block-chain/tx/tx.module'
import { ScheduleModule } from '@nestjs/schedule'
import { StakeModule } from './block-chain/stake/stake.module'
import { MarketModule } from './market/market.module'
import { RpcModule } from './block-chain/rpc/rpc.module'
import { SmartContractModule } from './block-chain/smart-contract/smart-contract.module'
import { join } from 'path'
import { ServeStaticModule } from '@nestjs/serve-static'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { GqlThrottlerBehindProxyGuard } from './guard/gql-throttler-behind-proxy-guard'
import { WalletModule } from './block-chain/wallet/wallet.module'
import * as path from 'path'
const root: string = path.resolve(__dirname, '../../')
const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        let databaseConfig = Object.assign(config.get('DB_CONFIG'), {
          entities: [join(__dirname, '**', '*.entity.{ts,js}')]
        })
        console.log(databaseConfig)
        if (!databaseConfig.database) {
          databaseConfig = Object.assign(databaseConfig, {
            database: `${root}/data/line.sqlite`
          })
        }
        return databaseConfig
      }
    }),
    GraphQLModule.forRoot({
      installSubscriptionHandlers: true,
      autoSchemaFile: 'schema.gql',
      introspection: true,
      context: ({ req, res }) => ({ req, res })
    }),
    CacheModule.register({
      // store: redisStore,
      // host: config.get('REDIS')['host'],
      // port: config.get('REDIS')['port']
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
