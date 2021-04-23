import { Inject, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UsersAuthEntity } from './users-auth.entity'
import { Repository } from 'typeorm'
import { UsersEntity } from './users.entity'
import { ResInfo } from './user-info.model'
import { CODE_ENUM } from '../common/code.enum'
import { USER_IDENTIFY_TYPE_ENUM, USER_STATUS_ENUM } from '../auth/auth.enum'
import { ClientProxy } from '@nestjs/microservices'
import { JwtService } from '@nestjs/jwt'

export type User = any
const bcrypt = require('bcrypt')
const moment = require('moment')
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersAuthEntity) private userAuthRepository: Repository<UsersAuthEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @Inject('MAIL_SERVICE') private client: ClientProxy,
    private jwtService: JwtService
  ) {}

  async register(email: string, password: string): Promise<ResInfo> {
    const saltRounds = 10
    let user = await this.usersRepository.findOne({ email: email })
    if (user) return { code: CODE_ENUM.register_user_exist, message: 'user exist' }
    let userEntity = new UsersEntity()
    let userAuthEntity = new UsersAuthEntity()
    userAuthEntity.identify_key = email
    userAuthEntity.identify_type = USER_IDENTIFY_TYPE_ENUM.web
    userAuthEntity.credential = await bcrypt.hash(password, saltRounds)
    if (!userEntity.auth) userEntity.auth = []
    userEntity.auth.push(userAuthEntity)
    userEntity.email = email
    userEntity.status = USER_STATUS_ENUM.register
    await this.usersRepository.save(userEntity)
    const access_token = this.jwtService.sign({
      login_time: moment().format(),
      email: email
    })
    this.client.emit<number>('send_mail', {
      from: 'THETA DATA',
      to: userEntity.email,
      subject: 'Email Verification',
      text:
        'Welcome to Register your Account. Please click the url to verify your account. https://www.thetadata.io/auth/verification-success?access_token=' +
        access_token
    })

    return { code: CODE_ENUM.success, userInfo: { email: email, status: userEntity.status } }
  }

  async login(email: string, password: string): Promise<ResInfo> {
    let userAuth = await this.userAuthRepository.findOne({
      relations: ['user'],
      where: { identify_key: email, identify_type: USER_IDENTIFY_TYPE_ENUM.web }
    })
    if (!userAuth) {
      return { code: CODE_ENUM.login_no_user }
    }
    const match = await bcrypt.compare(password, userAuth.credential)
    if (!match) {
      return { code: CODE_ENUM.login_password_error }
    }
    return {
      code: CODE_ENUM.success,
      userInfo: {
        email: userAuth.user.email,
        status: userAuth.user.status
      }
    }
  }

  async verifyEmail(email: string) {
    let user = await this.userAuthRepository.findOne({
      relations: ['user'],
      where: { identify_key: email, identify_type: USER_IDENTIFY_TYPE_ENUM.web }
    })
    user.user.status = USER_STATUS_ENUM.email_checked
    await this.userAuthRepository.save(user)
  }
}
