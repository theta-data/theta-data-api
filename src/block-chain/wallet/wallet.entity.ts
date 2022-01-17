import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class WalletEntity {
  @PrimaryGeneratedColumn()
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
