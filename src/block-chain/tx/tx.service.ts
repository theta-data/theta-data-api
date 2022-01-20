import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { WalletService } from '../wallet/wallet.service'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { ThetaTxNumByDateModel } from './theta-tx.model'
const moment = require('moment')

@Injectable()
export class TxService {
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumRepository: Repository<ThetaTxNumByHoursEntity>,
    private walletService : WalletService
  
  ) {}

  public async getThetaDataByDate(timezoneOffset: string) {
    let hours = await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(
          moment()
            .subtract(14, 'days')
            .subtract(-new Date().getTimezoneOffset() - Number(timezoneOffset), 'minutes')
            .unix()
        )
      }
      // take: 500
    })
    let obj: {
      [propName: string]: ThetaTxNumByDateModel
    } = {}
    hours.forEach((hourData) => {
      const dateObj = moment(hourData.timestamp).subtract(
        -new Date().getTimezoneOffset() - Number(timezoneOffset),
        'minutes'
      )
      let date = dateObj.format('YYYY_MM_DD')
      if (!obj.hasOwnProperty(date)) {
        obj[date] = {
          latest_block_height: hourData.latest_block_height,
          month: dateObj.format('MM'),
          theta_fuel_burnt: hourData.theta_fuel_burnt,
          theta_fuel_burnt_by_smart_contract: hourData.theta_fuel_burnt_by_smart_contract,
          theta_fuel_burnt_by_transfers: hourData.theta_fuel_burnt_by_transfers,
          timestamp: hourData.timestamp,
          year: dateObj.format('YYYY'),
          block_number: hourData.block_number,
          active_wallet: hourData.active_wallet,
          date: dateObj.format('DD'),
          coin_base_transaction: hourData.coin_base_transaction,
          slash_transaction: hourData.slash_transaction,
          send_transaction: hourData.send_transaction,
          reserve_fund_transaction: hourData.reserve_fund_transaction,
          release_fund_transaction: hourData.reserve_fund_transaction,
          service_payment_transaction: hourData.service_payment_transaction,
          split_rule_transaction: hourData.split_rule_transaction,
          deposit_stake_transaction: hourData.deposit_stake_transaction,
          withdraw_stake_transaction: hourData.withdraw_stake_transaction,
          smart_contract_transaction: hourData.smart_contract_transaction
          // timestamp: hourData.timestamp
        }
      } else {
        obj[date].coin_base_transaction += hourData.coin_base_transaction
        obj[date].slash_transaction += hourData.slash_transaction
        obj[date].block_number += hourData.block_number
        obj[date].active_wallet += hourData.active_wallet
        obj[date].send_transaction += hourData.send_transaction
        obj[date].reserve_fund_transaction += hourData.reserve_fund_transaction
        obj[date].release_fund_transaction += hourData.release_fund_transaction
        obj[date].service_payment_transaction += hourData.service_payment_transaction
        obj[date].split_rule_transaction += hourData.split_rule_transaction
        obj[date].deposit_stake_transaction += hourData.deposit_stake_transaction
        obj[date].withdraw_stake_transaction += hourData.withdraw_stake_transaction
        obj[date].smart_contract_transaction += hourData.smart_contract_transaction
        obj[date].theta_fuel_burnt += hourData.theta_fuel_burnt
        obj[date].theta_fuel_burnt_by_smart_contract += hourData.theta_fuel_burnt_by_smart_contract
        obj[date].theta_fuel_burnt_by_transfers += hourData.theta_fuel_burnt_by_transfers
      }
    })

    return Object.values(obj)
  }

  public async getThetaByHour(timezoneOffset, hours: number = 24 * 7) {
    const startTime =  moment()
    .subtract(hours, 'hours')
    .subtract(-new Date().getTimezoneOffset() - Number(timezoneOffset), 'minutes')
    .unix()
    const res = await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(
         startTime
        )
      }
    })
    const activeWalletList = await this.walletService.getActiveWallet(startTime - 3600)
    res.forEach((tx) => {
      const dateObj = moment(tx.timestamp).subtract(
        -new Date().getTimezoneOffset() - Number(timezoneOffset),
        'minutes'
      )
      tx.year = dateObj.format('YYYY')
      tx.month = dateObj.format('MM')
      tx.date = dateObj.format('DD')
      tx.hour = dateObj.format('HH')
      for(const wallet of activeWalletList){
        if(tx.timestamp === (wallet.snapshot_time - 3600)){
          tx.active_wallet = wallet.active_wallets_amount_last_hour
        }
      }
    })
    return res
  }
}
