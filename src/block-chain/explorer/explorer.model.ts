import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { Paginated } from 'src/common/common.model'
import { BlockModel, GetAccountModel, GetTransactionModel } from '../rpc/rpc.model'
import { BlokcListEntity } from './block-list.entity'
import { TransactionEntity } from './transaction.entity'

@ObjectType()
export class PaginatedBlockList extends Paginated(BlokcListEntity) {}

@ObjectType()
export class PaginatedTransactions extends Paginated(TransactionEntity) {}

export enum SEARCH_TYPE_ENUM {
  block,
  transaction,
  account
}
registerEnumType(SEARCH_TYPE_ENUM, {
  name: 'SEARCH_TYPE_ENUM'
})
@ObjectType()
export class ExplorerSearchModelType {
  @Field(() => GetTransactionModel, { nullable: true })
  transaction: GetTransactionModel

  @Field(() => SEARCH_TYPE_ENUM, { nullable: true })
  search_type: SEARCH_TYPE_ENUM

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
