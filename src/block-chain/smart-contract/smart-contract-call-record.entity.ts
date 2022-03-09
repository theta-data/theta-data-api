import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, ObjectType } from '@nestjs/graphql'
import { GraphQLString } from 'graphql'

@ObjectType()
@Entity()
@Index(['contract_id', 'timestamp'])
export class SmartContractCallRecordEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  contract_id: number

  @Column()
  data: string

  @Column()
  receipt: string

  @Column({
    type: 'int',
    default: 0
  })
  height: number

  @Column({ default: '', unique: true })
  tansaction_hash: string

  @Field(() => GraphQLString, { description: 'Calling time' })
  @Column({
    type: 'int'
    // default: '1970-01-01 00:00:01'
  })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
