import { SmartContractModule } from 'src/block-chain/smart-contract/smart-contract.module'
import { CountEntity } from './count.entity'
import { ExplorerService } from './explorer.service'
import { ExplorerResolver } from './explorer.resolver'
import { ExplorerAnalyseService } from './explorer-analyse.service'
import { CommonModule } from 'src/common/common.module'
import { TransactionEntity } from './transaction.entity'
import { BlokcListEntity } from './block-list.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'
import { RpcModule } from '../rpc/rpc.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([BlokcListEntity, TransactionEntity, CountEntity], 'explorer'),
    CommonModule,
    RpcModule,
    SmartContractModule
  ],
  providers: [ExplorerAnalyseService, ExplorerResolver, ExplorerService],
  exports: []
})
export class ExplorerModule {}
