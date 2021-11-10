import { BalanceModel } from './wallet-balance.model'
import { ObjectType } from '@nestjs/graphql'

@ObjectType()
export class WalletModel {
  balance: BalanceModel
}
