import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// import { checkTnt721, decodeLogs, readSmartContract } from 'src/helper/utils'
import { getConnection, MoreThan, Repository } from 'typeorm'
import { SmartContractCallRecordEntity } from '../smart-contract-call-record.entity'
import { SmartContractEntity } from '../smart-contract.entity'
import { NftBalanceEntity, NftStatusEnum } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
import fetch from 'cross-fetch'
import { UtilsService } from 'src/common/utils.service'
import { orderBy } from 'lodash'
// import { Logger } from 'ethers/lib/utils'
// import { add } from 'lodash'

@Injectable()
export class NftService {
  logger = new Logger('nft service')
  constructor(
    @InjectRepository(NftTransferRecordEntity, 'nft')
    private nftTransferRecordRepository: Repository<NftTransferRecordEntity>,

    @InjectRepository(NftBalanceEntity, 'nft')
    private nftBalanceRepository: Repository<NftBalanceEntity>,

    @InjectRepository(SmartContractCallRecordEntity, 'smart_contract')
    private smartContractCallRecordRepository: Repository<SmartContractCallRecordEntity>,

    @InjectRepository(SmartContractEntity, 'smart_contract')
    private smartContractRepository: Repository<SmartContractEntity>,

    private utilsService: UtilsService
  ) {}

  async parseRecordByContractAddress(contractAddress: string): Promise<number> {
    const contract = await this.smartContractRepository.findOne({
      contract_address: contractAddress
    })
    if (!this.utilsService.checkTnt721(JSON.parse(contract.abi))) {
      this.logger.debug('protocol not nft 721')
      return 0
    }
    const nftRecord = await this.nftTransferRecordRepository.findOne({
      where: { smart_contract_address: contract.contract_address },
      order: { timestamp: 'DESC' }
    })
    const condition: any = {
      where: { contract_id: contract.id },
      order: { timestamp: 'ASC' }
    }
    if (nftRecord) {
      condition['where']['timestamp'] = MoreThan(nftRecord.timestamp)
    }
    const contractRecord = await this.smartContractCallRecordRepository.find(condition)

    this.logger.debug('protocol is tnt 721')
    for (const record of contractRecord) {
      await this.updateNftRecord(record, contract)
    }
    return contractRecord.length
  }

  async updateNftRecord(record: SmartContractCallRecordEntity, contract: SmartContractEntity) {
    const receipt = JSON.parse(record.receipt)
    if (receipt.Logs[0].data === '') {
      const data = this.utilsService.getHex(record.data)
      receipt.Logs[0].data = data
    }
    const logInfo = this.utilsService.decodeLogs(receipt.Logs, JSON.parse(contract.abi))
    if (logInfo[0].decode.eventName === 'Transfer') {
      const connection = getConnection('nft').createQueryRunner()
      await connection.connect()
      await connection.startTransaction()
      try {
        await connection.manager.upsert(
          NftTransferRecordEntity,
          {
            from: logInfo[0].decode.result.from,
            to: logInfo[0].decode.result.to,
            token_id: Number(logInfo[0].decode.result.tokenId),
            smart_contract_address: contract.contract_address,
            timestamp: record.timestamp
          },
          ['smart_contract_address', 'token_id', 'timestamp']
        )
        await connection.manager.upsert(
          NftBalanceEntity,
          {
            smart_contract_address: contract.contract_address,
            owner: logInfo[0].decode.result.to.toLowerCase(),
            from: logInfo[0].decode.result.from.toLowerCase(),
            token_id: Number(logInfo[0].decode.result.tokenId)
          },
          ['smart_contract_address', 'token_id']
        )
        await connection.commitTransaction()
      } catch (e) {
        connection.rollbackTransaction()
        this.logger.debug(e)
      } finally {
        connection.release()
      }
    }
  }

  async updateNftBalance(contract_address: string, from: string, to: string, tokenId: number) {
    await this.nftBalanceRepository.upsert(
      {
        smart_contract_address: contract_address,
        owner: to.toLowerCase(),
        from: from.toLowerCase(),
        token_id: tokenId
      },
      ['smart_contract_address', 'token_id']
    )
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
    this.logger.debug('address: ' + address)
    const nftList = await this.nftBalanceRepository.find({
      owner: address
    })
    this.logger.debug('nft length  :' + nftList.length)
    return await this.checkSources(nftList)
  }

  async getNftsBySmartContractAddress(address: string) {
    return await this.checkSources(
      await this.nftBalanceRepository.find({
        smart_contract_address: address
      })
    )
  }

  async getNftTransfersForSmartContract(contractAddress: string) {
    return await this.nftTransferRecordRepository.find({
      smart_contract_address: contractAddress
    })
  }

  async getNftTransfersByWallet(walletAddress) {
    return await this.nftTransferRecordRepository.find({
      where: [
        {
          from: walletAddress
        },
        {
          to: walletAddress
        }
      ]
    })
  }

  async getNftsForContract(walletAddress: string, contractAddress: string) {
    // let condition = {}
    // if (walletAddress) condition['owner'] = walletAddress
    // if (contractAddress) condition['smart_contract_address'] = contractAddress
    return await this.checkSources(
      await this.nftBalanceRepository.find({
        smart_contract_address: contractAddress,
        owner: walletAddress
      })
    )
  }

  async getNftTransfersForBlockHeight(height: number) {
    return await this.nftTransferRecordRepository.find({
      height: height
    })
  }

  async getNftByTokenId(tokenId: number, contractAddress: string) {
    const nft = await this.nftBalanceRepository.findOne({
      token_id: tokenId,
      smart_contract_address: contractAddress
    })
    if (!nft) return undefined
    return await this.checkSources([nft])[0]
  }

  async checkSources(nfts: Array<NftBalanceEntity>) {
    this.logger.debug('nfts length: ' + nfts.length)
    const smartContractList: { [prop: string]: SmartContractEntity } = {}
    for (const nft of nfts) {
      if (!nft.name || !nft.img_uri) {
        if (!smartContractList[nft.smart_contract_address]) {
          smartContractList[nft.smart_contract_address] =
            await this.smartContractRepository.findOne({
              contract_address: nft.smart_contract_address
            })
        }
        const contractInfo = smartContractList[nft.smart_contract_address]
        const abiInfo = JSON.parse(contractInfo.abi)
        const tokenUri = await this.getTokenUri(nft.smart_contract_address, abiInfo, nft.token_id)
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
        // this.logger.debug(res)
        nft.name = res.name
        nft.img_uri = res.image
        nft.detail = JSON.stringify(res)
        nft.contract_uri = await this.getContractUri(nft.smart_contract_address, abiInfo)
        nft.base_token_uri = await this.getBaseTokenUri(nft.smart_contract_address, abiInfo)
        nft.token_uri = await this.getTokenUri(nft.smart_contract_address, abiInfo, nft.token_id)
        await this.nftBalanceRepository.save(nft)
      }
    }
    return nfts
  }

  async uniqueHolders(contractAddress: string) {
    const list = await this.nftBalanceRepository
      .createQueryBuilder()
      .from(NftBalanceEntity, 'nft')
      .select('nft.owner')
      .where('nft.smart_contract_address=:contractAddress', { contractAddress: contractAddress })
      .distinct(true)
      .getMany()

    // this.logger.debug(JSON.stringify(list))
    return list.length
  }

  async totalAmount(
    contractAddress: string
  ): Promise<[totalAmount: number, uniqueHolders: number]> {
    const res = await this.nftBalanceRepository.find({
      smart_contract_address: contractAddress
    })
    const userObj = {}
    let uniqeuHolder = 0
    for (const nft of res) {
      if (!userObj[nft.owner]) {
        uniqeuHolder++
        userObj[nft.owner] = true
      }
    }
    return [res.length, uniqeuHolder]
  }
}
