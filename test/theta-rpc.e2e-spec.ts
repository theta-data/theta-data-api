import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { INestApplication } from '@nestjs/common'
const gql = '/graphql/'

describe('Theta RPC', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    // done().catch(() => {})
  })
  it('should get account', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          '{\n' +
          '  ThetaRpc {\n' +
          '    GetAccount(address: "0x6ae043e27a9599bfc0188d6c4bcd43d7c0dd46f5") {\n' +
          '      code\n' +
          '      coins {\n' +
          '        tfuelwei\n' +
          '        thetawei\n' +
          '      }\n' +
          '      reserved_funds\n' +
          '      last_updated_block_height\n' +
          '      sequence\n' +
          '      root\n' +
          '    }\n' +
          '  }\n' +
          '}'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.ThetaRpc.GetAccount).toHaveProperty('code')
        // done()
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  })
  afterAll(async () => {
    await app.close()
    // await new Promise((resolve) => setTimeout(() => resolve(0), 500)) // avoid jest open handle error
    // done().catch(() => {})
  })
})
