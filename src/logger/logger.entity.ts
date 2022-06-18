import { Field, ObjectType } from '@nestjs/graphql'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@ObjectType()
@Entity()
export class LoggerEntity {
  // @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  query: string

  @Field()
  @Column({ unique: true })
  hash: string

  @Field()
  @Column({ type: 'int', default: 0 })
  call_times: number

  // @Field()
  @CreateDateColumn()
  create_date!: number

  // @Field()
  @Field()
  @UpdateDateColumn()
  update_date!: number
}
