import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SmartContractEntity, smartContractProtocol } from './smart-contract.entity'
import { MoreThan, Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RankByEnum } from './smart-contract.model'
import { checkTnt20, checkTnt721 } from 'src/helper/utils'
import { NftService } from './nft/nft.service'

const moment = require('moment')
@Injectable()
export class SmartContractService {
  logger = new Logger()
  constructor(
    @InjectRepository(SmartContractEntity)
    private smartContractRepository: Repository<SmartContractEntity>,

    @InjectRepository(SmartContractCallRecordEntity)
    private smartContractRecordRepository: Repository<SmartContractCallRecordEntity>,

    private nftServide: NftService
  ) {}

  async getSmartContract(rankBy: RankByEnum, max: number = 500) {
    switch (rankBy) {
      case RankByEnum.last_seven_days_call_times:
        return await this.smartContractRepository.find({
          // relations: ['record'],
          order: { last_seven_days_call_times: 'DESC' },
          take: max
        })
      case RankByEnum.last_24h_call_times:
        return await this.smartContractRepository.find({
          // relations: ['record'],
          order: { last_24h_call_times: 'DESC' },
          take: max
        })
      default:
        return await this.smartContractRepository.find({
          // relations: ['record'],
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
    receipt: string
  ) {
    const smartContract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    this.logger.debug('timestamp:' + timestamp)
    const smartContractRecord = new SmartContractCallRecordEntity()
    smartContractRecord.timestamp = Number(timestamp)
    smartContractRecord.data = data
    smartContractRecord.receipt = receipt

    if (!smartContract) {
      const smartContract = new SmartContractEntity()
      smartContract.contract_address = contractAddress
      smartContract.call_times = 1
      smartContract.last_24h_call_times = 1
      smartContract.last_seven_days_call_times = 1
      smartContractRecord.smart_contract = await this.smartContractRepository.save(smartContract)
    } else {
      smartContractRecord.smart_contract = smartContract
      smartContract.call_times++
      await this.smartContractRepository.save(smartContract)
    }
    await this.smartContractRecordRepository.save(smartContractRecord)
    if (smartContract.verified && smartContract.protocol === smartContractProtocol.tnt721) {
      await this.nftServide.updateNftRecord(smartContractRecord, smartContract)
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCallTimesByPeriod() {
    let smartContractList = await this.smartContractRepository.find()
    for (const contract of smartContractList) {
      contract.last_24h_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(24, 'hours').unix()),
        smart_contract: contract
      })
      contract.last_seven_days_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(7, 'days').unix()),
        smart_contract: contract
      })
      await this.smartContractRepository.save(contract)
    }
  }

  async verifySmartContract(
    address: string,
    abi: string,
    source_code: string,
    // verification_date: number,
    compiler_version: string,
    optimizer: string,
    optimizerRuns: number,
    name: string,
    function_hash: string,
    constructor_arguments: string
  ) {
    let contract = await this.smartContractRepository.findOne({
      contract_address: address
    })
    if (!contract) {
      contract = new SmartContractEntity()
    }
    contract.verified = true
    if (checkTnt721(JSON.parse(abi))) {
      contract.protocol = smartContractProtocol.tnt721
    } else if (checkTnt20(JSON.parse(abi))) {
      contract.protocol = smartContractProtocol.tnt20
    } else {
      contract.protocol = smartContractProtocol.unknow
    }
    contract.abi = abi
    contract.source_code = source_code
    contract.verification_date = moment().unix()
    contract.compiler_version = compiler_version
    contract.optimizer = optimizer
    contract.optimizerRuns = optimizerRuns
    contract.name = name
    contract.function_hash = function_hash
    contract.constructor_arguments = constructor_arguments
    return await this.smartContractRepository.save(contract)
  }
}
