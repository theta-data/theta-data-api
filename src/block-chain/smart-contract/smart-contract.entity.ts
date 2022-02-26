import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, Int, ObjectType } from '@nestjs/graphql'

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

  @Column({ type: Boolean, default: false })
  verified: boolean

  @Column({ type: 'int', default: smartContractProtocol.unknow })
  protocol: smartContractProtocol

  @Column({ default: null })
  abi: string

  @Column({ default: null })
  source_code: string

  @Column({ default: null })
  byte_code: string

  @Column({ type: 'int', default: 0 })
  verification_date: number

  @Column({ default: null })
  compiler_version: string

  @Column({ default: null })
  optimizer: string

  @Column({ type: 'int', default: 0 })
  optimizerRuns: number

  @Column({ default: null })
  name: string

  @Column({ default: null })
  function_hash: string

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

  // @Field(() => [SmartContractCallRecordEntity], { description: ' Call log' })
  // @OneToMany(() => SmartContractCallRecordEntity, (record) => record.smart_contract, {
  //   cascade: true
  // })
  // record: Array<SmartContractCallRecordEntity>

  // @Field()
  @CreateDateColumn()
  create_date!: number

  // @Field()
  @UpdateDateColumn()
  update_date!: number
}
