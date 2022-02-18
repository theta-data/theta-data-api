import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { thetaTsSdk } from 'theta-ts-sdk'
const config = require('config')
thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))

const WEI = 1000000000000000000

export function truncateMiddle(str, maxLength = 20, separator = '...') {
  if (str && str.length <= 20) return str

  let diff = maxLength - separator.length
  let front = Math.ceil(diff / 2)
  let back = Math.floor(diff / 2)
  return str.substr(0, front) + separator + str.substr(str.length - back)
}

export function formatNumber(num, length = 0) {
  return num
    .toFixed(length)
    .toString()
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

export function formatCurrency(num, length = 2) {
  return '$' + num.toFixed(length).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

export function formatCoin(weiAmount, length = 4) {
  return new BigNumber(weiAmount).dividedBy(WEI).decimalPlaces(length).toFormat({
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3
  })
}

export function priceCoin(weiAmount, price) {
  return new BigNumber(weiAmount).dividedBy(WEI).multipliedBy(price).decimalPlaces(2).toFormat({
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3
  })
}

export function sumCoin(weiAmountA, weiAmountB) {
  return BigNumber.sum(new BigNumber(weiAmountA), new BigNumber(weiAmountB))
}

export function timeCoin(amountA, amountB) {
  return new BigNumber(amountA).times(amountB)
}

export function getQueryParam(search, name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
  let regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
  let results = regex.exec(search)
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
}

export function getTheta(weiAmount) {
  return new BigNumber(weiAmount).dividedBy(WEI).toFixed()
}

export function getHex(str) {
  const buffer = Buffer.from(str, 'base64')
  const bufString = buffer.toString('hex')
  return '0x' + bufString
}

export function getArguments(str) {
  let res = str
  const num = Math.floor(str.length / 64)
  res += `\n\n---------------Encoded View---------------\n${num} Constructor Argument${
    num > 1 ? 's' : ''
  } found :\n`
  for (let i = 0; i < num; i++) {
    res += `Arg [${i}] : ` + str.substring(i * 64, (i + 1) * 64) + '\n'
  }
  return res
}

export function validateHex(hash, limit) {
  const reg = new RegExp('^(0x){0,1}[0-9a-fA-F]{' + limit + '}$')
  return reg.test(hash)
}

// import { ethers } from 'ethers'
export function decodeLogs(
  logs,
  abi
): Array<{
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
      tokenId: string //"2977"
    }
    eventName: 'Transfer' | 'Approval' | 'ApprovalForAll'
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
}> {
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
      log.decode = 'Something wrong while decoding, met error: ' + e
      return log
    }
  })
}
// const data = decodeLogs(
//   [
//     {
//       address: '0x54f291157370999da7bb3036a717b1a06792a046',
//       topics: [
//         '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//         '0x0000000000000000000000000000000000000000000000000000000000000000',
//         '0x000000000000000000000000000ee983fee2b755d9848944f41c8f5cf9d7f3ae',
//         '0x00000000000000000000000000000000000000000000000000000000000000ee'
//       ],
//       data: '0N71IQAAAAAAAAAAAAAAAAAO6YP+4rdV2YSJRPQcj1z51/OuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE2luc2tzamYzOW0wN3g1dXY3NXUAAAAAAAAAAAAAAAAA'
//     }
//   ],
//   [
//     {
//       constant: true,
//       inputs: [{ name: 'interfaceId', type: 'bytes4' }],
//       name: 'supportsInterface',
//       outputs: [{ name: '', type: 'bool' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: 'creator',
//       outputs: [{ name: '', type: 'address' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: 'tokenId', type: 'uint256' }],
//       name: 'getApproved',
//       outputs: [{ name: '', type: 'address' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'to', type: 'address' },
//         { name: 'tokenId', type: 'uint256' }
//       ],
//       name: 'approve',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: 'totalSupply',
//       outputs: [{ name: '', type: 'uint256' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'from', type: 'address' },
//         { name: 'to', type: 'address' },
//         { name: 'tokenId', type: 'uint256' }
//       ],
//       name: 'transferFrom',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [
//         { name: 'owner', type: 'address' },
//         { name: 'index', type: 'uint256' }
//       ],
//       name: 'tokenOfOwnerByIndex',
//       outputs: [{ name: '', type: 'uint256' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'from', type: 'address' },
//         { name: 'to', type: 'address' },
//         { name: 'tokenId', type: 'uint256' }
//       ],
//       name: 'safeTransferFrom',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [{ name: 'instanceId', type: 'uint256' }],
//       name: 'burn',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: 'index', type: 'uint256' }],
//       name: 'tokenByIndex',
//       outputs: [{ name: '', type: 'uint256' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: 'tokenId', type: 'uint256' }],
//       name: 'ownerOf',
//       outputs: [{ name: '', type: 'address' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: 'owner', type: 'address' }],
//       name: 'balanceOf',
//       outputs: [{ name: '', type: 'uint256' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: 'owner',
//       outputs: [{ name: '', type: 'address' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'to', type: 'address' },
//         { name: 'approved', type: 'bool' }
//       ],
//       name: 'setApprovalForAll',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: '', type: 'uint256' }],
//       name: 'instances',
//       outputs: [
//         { name: 'minter', type: 'address' },
//         { name: 'original_owner', type: 'address' },
//         { name: 'off_chain_id', type: 'string' }
//       ],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'from', type: 'address' },
//         { name: 'to', type: 'address' },
//         { name: 'tokenId', type: 'uint256' },
//         { name: '_data', type: 'bytes' }
//       ],
//       name: 'safeTransferFrom',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [{ name: '_tokenId', type: 'uint256' }],
//       name: 'tokenURI',
//       outputs: [{ name: '', type: 'string' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [
//         { name: 'account', type: 'address' },
//         { name: 'instanceId', type: 'string' }
//       ],
//       name: 'mint',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: 'baseTokenURI',
//       outputs: [{ name: '', type: 'string' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [],
//       name: 'contractURI',
//       outputs: [{ name: '', type: 'string' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: true,
//       inputs: [
//         { name: 'owner', type: 'address' },
//         { name: 'operator', type: 'address' }
//       ],
//       name: 'isApprovedForAll',
//       outputs: [{ name: '', type: 'bool' }],
//       payable: false,
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       constant: false,
//       inputs: [{ name: 'newOwner', type: 'address' }],
//       name: 'transferOwnership',
//       outputs: [],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         { name: 'metadataUri', type: 'string' },
//         { name: 'baseTokenUri', type: 'string' }
//       ],
//       payable: false,
//       stateMutability: 'nonpayable',
//       type: 'constructor'
//     },
//     {
//       anonymous: false,
//       inputs: [
//         { indexed: true, name: 'from', type: 'address' },
//         { indexed: true, name: 'to', type: 'address' },
//         { indexed: true, name: 'tokenId', type: 'uint256' }
//       ],
//       name: 'Transfer',
//       type: 'event'
//     },
//     {
//       anonymous: false,
//       inputs: [
//         { indexed: true, name: 'owner', type: 'address' },
//         { indexed: true, name: 'approved', type: 'address' },
//         { indexed: true, name: 'tokenId', type: 'uint256' }
//       ],
//       name: 'Approval',
//       type: 'event'
//     },
//     {
//       anonymous: false,
//       inputs: [
//         { indexed: true, name: 'owner', type: 'address' },
//         { indexed: true, name: 'operator', type: 'address' },
//         { indexed: false, name: 'approved', type: 'bool' }
//       ],
//       name: 'ApprovalForAll',
//       type: 'event'
//     }
//   ]
// )
// console.log(JSON.stringify(data))

export function checkTnt721(abi) {
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

  return _check(obj, abi)
}

export function checkTnt20(abi) {
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

  return _check(obj, abi)
}

function _check(obj, abi) {
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

exports.normalize = function (hash) {
  const regex = /^0x/i
  return regex.test(hash) ? hash : '0x' + hash
}

exports.getBytecodeWithoutMetadata = function (bytecode) {
  // Last 4 chars of bytecode specify byte size of metadata component,
  const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4
  const metadataStarts = bytecode.slice(
    bytecode.length - metadataSize,
    bytecode.length - metadataSize + 14
  )
  const endPoint = bytecode.indexOf(metadataStarts)
  return bytecode.slice(0, endPoint)
}

exports.getHex = function (str) {
  const buffer = Buffer.from(str, 'base64')
  const bufString = buffer.toString('hex')
  return '0x' + bufString
}
exports.stampDate = function (sourceCode) {
  let date = new Date()
  const offset = date.getTimezoneOffset()
  date = new Date(date.getTime() - offset * 60 * 1000)
  return (
    `/**\n *Submitted for verification at thetatoken.org on ${
      date.toISOString().split('T')[0]
    }\n */\n` + sourceCode
  )
}

export const readSmartContract = async function (
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
  try {
    var abiCoder = new ethers.utils.AbiCoder()
    var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2)
    const data = functionSignature + encodedParameters
    const res = await thetaTsSdk.blockchain.callSmartContract(from, to, data)
    console.log('read smart contract', res)
    const outputValues = /^0x/i.test(res.result.vm_return)
      ? res.result.vm_return
      : '0x' + res.result.vm_return
    const decodeValues = abiCoder.decode(outputTypes, outputValues)
    console.log('decode', decodeValues)
    return decodeValues
  } catch (e) {
    console.log('error occurs:', e)
  }
}
