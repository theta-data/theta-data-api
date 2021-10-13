import { Query, Resolver } from '@nestjs/graphql'
import { ThetaTxList } from './theta-tx-list.model'
import { TxService } from './tx.service'
import { ThetaTxNumByHoursEntity } from './theta-tx-num-by-hours.entity'

@Resolver((of) => ThetaTxList)
export class TxResolver {
  constructor(private readonly txService: TxService) {}

  // @Query((returns) => ThetaTxList)
  // async thetaTxList() {
  //   return await this.txService.getThetaData()
  // }
  //
  // @Query((returns) => ThetaTxList)
  // async thetaTxListByDay() {
  //   return await this.txService.getThetaDataByDay()
  // }
  @Query(() => [ThetaTxNumByHoursEntity])
  async TransactionsNumberByDate() {
    const listData = await this.txService.getThetaDataByDay()
    return listData.list
  }

  @Query(() => [ThetaTxNumByHoursEntity])
  async TransactionsNumberByHour() {
    return await this.txService.getThetaByHour()
  }
}
