import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SmartContractEntity } from './smart-contract.entity'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'

@Module({
  imports: [TypeOrmModule.forFeature([SmartContractEntity, SmartContractCallRecordEntity])],
  providers: [],
  exports: []
})
export class SmartContractModule {}
