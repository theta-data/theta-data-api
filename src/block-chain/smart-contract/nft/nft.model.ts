import { Field, Int, ObjectType } from '@nestjs/graphql'
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

// @ObjectType()
// export class NftBlanceType {
//   @Field()
//   token_uri: string

//   @Field(() => Int)
//   token_id: number

//   @Field()
//   contract_uri: string

//   @Field()
//   from: string

//   @Field()
//   name: string

//   @Field()
//   img_uri: string

//   @Field()
//   detail: string

//   @Field()
//   base_token_uri: string

//   @Field()
//   smart_contract_address: string
// }
