import { registerEnumType } from '@nestjs/graphql'

export enum THETA_TX_TYPE_ENUM {
  TxCoinbase,
  TxSlash,
  TxSend,
  TxReserveFund,
  TxReleaseFund,
  TxServicePayment,
  TxSplitRule,
  TxSmartContract,
  TxDepositStake,
  TxWithdrawStake,
  TxDepositStakeV2,
  TxStakeRewardDistribution
}
registerEnumType(THETA_TX_TYPE_ENUM, { name: 'THETA_TX_TYPE_ENUM' })

export enum THETA_BLOCK_STATUS_ENUM {
  pending,
  valid,
  invalid,
  committed,
  directly_finalized,
  indirectly_finalized,
  trusted
}
registerEnumType(THETA_BLOCK_STATUS_ENUM, { name: 'THETA_BLOCK_STATUS_ENUM' })
