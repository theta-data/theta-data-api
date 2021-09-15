import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable'
import { Field, Float, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
@Entity()
@Unique(['year', 'month', 'day', 'hour'])
export class ThetaTxNumByHoursEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  year: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  month: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  day: number

  @Field(() => Int)
  @Column({
    type: 'int'
  })
  hour: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  block_number: number

  @Field(() => Float)
  @Column({
    type: 'float',
    default: 0
  })
  tfuel_burnt: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  active_wallet: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  coin_base_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  slash_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  send_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  reserve_fund_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  release_fund_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  service_payment_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  split_rule_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  deposit_stake_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  withdraw_stake_tx: number

  @Field(() => Int)
  @Column({
    type: 'int',
    default: 0
  })
  smart_contract_tx: number

  @Field(() => Int)
  @Column({
    type: 'bigint',
    default: 0
  })
  latest_block_height: number

  @Field()
  @Column({
    type: 'timestamp',
    unique: true,
    comment: '对应精确到小时的数据'
  })
  timestamp: string

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
