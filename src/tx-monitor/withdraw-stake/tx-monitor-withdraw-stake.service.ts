import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from '../../tx/theta-tx-num-by-hours.entity'
import { In, Repository } from 'typeorm'
// import { TxMonitorSendListEntity } from './tx-monitor-send-list.entity'
import { UsersEntity } from '../../users/users.entity'
import { THETA_TX_TYPE_ENUM } from '../../tx/theta.enum'
import { TxMonitorWithdrawStakeListEntity } from './tx-monitor-withdraw-stake-list.entity'
import { TxMonitorWithdrawStakeStatusEnum } from './ts-monitor-withdraw-stake.enum'
// import { SendTxMonitorStatusEnum, SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@Injectable()
export class TxMonitorWithdrawStakeService {
  constructor(
    @InjectRepository(TxMonitorWithdrawStakeListEntity)
    private withdrawStakeRepository: Repository<TxMonitorWithdrawStakeListEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>
  ) {}

  async getList(email: string) {
    let user = await this.usersRepository.findOne({ email: email })
    return await this.withdrawStakeRepository.find({
      where: { user: user, status: TxMonitorWithdrawStakeStatusEnum.success },
      relations: ['user'],
      order: {
        update_date: 'DESC'
      }
    })
  }

  public async delete(email: string, id: number) {
    let user = await this.usersRepository.findOne({ email: email })
    // console.log('email', email, 'id', id)
    await this.withdrawStakeRepository.update(
      { user: user, id: id },

      { status: TxMonitorWithdrawStakeStatusEnum.deleted }
    )
  }

  async addTxWithdrawStakeMonitor(email: string, min: number, notify_email: string) {
    let user = await this.usersRepository.findOne({
      email: email
    })
    let sendTxMonitorEntity = new TxMonitorWithdrawStakeListEntity()
    sendTxMonitorEntity.min = min
    sendTxMonitorEntity.user = user
    sendTxMonitorEntity.notify_email = notify_email
    // sendTxMonitorEntity.token_type = token_type
    await this.withdrawStakeRepository.save(sendTxMonitorEntity)
    return await this.withdrawStakeRepository.find({
      where: { user: user },
      relations: ['user'],
      order: {
        update_date: 'DESC'
      }
    })
  }
}
