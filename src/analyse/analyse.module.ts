import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AnalyseService } from './analyse.service'
import * as redisStore from 'cache-manager-redis-store'
import { StakeModule } from '../block-chain/stake/stake.module'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractModule } from '../block-chain/smart-contract/smart-contract.module'
import { join } from 'path'
const config = require('config')
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(
          Object.assign(await getConnectionOptions('THETA_DATA'), config.get('THETA_DATA_DB')),
          { entities: [join(__dirname, '/../**', '*.entity.{ts,js}')] }
        )
    }),
    TypeOrmModule.forFeature([ThetaTxNumByHoursEntity, StakeStatisticsEntity]),
    CacheModule.register({
      store: redisStore,
      host: config.get('REDIS')['host'],
      port: config.get('REDIS')['port']
    }),
    ClientsModule.register([
      {
        name: 'SEND_TX_MONITOR_SERVICE',
        transport: Transport.REDIS,
        // transport: Transport.TCP,
        options: {
          // port: 5000
          url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
          // url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
        }
      }
    ]),
    StakeModule,
    SmartContractModule
  ],
  providers: [AnalyseService]
})
export class AnalyseModule {}
