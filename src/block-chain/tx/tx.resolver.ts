import { Args, Int, Query, ResolveField, Resolver } from '@nestjs/graphql'
import { TxService } from './tx.service'
import { ThetaTransactionStatisticsType } from './theta-tx.model'

@Resolver((of) => ThetaTransactionStatisticsType)
export class TxResolver {
  constructor(private readonly txService: TxService) {}

  @Query(() => ThetaTransactionStatisticsType)
  TransactionsStatistics() {
    return {}
  }

  @ResolveField()
  async ByDate(
    @Args('timezoneOffset', {
      type: () => Int,
      nullable: true,
      defaultValue: '0',
      description:
        'the timezone difference in minutes, between the UTC and the current local time.' +
        'Such as PDT time is utc-07, should pass -420'
    })
    timezoneOffset: string
  ) {
    return await this.txService.getThetaDataByDate(timezoneOffset)
  }

  @ResolveField()
  async ByHour(
    @Args('timezoneOffset', {
      type: () => Int,
      nullable: true,
      defaultValue: '0',
      description:
        'the timezone difference in minutes, between the UTC and the current local time.' +
        'Such as PDT time is utc-07, should pass -420'
    })
    timezoneOffset: string
  ) {
    return await this.txService.getThetaByHour(timezoneOffset)
  }
}
