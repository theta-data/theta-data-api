import { Args, Int, Query, Resolver } from '@nestjs/graphql'
import { RpcService } from './rpc.service'
import { thetaTsSdk } from 'theta-ts-sdk'
import { GraphQLString } from 'graphql'
import { BlockType, GetAccountType, GetTransactionType, GetVersionType } from './rpc.model'
// import { has } from 'config'
thetaTsSdk.blockchain.setUrl('localhost:16888')

@Resolver()
export class RpcResolver {
  constructor(private rpcService: RpcService) {}

  @Query((returns) => GetVersionType)
  async getVersion() {
    return await thetaTsSdk.blockchain.getVersion()
  }

  @Query(() => GetVersionType)
  async getAccount(@Args('address', { type: () => GraphQLString! }) address: string) {
    return await thetaTsSdk.blockchain.getAccount(address)
  }

  @Query(() => BlockType)
  async getBlock(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await thetaTsSdk.blockchain.getBlock(hash)
  }

  @Query(() => BlockType)
  async getBlockByHeight(@Args('height', { type: () => GraphQLString! }) height: number) {
    return await thetaTsSdk.blockchain.getBlockByHeight(height.toString())
  }

  @Query(() => GetTransactionType)
  async getTransaction(@Args('hash', { type: () => GraphQLString! }) hash: string) {
    return await thetaTsSdk.blockchain.getTransaction(hash)
  }
}
