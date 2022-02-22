import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { NftBalanceEntity } from './nft-balance.entity'
import { NftType } from './nft.model'
import { NftService } from './nft.service'

@Resolver(() => NftType)
export class NftResolver {
  constructor(private nftService: NftService) {}

  @Query(() => NftType)
  async Nfts() {
    return {}
  }

  @ResolveField(() => [NftBalanceEntity])
  async Balance(@Args('wallet_address') walletAddress: string) {
    return await this.nftService.getNftByWalletAddress(walletAddress.toLowerCase())
  }

  @ResolveField(() => [NftBalanceEntity])
  async NftsForContract(
    @Args('wallet_address') walletAddress: string,
    @Args('smart_contract_address') contractAddress: string
  ) {}

  @ResolveField(() => [NftBalanceEntity])
  async NftTransfers(@Args('wallet_address') walletAddress: string) {}

  @ResolveField(() => [NftBalanceEntity])
  async NftTransfersByBlock(@Args('block_height', { type: () => Int }) blockHeight: number) {}

  @ResolveField(() => [NftBalanceEntity])
  async AllTokenIds(@Args('smart_contract_address') contractAddress: string) {}

  @ResolveField(() => [NftBalanceEntity])
  async ContractNftTransfers(@Args('smart_contract_address') contractAddress: string) {}

  @ResolveField(() => [NftBalanceEntity])
  async NftOwners(@Args('smart_contract_address') contractAddress: string) {}

  @ResolveField(() => [NftBalanceEntity])
  async TokenIdOwners(@Args('token_id') tokenId: number) {}
}
