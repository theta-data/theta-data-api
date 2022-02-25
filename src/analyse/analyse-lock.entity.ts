import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class AnalyseLockEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({
    unique: true,
    type: 'int'
  })
  lock_key: string

  @Column({
    unique: true,
    type: 'boolean'
  })
  status: boolean

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
