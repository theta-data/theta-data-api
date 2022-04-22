import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindManyOptions, Repository } from 'typeorm'
import { LoggerEntity } from './logger.entity'
import { LoggerRankByEnum } from './logger.resolver'

// import { LoggerService } from "src/common/logger.service";
@Injectable()
export class LoggerService {
  constructor(
    @InjectRepository(LoggerEntity, 'logger')
    private loggerRepository: Repository<LoggerEntity>
  ) {}

  async addQueryLog(query: string, hash: string) {
    await this.loggerRepository.query(
      `INSERT INTO  logger_entity (query,hash,call_times) VALUES (?, ?,1) ON CONFLICT (hash) DO UPDATE set call_times=call_times+1`,
      [query, hash]
    )
  }

  async query(rankBy: LoggerRankByEnum) {
    const queryParam: FindManyOptions = {}
    switch (rankBy) {
      case LoggerRankByEnum.call_times:
        queryParam.order = { call_times: 'DESC' }
        break
      case LoggerRankByEnum.update_time:
        queryParam.order = { update_date: 'DESC' }
        break
      default:
        break
    }
    return await this.loggerRepository.find(queryParam)
  }
}
