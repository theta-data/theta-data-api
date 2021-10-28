import { Query, Resolver } from '@nestjs/graphql'
import { ThetaTxList } from './theta-tx-list.model'
import { TxService } from './tx.service'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'
import { ThetaTxNumByDateModel } from './theta-tx-num-by-date.model'

@Resolver((of) => ThetaTxList)
export class TxResolver {
  constructor(private readonly txService: TxService) {}

  @Query(() => [ThetaTxNumByDateModel])
  async TransactionsNumberByDate() {
    return await this.txService.getThetaDataByDate()
  }

  @Query(() => [ThetaTxNumByHoursEntity])
  async TransactionsNumberByHour() {
    return await this.txService.getThetaByHour()
  }
}
