import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SmartContractEntity } from './smart-contract.entity'
import { Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from './smart-contract-call-record.entity'

@Injectable()
export class SmartContractService {
  constructor(
    @InjectRepository(SmartContractEntity)
    private smartContractRepository: Repository<SmartContractEntity>,

    @InjectRepository(SmartContractCallRecordEntity)
    private smartContractRecordRepository: Repository<SmartContractCallRecordEntity>
  ) {}

  async getSmartContract() {
    return await this.smartContractRecordRepository.find()
  }

  async getSmartContractRecord() {
    return await this.smartContractRecordRepository.find()
  }

  async updateSmartContractRecord() {}
}
