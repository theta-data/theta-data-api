import { registerEnumType } from '@nestjs/graphql'

export enum USER_STATUS_ENUM {
  register,
  email_checked
}

registerEnumType(USER_STATUS_ENUM, { name: 'USER_STATUS_ENUM' })

export enum USER_IDENTIFY_TYPE_ENUM {
  web,
  telegram
}
registerEnumType(USER_IDENTIFY_TYPE_ENUM, { name: 'USER_IDENTIFY_TYPE_ENUM' })
