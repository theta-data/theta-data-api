import { NestFactory } from '@nestjs/core'
import { AnalyseService } from './analyse/analyse.service'
import { AnalyseModule } from './analyse/analyse.module'
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AnalyseModule)
  const taskService = app.get(AnalyseService)
  await taskService.queryDataFromBlockChain()
}
bootstrap()
