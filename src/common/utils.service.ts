import { Injectable, Logger } from '@nestjs/common'
// import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
// import { Logger } from 'ethers/lib/utils'
import { thetaTsSdk } from 'theta-ts-sdk'
const config = require('config')
const fs = require('fs')
const stream = require('stream')
const url = require('url')
const { promisify } = require('util')
const got = require('got')
export interface LOG_DECODE_INTERFACE {
  address: string
  data: string
  topics: Array<string>
  decode: {
    result: {
      '0': string
      '1': string
      '2': string //"2977",
      from: string //"0xD79Af707db0c2Be0a80D040a87f3d35b08043920",
      to: string //"0xDEa859B1FFF4FdE81a3DCeCcf6a47bE4f878Cc2d",
      tokenId?: string //"2977"
      nftTokenID?: string //"1968"
      nftTokenAddress?: string //"0xB8153C0e8Ed32943e60630Bfd8CCDFB1E32e43D4"
      paymentTokenAmount?: string //"1264837509977270451409",
      price?: string //"1000000000000000000",
      tdropMined?: string //"244999837273506757285"
      seller?: string //"0x9DD37001080B93856aD1B438dCbd0CAB54264b61"
      buyer?: string //"0xD79Af707db0c2Be0a80D040a87f3d35b08043920"
      isSold?: string //"true"
      nftContract?: string //"0xB8153C0e8Ed32943e60630Bfd8CCDFB1E32e43D4"
      owner?: string //"0xD79Af707db0c2Be0a80D040a87f3d35b08043920"
      // tokenId ?: string //"2977"
    }
    eventName: 'Transfer' | 'Approval' | 'ApprovalForAll' | 'NFTTraded' | 'MarketItemSale'
    event: {
      anonymous: boolean //false,
      inputs: [
        {
          indexed: boolean //true,
          name: string //"from",
          type: string //"address"
        }
      ]
      name: string //"Transfer",
      type: string //"event"
    }
  }
}
@Injectable()
export class UtilsService {
  logger = new Logger()
  constructor() {
    // thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }

  decodeLogs(logs, abi): Array<LOG_DECODE_INTERFACE> {
    const iface = new ethers.utils.Interface(abi || [])
    return logs.map((log) => {
      try {
        let event = null
        for (let i = 0; i < abi.length; i++) {
          let item = abi[i]
          if (item.type != 'event') continue
          const hash = iface.getEventTopic(item.name)
          if (hash == log.topics[0]) {
            event = item
            break
          }
        }
        if (event != null) {
          let bigNumberData = iface.decodeEventLog(event.name, log.data, log.topics)
          let data = {}
          Object.keys(bigNumberData).forEach((k) => {
            data[k] = bigNumberData[k].toString()
          })
          log.decode = {
            result: data,
            eventName: event.name,
            event: event
          }
        } else {
          log.decode = 'No matched event or the smart contract source code has not been verified.'
        }
        return log
      } catch (e) {
        throw new Error('Something wrong while decoding, met error: ' + e)
        // log.decode = 'Something wrong while decoding, met error: ' + e
        // return log
      }
    })
  }

  checkTnt721(abi) {
    const obj = {
      balanceOf: { contains: false, type: 'function' },
      ownerOf: { contains: false, type: 'function' },
      safeTransferFrom: { contains: false, type: 'function' },
      transferFrom: { contains: false, type: 'function' },
      approve: { contains: false, type: 'function' },
      setApprovalForAll: { contains: false, type: 'function' },
      getApproved: { contains: false, type: 'function' },
      isApprovedForAll: { contains: false, type: 'function' },
      Transfer: { contains: false, type: 'event' },
      Approval: { contains: false, type: 'event' },
      ApprovalForAll: { contains: false, type: 'event' }
    }

    return this.check(obj, abi)
  }

  checkTnt20(abi) {
    const obj = {
      name: { contains: false, type: 'function' },
      symbol: { contains: false, type: 'function' },
      decimals: { contains: false, type: 'function' },
      totalSupply: { contains: false, type: 'function' },
      balanceOf: { contains: false, type: 'function' },
      transfer: { contains: false, type: 'function' },
      transferFrom: { contains: false, type: 'function' },
      approve: { contains: false, type: 'function' },
      allowance: { contains: false, type: 'function' },
      Transfer: { contains: false, type: 'event' },
      Approval: { contains: false, type: 'event' }
    }

    return this.check(obj, abi)
  }

  check(obj, abi) {
    abi.forEach((o) => {
      if (obj[o.name] !== undefined) {
        if (obj[o.name].type === o.type) {
          obj[o.name].contains = true
        }
      }
    })
    let res = true
    for (let key in obj) {
      res = res && obj[key].contains
    }
    return res
  }

  async readSmartContract(
    from: string,
    to: string,
    abi: any,
    functionName: string,
    inputTypes: Array<any>,
    inputValues: Array<any>,
    outputTypes: Array<any>
  ) {
    const iface = new ethers.utils.Interface(abi || [])
    const functionSignature = iface.getSighash(functionName)
    // try {
    var abiCoder = new ethers.utils.AbiCoder()
    var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2)
    const data = functionSignature + encodedParameters
    this.logger.debug('from:' + from + '; to:' + to + '; data:' + data)
    const res = await thetaTsSdk.blockchain.callSmartContract(from, to, data)
    this.logger.debug('read smart contract: ' + JSON.stringify(res))
    const outputValues = /^0x/i.test(res.result.vm_return)
      ? res.result.vm_return
      : '0x' + res.result.vm_return
    const decodeValues = abiCoder.decode(outputTypes, outputValues)
    this.logger.debug('decode: ' + JSON.stringify(decodeValues))
    return decodeValues
    // } catch (e) {
    //   console.log('error occurs:', e)
    // }
  }

  normalize = function (hash) {
    const regex = /^0x/i
    return regex.test(hash) ? hash : '0x' + hash
  }

  getHex(str) {
    const buffer = Buffer.from(str, 'base64')
    const bufString = buffer.toString('hex')
    return '0x' + bufString
  }

  getBytecodeWithoutMetadata(bytecode) {
    // Last 4 chars of bytecode specify byte size of metadata component,
    const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4
    const metadataStarts = bytecode.slice(
      bytecode.length - metadataSize,
      bytecode.length - metadataSize + 14
    )
    const endPoint = bytecode.indexOf(metadataStarts)
    return bytecode.slice(0, endPoint)
  }

  stampDate(sourceCode) {
    let date = new Date()
    const offset = date.getTimezoneOffset()
    date = new Date(date.getTime() - offset * 60 * 1000)
    return (
      `/**\n *Submitted for verification at thetadata.io on ${
        date.toISOString().split('T')[0]
      }\n */\n` + sourceCode
    )
  }

  getRecordHeight(path: string) {
    const fs = require('fs')
    if (!fs.existsSync(path)) {
      this.logger.debug('read height')
      // mkdirSync(this.heightConfigFile)
      this.logger.debug('finish mkdir')
      fs.writeFileSync(path, '0')
      return 0
    } else {
      const data = fs.readFileSync(path, 'utf8')
      return Number(data) + 1
    }
  }

  updateRecordHeight(path: string, height: number) {
    const fs = require('fs')
    fs.writeFileSync(path, height.toString())
  }

  getRandomStr(length: number) {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }

  async downloadImage(urlPath: string, storePath: string): Promise<string | null> {
    this.logger.debug('url path: ' + urlPath)
    if (!urlPath) return null
    const pipeline = promisify(stream.pipeline)
    // const got: any = await import('got')
    // got.default()
    var path = require('path')
    var parsed = url.parse(urlPath)
    // if(!pa)
    if (!parsed.hostname) {
      return urlPath.replace(storePath, '')
    }
    // const ext = ['gif', 'png', 'jpg', 'jpeg']
    if (
      !parsed.pathname.includes('gif') &&
      !parsed.pathname.includes('png') &&
      !parsed.pathname.includes('jpg') &&
      !parsed.pathname.includes('jpeg')
    ) {
      return null
    }
    const imgPath = storePath + '/' + parsed.hostname.replace(/\./g, '-')
    const imgStorePath = imgPath + parsed.pathname
    const pathArr = imgStorePath.split('/')
    pathArr.pop()

    if (!fs.existsSync(pathArr.join('/'))) {
      fs.mkdirSync(pathArr.join('/'), { recursive: true })
    }

    console.log(path.basename(parsed.pathname))
    if (!fs.existsSync(imgStorePath)) {
      try {
        await pipeline(got.stream(urlPath), fs.createWriteStream(imgStorePath))
        return imgStorePath.replace(storePath, '')
      } catch (e) {
        console.error(e)
        return null
      }
    } else {
      return imgStorePath.replace(storePath, '')
    }
  }
}
