import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

@Entity()
@Unique(['smart_contract_address', 'token_id', 'timestamp'])
export class NftTransferRecordEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  smart_contract_address: string

  @Column()
  from: string

  @Column()
  to: string

  @Column({ type: 'int' })
  token_id: number

  @Column({
    type: 'int',
    default: 0
  })
  height: number

  @Column({ type: 'int' })
  timestamp: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
