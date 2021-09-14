import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StakeEntity } from './stake.entity'
import { StakeService } from './stake.service'
import { StakeResolver } from './stake.resolver'
import { StakeStatisticsEntity } from './stake-statistics.entity'
@Module({
  imports: [TypeOrmModule.forFeature([StakeEntity, StakeStatisticsEntity])],
  providers: [StakeService, StakeResolver],
  exports: [StakeService]
})
export class StakeModule {}
