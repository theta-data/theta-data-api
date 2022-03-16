import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Paginated } from 'src/common/common.model'
import { NftBalanceEntity } from './nft-balance.entity'

@ObjectType()
export class NftType {
  // @Field(() => [NftBalanceEntity])
  // balance: [NftBalanceEntity]
}

@ObjectType()
export class NftMetaType {
  @Field(() => Int)
  unique_holder: number

  @Field()
  total: number
}

@ObjectType()
export class PaginatedNftBalance extends Paginated(NftBalanceEntity) {}
