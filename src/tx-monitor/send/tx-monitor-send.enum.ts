import { registerEnumType } from '@nestjs/graphql'

export enum SendTxMonitorTokenTypeEnum {
  THETA,
  TFUEL
}
registerEnumType(SendTxMonitorTokenTypeEnum, {
  name: 'SendTxMonitorTokenTypeEnum'
})

export enum SendTxMonitorStatusEnum {
  deleted = -1,
  success
}

registerEnumType(SendTxMonitorStatusEnum, { name: 'SendTxMonitorStatusEnum' })
