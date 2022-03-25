import { Field, Int, ObjectType } from '@nestjs/graphql'
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
@Unique(['smart_contract_address', 'token_id', 'timestamp'])
export class NftTransferRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: number

  @Field()
  @Column()
  smart_contract_address: string

  @Field()
  @Column()
  from: string

  @Field()
  @Column({ default: '' })
  name: string

  @Field()
  @Column()
  to: string

  @Field(() => Int)
  @Column({ type: 'int' })
  token_id: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  height: number

  @Field(() => Int)
  @Column({ type: 'int' })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
