import { Field, Float, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class ThetaPriceModel {
  @Field()
  name: string

  @Field(() => Float)
  price: number

  @Field(() => Float)
  volume_24h: number

  @Field(() => Float)
  market_cap: number

  @Field(() => Float)
  total_supply: number

  @Field(() => Float)
  circulating_supply: number

  @Field()
  last_updated: string
}
