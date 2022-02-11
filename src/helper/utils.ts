import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import { thetaTsSdk } from 'theta-ts-sdk'
// import Theta from 'src/libs/Theta'
import ThetaJS from '../libs/thetajs.esm'

const WEI = 1000000000000000000
const CommonABIs = {
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': [
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' }
      ],
      name: 'Transfer',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: true, name: 'tokenId', type: 'uint256' }
      ],
      name: 'Transfer',
      type: 'event'
    }
  ],
  '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': [
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: true, name: 'spender', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' }
      ],
      name: 'Approval',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: true, name: 'approved', type: 'address' },
        { indexed: true, name: 'tokenId', type: 'uint256' }
      ],
      name: 'Approval',
      type: 'event'
    }
  ],
  '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': [
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'owner', type: 'address' },
        { indexed: true, name: 'operator', type: 'address' },
        { indexed: false, name: 'approved', type: 'bool' }
      ],
      name: 'ApprovalForAll',
      type: 'event'
    }
  ]
}
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
        // {
        //     "indexed":true,
        //     "name":"to",
        //     "type":"address"
        // },
        // {
        //     "indexed":true,
        //     "name":"tokenId",
        //     "type":"uint256"
        // }
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
//       address: '0x59b15f0da35ce927d465c2215d022cb45d930584',
//       data: '0x23b872dd000000000000000000000000d79af707db0c2be0a80d040a87f3d35b08043920000000000000000000000000dea859b1fff4fde81a3dceccf6a47be4f878cc2d0000000000000000000000000000000000000000000000000000000000000ba1',
//       topics: [
//         '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//         '0x000000000000000000000000d79af707db0c2be0a80d040a87f3d35b08043920',
//         '0x000000000000000000000000dea859b1fff4fde81a3dceccf6a47be4f878cc2d',
//         '0x0000000000000000000000000000000000000000000000000000000000000ba1'
//       ]
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
  const senderSequence = 1
  const functionSignature = iface.getSighash(functionName)
  const gasPrice = 0.000001
  try {
    var abiCoder = new ethers.utils.AbiCoder()
    var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2)
    const gasLimit = 2000000
    const data = functionSignature + encodedParameters
    console.log('data', data)
    const ten18 = new BigNumber(10).pow(18) // 10^18, 1 Theta = 10^18 ThetaWei, 1 Gamma = 10^ TFuelWei
    const feeInTFuelWei = new BigNumber(gasPrice).multipliedBy(ten18) // Any fee >= 10^12 TFuelWei should work, higher fee yields higher priority

    const tx = new ThetaJS.SmartContractTx(
      from,
      to,
      gasLimit,
      feeInTFuelWei,
      data,
      0,
      senderSequence
    )

    const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx)
    const sctxBytes: string = rawTxBytes.toString('hex').slice(2)
    const res = await thetaTsSdk.blockchain.callSmartContract(sctxBytes)
    console.log(res)
    // let outputValues =
    //   '0000000000000000000000004aaa915f23f581e85e5c03c4514eac91aa05ce35000000000000000000000000718ed825af070b41e51aa26e38eeb985e472faa60000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000004d747970655f6832666261686d31356478306e657635786270697473736664396e2e6a736f6e3f6e66745f69643d6e66745f7976786830377069666d6d35616e357962353376376663333574716800000000000000000000000000000000000000'
    const outputValues = /^0x/i.test(res.result.vm_return)
      ? res.result.vm_return
      : '0x' + res.result.vm_return
    const decodeValues = abiCoder.decode(outputTypes, outputValues)
    console.log('decode', decodeValues)
    return decodeValues
  } catch (e) {
    console.log('error occurs:', e)
    //Stop loading and put the error message in the vm_error like it came from the blockchain.
    // setCallResult({ vm_error: e.message })
  }
}
// readSmartContract(
//   '0x8366537d56cf2b86ca90e9dbc89450207a29f6e3',
//   '0x8366537d56cf2b86ca90e9dbc89450207a29f6e3',
//   [
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: '_factory',
//           type: 'address'
//         },
//         {
//           internalType: 'address',
//           name: '_WETH',
//           type: 'address'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'constructor'
//     },
//     {
//       anonymous: false,
//       inputs: [
//         {
//           indexed: false,
//           internalType: 'address',
//           name: 'calculatedPairAddr',
//           type: 'address'
//         }
//       ],
//       name: 'CalculatePairAddress',
//       type: 'event'
//     },
//     {
//       anonymous: false,
//       inputs: [
//         {
//           indexed: false,
//           internalType: 'uint256',
//           name: 'status',
//           type: 'uint256'
//         }
//       ],
//       name: 'Create2Invoked',
//       type: 'event'
//     },
//     {
//       inputs: [],
//       name: 'WETH',
//       outputs: [
//         {
//           internalType: 'address',
//           name: '',
//           type: 'address'
//         }
//       ],
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'tokenA',
//           type: 'address'
//         },
//         {
//           internalType: 'address',
//           name: 'tokenB',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountADesired',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountBDesired',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountAMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountBMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'addLiquidity',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountA',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountB',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'token',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenDesired',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETHMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'addLiquidityETH',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountToken',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETH',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'payable',
//       type: 'function'
//     },
//     {
//       inputs: [],
//       name: 'factory',
//       outputs: [
//         {
//           internalType: 'address',
//           name: '',
//           type: 'address'
//         }
//       ],
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveOut',
//           type: 'uint256'
//         }
//       ],
//       name: 'getAmountIn',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'pure',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveOut',
//           type: 'uint256'
//         }
//       ],
//       name: 'getAmountOut',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'pure',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         }
//       ],
//       name: 'getAmountsIn',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         }
//       ],
//       name: 'getAmountsOut',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'view',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountA',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveA',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'reserveB',
//           type: 'uint256'
//         }
//       ],
//       name: 'quote',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountB',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'pure',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'tokenA',
//           type: 'address'
//         },
//         {
//           internalType: 'address',
//           name: 'tokenB',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountAMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountBMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'removeLiquidity',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountA',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountB',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'token',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETHMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'removeLiquidityETH',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountToken',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETH',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'token',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETHMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'removeLiquidityETHSupportingFeeOnTransferTokens',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountETH',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'token',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETHMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         },
//         {
//           internalType: 'bool',
//           name: 'approveMax',
//           type: 'bool'
//         },
//         {
//           internalType: 'uint8',
//           name: 'v',
//           type: 'uint8'
//         },
//         {
//           internalType: 'bytes32',
//           name: 'r',
//           type: 'bytes32'
//         },
//         {
//           internalType: 'bytes32',
//           name: 's',
//           type: 'bytes32'
//         }
//       ],
//       name: 'removeLiquidityETHWithPermit',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountToken',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETH',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'token',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountTokenMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountETHMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         },
//         {
//           internalType: 'bool',
//           name: 'approveMax',
//           type: 'bool'
//         },
//         {
//           internalType: 'uint8',
//           name: 'v',
//           type: 'uint8'
//         },
//         {
//           internalType: 'bytes32',
//           name: 'r',
//           type: 'bytes32'
//         },
//         {
//           internalType: 'bytes32',
//           name: 's',
//           type: 'bytes32'
//         }
//       ],
//       name: 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountETH',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'address',
//           name: 'tokenA',
//           type: 'address'
//         },
//         {
//           internalType: 'address',
//           name: 'tokenB',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'liquidity',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountAMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountBMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         },
//         {
//           internalType: 'bool',
//           name: 'approveMax',
//           type: 'bool'
//         },
//         {
//           internalType: 'uint8',
//           name: 'v',
//           type: 'uint8'
//         },
//         {
//           internalType: 'bytes32',
//           name: 'r',
//           type: 'bytes32'
//         },
//         {
//           internalType: 'bytes32',
//           name: 's',
//           type: 'bytes32'
//         }
//       ],
//       name: 'removeLiquidityWithPermit',
//       outputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountA',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountB',
//           type: 'uint256'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapETHForExactTokens',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'payable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactETHForTokens',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'payable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
//       outputs: [],
//       stateMutability: 'payable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactTokensForETH',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
//       outputs: [],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactTokensForTokens',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountIn',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountOutMin',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
//       outputs: [],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountInMax',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapTokensForExactETH',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       inputs: [
//         {
//           internalType: 'uint256',
//           name: 'amountOut',
//           type: 'uint256'
//         },
//         {
//           internalType: 'uint256',
//           name: 'amountInMax',
//           type: 'uint256'
//         },
//         {
//           internalType: 'address[]',
//           name: 'path',
//           type: 'address[]'
//         },
//         {
//           internalType: 'address',
//           name: 'to',
//           type: 'address'
//         },
//         {
//           internalType: 'uint256',
//           name: 'deadline',
//           type: 'uint256'
//         }
//       ],
//       name: 'swapTokensForExactTokens',
//       outputs: [
//         {
//           internalType: 'uint256[]',
//           name: 'amounts',
//           type: 'uint256[]'
//         }
//       ],
//       stateMutability: 'nonpayable',
//       type: 'function'
//     },
//     {
//       stateMutability: 'payable',
//       type: 'receive'
//     }
//   ],
//   'WETH',
//   [],
//   [],
//   ['address']
// )
