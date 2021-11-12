# SmartContractStatistics
统计智能合约的相关调用情况
### call_rank
**参数**
* rank_by : 返回的数据的排序方式
  - call_times：返回数据通过总调用次数从高到低排序
  - last_24h_call_times ： 返回数据通过过去24小时的调用次数从高到低排序
  - last_seven_days_call_times ： 返回数据通过过去7天的调用次数从高到低排序
* take : 返回记录条数

**字段**
* call_times ： 智能合约总的被调用次数
* contract_address ： 智能合约的地址
* create_date ： 记录创建时间
* id ： 记录ID
* last_24h_call_times ： 智能合约过去24小时的调用次数
* last_seven_days_call_times：智能合约过去7天的调用次数
* update_date ： 记录更新时间

## 示例
```graphql
{
  SmartContractStatistics {
    call_rank(rank_by: last_24h_call_times, take: 10) {
      contract_address
      call_times
      create_date
      id
      last_24h_call_times
      last_seven_days_call_times
      record {
        id
        timestamp
      }
      update_date
    }
  }
}
```
