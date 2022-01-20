import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { thetaTsSdk } from 'theta-ts-sdk'
// import config from 'config'
import { Cache } from 'cache-manager'
import { MarketService } from '../../market/market.service'
import BigNumber from 'bignumber.js'
import { BalanceModel, StakeBalanceType, TotalBalanceType } from './wallet-balance.model'
import { fetch } from 'cross-fetch'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan, Repository } from 'typeorm'
import { WalletEntity } from './wallet.entity'
import { AcitiveWalletsEntity } from './active-wallets.entity'
const config = require('config')
const moment = require('moment')
@Injectable()
export class WalletService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,

    @InjectRepository(WalletEntity)
    private walletRepository: Repository<WalletEntity>,

    @InjectRepository(AcitiveWalletsEntity)
    private activeWalletsRepository: Repository<AcitiveWalletsEntity>,

    private marketInfo: MarketService
  ) {
    thetaTsSdk.blockchain.setUrl(config.get('THETA_NODE_HOST'))
  }

  public async getBalanceByAddress(address: string) {
    const accountBalance = await thetaTsSdk.blockchain.getAccount(address)
    const thetaBalance = {
      amount: Number(
        new BigNumber(accountBalance.result.coins.thetawei).dividedBy('1e18').toFixed()
      ),
      fiat_currency_value: {
        usd:
          (await this.marketInfo.getThetaMarketInfo()).price *
          Number(new BigNumber(accountBalance.result.coins.thetawei).dividedBy('1e18').toFixed()),
        cny: 0,
        eur: 0
      }
    }
    const usdRate = await this.getUsdRate()
    thetaBalance.fiat_currency_value.cny = thetaBalance.fiat_currency_value.usd * usdRate.CNY
    thetaBalance.fiat_currency_value.eur = thetaBalance.fiat_currency_value.usd * usdRate.EUR
    const thetaFuelBalance = {
      amount: Number(
        new BigNumber(accountBalance.result.coins.tfuelwei).dividedBy('1e18').toFixed()
      ),
      fiat_currency_value: {
        usd:
          (await this.marketInfo.getThetaFuelMarketInfo()).price *
          Number(new BigNumber(accountBalance.result.coins.tfuelwei).dividedBy('1e18').toFixed()),
        cny: 0,
        eur: 0
      }
    }
    thetaFuelBalance.fiat_currency_value.cny =
      thetaFuelBalance.fiat_currency_value.usd * usdRate.CNY
    thetaFuelBalance.fiat_currency_value.eur =
      thetaFuelBalance.fiat_currency_value.usd * usdRate.EUR
    return {
      theta: thetaBalance,
      theta_fuel: thetaFuelBalance
    }
  }

  async getStakeInfoByAddress(address: string) {
    const latestBlockHeight = (await thetaTsSdk.blockchain.getStatus()).result
      .latest_finalized_block_height
    const gcpStake: Array<StakeBalanceType> = []
    const eenpStake: Array<StakeBalanceType> = []
    const vcpStake: Array<StakeBalanceType> = []
    const gcpList = await thetaTsSdk.blockchain.getGcpByHeight(latestBlockHeight)
    const thetaMarketInfo = await this.marketInfo.getThetaMarketInfo()
    const thetaFuelMarketInfo = await this.marketInfo.getThetaFuelMarketInfo()
    const usdRate = await this.getUsdRate()

    gcpList.result.BlockHashGcpPairs[0].Gcp.SortedGuardians.forEach((guardian) => {
      guardian.Stakes.forEach((stake) => {
        if (stake.source === address) {
          gcpStake.push({
            node_address: guardian.Holder,
            amount: Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()),
            withdrawn: stake.withdrawn,
            return_height: stake.return_height,
            fiat_currency_value: {
              usd:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price,
              cny:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price *
                usdRate.CNY,
              eur:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price *
                usdRate.EUR
            }
          })
        }
      })
    })

    const eenpList = await thetaTsSdk.blockchain.getEenpByHeight(latestBlockHeight)

    eenpList.result.BlockHashEenpPairs[0].EENs.forEach((een) => {
      een.Stakes.forEach((stake) => {
        if (stake.source === address) {
          eenpStake.push({
            node_address: een.Holder,
            amount: Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()),
            withdrawn: stake.withdrawn,
            return_height: stake.return_height,
            fiat_currency_value: {
              usd:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaFuelMarketInfo.price,
              cny:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaFuelMarketInfo.price *
                usdRate.CNY,
              eur:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaFuelMarketInfo.price *
                usdRate.EUR
            }
          })
        }
      })
    })

    const validatorList = await thetaTsSdk.blockchain.getVcpByHeight(latestBlockHeight)

    validatorList.result.BlockHashVcpPairs[0].Vcp.SortedCandidates.forEach((vcp) => {
      vcp.Stakes.forEach((stake) => {
        if (stake.source === address) {
          vcpStake.push({
            node_address: vcp.Holder,
            amount: Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()),
            withdrawn: stake.withdrawn,
            return_height: stake.return_height,
            fiat_currency_value: {
              usd:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price,
              cny:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price *
                usdRate.CNY,
              eur:
                Number(new BigNumber(stake.amount).dividedBy('1e18').toFixed()) *
                thetaMarketInfo.price *
                usdRate.EUR
            }
          })
        }
      })
    })

    return {
      stake_to_guardian: gcpStake,
      stake_to_elite_node: eenpStake,
      stake_to_vcp: vcpStake
    }
  }

  public async getALlBalance(address: string): Promise<BalanceModel> {
    const totalBalance: TotalBalanceType = {
      fiat_currency_value: {
        usd: 0,
        cny: 0,
        eur: 0
      },
      theta_amount: 0,
      theta_fuel_amount: 0
    }
    let walletBalance = await this.getBalanceByAddress(address)
    totalBalance.theta_amount += walletBalance.theta.amount
    totalBalance.theta_fuel_amount += walletBalance.theta_fuel.amount
    totalBalance.fiat_currency_value.usd +=
      walletBalance.theta_fuel.fiat_currency_value.usd + walletBalance.theta.fiat_currency_value.usd
    totalBalance.fiat_currency_value.cny +=
      walletBalance.theta_fuel.fiat_currency_value.cny + walletBalance.theta.fiat_currency_value.cny
    totalBalance.fiat_currency_value.eur +=
      walletBalance.theta_fuel.fiat_currency_value.eur + walletBalance.theta.fiat_currency_value.eur
    let stakeBalance = await this.getStakeInfoByAddress(address)
    stakeBalance.stake_to_guardian.concat(stakeBalance.stake_to_vcp).forEach((stakeInfo) => {
      totalBalance.theta_amount += stakeInfo.amount
      totalBalance.fiat_currency_value.usd += stakeInfo.fiat_currency_value.usd
      totalBalance.fiat_currency_value.cny += stakeInfo.fiat_currency_value.cny
      totalBalance.fiat_currency_value.eur += stakeInfo.fiat_currency_value.eur
    })
    stakeBalance.stake_to_elite_node.forEach((stakeInfo) => {
      totalBalance.theta_fuel_amount += stakeInfo.amount
      totalBalance.fiat_currency_value.usd += stakeInfo.fiat_currency_value.usd
      totalBalance.fiat_currency_value.cny += stakeInfo.fiat_currency_value.cny
      totalBalance.fiat_currency_value.eur += stakeInfo.fiat_currency_value.eur
    })
    return {
      total: totalBalance,
      theta: walletBalance.theta,
      theta_fuel: walletBalance.theta_fuel,
      stake_to_guardian: stakeBalance.stake_to_guardian,
      stake_to_elite_node: stakeBalance.stake_to_elite_node,
      stake_to_validator_node: stakeBalance.stake_to_vcp
    }
  }

  public async getUsdRate(): Promise<{ CNY: number; EUR: number }> {
    const key = 'usd-rate-key'
    if (await this.cacheManager.get(key)) return await this.cacheManager.get(key)
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (res.status >= 400) {
      throw new Error('Bad response from server')
    }
    // console.log(await res.json())
    let jsonInfo = await res.json()
    // console.log(res.json())
    await this.cacheManager.set(key, jsonInfo['rates'], { ttl: 60 * 60 * 24 * 7 })
    return jsonInfo['rates']
  }

  public async markActive(address: string): Promise<void> {
    await this.walletRepository.upsert({ address: address, latest_active_time: moment().unix() }, [
      'address'
    ])
  }

  public async snapShotActiveWallets() {
    if (moment().minutes() < 2) {
      const hhTimestamp = moment(moment().format("YYYY-MM-DD HH:00:00")).unix()
      const statisticsStartTimeStamp = moment(hhTimestamp * 1000).subtract(24, 'hours').unix()
      const totalAmount = await this.walletRepository.count({
        latest_active_time: MoreThan(statisticsStartTimeStamp)
      })
      const activeWalletLastHour = await this.walletRepository.count({
        latest_active_time : MoreThan(moment(hhTimestamp * 1000).subtract(1, 'hours').unix())
      })
      await this.activeWalletsRepository.upsert({
        snapshot_time: hhTimestamp,
        active_wallets_amount: totalAmount,
        active_wallets_amount_last_hour : activeWalletLastHour
      }, ['snapshot_time'])

    }
  }

  public async getActiveWallet(startTime){
    return await this.activeWalletsRepository.find({
      snapshot_time : MoreThan(startTime)
    })

  }
}
