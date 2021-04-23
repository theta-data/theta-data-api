import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
const config = require('config')
console.log('redis', 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port'])
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      // port: 5000
      url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
      // url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
    }
  })
  await app.startAllMicroservicesAsync()
  await app.listen(3000)
}
bootstrap()
