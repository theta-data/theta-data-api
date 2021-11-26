import { Query, ResolveField, Resolver } from '@nestjs/graphql'
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
  async ByDate() {
    return await this.txService.getThetaDataByDate()
  }

  @ResolveField()
  async ByHour() {
    return await this.txService.getThetaByHour()
  }
}
