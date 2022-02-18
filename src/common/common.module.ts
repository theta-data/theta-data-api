import { Module } from '@nestjs/common'
import { SolcService } from './solc.service'
import { UtilsService } from './utils.service'

@Module({
  imports: [],
  providers: [SolcService, UtilsService],
  exports: [SolcService, UtilsService]
})
export class CommonModule {}
