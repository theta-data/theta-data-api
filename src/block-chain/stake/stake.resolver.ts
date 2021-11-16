import { Args, Info, Parent, Query, ResolveField, ResolveProperty, Resolver } from '@nestjs/graphql'
import { StakeService } from './stake.service'
import { STAKE_NODE_TYPE_ENUM } from './stake.entity'
import { StakeStatisticsEntity } from './stake-statistics.entity'
import { Logger } from '@nestjs/common'
import { StakeRewardModel } from './stake.model'
import { fieldsList, fieldsMap } from 'graphql-fields-list'
import { GraphQLString } from 'graphql'
import { MarketService } from '../../market/market.service'
import { WalletService } from '../wallet/wallet.service'

@Resolver(() => StakeStatisticsEntity)
export class StakeResolver {
  logger = new Logger()

  constructor(
    private stakeService: StakeService,
    private marketInfo: MarketService,
    private walletService: WalletService
  ) {}

  @Query(() => StakeStatisticsEntity)
  async StakeStatistics() {
    return await this.stakeService.getLatestStakeStatics()
  }

  // @Resolver('stake_reward')
  // @ResolveField(() => StakeRewardModel, { name: 'stake_reward' })
  async stake_reward(
    @Info() info,
    @Args('wallet_address', { type: () => GraphQLString! }) wallet_address: string
  ) {
    console.log(fieldsList(info))
    const reward = new StakeRewardModel()
    const thetaFuelMarketInfo = await this.marketInfo.getThetaFuelMarketInfo()

    for (const field of fieldsList(info)) {
      //@ts-ignore
      const rewardAmount = await this.stakeService.getStakeReward(wallet_address, field)
      reward[field] = {
        amount: rewardAmount,
        fiat_currency_value: {
          usd: thetaFuelMarketInfo.price * rewardAmount,
          cny:
            thetaFuelMarketInfo.price * rewardAmount * (await this.walletService.getUsdRate()).CNY,
          eur:
            thetaFuelMarketInfo.price * rewardAmount * (await this.walletService.getUsdRate()).EUR
        }
      }
    }
    return reward
    // return new StakeRewardModel()
  }

  // @ResolveField('stake_reward.last_24_hour')
  // async last_24_hour() {}
}
