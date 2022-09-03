import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { WalletModule } from 'src/block-chain/wallet/wallet.module'
import { WalletsAnalyseService } from 'src/block-chain/wallet/wallets-analyse.service'
import { writeFailExcuteLog } from 'src/common/utils.service'
const config = require('config')
async function bootstrap() {
  try {
    while (1) {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app.select(WalletModule).get(WalletsAnalyseService, { strict: true })
      await Promise.race([
        service.analyseData(),
        new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve('timeout')
            this.logger.debug('timeout')
          }, 1000 * 60 * 5)
        })
      ])
      // await service.analyseData()
      await new Promise((resolve) => setTimeout(resolve, config.get('WALLET.ANALYSE_INTERVAL')))
      app.close()
      // await sleep(1000)
    }
  } catch (e) {
    console.log(e)
    writeFailExcuteLog(config.get('WALLET.MONITOR_PATH'))
    process.exit()
  }
}
bootstrap()
