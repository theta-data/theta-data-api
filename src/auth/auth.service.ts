import { Inject, Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { CODE_ENUM } from '../common/code.enum'
import { ResInfo } from '../users/user-info.model'
import { ClientProxy } from '@nestjs/microservices'
const moment = require('moment')
@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async login(email: string, password: string): Promise<ResInfo> {
    let checkRes = await this.usersService.login(email, password)
    if (checkRes.code !== CODE_ENUM.success) {
      return checkRes
    }
    const payload = {
      login_time: moment().format(),
      email: checkRes.userInfo.email
    }
    console.log('jwt test', this.jwtService.decode(this.jwtService.sign(payload)))
    return { code: CODE_ENUM.success, message: this.jwtService.sign(payload) }
  }

  async register(userName: string, password: string) {
    return await this.usersService.register(userName, password)
  }

  async validateUser(userName: string, password: string) {
    return {}
  }

  async verifyEmail(email: string) {
    await this.usersService.verifyEmail(email)
  }
}
