import { Field, Int, ObjectType } from '@nestjs/graphql'
import { CODE_ENUM } from '../../common/code.enum'
import { SendTxMonitorStatusEnum } from '../send/tx-monitor-send.enum'
import { TxMonitorWithdrawStakeStatusEnum } from './ts-monitor-withdraw-stake.enum'
// import { SendTxMonitorStatusEnum, SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@ObjectType()
export class TxMonitorWithdrawStakeResIno {
  @Field((type) => CODE_ENUM)
  code: CODE_ENUM

  @Field({ nullable: true })
  message?: string

  @Field((type) => [TxMonitorWithdrawStakeResList])
  list?: Array<TxMonitorWithdrawStakeResList>
}

@ObjectType()
export class TxMonitorWithdrawStakeResList {
  @Field((type) => Int)
  id: number

  @Field((type) => Int)
  min: number

  @Field()
  notify_email: string

  @Field((type) => TxMonitorWithdrawStakeStatusEnum)
  status: TxMonitorWithdrawStakeStatusEnum

  @Field()
  create_date: string

  @Field()
  update_date: string
}
