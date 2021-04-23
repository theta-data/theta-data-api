import { registerEnumType } from '@nestjs/graphql'

export enum TxMonitorWithdrawStakeStatusEnum {
  success,
  deleted
}
registerEnumType(TxMonitorWithdrawStakeStatusEnum, {
  name: 'TxMonitorWithdrawStakeStatusEnum'
})
