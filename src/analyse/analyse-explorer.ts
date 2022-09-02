import { writeFailExcuteLog } from 'src/common/utils.service'
import { ExplorerAnalyseService } from './../block-chain/explorer/explorer-analyse.service'
import { ExplorerModule } from './../block-chain/explorer/explorer.module'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
const config = require('config')

async function bootstrap() {
  try {
    while (1) {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app.select(ExplorerModule).get(ExplorerAnalyseService, { strict: true })
      await service.analyseData()
      await new Promise((resolve) => setTimeout(resolve, config.get('EXPLORER.ANALYSE_INTERVAL')))
      app.close()
    }
  } catch (e) {
    console.log(e)
    writeFailExcuteLog(config.get('EXPLORER.MONITOR_PATH'))
    process.exit()
  }
}
bootstrap()
