import { register } from 'tsconfig-paths'
import { registerEnumType } from '@nestjs/graphql'

export enum CODE_ENUM {
  invalid_request = -1001,
  too_many_request = -1000,
  sys_err = -999,
  db_operate_err,
  success = 0,
  params_format_error,

  register_password_repeat_error = 1001,
  register_user_exist,

  login_no_user = 1101,
  login_password_error,
  login_not_verified,

  mail_check_invalid_auth_token = 1201

  // send_tx_monitor_
}

registerEnumType(CODE_ENUM, { name: 'CODE_ENUM' })
