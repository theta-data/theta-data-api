import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { Field, registerEnumType } from '@nestjs/graphql'
export enum STAKE_TOKEN_TYPE_ENUM {
  theta_stake = 1,
  elite_node_stake
}
registerEnumType(STAKE_TOKEN_TYPE_ENUM, {
  name: 'STAKE_TOKEN_TYPE_ENUM'
})

@Entity()
@Index(['wallet_address', 'timestamp'])
export class StakeRewardEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'float' })
  reward_amount: number

  @Column()
  wallet_address: string

  // @Column({ type: 'tinyint' })
  // stake_token_type: STAKE_TOKEN_TYPE_ENUM

  @Column({ type: 'bigint' })
  reward_height: number

  @Field()
  @Column({
    type: 'timestamp',
    // default: '1970-01-01 00:00:01',
    comment: '对应精确到小时的数据'
  })
  timestamp: string

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
