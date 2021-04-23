import { Field, Int, ObjectType } from '@nestjs/graphql'
import { CODE_ENUM } from '../../common/code.enum'
import { SendTxMonitorStatusEnum, SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@ObjectType()
export class SendTxMonitorResIno {
  @Field((type) => CODE_ENUM)
  code: CODE_ENUM

  @Field({ nullable: true })
  message?: string

  @Field((type) => [SendTxMonitorResList])
  list?: Array<SendTxMonitorResList>
}

@ObjectType()
export class SendTxMonitorResList {
  @Field((type) => Int)
  id: number

  @Field((type) => Int)
  min: number

  @Field()
  notify_email: string

  @Field((type) => SendTxMonitorTokenTypeEnum)
  token_type: SendTxMonitorTokenTypeEnum

  @Field((type) => SendTxMonitorStatusEnum)
  status: SendTxMonitorStatusEnum

  @Field()
  create_date: string

  @Field()
  update_date: string
}
