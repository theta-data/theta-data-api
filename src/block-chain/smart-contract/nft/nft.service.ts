import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ethers } from 'ethers'
import { checkTnt721, decodeLogs, readSmartContract } from 'src/helper/utils'
import { Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from '../smart-contract-call-record.entity'
import { SmartContractEntity } from '../smart-contract.entity'
import { NftBalanceEntity, NftStatusEnum } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
@Injectable()
export class NftService {
  constructor(
    @InjectRepository(NftTransferRecordEntity)
    private nftTransferRecordRepository: Repository<NftTransferRecordEntity>,

    @InjectRepository(NftBalanceEntity)
    private nftBalanceRepository: Repository<NftBalanceEntity>,

    @InjectRepository(SmartContractCallRecordEntity)
    private smartContractCallRecordRepository: Repository<SmartContractCallRecordEntity>,

    @InjectRepository(SmartContractEntity)
    private smartContractRepository: Repository<SmartContractEntity>
  ) {}

  async parseRecordByContractAddress(contractAddress: string) {
    const contract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    const contractRecord = await this.smartContractCallRecordRepository.find({
      smart_contract: contract
    })
    if (!checkTnt721(JSON.parse(contract.abi))) {
      return false
    }
    for (const record of contractRecord) {
      const receipt = JSON.parse(record.receipt)
      if (receipt.Logs[0].data === '') {
        receipt.Logs[0].data = record.data
      }
      const logInfo = decodeLogs(receipt.Logs, JSON.parse(contract.abi))
      if (logInfo[0].decode.eventName === 'Transfer') {
        try {
          await this.nftTransferRecordRepository.insert({
            from: logInfo[0].decode.result.from,
            to: logInfo[0].decode.result.to,
            token_id: Number(logInfo[0].decode.result.tokenId),
            smart_contract_address: record.smart_contract.contract_address,
            timestamp: record.timestamp
          })
          await this.updateNftBalance(
            contract.contract_address,
            logInfo[0].decode.result.from,
            logInfo[0].decode.result.to,
            Number(logInfo[0].decode.result.tokenId)
          )
        } catch (e) {
          console.log(e)
        }
      }
    }
  }

  async updateNftBalance(contract_address: string, from: string, to: string, tokenId: number) {
    const NftRecord = await this.nftBalanceRepository.findOne({
      smart_contract_address: contract_address,
      token_id: tokenId,
      owner: from
    })
    const contractInfo = await this.smartContractRepository.findOne({
      contract_address: contract_address
    })
    const abiInfo = JSON.stringify(contractInfo.abi)
    if (!NftRecord) {
      await this.nftBalanceRepository.insert({
        smart_contract_address: contract_address,
        owner: to,
        from: from,
        contract_uri: await this.getContractUri(contract_address, abiInfo),
        base_token_uri: await this.getBaseTokenUri(contract_address, abiInfo),
        token_id: tokenId,
        token_uri: await this.getTokenUri(contract_address, abiInfo, tokenId)
        // status: NftStatusEnum.valid
      })
    } else {
      await this.nftBalanceRepository.update(
        {
          smart_contract_address: contract_address,
          owner: from
        },
        {
          owner: to,
          from: from
        }
      )
    }
  }

  async getContractUri(address: string, abi: any) {
    const res = await readSmartContract(address, address, abi, 'contractURI', [], [], ['string'])
    return res[0]
  }

  async getBaseTokenUri(address: string, abi: any) {
    const res = await readSmartContract(address, address, abi, 'baseTokenURI', [], [], ['string'])
    return res[0]
  }

  async getTokenUri(address: string, abi: any, tokenId: number) {
    const res = await readSmartContract(
      address,
      address,
      abi,
      'tokenURI',
      ['uint256'],
      [tokenId],
      ['string']
    )
    return res[0]
  }
}
