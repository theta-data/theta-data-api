import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SmartContractEntity, smartContractProtocol } from './smart-contract.entity'
import { getConnection, MoreThan, Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { RankByEnum } from './smart-contract.model'
import { NftService } from './nft/nft.service'
import { SolcService } from 'src/common/solc.service'
import { UtilsService } from 'src/common/utils.service'
import fetch from 'cross-fetch'

const moment = require('moment')
@Injectable()
export class SmartContractService {
  logger = new Logger()
  constructor(
    @InjectRepository(SmartContractEntity, 'smart_contract')
    private smartContractRepository: Repository<SmartContractEntity>,

    @InjectRepository(SmartContractCallRecordEntity, 'smart_contract')
    private smartContractRecordRepository: Repository<SmartContractCallRecordEntity>,

    private nftService: NftService,

    private solcService: SolcService,

    private utilsService: UtilsService
  ) {}

  async getSmartContract(rankBy: RankByEnum, max: number = 500) {
    switch (rankBy) {
      case RankByEnum.last_seven_days_call_times:
        return await this.smartContractRepository.find({
          order: { last_seven_days_call_times: 'DESC' },
          take: max
        })
      case RankByEnum.last_24h_call_times:
        return await this.smartContractRepository.find({
          order: { last_24h_call_times: 'DESC' },
          take: max
        })
      default:
        return await this.smartContractRepository.find({
          order: { call_times: 'DESC' },
          take: max
        })
    }
  }

  async getSmartContractNum() {
    return await this.smartContractRepository.count()
  }

  async getSmartContractRecord() {
    return await this.smartContractRecordRepository.find()
  }

  async updateSmartContractRecord(
    timestamp: string,
    contractAddress: string,
    data: string,
    receipt: string,
    height: number,
    tansactionHash: string
  ) {
    try {
      await this.smartContractRepository.query(
        `INSERT INTO smart_contract_entity(contract_address,height) VALUES ('${contractAddress}',${height})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1;`
      )
    } catch (e) {
      this.logger.debug('insert smart contract error')
      this.logger.error(e)
    }

    const smartContract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    // this.logger.debug('timestamp:' + timestamp)
    const smartContractRecord = new SmartContractCallRecordEntity()
    smartContractRecord.timestamp = Number(timestamp)
    smartContractRecord.data = data
    smartContractRecord.receipt = receipt
    smartContractRecord.height = height
    smartContractRecord.transaction_hash = tansactionHash
    smartContractRecord.contract_id = smartContract.id
    await this.smartContractRecordRepository.save(smartContractRecord)
    let afftectedNum = 0
    if (smartContract.verified && smartContract.protocol === smartContractProtocol.tnt721) {
      const connection = getConnection('nft').createQueryRunner()
      await connection.connect()
      await connection.startTransaction()
      try {
        const res = await this.nftService.updateNftRecord(
          connection,
          smartContractRecord,
          smartContract
        )
        if (res) afftectedNum++
      } catch (e) {
        this.logger.debug(e)
        await connection.rollbackTransaction()
      } finally {
        await connection.release()
      }
    }

    // }
  }

  async getOrAddSmartContract(contractAddress: string, height: number) {
    await this.smartContractRepository.query(
      `INSERT INTO smart_contract_entity(contract_address,height) VALUES ('${contractAddress}',${height})  ON CONFLICT (contract_address) DO UPDATE set call_times=call_times+1;`
    )
    return await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
  }

  // @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCallTimesByPeriod() {
    let smartContractList = await this.smartContractRepository.find()
    for (const contract of smartContractList) {
      contract.last_24h_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
        contract_id: contract.id
      })
      contract.last_seven_days_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(7, 'days').unix()),
        contract_id: contract.id
      })
      await this.smartContractRepository.save(contract)
    }
  }

  async verifySmartContract(
    address: string,
    // abi: string,
    sourceCode: string,
    byteCode: string,
    version: string,
    versionFullName: string,
    optimizer: boolean,
    optimizerRuns: number
  ) {
    let contract = await this.smartContractRepository.findOne({
      contract_address: address
    })
    if (!contract) {
      contract = new SmartContractEntity()
      contract.contract_address = address
      contract = await this.smartContractRepository.save(contract)
    } else {
      if (contract.verified) return contract
    }

    // const downloader = require('../../helper/solcDownloader')
    const solc = require('solc')
    // const helper = require('../../helper/utils')
    const fs = require('fs')

    address = this.utilsService.normalize(address.toLowerCase())
    optimizerRuns = +optimizerRuns
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200
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
        await this.solcService.downloadByVersion(version, './libs')
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
      if (check.error) {
        console.log(check.error)
        data = { result: { verified: false }, err_msg: check.error }
      } else {
        if (output.contracts) {
          let hexBytecode = this.utilsService.getHex(byteCode).substring(2)
          for (var contractName in output.contracts['test.sol']) {
            const byteCode = output.contracts['test.sol'][contractName].evm.bytecode.object
            const deployedBytecode =
              output.contracts['test.sol'][contractName].evm.deployedBytecode.object
            const processed_compiled_bytecode =
              this.utilsService.getBytecodeWithoutMetadata(deployedBytecode)
            const constructor_arguments = hexBytecode.slice(byteCode.length)
            if (
              hexBytecode.indexOf(processed_compiled_bytecode) > -1 &&
              processed_compiled_bytecode.length > 0
            ) {
              let abi = output.contracts['test.sol'][contractName].abi
              const breifVersion = versionFullName.match(/^soljson-(.*).js$/)[1]
              contract.verified = true
              contract.byte_code = byteCode
              if (this.utilsService.checkTnt721(abi)) {
                contract.protocol = smartContractProtocol.tnt721
              } else if (this.utilsService.checkTnt20(abi)) {
                contract.protocol = smartContractProtocol.tnt20
              } else {
                contract.protocol = smartContractProtocol.unknow
              }
              // contract.contract_address
              contract.abi = JSON.stringify(abi)
              contract.source_code = this.utilsService.stampDate(sourceCode)
              contract.verification_date = moment().unix()
              contract.compiler_version = breifVersion
              contract.optimizer = optimizer === true ? 'enabled' : 'disabled'
              contract.optimizerRuns = optimizerRuns
              contract.name = contractName
              contract.function_hash = JSON.stringify(
                output.contracts['test.sol'][contractName].evm.methodIdentifiers
              )
              contract.constructor_arguments = constructor_arguments
              await this.smartContractRepository.save(contract)
              console.log('save smart contract')
              // await this.nftService.parseRecordByContractAddress(address)
              // return contract
              break
            }
          }
        }
      }
      return contract
    } catch (e) {
      console.log('Error in catch:', e)
      return contract
    }
  }

  async getVerifyInfo(
    address: string,
    // abi: string,
    sourceCode: string,
    byteCode: string,
    version: string,
    versionFullName: string,
    optimizer: boolean,
    optimizerRuns: number
  ) {
    const solc = require('solc')
    // const helper = require('../../helper/utils')
    const fs = require('fs')

    address = this.utilsService.normalize(address.toLowerCase())
    optimizerRuns = +optimizerRuns
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200
    // try {
    // console.log('Verifing the source code and bytecode for address:', address)
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
    // console.log(`Loading specific version starts.`)
    // console.log(`version: ${version}`)
    const prefix = './libs'
    const fileName = prefix + '/' + versionFullName
    if (!fs.existsSync(fileName)) {
      this.logger.debug(`file ${fileName} does not exsit, downloading`)
      await this.solcService.downloadByVersion(version, './libs')
    } else {
      this.logger.debug(`file ${fileName} exsits, skip download process`)
    }
    this.logger.debug(`Download solc-js file takes: ${(+new Date() - start) / 1000} seconds`)
    start = +new Date()
    const solcjs = solc.setupMethods(require('../../.' + fileName))
    this.logger.debug(`load solc-js version takes: ${(+new Date() - start) / 1000} seconds`)
    start = +new Date()
    // console.log('input', input)
    output = JSON.parse(solcjs.compile(JSON.stringify(input)))
    this.logger.debug(`compile takes ${(+new Date() - start) / 1000} seconds`)
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
    // let data = {}
    const contract: any = {}
    if (check.error) {
      this.logger.error(check.error)
      return false
      // data = { result: { verified: false }, err_msg: check.error }
    } else {
      if (output.contracts) {
        let hexBytecode = this.utilsService.getHex(byteCode).substring(2)
        for (var contractName in output.contracts['test.sol']) {
          const byteCode = output.contracts['test.sol'][contractName].evm.bytecode.object
          const deployedBytecode =
            output.contracts['test.sol'][contractName].evm.deployedBytecode.object
          const processed_compiled_bytecode =
            this.utilsService.getBytecodeWithoutMetadata(deployedBytecode)
          const constructor_arguments = hexBytecode.slice(byteCode.length)
          if (
            hexBytecode.indexOf(processed_compiled_bytecode) > -1 &&
            processed_compiled_bytecode.length > 0
          ) {
            let abi = output.contracts['test.sol'][contractName].abi
            const breifVersion = versionFullName.match(/^soljson-(.*).js$/)[1]
            contract.verified = true
            contract.byte_code = byteCode
            if (this.utilsService.checkTnt721(abi)) {
              contract.protocol = smartContractProtocol.tnt721
              this.logger.debug('read 721  contract uri,address:' + address)
              const contractUri = abi.find((v) => v.name == 'contractURI')
              if (contractUri) {
                const res = await this.utilsService.readSmartContract(
                  address,
                  address,
                  abi,
                  'contractURI',
                  [],
                  [],
                  ['string']
                )
                this.logger.debug('contract uri:' + res[0])
                contract.contract_uri = res[0]
                if (res[0]) {
                  // const contractUri: string = res[0]
                  const httpRes = await fetch(res[0], {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  })
                  if (httpRes.status >= 400) {
                    this.logger.error('Fetch contract uri: Bad response from server')
                    contract.contract_uri_detail = ''
                    contract.name = contractName
                    // throw new Error('Bad response from server')
                  } else {
                    const jsonRes: any = await httpRes.json()

                    contract.contract_uri_detail = JSON.stringify(jsonRes)
                    contract.name = jsonRes.name
                  }
                }
              }
              const name = abi.find((v) => v.name == 'name')
              if (name) {
                const res = await this.utilsService.readSmartContract(
                  address,
                  address,
                  abi,
                  'name',
                  [],
                  [],
                  ['string']
                )
                this.logger.debug('get name:' + JSON.stringify(res))
                if (res[0]) {
                  contract.name = res[0]
                }
              }
            } else if (this.utilsService.checkTnt20(abi)) {
              contract.protocol = smartContractProtocol.tnt20
              contract.name = contractName
            } else {
              contract.protocol = smartContractProtocol.unknow
              contract.name = contractName
            }
            // contract.contract_address
            contract.abi = JSON.stringify(abi)
            contract.source_code = this.utilsService.stampDate(sourceCode)
            contract.verification_date = moment().unix()
            contract.compiler_version = breifVersion
            contract.optimizer = optimizer === true ? 'enabled' : 'disabled'
            contract.optimizerRuns = optimizerRuns
            contract.function_hash = JSON.stringify(
              output.contracts['test.sol'][contractName].evm.methodIdentifiers
            )
            contract.constructor_arguments = constructor_arguments
            return contract
          }
        }
      }
    }
    // return contract
    // } catch (e) {
    //   this.logger.error('Error in catch:' + e)
    //   return false
    //   // return contract
    // }
  }
}
