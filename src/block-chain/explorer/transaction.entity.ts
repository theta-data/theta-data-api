import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@ObjectType()
@Entity()
@Index(['height'])
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column({ unique: true })
  tx_hash: string

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  tx_type: number

  @Field(() => GraphQLString, { nullable: true })
  @Column({ nullable: true })
  from: string

  @Field(() => GraphQLString, { nullable: true })
  @Column({ nullable: true })
  to: string

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  height: number

  @Field(() => GraphQLInt)
  @Column({ type: 'int' })
  timestamp: number

  @Field(() => GraphQLFloat)
  @Column({ type: 'float' })
  theta: number

  @Field(() => GraphQLFloat)
  @Column({ type: 'float' })
  theta_fuel: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}