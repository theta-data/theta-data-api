import { CacheModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { WalletModule } from './block-chain/wallet/wallet.module'
// import { AnalyseModule } from './analyse/analyse.module'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ContactModule } from './contact/contact.module'
import { ApolloDriver } from '@nestjs/apollo'
import { APP_GUARD } from '@nestjs/core'
import { GqlThrottlerGuard } from './guard'
import { LoggerModule } from './logger/logger.module'
import { LoggerMiddleware } from './logger/logger.middleware'
const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'contact.sqlite',
      name: 'contact',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'analyse.sqlite',
      name: 'analyse',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'smart_contract/smart_contract.sqlite',
      name: 'smart_contract',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'nft/nft.sqlite',
      name: 'nft',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'stake/stake.sqlite',
      name: 'stake',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'tx/tx.sqlite',
      name: 'tx',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'wallet/wallet.sqlite',
      name: 'wallet',
      entities: []
    }),
    TypeOrmModule.forRoot({
      ...config.get('ORM_CONFIG'),
      database: config.get('ORM_CONFIG')['database'] + 'logger/wallet.sqlite',
      name: 'logger',
      entities: []
    }),
    GraphQLModule.forRoot({
      driver: ApolloDriver,
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
    TxModule,
    StakeModule,
    MarketModule,
    RpcModule,
    SmartContractModule,
    WalletModule,
    ContactModule,
    LoggerModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*')
  }
}
