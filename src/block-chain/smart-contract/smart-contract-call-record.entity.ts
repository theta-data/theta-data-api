import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { SmartContractEntity } from './smart-contract.entity'
import { Field, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity()
export class SmartContractCallRecordEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => SmartContractEntity)
  @ManyToOne(() => SmartContractEntity, (contract) => contract.record, {
    onUpdate: 'CASCADE'
  })
  smart_contract: SmartContractEntity

  @Field()
  @Column({ type: 'timestamp', default: 0 })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
