import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// import { checkTnt721, decodeLogs, readSmartContract } from 'src/helper/utils'
import { Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from '../smart-contract-call-record.entity'
import { SmartContractEntity } from '../smart-contract.entity'
import { NftBalanceEntity, NftStatusEnum } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
import fetch from 'cross-fetch'
import { UtilsService } from 'src/common/utils.service'

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
    private smartContractRepository: Repository<SmartContractEntity>,

    private utilsService: UtilsService
  ) {}

  async parseRecordByContractAddress(contractAddress: string) {
    const contract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    const contractRecord = await this.smartContractCallRecordRepository.find({
      smart_contract: contract
    })
    if (!this.utilsService.checkTnt721(JSON.parse(contract.abi))) {
      console.log('protocol not nft 721')
      return false
    }
    console.log('protocol is tnt 721')
    for (const record of contractRecord) {
      await this.updateNftRecord(record, contract)
    }
  }

  async updateNftRecord(record: SmartContractCallRecordEntity, contract: SmartContractEntity) {
    const helper = require('../../../helper/utils')
    const receipt = JSON.parse(record.receipt)
    if (receipt.Logs[0].data === '') {
      const data = helper.getHex(record.data)
      receipt.Logs[0].data = data
    }
    // console.log('logs', receipt.Logs)
    // console.log('abi', contract.abi)
    const logInfo = this.utilsService.decodeLogs(receipt.Logs, JSON.parse(contract.abi))
    // console.log('logInfo', logInfo)
    if (logInfo[0].decode.eventName === 'Transfer') {
      try {
        const recordHistory = await this.nftTransferRecordRepository.findOne({
          from: logInfo[0].decode.result.from,
          to: logInfo[0].decode.result.to,
          token_id: Number(logInfo[0].decode.result.tokenId),
          smart_contract_address: contract.contract_address,
          timestamp: record.timestamp
        })
        if (!recordHistory) {
          await this.nftTransferRecordRepository.insert({
            from: logInfo[0].decode.result.from,
            to: logInfo[0].decode.result.to,
            token_id: Number(logInfo[0].decode.result.tokenId),
            smart_contract_address: contract.contract_address,
            timestamp: record.timestamp
          })
        }
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

  async updateNftBalance(contract_address: string, from: string, to: string, tokenId: number) {
    const NftRecord = await this.nftBalanceRepository.findOne({
      smart_contract_address: contract_address,
      token_id: tokenId,
      owner: from
    })
    const contractInfo = await this.smartContractRepository.findOne({
      contract_address: contract_address
    })
    const abiInfo = JSON.parse(contractInfo.abi)
    if (!NftRecord) {
      const tokenUri = await this.getTokenUri(contract_address, abiInfo, tokenId)
      const httpRes = await fetch(tokenUri, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (httpRes.status >= 400) {
        throw new Error('Bad response from server')
      }
      const res: any = await httpRes.json()
      await this.nftBalanceRepository.insert({
        smart_contract_address: contract_address,
        owner: to.toLowerCase(),
        from: from.toLowerCase(),
        name: res.name,
        img_uri: res.image,
        detail: JSON.stringify(res),
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
    const res = await this.utilsService.readSmartContract(
      address,
      address,
      abi,
      'contractURI',
      [],
      [],
      ['string']
    )
    return res[0]
  }

  async getBaseTokenUri(address: string, abi: any) {
    const res = await this.utilsService.readSmartContract(
      address,
      address,
      abi,
      'baseTokenURI',
      [],
      [],
      ['string']
    )
    return res[0]
  }

  async getTokenUri(address: string, abi: any, tokenId: number) {
    const res = await this.utilsService.readSmartContract(
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

  async getNftByWalletAddress(address: string) {
    return await this.nftBalanceRepository.find({
      owner: address
    })
  }
}
