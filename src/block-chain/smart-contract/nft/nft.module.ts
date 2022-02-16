import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NftService } from './nft.service'
import { NftBalanceEntity } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
import { SmartContractCallRecordEntity } from '../smart-contract-call-record.entity'
import { SmartContractEntity } from '../smart-contract.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NftBalanceEntity,
      NftTransferRecordEntity,
      SmartContractCallRecordEntity,
      SmartContractEntity
    ])
  ],
  providers: [NftService],
  exports: [NftService]
})
export class NftModule {}
