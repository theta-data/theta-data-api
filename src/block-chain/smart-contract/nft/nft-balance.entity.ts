import { Field, Int, ObjectType } from '@nestjs/graphql'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'

export enum NftStatusEnum {
  invalid = 1,
  valid = 2
}

@ObjectType()
@Entity()
@Index(['smart_contract_address'])
@Unique(['smart_contract_address', 'token_id'])
export class NftBalanceEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  smart_contract_address: string

  @Field()
  @Column()
  owner: string

  @Field()
  @Column()
  from: string

  @Field()
  @Column()
  contract_uri: string

  @Field()
  @Column()
  base_token_uri: string

  @Field()
  @Column()
  token_uri: string

  @Field()
  @Column()
  name: string

  @Field()
  @Column()
  img_uri: string

  @Field()
  @Column()
  detail: string

  @Field(() => Int)
  @Column({ type: 'int' })
  token_id: number
  //   @Column({ type: 'int' })
  //   status: NftStatusEnum

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
