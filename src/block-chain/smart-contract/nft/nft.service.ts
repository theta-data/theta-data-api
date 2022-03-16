import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// import { checkTnt721, decodeLogs, readSmartContract } from 'src/helper/utils'
import {
  FindCondition,
  FindConditions,
  FindManyOptions,
  getConnection,
  Like,
  MoreThan,
  MoreThanOrEqual,
  QueryRunner,
  Repository
} from 'typeorm'
import { SmartContractCallRecordEntity } from '../smart-contract-call-record.entity'
import { SmartContractEntity, smartContractProtocol } from '../smart-contract.entity'
import { NftBalanceEntity, NftStatusEnum } from './nft-balance.entity'
import { NftTransferRecordEntity } from './nft-transfer-record.entity'
import fetch from 'cross-fetch'
import { UtilsService } from 'src/common/utils.service'
import { orderBy } from 'lodash'
import { TokenType } from 'src/block-chain/rpc/rpc.model'
// import { Logger } from 'ethers/lib/utils'
// import { add } from 'lodash'

@Injectable()
export class NftService {
  logger = new Logger()
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
    this.logger.debug('nft record:' + JSON.stringify(nftRecord))
    const condition: any = {
      where: { contract_id: contract.id },
      order: { timestamp: 'ASC' }
    }
    if (nftRecord) {
      condition['where']['timestamp'] = MoreThan(nftRecord.timestamp)
    }
    this.logger.debug(condition)
    const contractRecord = await this.smartContractCallRecordRepository.find(condition)
    let afftectedNum = 0

    const connection = getConnection('nft').createQueryRunner()
    await connection.connect()
    await connection.startTransaction()
    this.logger.debug('protocol is tnt 721')
    try {
      for (const record of contractRecord) {
        const res = await this.updateNftRecord(connection, record, contract)
        if (res) afftectedNum++
      }
      await connection.commitTransaction()
    } catch (e) {
      this.logger.debug(e)
      await connection.rollbackTransaction()
    } finally {
      await connection.release()
    }

    return afftectedNum
  }

  async parseRecordByContractAddressWithConnection(
    nftConnection: QueryRunner,
    smartContractConnection: QueryRunner,
    contract: SmartContractEntity,
    height: number = 0
  ): Promise<number> {
    this.logger.debug('start parese record')
    if (!contract.verified) {
      this.logger.debug(contract.contract_address + ' not verified')
      return 0
    }
    if (!this.utilsService.checkTnt721(JSON.parse(contract.abi))) {
      this.logger.debug('protocol not nft 721')
      return 0
    }
    this.logger.debug('protocol is tnt 721')
    const nftRecord = await nftConnection.manager.findOne(NftTransferRecordEntity, {
      where: { smart_contract_address: contract.contract_address },
      order: { height: 'DESC' }
    })
    this.logger.debug('nft record:' + JSON.stringify(nftRecord))
    const condition: any = {
      where: { contract_id: contract.id },
      order: { height: 'ASC' }
    }
    if (nftRecord) {
      condition['where']['height'] = MoreThanOrEqual(nftRecord.height)
    }
    this.logger.debug(condition)
    const contractRecord = await smartContractConnection.manager.find(
      SmartContractCallRecordEntity,
      condition
    )
    // if (height == 12817368) process.exit(0)
    let afftectedNum = 0
    // if(contract.)
    for (const record of contractRecord) {
      const res = await this.updateNftRecord(nftConnection, record, contract)
      if (res) afftectedNum++
    }
    return afftectedNum
  }

  async updateNftRecord(
    connection: QueryRunner,
    record: SmartContractCallRecordEntity,
    contract: SmartContractEntity
  ) {
    const receipt = JSON.parse(record.receipt)
    if (!receipt.Logs[0]) {
      this.logger.debug('receipt:' + JSON.stringify(receipt))
      return
    }
    this.logger.debug(JSON.stringify(receipt))
    receipt.Logs.forEach((log) => {
      if (log.data == '') {
        log.data = '0x'
      }
      if (record.data) {
        const data = this.utilsService.getHex(record.data)
        // receipt.Logs[0].data = data
        log.data = data
      }
    })

    const logInfo = this.utilsService.decodeLogs(receipt.Logs, JSON.parse(contract.abi))
    this.logger.debug(contract.contract_address)
    this.logger.debug(JSON.stringify(logInfo))
    if (logInfo[0].decode.eventName === 'Transfer') {
      // try {
      await connection.manager.upsert(
        NftTransferRecordEntity,
        {
          from: logInfo[0].decode.result.from.toLowerCase(),
          to: logInfo[0].decode.result.to.toLowerCase(),
          token_id: Number(logInfo[0].decode.result.tokenId),
          smart_contract_address: contract.contract_address,
          height: record.height,
          timestamp: record.timestamp
        },
        ['smart_contract_address', 'token_id', 'timestamp']
      )
      const balance = await connection.manager.findOne(NftBalanceEntity, {
        smart_contract_address: contract.contract_address,
        token_id: Number(logInfo[0].decode.result.tokenId)
      })
      if (balance) {
        balance.owner = logInfo[0].decode.result.to.toLowerCase()
        balance.from = logInfo[0].decode.result.from.toLowerCase()
        await connection.manager.save(NftBalanceEntity, balance)
      } else {
        await connection.manager.insert(NftBalanceEntity, {
          smart_contract_address: contract.contract_address,
          owner: logInfo[0].decode.result.to.toLowerCase(),
          from: logInfo[0].decode.result.from.toLowerCase(),
          token_id: Number(logInfo[0].decode.result.tokenId)
        })
      }
      // await connection.manager.upsert(
      //   NftBalanceEntity,
      //   {
      //     smart_contract_address: contract.contract_address,
      //     owner: logInfo[0].decode.result.to.toLowerCase(),
      //     from: logInfo[0].decode.result.from.toLowerCase(),
      //     token_id: Number(logInfo[0].decode.result.tokenId)
      //   },
      //   ['smart_contract_address', 'token_id']
      // )
      return true
    }
    return false
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

  async getNftByWalletAddress(
    address: string,
    take: number = 20,
    after: string | undefined
  ): Promise<[boolean, number, Array<NftBalanceEntity>]> {
    this.logger.debug('address: ' + address)
    const condition: FindManyOptions<NftBalanceEntity> = {
      where: {
        owner: address
      },
      take: take + 1,
      order: {
        id: 'ASC'
      }
    }
    if (after) {
      const id = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + id)
      condition.where['id'] = MoreThan(id)
    }

    const totalNft = await this.nftBalanceRepository.count({
      owner: address
    })
    let nftList = await this.nftBalanceRepository.find(condition)
    let hasNextPage = false
    if (nftList.length > take) {
      hasNextPage = true
      nftList = nftList.slice(0, take)
    }
    this.logger.debug('nft length  :' + nftList.length)
    return [hasNextPage, totalNft, await this.checkSources(nftList)]
  }

  async getNftsBySmartContractAddress(
    address: string,
    take: number = 20,
    after: string | undefined
  ): Promise<[boolean, number, Array<NftBalanceEntity>]> {
    const condition: FindManyOptions<NftBalanceEntity> = {
      where: {
        smart_contract_address: address
      },
      take: take + 1,
      order: {
        id: 'ASC'
      }
    }
    if (after) {
      const id = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + id)
      condition.where['id'] = MoreThan(id)
    }
    const totalNft = await this.nftBalanceRepository.count({
      smart_contract_address: address
    })
    let nftList = await this.nftBalanceRepository.find(condition)
    let hasNextPage = false
    if (nftList.length > take) {
      hasNextPage = true
      nftList = nftList.slice(0, take)
    }
    return [hasNextPage, totalNft, await this.checkSources(nftList)]
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

  async findNftsByName(name: string) {
    return await this.smartContractRepository.find({
      protocol: smartContractProtocol.tnt721,
      name: Like('%' + name + '%')
    })
  }
}
