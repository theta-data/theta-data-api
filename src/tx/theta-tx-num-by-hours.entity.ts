import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable'

@Entity()
@Unique(['year', 'month', 'day', 'hour'])
export class ThetaTxNumByHoursEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    type: 'int'
  })
  year: number

  @Column({
    type: 'int'
  })
  month: number

  @Column({
    type: 'int'
  })
  day: number

  @Column({
    type: 'int'
  })
  hour: number

  @Column({
    type: 'int',
    default: 0
  })
  block_number: number

  @Column({
    type: 'int',
    default: 0
  })
  coin_base_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  slash_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  send_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  reserve_fund_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  release_fund_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  service_payment_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  split_rule_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  deposit_stake_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  withdraw_stake_tx: number

  @Column({
    type: 'int',
    default: 0
  })
  smart_contract_tx: number

  @Column({
    type: 'bigint',
    default: 0
  })
  latest_block_height: number

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
