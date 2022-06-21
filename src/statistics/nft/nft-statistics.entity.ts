import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

@Entity()
@Unique(['smart_contract_address'])
export class NftStatisticsEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  smart_contract_address: string

  @Column()
  name: string

  @Column()
  contract_uri: string

  @Column()
  contract_uri_detail: string

  @Column({ type: 'int' })
  last_24_h_transactions: number

  @Column({ type: 'int' })
  last_24_h_volume: number

  @Column({ type: 'int' })
  last_24_h_users: number

  @Column({ type: 'int' })
  last_7_days_transactions: number

  @Column({ type: 'int' })
  last_7_days_volume: number

  @Column({ type: 'int' })
  last_7_days_users: number

  @Column({ type: 'int' })
  last_30_days_transactions: number

  @Column({ type: 'int' })
  last_30_days_volume: number

  @Column({ type: 'int' })
  last_30_days_users: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
