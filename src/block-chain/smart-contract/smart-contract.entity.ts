import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity()
@Index('call_times')
@Index('last_seven_days_call_times')
@Index('last_24h_call_times')
export class SmartContractEntity {
  // @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field({ description: 'Address of the smart contract' })
  @Column()
  contract_address: string

  @Field(() => Int, { description: 'Total number of smart contract calls' })
  @Column({
    type: 'int'
  })
  call_times: number

  @Field(() => Int, { description: 'Number of smart contract calls in the last 7 days' })
  @Column({
    type: 'int'
  })
  last_seven_days_call_times: number

  @Field(() => Int, { description: 'Number of smart contract calls in the last 24 hours' })
  @Column({
    type: 'int'
  })
  last_24h_call_times: number

  @Field(() => [SmartContractCallRecordEntity], { description: ' Call log' })
  @OneToMany(() => SmartContractCallRecordEntity, (record) => record.smart_contract, {
    cascade: true
  })
  record: Array<SmartContractCallRecordEntity>

  // @Field()
  @CreateDateColumn()
  create_date!: number

  // @Field()
  @UpdateDateColumn()
  update_date!: number
}
