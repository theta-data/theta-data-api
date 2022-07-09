import { Field, ObjectType } from '@nestjs/graphql'
import { Paginated } from 'src/common/common.model'
import { BlokcListEntity } from './block-list.entity'
import { TransactionEntity } from './transaction.entity'

@ObjectType()
export class PaginatedBlockList extends Paginated(BlokcListEntity) {}

@ObjectType()
export class PaginatedTransactions extends Paginated(TransactionEntity) {}

@ObjectType()
export class ExplorerModelType {
  @Field(() => PaginatedBlockList)
  blockList: PaginatedBlockList

  @Field(() => PaginatedTransactions)
  transactions: PaginatedTransactions
  //   @Field(()=>Pa)
}
