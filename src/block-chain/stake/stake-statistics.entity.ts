import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { GraphQLFloat } from 'graphql'
import { StakeEntity } from './stake.entity'
import { StakeRewardModel } from './stake.model'

@Entity()
@ObjectType()
export class StakeStatisticsEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Field(() => Int)
  @Column({
    type: 'int',
    unique: true
  })
  block_height: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  total_elite_edge_node_number: number

  // @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_elite_edge_node_number: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_edge_node_stake_amount: number

  // @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_elite_edge_node_stake_amount: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  total_guardian_node_number: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_guardian_node_number: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_guardian_stake_amount: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_guardian_stake_amount: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  total_validator_node_number: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_validator_node_number: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_validator_stake_amount: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_validator_stake_amount: number

  @Field(() => GraphQLFloat)
  @Column({
    type: 'float'
  })
  theta_fuel_stake_ratio: number

  @Field(() => GraphQLFloat)
  @Column({
    type: 'float'
  })
  theta_stake_ratio: number

  @Field(() => Int)
  @Column({
    type: 'bigint',
    default: 0
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
  // @Field(() => [StakeEntity])
  // stakes: Array<StakeEntity>

  // @Field(() => StakeRewardModel)
  stake_reward: Promise<StakeRewardModel>
}
