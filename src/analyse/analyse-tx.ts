import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { TxAnalyseService } from 'src/block-chain/tx/tx-analyse.service'
import { TxModule } from 'src/block-chain/tx/tx.module'
import { writeFailExcuteLog } from 'src/common/utils.service'
const config = require('config')
async function bootstrap() {
  try {
    while (1) {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app.select(TxModule).get(TxAnalyseService, { strict: true })

      // console.log('do while')
      await service.analyseData()
      await new Promise((resolve) => setTimeout(resolve, config.get('TX.ANALYSE_INTERVAL')))
      app.close()
    }
  } catch (e) {
    console.log(e)
    writeFailExcuteLog(config.get('TX.MONITOR_PATH'))
  }
}
bootstrap()
