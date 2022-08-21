import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { NftAnalyseService } from 'src/block-chain/smart-contract/nft/nft-analyse.service'
import { NftModule } from 'src/block-chain/smart-contract/nft/nft.module'
const config = require('config')

async function bootstrap() {
  while (1) {
    const app = await NestFactory.createApplicationContext(AppModule)
    const service = app.select(NftModule).get(NftAnalyseService, { strict: true })

    await service.analyseData()
    await new Promise((resolve) => setTimeout(resolve, config.get('NFT.ANALYSE_INTERVAL')))
    app.close()
  }
}
bootstrap()
