import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLFloat, GraphQLInt } from 'graphql'
import { Paginated } from 'src/common/common.model'
import { NftStatisticsEntity } from './nft-statistics.entity'

@ObjectType()
export class PaginatedNftStatistics extends Paginated(NftStatisticsEntity) {}

@ObjectType()
export class NftDetailType {
  @Field({ nullable: true })
  contract_uri_detail: string

  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  img_uri: string

  @Field(() => [NftDetailByDate])
  by_24_hours: Array<NftDetailByDate>

  @Field(() => [NftDetailByDate])
  by_7_days: Array<NftDetailByDate>

  @Field(() => [NftDetailByDate])
  by_30_days: Array<NftDetailByDate>
}

@ObjectType()
export class NftDetailByDate {
  @Field(() => GraphQLInt)
  date: number

  @Field(() => GraphQLFloat)
  volume: number

  @Field(() => GraphQLInt)
  transactions: number

  @Field(() => GraphQLInt)
  users: number
}
