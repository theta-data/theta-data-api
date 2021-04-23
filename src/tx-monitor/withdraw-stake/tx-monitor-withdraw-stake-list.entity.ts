import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { UsersEntity } from '../../users/users.entity'
import { TxMonitorWithdrawStakeStatusEnum } from './ts-monitor-withdraw-stake.enum'

@Entity()
@Index(['status'])
export class TxMonitorWithdrawStakeListEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => UsersEntity)
  user: UsersEntity

  @Column({ type: 'bigint' })
  min: number

  @Column()
  notify_email: string

  @Column({ type: 'int' })
  status: TxMonitorWithdrawStakeStatusEnum

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
