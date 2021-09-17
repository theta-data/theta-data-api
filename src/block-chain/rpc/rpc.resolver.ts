import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
// import { has } from 'config'
thetaTsSdk.blockchain.setUrl('localhost:16888')

@Resolver()
export class RpcResolver {
  constructor(private rpcService: RpcService) {}

  @Query()
  async GetVersion() {
    return await thetaTsSdk.blockchain.getVersion()
  }

  @Query()
  async getAccount(@Args('address', { type: () => GraphQLString! }) address: string) {
    return await thetaTsSdk.blockchain.getAccount(address)
  }

  @Query()
  async getBlock(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await thetaTsSdk.blockchain.getBlock(hash)
  }

  @Query()
  async getBlockByHeight(@Args('height', { type: () => GraphQLString! }) height: number) {
    return await thetaTsSdk.blockchain.getBlockByHeight(height.toString())
  }

  @Query()
  async getTransaction(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await thetaTsSdk.blockchain.getTransaction(hash)
  }
}
