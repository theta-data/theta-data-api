import { CacheModule, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from '../block-chain/tx/theta-tx-num-by-hours.entity'
import { AnalyseService } from './analyse.service'
import { StakeModule } from '../block-chain/stake/stake.module'
import { StakeStatisticsEntity } from '../block-chain/stake/stake-statistics.entity'
import { SmartContractModule } from '../block-chain/smart-contract/smart-contract.module'
import { StakeRewardEntity } from '../block-chain/stake/stake-reward.entity'
import { WalletModule } from '../block-chain/wallet/wallet.module'
import { BlockListEntity } from './block-list.entity'
import { AnalyseLockEntity } from './analyse-lock.entity'
import { CommonModule } from 'src/common/common.module'
import { NftModule } from 'src/block-chain/smart-contract/nft/nft.module'
@Module({
  imports: [
    TypeOrmModule.forFeature([ThetaTxNumByHoursEntity], 'tx'),
    TypeOrmModule.forFeature([StakeStatisticsEntity, StakeRewardEntity], 'stake'),
    TypeOrmModule.forFeature([BlockListEntity, AnalyseLockEntity], 'analyse'),
    CacheModule.register({}),
    StakeModule,
    SmartContractModule,
    WalletModule,
    CommonModule,
    NftModule
  ],
  providers: [AnalyseService]
})
export class AnalyseModule {}
