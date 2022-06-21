import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NftBalanceEntity } from 'src/block-chain/smart-contract/nft/nft-balance.entity'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { CommonModule } from 'src/common/common.module'
// import { CommonModule } from 'src/common/common.module'
import { NftStatisticsEntity } from './nft-statistics.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([NftTransferRecordEntity, NftBalanceEntity], 'nft'),
    TypeOrmModule.forFeature([NftStatisticsEntity], 'nft-statistics'),
    CommonModule
  ],
  providers: [],
  exports: []
})
export class NftStatisticsModule {}
