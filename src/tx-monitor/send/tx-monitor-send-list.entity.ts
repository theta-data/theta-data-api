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
import { SendTxMonitorStatusEnum, SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@Entity()
@Index(['status'])
export class TxMonitorSendListEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => UsersEntity)
  user: UsersEntity

  @Column({ type: 'bigint' })
  min: number

  @Column()
  notify_email: string

  @Column({ type: 'int' })
  token_type: SendTxMonitorTokenTypeEnum

  @Column({ type: 'int' })
  status: SendTxMonitorStatusEnum

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
