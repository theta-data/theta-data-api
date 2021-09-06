import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AnalyseService } from './analyse/analyse.service'
import { AnalyseModule } from './analyse/analyse.module'
// import { AppService } from './app.service'
const sleep = require('await-sleep')
const awaitHors = 2
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AnalyseModule)
  const taskService = app.get(AnalyseService)
  // while (1) {
  // await taskService.run()
  process.on('SIGINT', () => {
    console.log('reload')
    taskService.stopQueryData()
    setTimeout(() => {
      process.exit(0)
    }, 10000)
  })
  await taskService.queryDataFromBlockChain()
  // await sleep(awaitHors * 200)
  // }
}
bootstrap()
