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
  @PrimaryGeneratedColumn('uuid')
  id!: number

  @Column({
    unique: true
  })
  address: string

  @Column({ type: 'int' })
  latest_active_time: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
