import { Injectable, Logger } from '@nestjs/common'
import { registerEnumType } from '@nestjs/graphql'
import { InjectRepository } from '@nestjs/typeorm'
import { NftTransferRecordEntity } from 'src/block-chain/smart-contract/nft/nft-transfer-record.entity'
import { FindManyOptions, LessThan, Repository } from 'typeorm'
import { NftStatisticsEntity } from './nft-statistics.entity'
import { NftDetailByDate, NftDetailType } from './nft-statistics.model'

export enum NftStatisticsOrderByType {
  last_24_h_users,
  last_7_days_users,
  last_30_days_users,
  last_24_h_transactions,
  last_7_days_transactions,
  last_30_days_transactions,
  last_24_h_volume,
  last_7_days_volume,
  last_30_days_volume
}
registerEnumType(NftStatisticsOrderByType, {
  name: 'NftStatisticsOrderByType',
  description: 'NftStatisticsOrderByType'
})
const moment = require('moment')
@Injectable()
export class NftStatisticsService {
  logger = new Logger()

  constructor(
    @InjectRepository(NftStatisticsEntity, 'nft-statistics')
    private nftStatisticsRepository: Repository<NftStatisticsEntity>,
    @InjectRepository(NftTransferRecordEntity, 'nft')
    private nftTransferRecordRepository: Repository<NftTransferRecordEntity>
  ) {}

  async getNft(
    orderBy: NftStatisticsOrderByType = NftStatisticsOrderByType.last_24_h_users,
    take: number = 20,
    after: string | undefined,
    skip = 0
  ): Promise<[boolean, number, Array<NftStatisticsEntity>]> {
    const condition: FindManyOptions<NftStatisticsEntity> = {
      where: {},
      take: take + 1,
      skip: skip,
      order: {}
    }
    switch (orderBy) {
      case NftStatisticsOrderByType.last_24_h_users:
        condition.order.last_24_h_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_users:
        condition.order.last_7_days_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_users:
        condition.order.last_30_days_users = 'DESC'
        break
      case NftStatisticsOrderByType.last_24_h_transactions:
        condition.order.last_24_h_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_transactions:
        condition.order.last_30_days_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_transactions:
        condition.order.last_30_days_transactions = 'DESC'
        break
      case NftStatisticsOrderByType.last_24_h_volume:
        condition.order.last_24_h_volume = 'DESC'
        break
      case NftStatisticsOrderByType.last_7_days_volume:
        condition.order.last_7_days_volume = 'DESC'
        break
      case NftStatisticsOrderByType.last_30_days_volume:
        condition.order.last_30_days_volume = 'DESC'
        break
      default:
        condition.order.last_24_h_users = 'DESC'
        break
    }

    if (after) {
      const num = Number(Buffer.from(after, 'base64').toString('ascii'))
      this.logger.debug('decode from base64:' + num)
      switch (orderBy) {
        case NftStatisticsOrderByType.last_24_h_users:
          condition.where['last_24_h_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_users:
          condition.where['last_7_days_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_users:
          condition.where['last_30_days_users'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_24_h_transactions:
          condition.where['last_24_h_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_transactions:
          condition.where['last_7_days_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_30_days_transactions:
          condition.where['last_30_days_transactions'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_24_h_volume:
          condition.where['last_24_h_volume'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_7_days_volume:
          condition.where['last_7_days_volume'] = LessThan(num)
          break
        case NftStatisticsOrderByType.last_30_days_volume:
          condition.where['last_30_days_volume'] = LessThan(num)
          break
        default:
          condition.where['last_24_h_users'] = LessThan(num)
          break
      }
    }
    const totalNft = await this.nftStatisticsRepository.count()
    let nftList = await this.nftStatisticsRepository.find(condition)
    let hasNextPage = false
    if (nftList.length > take) {
      hasNextPage = true
      nftList = nftList.slice(0, take)
    }
    return [hasNextPage, totalNft, nftList]
  }

  async updateNftImg(contractAddress: string, imgUri: string) {
    const nftStatistics = await this.nftStatisticsRepository.findOne({
      where: { smart_contract_address: contractAddress }
    })
    if (nftStatistics) {
      nftStatistics.img_uri = imgUri
      return await this.nftStatisticsRepository.save(nftStatistics)
    }
    return {}
  }

  async nftDetail(contractAddress): Promise<NftDetailType> {
    const nftDetail = await this.nftStatisticsRepository.findOne({
      where: { smart_contract_address: contractAddress }
    })
    if (!nftDetail) {
      return {
        name: '',
        contract_uri_detail: '',
        by_24_hours: [],
        by_30_days: [],
        by_7_days: [],
        img_uri: ''
      }
    }
    const nftStatistics = await this.nftTransferRecordRepository.find({
      where: { smart_contract_address: contractAddress },
      order: { timestamp: 'ASC' }
    })
    if (nftStatistics) {
      const statisticsObj24H: {
        [index: string]: NftDetailByDate
      } = {}
      const statisticsObj7Days: {
        [index: string]: NftDetailByDate
      } = {}
      const statisticsObj30Days: {
        [index: string]: NftDetailByDate
      } = {}
      const usersArr24H = {}
      const usersArr7Days = {}
      const usersArr30Days = {}
      const statisticsArr24H: Array<NftDetailByDate> = []
      const statisticsArr7Days: Array<NftDetailByDate> = []
      const statisticsArr30Days: Array<NftDetailByDate> = []
      for (const record of nftStatistics) {
        if (record.timestamp > moment().subtract(24, 'hours').unix()) {
          const hourStr = moment(record.timestamp * 1000).format('YYYY-MM-DD-HH')
          if (statisticsObj24H[hourStr]) {
            usersArr24H[hourStr].includes(record.from) || usersArr24H[hourStr].push(record.from)
            usersArr24H[hourStr].includes(record.to) || usersArr24H[hourStr].push(record.to)
            statisticsObj24H[hourStr].volume += record.payment_token_amount
            statisticsObj24H[hourStr].users = usersArr24H[hourStr].length
            statisticsObj24H[hourStr].transactions += 1
          } else {
            usersArr24H[hourStr] = [record.from, record.to]
            statisticsObj24H[hourStr] = {
              volume: record.payment_token_amount,
              users: 2,
              transactions: 1,
              date: record.timestamp
              // img_uri: nftDetail.img_uri
            }
          }
          if (usersArr24H[record.from]) {
            usersArr24H[record.from] += 1
          } else {
            usersArr24H[record.from] = 1
          }
        }
        if (record.timestamp > moment().subtract(7, 'days').unix()) {
          const dayStr = moment(record.timestamp * 1000).format('YYYY-MM-DD')
          if (statisticsObj7Days[dayStr]) {
            usersArr7Days[dayStr].includes(record.from) || usersArr7Days[dayStr].push(record.from)
            usersArr7Days[dayStr].includes(record.to) || usersArr7Days[dayStr].push(record.to)
            statisticsObj7Days[dayStr].volume += record.payment_token_amount
            statisticsObj7Days[dayStr].users = usersArr7Days[dayStr].length
            statisticsObj7Days[dayStr].transactions += 1
          } else {
            usersArr7Days[dayStr] = [record.from, record.to]
            statisticsObj7Days[dayStr] = {
              volume: record.payment_token_amount,
              users: 2,
              transactions: 1,
              date: record.timestamp
              // img_uri: nftDetail.img_uri
            }
          }
        }
        if (record.timestamp > moment().subtract(30, 'days').unix()) {
          const dayStr = moment(record.timestamp * 1000).format('YYYY-MM-DD')
          if (statisticsObj30Days[dayStr]) {
            usersArr30Days[dayStr].includes(record.from) || usersArr30Days[dayStr].push(record.from)
            usersArr30Days[dayStr].includes(record.to) || usersArr30Days[dayStr].push(record.to)
            statisticsObj30Days[dayStr].volume += record.payment_token_amount
            statisticsObj30Days[dayStr].users = usersArr30Days[dayStr].length
            statisticsObj30Days[dayStr].transactions += 1
          } else {
            usersArr30Days[dayStr] = [record.from, record.to]
            statisticsObj30Days[dayStr] = {
              volume: record.payment_token_amount,
              users: 2,
              transactions: 1,
              date: record.timestamp
              // img_uri: nftDetail.img_uri
            }
          }
        }
      }
      for (let i = 23; i >= 0; i--) {
        const hourStr = moment().subtract(i, 'hours').format('YYYY-MM-DD-HH')
        if (statisticsObj24H[hourStr]) {
          statisticsArr24H.push(statisticsObj24H[hourStr])
        } else {
          statisticsArr24H.push({
            date: moment().subtract(i, 'hours').unix(),
            volume: 0,
            users: 0,
            transactions: 0
          })
        }
      }
      for (let i = 6; i >= 0; i--) {
        const dayStr = moment().subtract(i, 'days').format('YYYY-MM-DD')
        if (statisticsObj7Days[dayStr]) {
          statisticsArr7Days.push(statisticsObj7Days[dayStr])
        } else {
          statisticsArr7Days.push({
            date: moment().subtract(i, 'days').unix(),
            volume: 0,
            users: 0,
            transactions: 0
          })
        }
      }
      for (let i = 29; i >= 0; i--) {
        const dayStr = moment().subtract(i, 'days').format('YYYY-MM-DD')
        if (statisticsObj30Days[dayStr]) {
          statisticsArr30Days.push(statisticsObj30Days[dayStr])
        } else {
          statisticsArr30Days.push({
            date: moment().subtract(i, 'days').unix(),
            volume: 0,
            users: 0,
            transactions: 0
          })
        }
      }
      return {
        name: nftDetail.name,
        img_uri: nftDetail.img_uri,
        contract_uri_detail: nftDetail.contract_uri_detail,
        by_24_hours: statisticsArr24H,
        by_7_days: statisticsArr7Days,
        by_30_days: statisticsArr30Days
      }
      // return nftStatistics
    }
    return {
      name: nftDetail.name,
      contract_uri_detail: nftDetail.contract_uri_detail,
      by_24_hours: [],
      by_30_days: [],
      by_7_days: [],
      img_uri: nftDetail.img_uri
    }
  }

  // formatNftDetailData() {
  //   try {
  //     for (const item of data.NftDetail.by_hours) {
  //       if (item.date >= moment().subtract(24, 'hours').unix()) {
  //         last24hData[moment(Number(item.date) * 1000).format('YYYY-MM-DDhh')] = {
  //           date: moment(Number(item.date) * 1000).format('MMMM Do, hh'),
  //           volume: item.volume,
  //           users: item.users,
  //           transactions: item.transactions
  //         }
  //       }
  //       if (item.date >= moment().subtract(7, 'days').unix()) {
  //         if (!last7DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')]) {
  //           last7DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')] = {
  //             date: moment(Number(item.date) * 1000).format('MMMM Do'),
  //             volume: item.volume,
  //             users: item.users,
  //             transactions: item.transactions
  //           }
  //         } else {
  //           last7DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].volume +=
  //             item.volume
  //           last7DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].users += item.users
  //           last7DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].transactions +=
  //             item.transactions
  //         }
  //       }
  //       if (item.date >= moment().subtract(30, 'days').unix()) {
  //         if (!last30DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')]) {
  //           last30DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')] = {
  //             date: moment(Number(item.date) * 1000).format('MMMM Do'),
  //             volume: item.volume,
  //             users: item.users,
  //             transactions: item.transactions
  //           }
  //         } else {
  //           last30DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].volume +=
  //             item.volume
  //           last30DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].users +=
  //             item.users
  //           last30DaysData[moment(Number(item.date) * 1000).format('YYYY-MM-DD')].transactions +=
  //             item.transactions
  //         }
  //       }
  //     }
  //     for (const i = 23; i >= 0; i--) {
  //       const date = moment().subtract(i, 'hours').format('YYYY-MM-DDhh')
  //       if (last24hData[date]) {
  //         chartData24H.push(last24hData[date])
  //       } else {
  //         chartData24H.push({
  //           date: moment().subtract(i, 'hours').format('MMMM Do YYYY, HH'),
  //           volume: 0,
  //           users: 0,
  //           transactions: 0
  //         })
  //       }
  //     }
  //     for (const i = 6; i >= 0; i--) {
  //       const date = moment().subtract(i, 'days').format('YYYY-MM-DD')
  //       if (last7DaysData[date]) {
  //         chartDataLast7Days.push(last7DaysData[date])
  //       } else {
  //         chartDataLast7Days.push({
  //           date: moment().subtract(i, 'days').format('MMMM Do'),
  //           volume: 0,
  //           users: 0,
  //           transactions: 0
  //         })
  //       }
  //     }
  //     console.log('last 30 days data', last30DaysData)
  //     for (const i = 29; i >= 0; i--) {
  //       const date = moment().subtract(i, 'days').format('YYYY-MM-DD')
  //       if (last30DaysData[date]) {
  //         chartDataLast30Days.push(last30DaysData[date])
  //       } else {
  //         chartDataLast30Days.push({
  //           date: moment().subtract(i, 'days').format('MMMM Do'),
  //           volume: 0,
  //           users: 0,
  //           transactions: 0
  //         })
  //       }
  //     }
  //     console.log('30 days chart data', chartDataLast30Days)
  //     // setChartData24H(chartData24H)
  //     // setChartData7Days(chartDataLast7Days)
  //     // setChartData30Days(chartDataLast30Days)
  //     // console.log(data)
  //   } catch (e) {
  //     console.log(e)
  //   }
  // }
}
