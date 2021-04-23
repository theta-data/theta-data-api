import { Args, Query, Resolver } from '@nestjs/graphql'
import { ThetaTxList } from './theta-tx-list.model'
import { TxService } from './tx.service'

@Resolver((of) => ThetaTxList)
export class TxResolver {
  constructor(private readonly txService: TxService) {}

  @Query((returns) => ThetaTxList)
  async thetaTxList() {
    return await this.txService.getThetaData()
  }

  @Query((returns) => ThetaTxList)
  async thetaTxListByDay() {
    return await this.txService.getThetaDataByDay()
  }
}
