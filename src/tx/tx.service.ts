import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ThetaTxList } from 'src/tx/theta-tx-list.model'
// import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { MoreThan, Repository } from 'typeorm'
// import { THETA_TX_TYPE_ENUM } from './theta.enum'
// import { ThetaTx } from './models/theta-tx.model'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
// import { ThetaTxList } from './models/theta-tx-list.model'
const moment = require('moment')
@Injectable()
export class TxService {
  constructor(
    @InjectRepository(ThetaTxNumByHoursEntity)
    private thetaTxNumRepository: Repository<ThetaTxNumByHoursEntity>
  ) {}

  getHello(): string {
    return 'Hello World!'
  }

  async getThetaData(): Promise<ThetaTxList> {
    let hours = await this.thetaTxNumRepository.find({
      where: {
        timestamp: MoreThan(moment(moment().unix() * 1000 - 7 * 24 * 60 * 60 * 1000).format())
      },
      order: { timestamp: 'ASC' }
    })
    console.log('start', moment(moment().unix() * 1000 - 7 * 24 * 60 * 60 * 1000).format())
    // let hour1List = hours.map((txEntity)=>{
    //   return txEntity[THETA_TX_TYPE_ENUM[txType]]
    // })
    return {
      list: hours
    }
  }

  public async getThetaDataByDay() {
    let hours = await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(moment().subtract(3, 'month').format())
      }
      // take: 500
    })
    let obj: {
      [propName: string]: {
        coin_base_transaction: number
        block_number: number
        active_wallet: number
        slash_transaction: number
        send_transaction: number
        reserve_fund_transaction: number
        release_fund_transaction: number
        service_payment_transaction: number
        split_rule_transaction: number
        deposit_stake_transaction: number
        withdraw_stake_transaction: number
        smart_contract_transaction: number
        timestamp: string
      }
    } = {}
    hours.forEach((hourData) => {
      let date = moment(hourData.timestamp).format('YYYY_MM_DD')
      if (!obj.hasOwnProperty(date)) {
        obj[date] = {
          block_number: hourData.block_number,
          active_wallet: hourData.active_wallet,
          coin_base_transaction: hourData.coin_base_transaction,
          slash_transaction: hourData.slash_transaction,
          send_transaction: hourData.send_transaction,
          reserve_fund_transaction: hourData.reserve_fund_transaction,
          release_fund_transaction: hourData.reserve_fund_transaction,
          service_payment_transaction: hourData.service_payment_transaction,
          split_rule_transaction: hourData.split_rule_transaction,
          deposit_stake_transaction: hourData.deposit_stake_transaction,
          withdraw_stake_transaction: hourData.withdraw_stake_transaction,
          smart_contract_transaction: hourData.smart_contract_transaction,
          timestamp: hourData.timestamp
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
      }
    })

    return { list: Object.values(obj) }
  }

  public async getThetaByHour(hours: number = 12) {
    return await this.thetaTxNumRepository.find({
      order: { timestamp: 'ASC' },
      where: {
        timestamp: MoreThan(moment().subtract(hours, 'hour').format())
      }
    })
  }
}
