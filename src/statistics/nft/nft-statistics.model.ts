import { ObjectType } from '@nestjs/graphql'
import { Paginated } from 'src/common/common.model'
import { NftStatisticsEntity } from './nft-statistics.entity'

@ObjectType()
export class PaginatedNftStatistics extends Paginated(NftStatisticsEntity) {}
