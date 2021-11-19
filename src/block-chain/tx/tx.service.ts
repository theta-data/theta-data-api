import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { ThetaTxNumByDateModel } from './theta-tx.model'
const moment = require('moment')

@Injectable()
export class TxService {
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumRepository: Repository<ThetaTxNumByHoursEntity>
  ) {}

  public async getThetaDataByDate() {
    let hours = await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(moment().subtract(14, 'days').format())
      }
      // take: 500
    })
    let obj: {
      [propName: string]: ThetaTxNumByDateModel
    } = {}
    hours.forEach((hourData) => {
      let date = moment(hourData.timestamp).format('YYYY_MM_DD')
      if (!obj.hasOwnProperty(date)) {
        obj[date] = {
          latest_block_height: hourData.latest_block_height,
          month: hourData.month,
          theta_fuel_burnt: hourData.theta_fuel_burnt,
          timestamp: hourData.timestamp,
          year: hourData.year,
          block_number: hourData.block_number,
          active_wallet: hourData.active_wallet,
          date: hourData.date,
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
      }
    })

    return Object.values(obj)
  }

  public async getThetaByHour(hours: number = 24 * 7) {
    return await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(moment().subtract(hours, 'hours').format())
      }
    })
  }
}
