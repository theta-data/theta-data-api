import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { StakeEntity } from './stake.entity'

@ObjectType()
export class stakeStatistics {
  @Field(() => Int)
  elite_edge_node_num: number

  @Field(() => Float)
  theta_stake_ratio: number

  @Field(() => Float)
  tfuel_stake_ratio: number

  @Field(() => Int)
  validator_node_num: number

  @Field(() => Int)
  guardian_node_num: number
}

// @ObjectType()
// export class stakeInfo {
//   @Field(() => [StakeEntity])
//   node_info: Array<StakeEntity>
//
//   @Field(() => stakeStatistics)
//   statistics: stakeStatistics
// }
