import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
import { ThetaRpcType } from './rpc.model'
import { Logger } from '@nestjs/common'
thetaTsSdk.blockchain.setUrl('http://localhost:16888/rpc')

@Resolver((of) => ThetaRpcType)
export class RpcResolver {
  constructor(private rpcService: RpcService) {}
  private logger = new Logger()

  @Query(() => ThetaRpcType)
  async thetaRpc() {
    return {}
  }

  @ResolveField()
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
}
