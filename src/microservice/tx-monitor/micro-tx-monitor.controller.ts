import { Controller, Inject } from '@nestjs/common'
import { ClientProxy, EventPattern, MessagePattern, Payload } from '@nestjs/microservices'
import {
  SendTxMonitorStatusEnum,
  SendTxMonitorTokenTypeEnum
} from '../../tx-monitor/send/tx-monitor-send.enum'
import { InjectRepository } from '@nestjs/typeorm'
import { TxMonitorSendListEntity } from '../../tx-monitor/send/tx-monitor-send-list.entity'
import { LessThan, MoreThan, Repository } from 'typeorm'
const config = require('config')
@Controller()
export class MicroTxMonitorController {
  constructor(
    @InjectRepository(TxMonitorSendListEntity)
    private sendTxMonitorRepository: Repository<TxMonitorSendListEntity>,
    @Inject('MAIL_SERVICE') private client: ClientProxy
  ) {}

  @EventPattern('send-tx-monitor-' + config.util.getEnv('NODE_ENV'))
  async sendTxMonitor({
    token_type,
    amount,
    from,
    to,
    hash
  }: {
    token_type: SendTxMonitorTokenTypeEnum
    amount: number
    from: string
    to: string
    hash: string
  }) {
    console.log('get send tx', token_type, amount, from, to, hash)
    let monitorToSend = await this.sendTxMonitorRepository.find({
      where: {
        token_type: token_type,
        status: SendTxMonitorStatusEnum.success,
        min: LessThan(amount)
      }
    })
    monitorToSend.forEach((monitor) => {
      this.client.emit<number>('send_mail', {
        from: 'THETA DATA',
        to: monitor.notify_email,
        subject:
          'Notification:' +
          +amount +
          ' ' +
          SendTxMonitorTokenTypeEnum[token_type] +
          ' was transferred.',
        text: '',
        // 'from  address ' +
        // from +
        // ' to ' +
        // to +
        // ' transfer' +
        // amount +
        // ' ' +
        // SendTxMonitorTokenTypeEnum[token_type] +
        // ' hash: ' +
        // hash,
        html:
          '<p>from  address:<a href="https://explorer.thetatoken.org/account/' +
          from +
          '">' +
          from +
          '</a></p><p>trasfer ' +
          amount +
          ' ' +
          SendTxMonitorTokenTypeEnum[token_type] +
          '</p>' +
          '<p>to address: <a href="https://explorer.thetatoken.org/account/">' +
          to +
          '</a>' +
          // to +
          '</p>' +
          '<p>transaction hash:</p>' +
          '<p> <a href="https://explorer.thetatoken.org/txs/' +
          hash +
          '"> ' +
          hash +
          '</a></p>'
      })
    })
  }

  // @MessagePattern('send-tx-monitor')
  // async sendTxMonitorTest(
  //   @Payload()
  //   {
  //     token_type,
  //     amount,
  //     from,
  //     to,
  //     hash
  //   }: {
  //     token_type: SendTxMonitorTokenTypeEnum
  //     amount: number
  //     from: string
  //     to: string
  //     hash: string
  //   }
  // ) {
  //   console.log('get send tx message', token_type, amount, from, to, hash)
  //   let monitorToSend = await this.sendTxMonitorRepository.find({
  //     where: {
  //       token_type: token_type,
  //       status: SendTxMonitorStatusEnum.success,
  //       min: MoreThan(amount)
  //     }
  //   })
  //   monitorToSend.forEach((monitor) => {
  //     this.client.emit<number>('send_mail', {
  //       from: 'THETA DATA',
  //       to: monitor.notify_email,
  //       subject: 'Send Transaction Notification',
  //       text:
  //         'from  address ' +
  //         from +
  //         ' to ' +
  //         to +
  //         ' transfer' +
  //         amount +
  //         ' ' +
  //         token_type +
  //         ' hash: ' +
  //         hash
  //     })
  //   })
  // }
}
