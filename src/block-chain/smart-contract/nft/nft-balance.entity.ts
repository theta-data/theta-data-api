import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

@Entity()
// @Unique([])
export class NftBalanceEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  smart_contract_address: string

  @Column()
  contract_uri: string

  @Column()
  base_token_uri: string

  @Column()
  token_uri: string

  @Column({ type: 'int' })
  token_id: number

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
