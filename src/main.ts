import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
const config = require('config')
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
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
