import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { SmartContractAnalyseService } from 'src/block-chain/smart-contract/smart-contract-analyse.service'
import { SmartContractModule } from 'src/block-chain/smart-contract/smart-contract.module'
import sleep from 'await-sleep'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(SmartContractModule).get(SmartContractAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
    await sleep(1000)
  }
}
bootstrap()
