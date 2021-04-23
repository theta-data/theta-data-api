import { Field, Int, ObjectType } from "@nestjs/graphql";
import { GraphQLList } from "graphql";

@ObjectType()
export class PeriodStatistics{
  @Field({nullable : true})
  start : string

  @Field(type => [Int],{nullable : true})
  list : Array<number>
}