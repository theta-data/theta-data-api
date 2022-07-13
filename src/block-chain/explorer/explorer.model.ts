import { Field, ObjectType } from '@nestjs/graphql'
import { Paginated } from 'src/common/common.model'
import { BlockModel, GetAccountModel, GetTransactionModel } from '../rpc/rpc.model'
import { BlokcListEntity } from './block-list.entity'
import { TransactionEntity } from './transaction.entity'

@ObjectType()
export class PaginatedBlockList extends Paginated(BlokcListEntity) {}

@ObjectType()
export class PaginatedTransactions extends Paginated(TransactionEntity) {}

@ObjectType()
export class ExplorerSearchModelType {
  @Field(() => GetTransactionModel, { nullable: true })
  transaction: GetTransactionModel

  @Field(() => BlockModel, { nullable: true })
  block: BlockModel

  @Field(() => GetAccountModel, { nullable: true })
  account: GetAccountModel

  @Field(() => BlokcListEntity, { nullable: true })
  block_extend: BlokcListEntity
}

@ObjectType()
export class ExplorerModelType {
  @Field(() => PaginatedBlockList)
  blockList: PaginatedBlockList

  @Field(() => PaginatedTransactions)
  transactions: PaginatedTransactions

  @Field(() => ExplorerSearchModelType)
  search: ExplorerSearchModelType
  //   @Field(()=>Pa)
}
