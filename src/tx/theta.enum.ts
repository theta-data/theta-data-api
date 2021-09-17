import { registerEnumType } from '@nestjs/graphql'

export enum THETA_TX_TYPE_ENUM {
  coin_base_tx,
  slash_tx,
  send_tx,
  reserve_fund_tx,
  release_fund_tx,
  service_payment_tx,
  split_rule_tx,
  deposit_stake_tx,
  withdraw_stake_tx,
  smart_contract_tx
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
