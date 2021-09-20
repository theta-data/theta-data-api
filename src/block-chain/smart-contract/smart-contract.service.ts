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
    return await this.smartContractRepository.find({
      relations: ['record']
    })
  }

  async getSmartContractRecord() {
    return await this.smartContractRecordRepository.find()
  }

  async updateSmartContractRecord(timestamp: string, contractAddress) {
    let smartContract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    if (!smartContract) {
      await this.smartContractRepository.insert({
        contract_address: contractAddress,
        call_times: 1,
        record: [
          {
            timestamp: timestamp
          }
        ]
      })
    } else {
      let contractRecord = new SmartContractCallRecordEntity()
      smartContract.record.push(contractRecord)
      contractRecord.timestamp = timestamp
      await this.smartContractRepository.update(
        {
          contract_address: contractAddress
        },
        {
          call_times: smartContract.call_times + 1,
          record: smartContract.record
        }
      )
    }
  }
}
