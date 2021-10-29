import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { INestApplication } from '@nestjs/common'
const gql = '/graphql/'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    // done().catch(() => {})
  })
  it('should get the smart contract statistics rank by call times', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          ' {SmartContractStatistics {\n' +
          '    call_rank(take: 10, rank_by: call_times) {\n' +
          '      call_times\n' +
          '      contract_address\n' +
          '      create_date\n' +
          '      id\n' +
          '      last_24h_call_times\n' +
          '      last_seven_days_call_times\n' +
          '      record {\n' +
          '        id\n' +
          '        timestamp\n' +
          '      }\n' +
          '      update_date\n' +
          '    }\n' +
          '  }}'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.SmartContractStatistics).toHaveProperty('call_rank')
        // done()
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  })

  afterAll(async () => {
    await app.close()
  })
})
