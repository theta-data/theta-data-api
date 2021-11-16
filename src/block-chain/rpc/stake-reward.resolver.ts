import { ResolveField, ResolveProperty, Resolver } from '@nestjs/graphql'
import { StakeRewardModel } from '../stake/stake.model'
import { TokenBalanceType } from '../wallet/wallet-balance.model'

@Resolver(StakeRewardModel)
export class StakeRewardResolver {
  constructor() {}

  @ResolveField(() => TokenBalanceType, { name: 'last_24_hour' })
  async last_24_hour() {
    return {
      amount: 111,
      fiat_currency_value: {
        cny: 11,
        usd: 211,
        eur: 222
      }
    }
  }
}
