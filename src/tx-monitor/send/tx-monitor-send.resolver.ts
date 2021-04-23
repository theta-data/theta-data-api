import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { SendTxMonitorResIno } from './tx-monitor-send.model'
import { UseGuards } from '@nestjs/common'
import { GqlAuthGuard } from '../../auth/gql-auth.guard'
import { CurrentUser } from '../../auth/constants'
import { UserLoginInfo } from '../../users/user-info.model'
import { TxMonitorSendService } from './tx-monitor-send.service'
import { CODE_ENUM } from '../../common/code.enum'
import { SendTxMonitorTokenTypeEnum } from './tx-monitor-send.enum'

@Resolver()
export class TxMonitorSendResolver {
  constructor(private sendTxMonitorService: TxMonitorSendService) {}

  @Mutation(() => SendTxMonitorResIno)
  @UseGuards(GqlAuthGuard)
  async addSendTxMonitor(
    @CurrentUser() user: UserLoginInfo,
    @Args('notify_email') notifyEmail: string,
    @Args('min', { type: () => Int }) min: number,
    @Args('token_type', { type: () => SendTxMonitorTokenTypeEnum })
    token_type: SendTxMonitorTokenTypeEnum
  ) {
    return {
      code: CODE_ENUM.success,
      list: await this.sendTxMonitorService.addMonitor(user.email, min, token_type, notifyEmail)
    }
  }

  @Query(() => SendTxMonitorResIno)
  @UseGuards(GqlAuthGuard)
  async sendTxMonitorList(@CurrentUser() user: UserLoginInfo) {
    return {
      code: CODE_ENUM.success,
      list: await this.sendTxMonitorService.getList(user.email)
    }
  }

  @Mutation(() => SendTxMonitorResIno)
  @UseGuards(GqlAuthGuard)
  async delTxMonitor(
    @CurrentUser() user: UserLoginInfo,
    @Args('id', { type: () => Int }) id: number
  ) {
    await this.sendTxMonitorService.delete(user.email, id)
    return {
      code: CODE_ENUM.success
    }
  }
}
