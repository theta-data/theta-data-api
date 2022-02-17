import { Args, Query, Resolver } from '@nestjs/graphql'
import { NftType } from './nft.model'
import { NftService } from './nft.service'

@Resolver()
export class NftResolver {
  constructor(private nftService: NftService) {}

  @Query(() => [NftType])
  async Nfts(@Args('wallet_address') walletAddress: string) {
    return await this.nftService.getNftByWalletAddress(walletAddress.toLowerCase())
  }
}
