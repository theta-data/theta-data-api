import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ThetaTxNumByHoursEntity } from '../../tx/theta-tx-num-by-hours.entity'
import { In, Repository } from 'typeorm'
import { TxMonitorSendListEntity } from './tx-monitor-send-list.entity'
import { UsersEntity } from '../../users/users.entity'
import { THETA_TX_TYPE_ENUM } from '../../tx/theta.enum'
import { SendTxMonitorStatusEnum, SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@Injectable()
export class TxMonitorSendService {
  constructor(
    @InjectRepository(TxMonitorSendListEntity)
    private sendTxMonitorRepository: Repository<TxMonitorSendListEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>
  ) {}

  async getList(email: string) {
    let user = await this.usersRepository.findOne({ email: email })
    return await this.sendTxMonitorRepository.find({
      where: { user: user, status: SendTxMonitorStatusEnum.success },
      relations: ['user'],
      order: {
        update_date: 'DESC'
      }
    })
  }

  public async delete(email: string, id: number) {
    let user = await this.usersRepository.findOne({ email: email })
    console.log('email', email, 'id', id)
    await this.sendTxMonitorRepository.update(
      { user: user, id: id },

      { status: SendTxMonitorStatusEnum.deleted }
    )
  }

  async addMonitor(
    email: string,
    min: number,
    token_type: SendTxMonitorTokenTypeEnum,
    notify_email: string
  ) {
    let user = await this.usersRepository.findOne({
      email: email
    })
    let sendTxMonitorEntity = new TxMonitorSendListEntity()
    sendTxMonitorEntity.min = min
    sendTxMonitorEntity.user = user
    sendTxMonitorEntity.notify_email = notify_email
    sendTxMonitorEntity.token_type = token_type
    await this.sendTxMonitorRepository.save(sendTxMonitorEntity)
    return await this.sendTxMonitorRepository.find({
      where: { user: user },
      relations: ['user'],
      order: {
        update_date: 'DESC'
      }
    })
  }
}
