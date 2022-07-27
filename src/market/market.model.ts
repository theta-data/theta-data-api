import { Field, Float, Int, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class KlineObj {
  @Field(() => Int)
  time: number

  @Field(() => Float)
  price: number
}

@ObjectType()
export class TokenMarketInformationType {
  @Field()
  name: string

  @Field(() => Float)
  price: number

  @Field(() => Float)
  volume_24h: number

  @Field(() => Float)
  price_change_percent: number

  @Field(() => [KlineObj])
  kline: KlineObj[]
}

@ObjectType()
export class MarketInformationType {
  @Field(() => TokenMarketInformationType)
  Theta: TokenMarketInformationType

  @Field(() => TokenMarketInformationType)
  ThetaFuel: TokenMarketInformationType
}
