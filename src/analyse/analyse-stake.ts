import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { StakeAnalyseService } from 'src/block-chain/stake/stake-analyse.service'
import { StakeModule } from 'src/block-chain/stake/stake.module'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(StakeModule).get(StakeAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
  }
}
bootstrap()
