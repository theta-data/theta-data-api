import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { GraphQLFloat } from 'graphql'
import { StakeEntity } from './stake.entity'

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
  total_edge_node_num: number

  // @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_edge_node_num: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_edge_node_stake: number

  // @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_edge_node_stake: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  total_guardian_node_num: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_guardian_node_num: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_guardian_stake: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_guardian_stake: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  total_validator_node_num: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  effective_validator_node_num: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  total_validator_stake: number

  @Field(() => String)
  @Column({
    type: 'bigint'
  })
  effective_validator_stake: number

  @Field(() => GraphQLFloat)
  @Column({
    type: 'float'
  })
  tfuel_stake_ratio: number

  @Field(() => GraphQLFloat)
  @Column({
    type: 'float'
  })
  theta_stake_ratio: number

  @Field(() => Int)
  @Column({
    type: 'bigint'
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number

  @Field(() => [StakeEntity])
  stakes: Array<StakeEntity>
}
