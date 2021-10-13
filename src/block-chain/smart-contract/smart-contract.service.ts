import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SmartContractEntity } from './smart-contract.entity'
import { MoreThan, Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'
import { Cron, CronExpression } from '@nestjs/schedule'
import { thetaTsSdk } from 'theta-ts-sdk'
const moment = require('moment')
@Injectable()
export class SmartContractService {
  logger = new Logger()
  constructor(
    @InjectRepository(SmartContractEntity)
    private smartContractRepository: Repository<SmartContractEntity>,

    @InjectRepository(SmartContractCallRecordEntity)
    private smartContractRecordRepository: Repository<SmartContractCallRecordEntity>
  ) {}

  async getSmartContract(max: number = 500) {
    return await this.smartContractRepository.find({
      relations: ['record'],
      order: {
        call_times: 'DESC'
      },
      take: max
    })
  }

  async getSmartContractNum() {
    return await this.smartContractRepository.count()
  }

  async getSmartContractRecord() {
    return await this.smartContractRecordRepository.find()
  }

  async updateSmartContractRecord(timestamp: string, contractAddress: string) {
    let smartContract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    this.logger.debug('timestamp:' + timestamp)
    if (!smartContract) {
      let smartContract = new SmartContractEntity()
      smartContract.contract_address = contractAddress
      smartContract.call_times = 1
      smartContract.last_24h_call_times = 1
      smartContract.last_seven_days_call_times = 1
      let smartContractRecord = new SmartContractCallRecordEntity()
      smartContractRecord.timestamp = moment(Number(timestamp) * 1000).format('YYYY-MM-DD HH:MM:SS')
      smartContractRecord.smart_contract = await this.smartContractRepository.save(smartContract)
      await this.smartContractRecordRepository.save(smartContractRecord)
    } else {
      let contractRecord = new SmartContractCallRecordEntity()
      // smartContract.record.push(contractRecord)
      contractRecord.timestamp = moment(Number(timestamp) * 1000).format('YYYY-MM-DD HH:MM:SS')
      contractRecord.smart_contract = smartContract
      smartContract.call_times++
      await this.smartContractRecordRepository.save(contractRecord)
      await this.smartContractRepository.save(smartContract)
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateCallTimesByPeriod() {
    let smartContractList = await this.smartContractRepository.find()
    for (const contract of smartContractList) {
      contract.last_24h_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(24, 'hours').format())
      })
      contract.last_seven_days_call_times = await this.smartContractRecordRepository.count({
        timestamp: MoreThan(moment().subtract(7, 'days').format())
      })
      await this.smartContractRepository.save(contract)
    }
  }
}
