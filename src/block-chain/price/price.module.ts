import { TypeOrmModule } from '@nestjs/typeorm'
import { StakeEntity } from '../stake/stake.entity'
import { StakeService } from '../stake/stake.service'
import { StakeResolver } from '../stake/stake.resolver'
import { CacheModule, Module } from '@nestjs/common'
import { PriceResolver } from './price.resolver'

@Module({
  imports: [CacheModule],
  providers: [PriceResolver],
  exports: []
})
export class PriceModule {}
