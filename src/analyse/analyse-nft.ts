import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { NftAnalyseService } from 'src/block-chain/smart-contract/nft/nft-analyse.service'
import { NftModule } from 'src/block-chain/smart-contract/nft/nft.module'
const config = require('config')

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(NftModule).get(NftAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
    await new Promise((resolve) => setTimeout(resolve, config.get('NFT.ANALYSE_INTERVAL')))
    // await sleep
  }
}
bootstrap()
