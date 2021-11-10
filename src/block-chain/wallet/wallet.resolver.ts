import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { WalletModel } from './wallet.model'
import { assertWrappingType, GraphQLString } from 'graphql'
import { BalanceModel } from './wallet-balance.model'
import { WalletService } from './wallet.service'

@Resolver(() => WalletModel)
export class WalletResolver {
  constructor(private walletService: WalletService) {}
  @Query(() => WalletModel)
  Wallet() {
    return {}
  }

  @ResolveField(() => BalanceModel)
  async balance(@Args('wallet_address', { type: () => GraphQLString! }) wallet_address: string) {
    // console.log(await this.walletService.getALlBalance(wallet_address))
    const resInfo = await this.walletService.getALlBalance(wallet_address.toLocaleLowerCase())
    console.log(resInfo.total)
    return resInfo
  }
}
