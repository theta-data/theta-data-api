import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AnalyseService } from './analyse/analyse.service'
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true })
  app.set('trust proxy', true)
  // const taskService = app.get(AnalyseService)
  // taskService.queryDataFromBlockChain()
  await app.listen(3000)
}
bootstrap()
