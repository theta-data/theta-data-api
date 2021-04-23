import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { GqlAuthGuard } from '../../auth/gql-auth.guard'
import { CurrentUser } from '../../auth/constants'
import { UserLoginInfo } from '../../users/user-info.model'
import { CODE_ENUM } from '../../common/code.enum'
import { TxMonitorWithdrawStakeService } from './tx-monitor-withdraw-stake.service'
import { TxMonitorWithdrawStakeResIno } from './tx-monitor-withdraw-stake.model'

@Resolver()
export class TxMonitorWithdrawStakeResolver {
  constructor(private txMonitorWithdrawStakeService: TxMonitorWithdrawStakeService) {}

  @Mutation(() => TxMonitorWithdrawStakeResIno)
  @UseGuards(GqlAuthGuard)
  async addTxWithdrawStakeMonitor(
    @CurrentUser() user: UserLoginInfo,
    @Args('notify_email') notifyEmail: string,
    @Args('min', { type: () => Int }) min: number
  ) {
    return {
      code: CODE_ENUM.success,
      list: await this.txMonitorWithdrawStakeService.addTxWithdrawStakeMonitor(
        user.email,
        min,
        notifyEmail
      )
    }
  }

  @Query(() => TxMonitorWithdrawStakeResIno)
  @UseGuards(GqlAuthGuard)
  async txWithdrawMonitorList(@CurrentUser() user: UserLoginInfo) {
    return {
      code: CODE_ENUM.success,
      list: await this.txMonitorWithdrawStakeService.getList(user.email)
    }
  }

  @Mutation(() => TxMonitorWithdrawStakeResIno)
  @UseGuards(GqlAuthGuard)
  async delTxWithdrawStakeMonitor(
    @CurrentUser() user: UserLoginInfo,
    @Args('id', { type: () => Int }) id: number
  ) {
    await this.txMonitorWithdrawStakeService.delete(user.email, id)
    return {
      code: CODE_ENUM.success
    }
  }
}
