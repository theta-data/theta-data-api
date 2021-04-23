import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm'
import { UsersEntity } from './users.entity'
import { USER_IDENTIFY_TYPE_ENUM } from '../auth/auth.enum'

@Unique(['identify_type', 'identify_key'])
@Entity()
export class UsersAuthEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => UsersEntity, (user) => user.auth, {
    cascade: true
  })
  user: UsersEntity

  @Column({
    comment: '鉴权类别'
  })
  identify_type: USER_IDENTIFY_TYPE_ENUM

  @Column({
    comment: '鉴权标志'
  })
  identify_key: string

  @Column({
    comment: '鉴权凭证'
  })
  credential: string

  @Column({
    comment: '是否已经验证',
    type: 'boolean',
    default: false
  })
  verified: boolean

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
