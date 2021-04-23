import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersEntity } from './users.entity'
import { UsersAuthEntity } from './users-auth.entity'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from '../auth/constants'
const config = require('config')
@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity, UsersAuthEntity]),
    ClientsModule.register([
      {
        name: 'MAIL_SERVICE',
        transport: Transport.REDIS,
        options: {
          url: 'redis://' + config.get('REDIS')['host'] + ':' + config.get('REDIS')['port']
        }
      }
    ]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '6000s' }
    })
  ],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
