import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { TxAnalyseService } from 'src/block-chain/tx/tx-analyse.service'
import { TxModule } from 'src/block-chain/tx/tx.module'
import sleep from 'await-sleep'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(TxModule).get(TxAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
    await sleep(1000)
  }
}
bootstrap()
