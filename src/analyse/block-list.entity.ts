import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
export enum BlockStatus {
  inserted,
  analysed
}
@Entity()
export class BlockListEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    unique: true,
    type: 'int'
  })
  block_number: number

  @Column({ type: 'int' })
  status: BlockStatus

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
