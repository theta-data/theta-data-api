import { Module } from '@nestjs/common'
import { SolcService } from './solc.service'

@Module({
  imports: [],
  providers: [SolcService],
  exports: [SolcService]
})
export class CommonModule {}
