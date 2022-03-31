import { SerializeOptions } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { NftAnalyseService } from 'src/block-chain/smart-contract/nft/nft-analyse.service'
import { NftModule } from 'src/block-chain/smart-contract/nft/nft.module'
import sleep from 'await-sleep'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  const service = app.select(NftModule).get(NftAnalyseService, { strict: true })
  while (1) {
    console.log('do while')
    await service.analyseData()
    await sleep(1000)
    // await sleep
  }
}
bootstrap()
