import { Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
thetaTsSdk.blockchain.setUrl('localhost:16888')
@Injectable()
export class RpcService {
  constructor() {}
  public async getVersion() {
    return await thetaTsSdk.blockchain.getVersion()
  }

  public async
}
