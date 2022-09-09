import { writeFailExcuteLog } from 'src/common/utils.service'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { NftStatisticsAnalyseService } from 'src/statistics/nft/nft-statistics-analyse.service'
import { NftStatisticsModule } from 'src/statistics/nft/nft-statistics.module'
const config = require('config')

async function bootstrap() {
  try {
    while (1) {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app
        .select(NftStatisticsModule)
        .get(NftStatisticsAnalyseService, { strict: true })

      console.log('do while')
      await Promise.race([
        service.analyseData(),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('timeout')
            console.log('analyse race timeout')
            // this.logger.debug('timeout')
          }, 1000 * 60 * 5)
        })
      ])
      await new Promise((resolve) =>
        setTimeout(resolve, config.get('NFT_STATISTICS.ANALYSE_INTERVAL'))
      )
      app.close()
    }
  } catch (e) {
    writeFailExcuteLog(config.get('NFT_STATISTICS.MONITOR_PATH'))
    console.log(e)
    process.exit()
  }
}
bootstrap()
