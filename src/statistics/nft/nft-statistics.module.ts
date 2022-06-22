import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NftBalanceEntity } from 'src/block-chain/smart-contract/nft/nft-balance.entity'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { CommonModule } from 'src/common/common.module'
import { NftStatisticsAnalyseService } from './nft-statistics-analyse.service'
import { NftStatisticsEntity } from './nft-statistics.entity'
import { NftStatisticsResolver } from './nft-statistics.resolver'
import { NftStatisticsService } from './nft-statistics.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([NftTransferRecordEntity, NftBalanceEntity], 'nft'),
    TypeOrmModule.forFeature([NftStatisticsEntity], 'nft-statistics'),
    CommonModule
  ],
  providers: [NftStatisticsAnalyseService, NftStatisticsResolver, NftStatisticsService],
  exports: []
})
export class NftStatisticsModule {}