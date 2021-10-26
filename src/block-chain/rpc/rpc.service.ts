import { Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
// import config from 'config'
const config = require('config')
if (config.get('THETA_NODE_HOST')) {
  thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
} else {
  thetaTsSdk.blockchain.setUrl('http://localhost:16888/rpc')
}
@Injectable()
export class RpcService {
  constructor() {}
  public async getVersion() {
    return await thetaTsSdk.blockchain.getVersion()
  }

  public async
}
