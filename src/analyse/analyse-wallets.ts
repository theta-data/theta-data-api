import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { WalletModule } from 'src/block-chain/wallet/wallet.module'
import { WalletsAnalyseService } from 'src/block-chain/wallet/wallets-analyse.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(WalletModule).get(WalletsAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
  }
}
bootstrap()
