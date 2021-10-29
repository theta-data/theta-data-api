import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { GraphQLBoolean, GraphQLInt } from 'graphql'

@ObjectType()
export class CandidateStakeTyep {
  @Field()
  source: string

  @Field()
  amount: string

  @Field(() => GraphQLBoolean)
  withdrawn: boolean

  @Field()
  return_height: string
}

@ObjectType()
export class CandidateType {
  @Field()
  Holder: string

  @Field(() => [CandidateStakeTyep])
  Stakes: Array<CandidateStakeTyep>
}

@ObjectType()
export class VcpPairType {
  @Field(() => String, { nullable: true })
  BlockHash: string

  @Field(() => [CandidateType])
  SortedCandidates: Array<CandidateType>
}

@ObjectType()
export class HeightListType {
  @Field(() => [Int])
  Heights: Array<number>
}

@ObjectType()
export class BlockHashVcpPair {
  @Field()
  BlockHash: string

  @Field(() => VcpPairType)
  Vcp: VcpPairType

  @Field(() => HeightListType)
  HeightList: HeightListType
}

@ObjectType()
export class GetVcpByHeightModel {
  @Field(() => [BlockHashVcpPair])
  BlockHashVcpPairs: Array<BlockHashVcpPair>
}
