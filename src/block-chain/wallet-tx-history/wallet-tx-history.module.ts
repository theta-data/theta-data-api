import { CommonModule } from './../../common/common.module'
import { WalletTxHistoryAnalyseService } from './wallet-tx-history-analyse.service'
import { WalletTxHistoryEntity } from './wallet-tx-history.entity'
import { TransactionEntity } from './../explorer/transaction.entity'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from '../wallet/wallet.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity], 'wallet'),
    TypeOrmModule.forFeature([TransactionEntity], 'explorer'),
    TypeOrmModule.forFeature([WalletTxHistoryEntity], 'wallet-tx-history'),
    CommonModule
  ],
  providers: [WalletTxHistoryAnalyseService],
  exports: []
})
export class WalletTxHistoryModule {}