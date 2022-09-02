import { writeFailExcuteLog } from 'src/common/utils.service'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { StakeAnalyseService } from 'src/block-chain/stake/stake-analyse.service'
import { StakeModule } from 'src/block-chain/stake/stake.module'
const config = require('config')
async function bootstrap() {
  while (1) {
    try {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app.select(StakeModule).get(StakeAnalyseService, { strict: true })
      await service.analyseData()
      await new Promise((resolve) => setTimeout(resolve, config.get('STAKE.ANALYSE_INTERVAL')))
      app.close()
    } catch (e) {
      writeFailExcuteLog(config.get('STAKE.MONITOR_PATH'))
      console.log(e)
    }
  }
}
bootstrap()
