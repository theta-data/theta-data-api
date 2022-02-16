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
    optimizer: string,

    @Args({
      name: 'optimizerRuns',
      type: () => Int
    })
    optimizerRuns: number
  ) {
    const downloader = require('../../helper/solcDownloader')
    const solc = require('solc')
    const helper = require('../../helper/utils')
    const fs = require('fs')

    address = helper.normalize(address.toLowerCase())
    optimizerRuns = +optimizerRuns
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200
    try {
      console.log('Verifing the source code and bytecode for address:', address)
      let start = +new Date()
      var input = {
        language: 'Solidity',
        settings: {
          optimizer: {
            enabled: optimizer === '1',
            runs: optimizerRuns
          },
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        },
        sources: {
          'test.sol': {
            content: sourceCode
          }
        }
      }
      // console.log(input)
      var output: any = ''
      console.log(`Loading specific version starts.`)
      console.log(`version: ${version}`)
      const prefix = './libs'
      const fileName = prefix + '/' + versionFullName
      if (!fs.existsSync(fileName)) {
        console.log(`file ${fileName} does not exsit, downloading`)
        await downloader.downloadByVersion(version, './libs')
      } else {
        console.log(`file ${fileName} exsits, skip download process`)
      }
      console.log(`Download solc-js file takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date()
      const solcjs = solc.setupMethods(require('../../.' + fileName))
      console.log(`load solc-js version takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date()
      output = JSON.parse(solcjs.compile(JSON.stringify(input)))
      console.log(`compile takes ${(+new Date() - start) / 1000} seconds`)
      let check: any = {}
      if (output.errors) {
        check = output.errors.reduce((check, err) => {
          if (err.severity === 'warning') {
            if (!check.warnings) check.warnings = []
            check.warnings.push(err.message)
          }
          if (err.severity === 'error') {
            check.error = err.message
          }
          return check
        }, {})
      }
      let data = {}
      let verified = false
      let sc
      if (check.error) {
        console.log(check.error)
        data = { result: { verified: false }, err_msg: check.error }
      } else {
        if (output.contracts) {
          let hexBytecode = helper.getHex(byteCode).substring(2)
          for (var contractName in output.contracts['test.sol']) {
            const byteCode = output.contracts['test.sol'][contractName].evm.bytecode.object
            const deployedBytecode =
              output.contracts['test.sol'][contractName].evm.deployedBytecode.object
            const processed_compiled_bytecode = helper.getBytecodeWithoutMetadata(deployedBytecode)
            const constructor_arguments = hexBytecode.slice(byteCode.length)
            if (
              hexBytecode.indexOf(processed_compiled_bytecode) > -1 &&
              processed_compiled_bytecode.length > 0
            ) {
              verified = true
              let abi = output.contracts['test.sol'][contractName].abi
              const breifVersion = versionFullName.match(/^soljson-(.*).js$/)[1]
              sc = {
                address: address,
                abi: JSON.stringify(abi),
                source_code: helper.stampDate(sourceCode),
                verification_date: +new Date(),
                compiler_version: breifVersion,
                optimizer: optimizer === '1' ? 'enabled' : 'disabled',
                optimizerRuns: optimizerRuns,
                name: contractName,
                function_hash: JSON.stringify(
                  output.contracts['test.sol'][contractName].evm.methodIdentifiers
                ),
                constructor_arguments: constructor_arguments
              }
              await this.smartContractService.verifySmartContract(
                address,
                abi,
                helper.stampDate(sourceCode),
                breifVersion,
                optimizer === '1' ? 'enabled' : 'disabled',
                optimizerRuns,
                contractName,
                JSON.stringify(output.contracts['test.sol'][contractName].evm.methodIdentifiers),
                constructor_arguments
              )
              await this.nftService.parseRecordByContractAddress(address)
              break
            }
          }
        }
        data = { result: { verified }, warning_msg: check.warnings, smart_contract: sc }
        return {
          is_verified: verified,
          smart_contract: sc
        }
      }
      return {
        is_verified: false
      }
      console.log(`Source code verification result: ${verified}, sending back result`)
      // res.status(200
      // ).send(data)
    } catch (e) {
      console.log('Error in catch:', e)
      return {
        is_verified: false
      }
      // res.status(400).send(e)
    }
    // return {
    //   is_verified:
    // }
  }

  @Mutation((returns) => SmartContractVerifyType)
  async verifyWithThetaExplorer(
    @Args({
      name: 'address'
    })
    address: string
  ) {
    const downloader = require('../../helper/solcDownloader')
    const solc = require('solc')
    const helper = require('../../helper/utils')
    const fs = require('fs')
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
    // optimizerRuns = +optimizerRuns
    // if (Number.isNaN(optimizerRuns)) optimizerRuns = 200
    try {
      console.log('Verifing the source code and bytecode for address:', address)
      let start = +new Date()
      var input = {
        language: 'Solidity',
        settings: {
          optimizer: {
            enabled: optimizer,
            runs: optimizerRuns
          },
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        },
        sources: {
          'test.sol': {
            content: sourceCode
          }
        }
      }
      // console.log(input)
      var output: any = ''
      console.log(`Loading specific version starts.`)
      console.log(`version: ${version}`)
      const prefix = './libs'
      const fileName = prefix + '/' + versionFullName
      if (!fs.existsSync(fileName)) {
        console.log(`file ${fileName} does not exsit, downloading`)
        await downloader.downloadByVersion(version, './libs')
      } else {
        console.log(`file ${fileName} exsits, skip download process`)
      }
      console.log(`Download solc-js file takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date()
      const solcjs = solc.setupMethods(require('../../.' + fileName))
      console.log(`load solc-js version takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date()
      console.log('input', input)
      output = JSON.parse(solcjs.compile(JSON.stringify(input)))
      console.log(`compile takes ${(+new Date() - start) / 1000} seconds`)
      let check: any = {}
      // console.log('out put', output)
      if (output.errors) {
        check = output.errors.reduce((check, err) => {
          if (err.severity === 'warning') {
            if (!check.warnings) check.warnings = []
            check.warnings.push(err.message)
          }
          if (err.severity === 'error') {
            check.error = err.message
          }
          return check
        }, {})
      }
      let data = {}
      let verified = false
      let sc
      if (check.error) {
        console.log(check.error)
        data = { result: { verified: false }, err_msg: check.error }
      } else {
        if (output.contracts) {
          let hexBytecode = helper.getHex(byteCode).substring(2)
          // console.log('hex bytecode', hexBytecode)
          for (var contractName in output.contracts['test.sol']) {
            const byteCode = output.contracts['test.sol'][contractName].evm.bytecode.object
            // console.log(contractName, byteCode)
            const deployedBytecode =
              output.contracts['test.sol'][contractName].evm.deployedBytecode.object
            const processed_compiled_bytecode = helper.getBytecodeWithoutMetadata(deployedBytecode)
            const constructor_arguments = hexBytecode.slice(byteCode.length)
            if (
              hexBytecode.indexOf(processed_compiled_bytecode) > -1 &&
              processed_compiled_bytecode.length > 0
            ) {
              verified = true
              let abi = output.contracts['test.sol'][contractName].abi
              const breifVersion = versionFullName.match(/^soljson-(.*).js$/)[1]
              sc = {
                address: address,
                abi: JSON.stringify(abi),
                source_code: helper.stampDate(sourceCode),
                verification_date: +new Date(),
                compiler_version: breifVersion,
                optimizer: res.body.optimizer,
                optimizerRuns: optimizerRuns,
                name: contractName,
                function_hash: JSON.stringify(
                  output.contracts['test.sol'][contractName].evm.methodIdentifiers
                ),
                constructor_arguments: constructor_arguments
              }
              console.log(output.contracts['test.sol'][contractName].evm.methodIdentifiers)
              await this.smartContractService.verifySmartContract(
                address,
                JSON.stringify(abi),
                helper.stampDate(sourceCode),
                breifVersion,
                res.body.optimizer,
                optimizerRuns,
                contractName,
                JSON.stringify(output.contracts['test.sol'][contractName].evm.methodIdentifiers),
                constructor_arguments
              )
              await this.nftService.parseRecordByContractAddress(address)
              break
            }
          }
        }
        data = { result: { verified }, warning_msg: check.warnings, smart_contract: sc }
        return {
          is_verified: verified,
          smart_contract: sc
        }
      }
      return {
        is_verified: false
      }
      console.log(`Source code verification result: ${verified}, sending back result`)
      // res.status(200
      // ).send(data)
    } catch (e) {
      console.log('Error in catch:', e)
      return {
        is_verified: false
      }
      // res.status(400).send(e)
    }
    // return {
    //   is_verified:
    // }
  }
}
