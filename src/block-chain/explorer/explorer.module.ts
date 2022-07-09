import { ExplorerService } from './explorer.service'
import { ExplorerResolver } from './explorer.resolver'
import { ExplorerAnalyseService } from './explorer-analyse.service'
import { CommonModule } from 'src/common/common.module'
import { TransactionEntity } from './transaction.entity'
import { BlokcListEntity } from './block-list.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

@Module({
  imports: [
    TypeOrmModule.forFeature([BlokcListEntity, TransactionEntity], 'explorer'),
    CommonModule
  ],
  providers: [ExplorerAnalyseService, ExplorerResolver, ExplorerService],
  exports: []
})
export class ExplorerModule {}
