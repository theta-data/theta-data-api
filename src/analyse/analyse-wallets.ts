import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { WalletModule } from 'src/block-chain/wallet/wallet.module'
import { WalletsAnalyseService } from 'src/block-chain/wallet/wallets-analyse.service'

async function bootstrap() {
  while (1) {
    const app = await NestFactory.createApplicationContext(AppModule)
    const service = app.select(WalletModule).get(WalletsAnalyseService, { strict: true })
    await service.analyseData()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    app.close()
    // await sleep(1000)
  }
}
bootstrap()
