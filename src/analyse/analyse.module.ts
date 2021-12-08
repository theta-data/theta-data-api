import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getConnectionOptions } from 'typeorm'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { AnalyseService } from './analyse.service'
import { StakeModule } from '../block-chain/stake/stake.module'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractModule } from '../block-chain/smart-contract/smart-contract.module'
import { join } from 'path'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async () =>
        Object.assign(await getConnectionOptions('THETA_DATA'), {
          entities: [join(__dirname, '/../**', '*.entity.{ts,js}')]
        })
    }),
    TypeOrmModule.forFeature([ThetaTxNumByHoursEntity, StakeStatisticsEntity, StakeRewardEntity]),
    CacheModule.register({}),
    StakeModule,
    SmartContractModule
  ],
  providers: [AnalyseService]
})
export class AnalyseModule {}
