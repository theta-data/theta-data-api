import { Query, Resolver } from '@nestjs/graphql'
import { ThetaPriceModel } from './price.model'
import { CmcHttpProvider } from 'theta-ts-sdk'

@Resolver()
export class PriceResolver {
  constructor() {}
  @Query(() => ThetaPriceModel)
  async theta() {
    const cmc = new CmcHttpProvider('57a40db8-5488-4ed4-ab75-152fec2ed608')
    const res = await cmc.getInformation()
    return res.theta
  }

  @Query(() => ThetaPriceModel)
  async tfuel() {
    const cmc = new CmcHttpProvider('57a40db8-5488-4ed4-ab75-152fec2ed608')
    const res = await cmc.getInformation()
    return res.tfuel
  }
}
