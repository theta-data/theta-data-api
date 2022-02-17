import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { SmartContractService } from './smart-contract.service'
import {
  RankByEnum,
  SmartContractStatisticsType,
  SmartContractVerifyType
} from './smart-contract.model'
import { GraphQLInt } from 'graphql'
import { NftService } from './nft/nft.service'
import fetch from 'cross-fetch'

@Resolver(() => SmartContractStatisticsType)
export class SmartContractResolver {
  constructor(private smartContractService: SmartContractService, private nftService: NftService) {}

  @Query(() => SmartContractStatisticsType)
  async SmartContractStatistics() {
    return {}
  }

  @ResolveField()
  async CallRank(
    @Parent() smartContract: SmartContractStatisticsType,
    @Args('rank_by', { type: () => RankByEnum, nullable: true }) rank_by: RankByEnum,
    @Args('take', { type: () => GraphQLInt, nullable: false, defaultValue: 500 }) take: number
  ) {
    return await this.smartContractService.getSmartContract(rank_by, take)
  }

  @Mutation((returns) => SmartContractVerifyType)
  async verify(
    @Args({
      name: 'address'
    })
    address: string,
    @Args({
      name: 'sourceCode'
    })
    sourceCode: string,
    @Args({
      name: 'byteCode'
    })
    byteCode: string,
    @Args({
      name: 'version'
    })
    version: string,
    @Args({
      name: 'versionFullName'
    })
    versionFullName: string,

    @Args({
      name: 'optimizer'
    })
    optimizer: boolean,

    @Args({
      name: 'optimizerRuns',
      type: () => Int
    })
    optimizerRuns: number
  ) {
    return await this.smartContractService.verifySmartContract(
      address,
      sourceCode,
      byteCode,
      version,
      versionFullName,
      optimizer,
      optimizerRuns
    )
  }

  @Mutation((returns) => SmartContractVerifyType)
  async verifyWithThetaExplorer(
    @Args({
      name: 'address'
    })
    address: string
  ) {
    // const downloader = require('../../helper/solcDownloader')
    // const solc = require('solc')
    const helper = require('../../helper/utils')
    // const fs = require('fs')
    const httpRes = await fetch(
      'https://explorer.thetatoken.org:8443/api/smartcontract/' + address,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    if (httpRes.status >= 400) {
      throw new Error('Bad response from server')
    }
    const res: any = await httpRes.json()
    console.log('theta explorer res optimizer ', res.body.optimizer)
    const optimizer = res.body.optimizer === 'disabled' ? false : true
    console.log('optimizer', optimizer)
    const optimizerRuns = res.body.optimizerRuns ? res.body.optimizerRuns : 200
    const sourceCode = res.body.source_code
    const version = res.body.compiler_version.match(/[\d,\.]+/g)[0]
    const versionFullName = 'soljson-' + res.body.compiler_version + '.js'
    const byteCode = res.body.bytecode

    address = helper.normalize(address.toLowerCase())
    return await this.smartContractService.verifySmartContract(
      address,
      sourceCode,
      byteCode,
      version,
      versionFullName,
      optimizer,
      optimizerRuns
    )
  }
}
