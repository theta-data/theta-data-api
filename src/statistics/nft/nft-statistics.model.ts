import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLFloat, GraphQLInt } from 'graphql'
import { Paginated } from 'src/common/common.model'
import { NftStatisticsEntity } from './nft-statistics.entity'

@ObjectType()
export class PaginatedNftStatistics extends Paginated(NftStatisticsEntity) {}

@ObjectType()
export class NftDetailType {
  @Field({ nullable: true })
  externel_url: string

  @Field({ nullable: true })
  name: string

  @Field(() => [NftDetailByDate])
  by_date: Array<NftDetailByDate>
}

@ObjectType()
export class NftDetailByDate {
  @Field()
  date: string

  @Field(() => GraphQLFloat)
  volume: number

  @Field(() => GraphQLInt)
  transactions: number

  @Field(() => GraphQLInt)
  users: number
}
