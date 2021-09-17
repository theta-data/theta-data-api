import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
import { BlockType, GetAccountType, GetTransactionType, GetVersionType } from './rpc.model'
// import { has } from 'config'
thetaTsSdk.blockchain.setUrl('http://localhost:16888/rpc')

@Resolver()
export class RpcResolver {
  constructor(private rpcService: RpcService) {}

  @Query((returns) => GetVersionType)
  async getVersion() {
    return (await thetaTsSdk.blockchain.getVersion()).result
  }

  @Query(() => GetVersionType)
  async getAccount(@Args('address', { type: () => GraphQLString! }) address: string) {
    return (await thetaTsSdk.blockchain.getAccount(address)).result
  }

  @Query(() => BlockType)
  async getBlock(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return (await thetaTsSdk.blockchain.getBlock(hash)).result
  }

  @Query(() => BlockType)
  async getBlockByHeight(@Args('height', { type: () => Int! }) height: number) {
    return (await thetaTsSdk.blockchain.getBlockByHeight(height.toString())).result
  }

  @Query(() => GetTransactionType)
  async getTransaction(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return (await thetaTsSdk.blockchain.getTransaction(hash)).result
  }
}
