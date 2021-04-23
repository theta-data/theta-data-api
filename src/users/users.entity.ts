import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm'
import { UsersAuthEntity } from './users-auth.entity'
import { USER_STATUS_ENUM } from '../auth/auth.enum'

@Entity()
@Index(['email'])
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @OneToMany(() => UsersAuthEntity, (userAuth) => userAuth.user, {
    cascade: ['update', 'insert']
  })
  auth: Array<UsersAuthEntity>

  @Column({
    comment: '邮箱',
    default: ''
  })
  email!: string

  @Column({
    comment: '手机号',
    default: ''
  })
  telephone!: string

  @Column({
    comment: '混淆盐值',
    default: ''
  })
  salt!: string

  @Column({
    comment: '状态',
    default: USER_STATUS_ENUM.register
  })
  status: USER_STATUS_ENUM

  @Column({
    type: 'datetime',
    comment: '最后访问时间',
    default: '2015-01-01 00:00:00'
  })
  last_visit_date!: string

  @Column({
    type: 'varchar',
    comment: '最后访问页面',
    default: ''
  })
  last_visit_page!: string

  @CreateDateColumn()
  create_date!: number

  @UpdateDateColumn()
  update_date!: number
}
