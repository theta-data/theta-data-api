import { THETA_TRANSACTION_TYPE_ENUM } from './../tx/theta.enum'
import { TransactionEntity } from './../explorer/transaction.entity'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { WalletTxHistoryEntity } from './wallet-tx-history.entity'
import { id } from 'ethers/lib/utils'

@Injectable()
export class WalletTxHistoryService {
  constructor(
    @InjectRepository(WalletTxHistoryEntity, 'wallet-tx-history')
    private readonly walletTxHistoryRepository: Repository<WalletTxHistoryEntity>,

    @InjectRepository(TransactionEntity, 'explorer')
    private readonly transactionRepository: Repository<TransactionEntity>
  ) {}

  async getTransactions(
    wallet: string,
    take: number = 10,
    skip: number = 0,
    txType: THETA_TRANSACTION_TYPE_ENUM | undefined
  ): Promise<[boolean, number, TransactionEntity[]]> {
    const res = await this.walletTxHistoryRepository.findOne({
      where: { wallet: wallet }
    })
    if (!res) {
      return [false, 0, []]
    }
    const txs: Array<string> = JSON.parse(res.tx_ids)
    // if(t)
    if (txs.length === 0) {
      return [false, 0, []]
    }

    // if (txs.length  take) {
    const idsTyped = []
    for (let i = 0; i < txs.length; i++) {
      if (txType == undefined || Number(txs[i].split('_')[1]) == txType) {
        idsTyped.push(txs[i].split('_')[0])
      }
    }

    if (skip > idsTyped.length) {
      return [false, 0, []]
    }
    const hasNextPage = idsTyped.length > skip + take ? true : false
    const idsToFind = idsTyped.slice(skip, skip + take)
    const list = await this.transactionRepository.find({
      where: { id: In(idsToFind) },
      order: { height: 'DESC' }
    })
    return [hasNextPage, idsTyped.length, list]
    // }
  }
}
