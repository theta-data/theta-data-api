import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { GraphQLBoolean } from 'graphql'

export enum smartContractProtocol {
  unknow = 1,
  tnt721,
  tnt20
}

@ObjectType()
@Entity()
export class SmartContractEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field({ description: 'Address of the smart contract' })
  @Column({ unique: true })
  contract_address: string

  @Column({ type: 'int', default: 0 })
  height: number

  @Field(() => GraphQLBoolean)
  @Column({ type: Boolean, default: false })
  verified: boolean

  @Field(() => Int)
  @Column({ type: 'int', default: smartContractProtocol.unknow })
  protocol: smartContractProtocol

  @Field({ nullable: true })
  @Column({ default: null })
  abi: string

  @Field({ nullable: true })
  @Column({ default: null })
  source_code: string

  @Field({ nullable: true })
  @Column({ default: null })
  byte_code: string

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  verification_date: number

  @Field({ nullable: true })
  @Column({ default: null })
  compiler_version: string

  @Field({ nullable: true })
  @Column({ default: null })
  optimizer: string

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  optimizerRuns: number

  @Field({ nullable: true })
  @Column({ default: null })
  name: string

  @Field({ nullable: true })
  @Column({ default: null })
  function_hash: string

  @Field({ nullable: true })
  @Column({ default: null })
  constructor_arguments: string

  @Field(() => Int, { description: 'Total number of smart contract calls' })
  @Index('call_times')
  @Column({
    type: 'int',
    default: 1
  })
  call_times: number

  @Field(() => Int, { description: 'Number of smart contract calls in the last 7 days' })
  @Index('last_seven_days_call_times')
  @Column({
    type: 'int',
    default: 1
  })
  last_seven_days_call_times: number

  @Field(() => Int, { description: 'Number of smart contract calls in the last 24 hours' })
  @Index('last_24h_call_times')
  @Column({
    type: 'int',
    default: 1
  })
  last_24h_call_times: number

  @Field(() => Int, { description: 'call times update timestamp' })
  @Index('call_times_update_date')
  @Column({
    type: 'int',
    default: 0
  })
  call_times_update_timestamp: number

  // @Field()
  @CreateDateColumn()
  create_date!: number

  // @Field()
  @UpdateDateColumn()
  update_date!: number
}
