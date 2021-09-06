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
        coin_base_tx: number
        block_number: number
        active_wallet: number
        slash_tx: number
        send_tx: number
        reserve_fund_tx: number
        release_fund_tx: number
        service_payment_tx: number
        split_rule_tx: number
        deposit_stake_tx: number
        withdraw_stake_tx: number
        smart_contract_tx: number
        timestamp: string
      }
    } = {}
    hours.forEach((hourData) => {
      let date = moment(hourData.timestamp).format('YYYY_MM_DD')
      if (!obj.hasOwnProperty(date)) {
        obj[date] = {
          block_number: hourData.block_number,
          active_wallet: hourData.active_wallet,
          coin_base_tx: hourData.coin_base_tx,
          slash_tx: hourData.slash_tx,
          send_tx: hourData.send_tx,
          reserve_fund_tx: hourData.reserve_fund_tx,
          release_fund_tx: hourData.reserve_fund_tx,
          service_payment_tx: hourData.service_payment_tx,
          split_rule_tx: hourData.split_rule_tx,
          deposit_stake_tx: hourData.deposit_stake_tx,
          withdraw_stake_tx: hourData.withdraw_stake_tx,
          smart_contract_tx: hourData.smart_contract_tx,
          timestamp: hourData.timestamp
        }
      } else {
        obj[date].coin_base_tx += hourData.coin_base_tx
        obj[date].slash_tx += hourData.slash_tx
        obj[date].block_number += hourData.block_number
        obj[date].active_wallet += hourData.active_wallet
        obj[date].send_tx += hourData.send_tx
        obj[date].reserve_fund_tx += hourData.reserve_fund_tx
        obj[date].release_fund_tx += hourData.release_fund_tx
        obj[date].service_payment_tx += hourData.service_payment_tx
        obj[date].split_rule_tx += hourData.split_rule_tx
        obj[date].deposit_stake_tx += hourData.deposit_stake_tx
        obj[date].withdraw_stake_tx += hourData.withdraw_stake_tx
        obj[date].smart_contract_tx += hourData.smart_contract_tx
      }
    })

    return { list: Object.values(obj) }
  }
}
