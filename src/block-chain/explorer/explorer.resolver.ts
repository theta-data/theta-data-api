import { ExplorerService } from './explorer.service'
import { ExplorerModelType, PaginatedBlockList, PaginatedTransactions } from './explorer.model'
import { Args, Context, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { GraphQLInt } from 'graphql'

@Resolver((of) => ExplorerModelType)
export class ExplorerResolver {
  constructor(private explorerService: ExplorerService) {}

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
    @Args('after', { nullable: true }) after: string,
    @Args('skip', { type: () => GraphQLInt, defaultValue: 0 }) skip: number
  ) {
    const [hasNextPage, totalNumber, res] = await this.explorerService.getTransactions(
      take,
      after,
      skip
    )
    console.log('get transactions nun', res.length)
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
}
