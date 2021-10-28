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
  }, 10000)

  it('should get block by hash', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          '{\n' +
          '  ThetaRpc {\n' +
          '    GetBlock(hash: "0x0bee8fcd0d92f7dcd9eb650c6be6333bd43143624e89023eabe27c3d69ecf1d5") {\n' +
          '      chain_id\n' +
          '      children\n' +
          '      epoch\n' +
          '      hash\n' +
          '      parent\n' +
          '      height\n' +
          '      proposer\n' +
          '      state_hash\n' +
          '      status\n' +
          '      timestamp\n' +
          '      transactions {\n' +
          '        fee {\n' +
          '          thetawei\n' +
          '          tfuelwei\n' +
          '        }\n' +
          '        hash\n' +
          '        raw {\n' +
          '          block_height\n' +
          '          data\n' +
          '          from {\n' +
          '            address\n' +
          '            coins {\n' +
          '              thetawei\n' +
          '              tfuelwei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '          gas_limit\n' +
          '          gas_price\n' +
          '          inputs {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '          }\n' +
          '          outputs {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '          }\n' +
          '          proposer {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '          to {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '        }\n' +
          '        receipt {\n' +
          '          ContractAddress\n' +
          '          EvmErr\n' +
          '          EvmRet\n' +
          '          GasUsed\n' +
          '          Logs {\n' +
          '            address\n' +
          '            data\n' +
          '            topics\n' +
          '          }\n' +
          '          TxHash\n' +
          '        }\n' +
          '        type\n' +
          '      }\n' +
          '      transactions_hash\n' +
          '    }\n' +
          '  }\n' +
          '}\n'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.ThetaRpc.GetBlock).toHaveProperty('hash')
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  }, 10000)

  it('should get block by height', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          '{\n' +
          '  ThetaRpc {\n' +
          '    GetBlockByHeight(height: 12598482) {\n' +
          '      chain_id\n' +
          '      children\n' +
          '      epoch\n' +
          '      hash\n' +
          '      parent\n' +
          '      height\n' +
          '      proposer\n' +
          '      state_hash\n' +
          '      status\n' +
          '      timestamp\n' +
          '      transactions {\n' +
          '        fee {\n' +
          '          thetawei\n' +
          '          tfuelwei\n' +
          '        }\n' +
          '        hash\n' +
          '        raw {\n' +
          '          block_height\n' +
          '          data\n' +
          '          from {\n' +
          '            address\n' +
          '            coins {\n' +
          '              thetawei\n' +
          '              tfuelwei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '          gas_limit\n' +
          '          gas_price\n' +
          '          inputs {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '          }\n' +
          '          outputs {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '          }\n' +
          '          proposer {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '          to {\n' +
          '            address\n' +
          '            coins {\n' +
          '              tfuelwei\n' +
          '              thetawei\n' +
          '            }\n' +
          '            sequence\n' +
          '            signature\n' +
          '          }\n' +
          '        }\n' +
          '        receipt {\n' +
          '          ContractAddress\n' +
          '          EvmErr\n' +
          '          EvmRet\n' +
          '          GasUsed\n' +
          '          Logs {\n' +
          '            address\n' +
          '            data\n' +
          '            topics\n' +
          '          }\n' +
          '          TxHash\n' +
          '        }\n' +
          '        type\n' +
          '      }\n' +
          '      transactions_hash\n' +
          '    }\n' +
          '  }\n' +
          '}\n'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.ThetaRpc.GetBlockByHeight).toHaveProperty('hash')
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  }, 10000)

  it('should get node status', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          '{\n' +
          '  ThetaRpc {\n' +
          '    GetStatus {\n' +
          '      address\n' +
          '      chain_id\n' +
          '      current_height\n' +
          '      current_epoch\n' +
          '      current_time\n' +
          '      latest_finalized_block_epoch\n' +
          '      genesis_block_hash\n' +
          '      latest_finalized_block_hash\n' +
          '      latest_finalized_block_height\n' +
          '      peer_id\n' +
          '      latest_finalized_block_time\n' +
          '      syncing\n' +
          '    }\n' +
          '  }\n' +
          '}\n'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.ThetaRpc.GetStatus).toHaveProperty('chain_id')
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  }, 10000)

  it('should get node version', (done) => {
    return request(app.getHttpServer())
      .post(gql)
      .send({
        query:
          ' {\n' +
          '  ThetaRpc {\n' +
          '    GetVersion {\n' +
          '      timestamp\n' +
          '      git_hash\n' +
          '      version\n' +
          '    }\n' +
          '  }\n' +
          '}\n'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.ThetaRpc.GetVersion).toHaveProperty('version')
      })
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  }, 10000)

  afterAll(async () => {
    await app.close()
    // await new Promise((resolve) => setTimeout(() => resolve(0), 500)) // avoid jest open handle error
    // done().catch(() => {})
  })
})
