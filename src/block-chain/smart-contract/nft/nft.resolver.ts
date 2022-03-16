import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { buffer } from 'stream/consumers'
import { SmartContractEntity } from '../smart-contract.entity'
import { NftBalanceEntity } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
import { NftMetaType, NftType, PaginatedNftBalance } from './nft.model'
import { NftService } from './nft.service'

@Resolver(() => NftType)
export class NftResolver {
  constructor(private nftService: NftService) {}

  @Query(() => NftType)
  async Nfts() {
    return {}
  }

  @ResolveField(() => [SmartContractEntity], { nullable: true })
  async SearchNfts(@Args('name') name: string) {
    return await this.nftService.findNftsByName(name)
  }

  @ResolveField(() => PaginatedNftBalance)
  async Balance(
    @Args('wallet_address') walletAddress: string,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
    @Args('after', { nullable: true }) after: string
  ) {
    const [hasNextPage, totalNumber, res] = await this.nftService.getNftByWalletAddress(
      walletAddress.toLowerCase(),
      take,
      after
    )
    let endCursor = ''
    if (res.length > 0) {
      // this.console.log();
      console.log(res[res.length - 1].create_date)
      endCursor = Buffer.from(res[res.length - 1].create_date.toISOString()).toString('base64')
    }
    return {
      endCursor: endCursor,
      hasNextPage: hasNextPage,
      nodes: res,
      totalCount: totalNumber
    }
  }

  @ResolveField(() => [NftBalanceEntity], { nullable: true })
  async NftsForContract(
    @Args('wallet_address') walletAddress: string,
    @Args('smart_contract_address') contractAddress: string
  ) {
    return await this.nftService.getNftsForContract(
      walletAddress.toLowerCase(),
      contractAddress.toLowerCase()
    )
  }

  @ResolveField(() => [NftTransferRecordEntity])
  async NftTransfers(@Args('wallet_address') walletAddress: string) {
    return await this.nftService.getNftTransfersByWallet(walletAddress.toLowerCase())
  }

  @ResolveField(() => [NftTransferRecordEntity])
  async NftTransfersByBlock(@Args('block_height', { type: () => Int }) blockHeight: number) {
    return await this.nftService.getNftTransfersForBlockHeight(blockHeight)
  }

  @ResolveField(() => [NftBalanceEntity])
  async NftOwners(@Args('smart_contract_address') contractAddress: string) {
    return await this.nftService.getNftsBySmartContractAddress(contractAddress.toLowerCase())
  }

  @ResolveField(() => [NftTransferRecordEntity])
  async ContractNftTransfers(@Args('smart_contract_address') contractAddress: string) {
    return await this.nftService.getNftTransfersForSmartContract(contractAddress.toLowerCase())
  }
  // @ResolveField(() => [NftBalanceEntity])
  // async NftOwners(@Args('smart_contract_address') contractAddress: string) {}

  @ResolveField(() => NftBalanceEntity)
  async TokenIdOwners(
    @Args('token_id') tokenId: number,
    @Args('contract_adress') contractAddress: string
  ) {
    return await this.nftService.getNftByTokenId(tokenId, contractAddress.toLowerCase())
  }

  @ResolveField(() => NftMetaType)
  async Meta(@Args('smart_contract_address') contractAddress: string): Promise<NftMetaType> {
    // const uniqueHolder = await this.nftService.uniqueHolders(contractAddress.toLowerCase())
    const [totalAmount, uniqueHolder] = await this.nftService.totalAmount(contractAddress)
    return { unique_holder: uniqueHolder, total: totalAmount }
  }
}
