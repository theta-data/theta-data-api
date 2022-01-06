import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { AnalyseService } from './analyse.service'
import { StakeModule } from '../block-chain/stake/stake.module'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractModule } from '../block-chain/smart-contract/smart-contract.module'
import { join } from 'path'
import * as path from 'path'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
const config = require('config')
const root: string = path.resolve(__dirname, '../../')
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        let databaseConfig = Object.assign(config.get('ORM_CONFIG'), {
          entities: [join(__dirname, '/../**', '*.entity.{ts,js}')]
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
    TypeOrmModule.forFeature([ThetaTxNumByHoursEntity, StakeStatisticsEntity, StakeRewardEntity]),
    CacheModule.register({}),
    StakeModule,
    SmartContractModule
  ],
  providers: [AnalyseService]
})
export class AnalyseModule {}
