import { BLOCK_COUNT_KEY, TRANSACTION_COUNT_KEY } from './const'
import { CountEntity } from './count.entity'
import { TransactionEntity } from './transaction.entity'
import { BlokcListEntity } from './block-list.entity'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, LessThan, Repository } from 'typeorm'

@Injectable()
export class ExplorerService {
  private logger = new Logger()
  constructor(
    @InjectRepository(BlokcListEntity, 'explorer')
    private blockListRepository: Repository<BlokcListEntity>,

    @InjectRepository(TransactionEntity, 'explorer')
    private transactionRepository: Repository<TransactionEntity>,

    @InjectRepository(CountEntity, 'explorer')
    private countRepository: Repository<CountEntity>
  ) {}

  public async getBlockList(
    take: number = 20,
    after: string | undefined,
    skip: number = 0
  ): Promise<[boolean, number, Array<BlokcListEntity>]> {
    const condition: FindManyOptions<BlokcListEntity> = {
      take: take + 1,
      skip: skip,
      order: {
        // id: 'ASC',
        height: 'DESC'
      }
    }
    if (after) {
      const height = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + height)
      condition.where[height] = LessThan(height)
    }
    const totalBlock = (
      await this.countRepository.findOne({
        key: BLOCK_COUNT_KEY
      })
    ).count
    let blockList = await this.blockListRepository.find(condition)
    let hasNextPage = false
    if (blockList.length > take) {
      hasNextPage = true
      blockList = blockList.slice(0, take)
    }
    return [hasNextPage, totalBlock, blockList]
  }

  public async getTransactions(
    take: number = 20,
    after: string | undefined,
    skip: number = 0
  ): Promise<[boolean, number, Array<TransactionEntity>]> {
    const condition: FindManyOptions<TransactionEntity> = {
      take: take + 1,
      skip: skip,
      order: {
        // id: 'ASC',
        id: 'DESC'
      }
    }
    if (after) {
      const id = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + id)
      condition.where['id'] = LessThan(id)
    }
    const totalBlock = (
      await this.countRepository.findOne({
        key: TRANSACTION_COUNT_KEY
      })
    ).count
    let blockList = await this.transactionRepository.find(condition)
    let hasNextPage = false
    if (blockList.length > take) {
      hasNextPage = true
      blockList = blockList.slice(0, take)
    }
    return [hasNextPage, totalBlock, blockList]
  }
}
