import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'
import { AuthResolver } from './auth.resolver'
const config = require('config')
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: config.get('JWT_CONSTANTS').secret,
      signOptions: { expiresIn: '6000s' }
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, AuthResolver],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
