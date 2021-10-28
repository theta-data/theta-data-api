import { Query, ResolveField, Resolver } from '@nestjs/graphql'
import { ThetaTxList } from './theta-tx-list.model'
import { TxService } from './tx.service'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { ThetaTxNumByDateModel } from './theta-tx-num-by-date.model'
import { ThetaTransactionStatisticsType } from './theta-tx.model'

@Resolver((of) => ThetaTransactionStatisticsType)
export class TxResolver {
  constructor(private readonly txService: TxService) {}

  @Query(() => ThetaTransactionStatisticsType)
  TransactionsStatistics() {
    return {}
  }

  @ResolveField()
  async by_date() {
    return await this.txService.getThetaDataByDate()
  }

  @ResolveField()
  async by_hour() {
    return await this.txService.getThetaByHour()
  }
}
