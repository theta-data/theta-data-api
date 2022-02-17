import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

export enum NftStatusEnum {
  invalid = 1,
  valid = 2
}

@Entity()
// @Unique([])
export class NftBalanceEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  smart_contract_address: string

  @Column()
  owner: string

  @Column()
  from: string

  @Column()
  contract_uri: string

  @Column()
  base_token_uri: string

  @Column()
  token_uri: string

  @Column()
  name: string

  @Column()
  img_uri: string

  @Column()
  detail: string

  @Column({ type: 'int' })
  token_id: number
  //   @Column({ type: 'int' })
  //   status: NftStatusEnum

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
