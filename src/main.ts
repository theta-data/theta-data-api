import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { NestExpressApplication } from '@nestjs/platform-express'
const config = require('config')
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true })
  app.set('trust proxy', true)
  // app.set()
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
    }
  })
  await app.startAllMicroservicesAsync()
  await app.listen(3000)
}
bootstrap()
