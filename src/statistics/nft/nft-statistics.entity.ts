import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

@ObjectType()
@Entity()
@Unique(['smart_contract_address'])
export class NftStatisticsEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  smart_contract_address: string

  @Field()
  @Column()
  name: string

  @Field()
  @Column()
  contract_uri: string

  @Field()
  @Column()
  contract_uri_detail: string

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_24_h_transactions: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_24_h_volume: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_24_h_users: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_7_days_transactions: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_7_days_volume: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_7_days_users: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_30_days_transactions: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_30_days_volume: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  last_30_days_users: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}