import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { ResInfo, UserInfo, UserLoginInfo } from '../users/user-info.model'
import { GqlAuthGuard } from './gql-auth.guard'
import { UseGuards } from '@nestjs/common'
import { CurrentUser } from './constants'
import { CODE_ENUM } from '../common/code.enum'

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation((returns) => ResInfo)
  async register(@Args('email') email: string, @Args('password') password: string) {
    return this.authService.register(email, password)
  }

  @Mutation(() => ResInfo)
  async login(@Args('email') email: string, @Args('password') password: string) {
    return await this.authService.login(email, password)
  }

  @Mutation(() => ResInfo)
  @UseGuards(GqlAuthGuard)
  async confirmEmail(): Promise<ResInfo> {
    return { code: CODE_ENUM.success }
  }

  @Query((returns) => UserInfo)
  @UseGuards(GqlAuthGuard)
  whoAmI(@CurrentUser() user: UserLoginInfo) {
    // console.log('user', user)
    // const pattern = { cmd: 'sum' }
    // const payload = [1, 2, 3]
    // this.client.emit<number>('user_created', { aa: 11 })
    return { email: user.email, status: 0 }
  }
}
