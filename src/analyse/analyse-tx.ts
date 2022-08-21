import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { TxAnalyseService } from 'src/block-chain/tx/tx-analyse.service'
import { TxModule } from 'src/block-chain/tx/tx.module'

async function bootstrap() {
  while (1) {
    const app = await NestFactory.createApplicationContext(AppModule)
    const service = app.select(TxModule).get(TxAnalyseService, { strict: true })

    // console.log('do while')
    await service.analyseData()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    app.close()
  }
}
bootstrap()
