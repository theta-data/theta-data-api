import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
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
import { WalletModule } from './block-chain/wallet/wallet.module'
import * as path from 'path'
import { AnalyseModule } from './analyse/analyse.module'
import { EventEmitterModule } from '@nestjs/event-emitter'

const root: string = path.resolve(__dirname, '../../')
const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        let databaseConfig = Object.assign(config.get('ORM_CONFIG'), {
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
    CacheModule.register(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'playground'),
      exclude: ['/graphql*']
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      ttl: config.get('RATE_LIMIT')['ttl'],
      limit: config.get('RATE_LIMIT')['limit']
    }),
    EventEmitterModule.forRoot(),
    AnalyseModule,
    TxModule,
    StakeModule,
    MarketModule,
    RpcModule,
    SmartContractModule,
    WalletModule
  ],
  providers: []
})
export class AppModule {}
