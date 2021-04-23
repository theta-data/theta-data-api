import { createUnionType, Field, Int, ObjectType } from '@nestjs/graphql'
import { CODE_ENUM } from '../common/code.enum'

@ObjectType()
export class UserInfo {
  @Field((type) => Int)
  status: number

  @Field()
  email: string
}

@ObjectType()
export class ResInfo {
  @Field((type) => CODE_ENUM)
  code: CODE_ENUM

  @Field({ nullable: true })
  message?: string

  @Field((type) => UserInfo, { nullable: true })
  userInfo?: UserInfo
}

@ObjectType()
export class UserLoginInfo {
  @Field()
  login_time: string

  @Field()
  email: string
}
