import { ExplorerService } from './explorer.service'
import {
  ExplorerModelType,
  ExplorerSearchModelType,
  PaginatedBlockList,
  PaginatedTransactions,
  SEARCH_TYPE_ENUM
} from './explorer.model'
import { Args, Context, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'
import { RpcService } from '../rpc/rpc.service'

@Resolver((of) => ExplorerModelType)
export class ExplorerResolver {
  constructor(private explorerService: ExplorerService, private rpcService: RpcService) {}

  @Query(() => ExplorerModelType)
  async Explorer(@Context() context) {
    return {}
  }

  @ResolveField(() => PaginatedBlockList)
  async blockList(
    @Args('take', { type: () => GraphQLInt, defaultValue: 10 }) take: number,
    @Args('after', { nullable: true }) after: string,
    @Args('skip', { type: () => GraphQLInt, defaultValue: 0 }) skip: number
  ) {
    const [hasNextPage, totalNumber, res] = await this.explorerService.getBlockList(
      take,
      after,
      skip
    )
    let endCursor = ''
    if (res.length > 0) {
      // this.console.log();
      console.log(res[res.length - 1].height.toString())
      endCursor = Buffer.from(res[res.length - 1].height.toString()).toString('base64')
    }
    return {
      endCursor: endCursor,
      hasNextPage: hasNextPage,
      nodes: res,
      skip: skip,
      totalCount: totalNumber
    }
  }

  @ResolveField(() => PaginatedTransactions)
  async transactions(
    @Args('take', { type: () => GraphQLInt, defaultValue: 10 }) take: number,
    @Args('block_height', { type: () => GraphQLInt, defaultValue: 0, nullable: true })
    blockHeight: number,
    @Args('after', { nullable: true }) after: string,
    @Args('skip', { type: () => GraphQLInt, defaultValue: 0 }) skip: number
  ) {
    const [hasNextPage, totalNumber, res] = await this.explorerService.getTransactions(
      take,
      after,
      skip,
      blockHeight
    )
    console.log('get transactions nun', res.length)
    let endCursor = ''
    if (res.length > 0) {
      // this.console.log();
      console.log(res[res.length - 1].id.toString())
      endCursor = Buffer.from(res[res.length - 1].id.toString()).toString('base64')
    }
    return {
      endCursor: endCursor,
      hasNextPage: hasNextPage,
      nodes: res,
      skip: skip,
      totalCount: totalNumber
    }
  }

  @ResolveField(() => ExplorerSearchModelType)
  async search(@Args('search') search: string) {
    const blockInfo = await this.explorerService.getBlockInfo(search)
    if (blockInfo) {
      const res = await this.rpcService.getBlockByHeight(blockInfo.height)
      return { block: res, block_extend: blockInfo, search_type: SEARCH_TYPE_ENUM.block }
    }
    const transactionInfo = await this.rpcService.getTransactionByHash(search)
    if (transactionInfo) {
      return {
        transaction: transactionInfo,
        search_type: SEARCH_TYPE_ENUM.transaction
      }
    }
    return {}
  }
}
