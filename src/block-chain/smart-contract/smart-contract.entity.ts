import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity()
export class SmartContractEntity {
  // @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  contract_address: string

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  call_times: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  last_seven_days_call_times: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  last_24h_call_times: number

  @Field(() => [SmartContractCallRecordEntity])
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
