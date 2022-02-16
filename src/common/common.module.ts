import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SolcService } from './solc.service'

@Module({
  imports: [],
  providers: [SolcService],
  exports: [SolcService]
})
export class CommonModule {}
