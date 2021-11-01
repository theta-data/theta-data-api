import { Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
const config = require('config')
// if (config.get('THETA_NODE_HOST')) {
// } else {
//   thetaTsSdk.blockchain.setUrl('http://localhost:16888/rpc')
// }
@Injectable()
export class RpcService {
  constructor() {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }
  public async getVersion() {
    return await thetaTsSdk.blockchain.getVersion()
  }

  public async
}
