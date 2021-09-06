import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { ThetaTxNumByHoursEntity } from '../tx/theta-tx-num-by-hours.entity'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { AnalyseService } from './analyse.service'
import * as redisStore from 'cache-manager-redis-store'
const config = require('config')

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions('THETA_DATA_DB'), config.get('THETA_DATA_DB'))
    }),

    TypeOrmModule.forFeature([ThetaTxNumByHoursEntity]),
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
    ])
  ],
  providers: [AnalyseService]
})
export class AnalyseModule {}
