import { writeFailExcuteLog } from 'src/common/utils.service'
import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { NftAnalyseService } from 'src/block-chain/smart-contract/nft/nft-analyse.service'
import { NftModule } from 'src/block-chain/smart-contract/nft/nft.module'
const config = require('config')

async function bootstrap() {
  let i = 0
  try {
    while (1) {
      const app = await NestFactory.createApplicationContext(AppModule)
      const service = app.select(NftModule).get(NftAnalyseService, { strict: true })
      // console.log(a)
      const a = {}
      console.log(a['b']['c'])
      await service.analyseData(i)
      await new Promise((resolve) => setTimeout(resolve, config.get('NFT.ANALYSE_INTERVAL')))
      app.close()
      i++
    }
  } catch (e) {
    console.log('analyse-nft catch error')
    console.log(e)
    writeFailExcuteLog(config.get('NFT.MONITOR_PATH'))
    process.exit()
  }
}
bootstrap()
