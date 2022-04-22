import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as bodyParser from 'body-parser'
// import { logger } from './logger/logger.middleware'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true })
  app.set('trust proxy', true)
  app.use(
    bodyParser.json({
      limit: '50mb'
    })
  )

  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      parameterLimit: 100000,
      extended: true
    })
  )
  // const logger = new LoggerMiddleware()
  // app.use(logger)
  console.log('listen:' + process.env.PORT)
  if (process.env.PORT) await app.listen(process.env.PORT)
  else await app.listen(3000)
}
bootstrap()
