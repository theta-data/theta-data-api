import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { StakeAnalyseService } from 'src/block-chain/stake/stake-analyse.service'
import { StakeModule } from 'src/block-chain/stake/stake.module'

async function bootstrap() {
  while (1) {
    const app = await NestFactory.createApplicationContext(AppModule)
    const service = app.select(StakeModule).get(StakeAnalyseService, { strict: true })
    await service.analyseData()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    app.close()
  }
}
bootstrap()
