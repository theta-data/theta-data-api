import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity()
@Index(['latest_active_time'])
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    unique: true
  })
  address: string

  @Column({
    default: ''
  })
  txs_hash_list: string

  @Column({ type: 'int' })
  latest_active_time: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
