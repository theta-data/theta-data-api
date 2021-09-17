import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SmartContractEntity } from '../smart-contract/smart-contract.entity'
import { SmartContractCallRecordEntity } from '../smart-contract/smart-contract-call-record.entity'
import { RpcService } from './rpc.service'
import { RpcResolver } from './rpc.resolver'

@Module({
  imports: [],
  providers: [RpcResolver],
  exports: []
})
export class RpcModule {}
