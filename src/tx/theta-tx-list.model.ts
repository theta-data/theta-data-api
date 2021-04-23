import { Field, ObjectType } from '@nestjs/graphql'
import { THETA_TX_TYPE_ENUM } from './theta.enum'
import { ThetaTx } from './theta-tx.model'

@ObjectType()
export class ThetaTxList {
  @Field((type) => [ThetaTx])
  list: Array<ThetaTx>
}
