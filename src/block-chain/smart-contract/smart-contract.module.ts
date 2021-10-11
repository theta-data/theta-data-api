import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SmartContractEntity } from './smart-contract.entity'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { SmartContractService } from './smart-contract.service'
import { SmartContractResolver } from './smart-contract.resolver'

@Module({
  imports: [TypeOrmModule.forFeature([SmartContractEntity, SmartContractCallRecordEntity])],
  providers: [SmartContractService, SmartContractResolver],
  exports: [SmartContractService]
})
export class SmartContractModule {}