import { Args, Context, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
import { Headers } from '@nestjs/common'

import // GetPendingTransactionsType,
// GetVersionType,
// NodeStatusType,
// ThetaRpcType
'./rpc.model'
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
    // this.logger.debug(
    //   'real ip: ' +
    //     (context.req.headers['x-forwarded-for']
    //       ? context.req.headers['x-forwarded-for'].toString().split(',')[0]
    //       : context.req.connection.remoteAddress)
    // )
    // this.logger.debug('get header')
    // this.logger.debug(context)
    return {}
  }

  @ResolveField(() => GetVersionModel, {
    description: 'This API returns the version of the blockchain software.\n' + '\n'
  })
  async GetVersion() {
    return (await thetaTsSdk.blockchain.getVersion()).result
  }

  @ResolveField()
  async GetAccount(@Args('address', { type: () => GraphQLString! }) address: string) {
    this.logger.debug(
      'get account: ' + JSON.stringify(await thetaTsSdk.blockchain.getAccount(address))
    )
    return (await thetaTsSdk.blockchain.getAccount(address)).result
  }

  @ResolveField()
  async GetBlock(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return (await thetaTsSdk.blockchain.getBlock(hash)).result
  }

  @ResolveField()
  async GetBlockByHeight(@Args('height', { type: () => Int! }) height: number) {
    const res = await thetaTsSdk.blockchain.getBlockByHeight(height.toString())
    this.logger.debug('get block by height: ' + JSON.stringify(res))
    return res.result
  }

  @ResolveField(() => NodeStatusModel, { description: '' })
  async GetStatus() {
    const nodeInfo = await thetaTsSdk.blockchain.getStatus()
    return nodeInfo.result
  }

  @ResolveField()
  async GetTransaction(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    const nodeInfo = await thetaTsSdk.blockchain.getTransaction(hash)
    return nodeInfo.result
  }

  @ResolveField()
  async GetVcpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height)
      height = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
    const nodeInfo = await thetaTsSdk.blockchain.getVcpByHeight(height.toString())
    return nodeInfo.result
  }

  @ResolveField()
  async GetGcpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height)
      height = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
    const nodeInfo = await thetaTsSdk.blockchain.getGcpByHeight(height.toString())
    return nodeInfo.result
  }

  @ResolveField()
  async GetEenpByHeight(@Args('height', { type: () => Int, nullable: true }) height: number) {
    if (!height)
      height = Number(
        (await thetaTsSdk.blockchain.getStatus()).result.latest_finalized_block_height
      )
    const nodeInfo = await thetaTsSdk.blockchain.getEenpByHeight(height.toString())
    // console.log(JSON.stringify(nodeInfo.result))
    return nodeInfo.result
  }

  @ResolveField()
  async GetPendingTransactions() {
    return (await thetaTsSdk.blockchain.getPendingTransactions()).result
  }

  @ResolveField()
  async GetStakeRewardDistributionByHeight(@Args('height', { type: () => Int! }) height: number) {
    return (await thetaTsSdk.blockchain.getStakeRewardDistributionByHeight(height.toString()))
      .result
  }
}
