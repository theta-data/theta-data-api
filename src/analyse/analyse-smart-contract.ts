import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { SmartContractAnalyseService } from 'src/block-chain/smart-contract/smart-contract-analyse.service'
import { SmartContractModule } from 'src/block-chain/smart-contract/smart-contract.module'
import { writeSucessExcuteLog } from 'src/common/utils.service'
const config = require('config')

async function bootstrap() {
  while (1) {
    try {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app
        .select(SmartContractModule)
        .get(SmartContractAnalyseService, { strict: true })

      await service.analyseData()
      await new Promise((resolve) =>
        setTimeout(resolve, config.get('SMART_CONTRACT.ANALYSE_INTERVAL'))
      )
      app.close()
    } catch (e) {
      console.log(e)
      writeSucessExcuteLog(config.get('SMART_CONTRACT.MONITOR_PATH'))
    }
  }
}
bootstrap()
