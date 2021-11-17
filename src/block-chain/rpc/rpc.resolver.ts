import { Args, Context, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
import { Logger } from '@nestjs/common'
import { GetVersionModel, NodeStatusModel, ThetaRpcModel } from './rpc.model'
const config = require('config')

@Resolver((of) => ThetaRpcModel)
export class RpcResolver {
  constructor(private rpcService: RpcService) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }
  private logger = new Logger()

  @Query(() => ThetaRpcModel)
  async ThetaRpc(@Context() context) {
    return {}
  }

  @ResolveField(() => GetVersionModel, {
    description: 'This API returns the version of the blockchain software.\n' + '\n'
  })
  async GetVersion() {
    return await this.rpcService.getVersion()
  }

  @ResolveField()
  async GetAccount(@Args('address', { type: () => GraphQLString! }) address: string) {
    return await this.rpcService.getAccount(address)
  }

  @ResolveField()
  async GetBlock(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await this.rpcService.getAccountByHash(hash)
  }

  @ResolveField()
  async GetBlockByHeight(@Args('height', { type: () => Int! }) height: number) {
    return await this.rpcService.getBlockByHeight(height)
  }

  @ResolveField(() => NodeStatusModel, { description: '' })
  async GetStatus() {
    return await this.rpcService.getStatus()
  }

  @ResolveField()
  async GetTransaction(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await this.rpcService.getTransactionByHash(hash)
  }

  @ResolveField()
  async GetVcpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height) height = Number((await this.rpcService.getStatus()).latest_finalized_block_height)
    return await this.rpcService.getVcpByHeight(height)
  }

  @ResolveField()
  async GetGcpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height) height = Number((await this.rpcService.getStatus()).latest_finalized_block_height)
    return await this.rpcService.getGcpByHeight(height)
  }

  @ResolveField()
  async GetEenpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height) height = Number((await this.rpcService.getStatus()).latest_finalized_block_height)
    return await this.rpcService.getEenpByHeight(height)
  }

  @ResolveField()
  async GetPendingTransactions() {
    return await this.rpcService.getPendingTransactions()
  }

  @ResolveField()
  async GetStakeRewardDistributionByHeight(
    @Args('height', { type: () => Int, nullable: true }) height: number
  ) {
    if (!height) height = Number((await this.rpcService.getStatus()).latest_finalized_block_height)
    return await this.rpcService.getStakeRewardDistributionByHeight(height)
  }
}
