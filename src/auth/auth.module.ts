import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { jwtConstants } from './constants'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'
import { AuthResolver } from './auth.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersEntity } from '../users/users.entity'
import { UsersAuthEntity } from '../users/users-auth.entity'
import { ClientsModule, Transport } from '@nestjs/microservices'
const config = require('config')
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '6000s' }
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, AuthResolver],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
