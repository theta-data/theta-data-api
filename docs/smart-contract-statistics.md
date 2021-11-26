# SmartContractStatistics

Statistics on smart contract related calls

## call_rank

**Parameters**

- rank_by : Sorting method of the returned data
  - call_times：The returned data is sorted from highest to lowest by the total number of calls
  - last_24h_call_times ： The returned data is sorted from highest to lowest by the number of calls in the last 24 hours
  - last_seven_days_call_times ： The returned data is sorted by the number of calls in the last 7 days from highest to lowest
- take : Return the number of records

**Fields**

- call_times ： Total number of smart contract calls
- contract_address ： Address of the smart contract
- last_24h_call_times ： Number of smart contract calls in the last 24 hours
- last_seven_days_call_times：Number of smart contract calls in the last 7 days
- record : Call log
  - timestamp : Calling time

**Example**

**Request**

```graphql
{
  SmartContractStatistics {
    CallRank(rank_by: last_24h_call_times, take: 1) {
      contract_address
      call_times
      last_24h_call_times
      last_seven_days_call_times
      record {
        timestamp
      }
    }
  }
}
```

**Response**

```shell
{
  "data": {
    "SmartContractStatistics": {
      "call_rank": [
        {
          "contract_address": "0x14ca082c412bf5530aadb07d54aaa64b6e205a74",
          "call_times": 32520,
          "create_date": 1634197751031,
          "id": 6,
          "last_24h_call_times": 977,
          "last_seven_days_call_times": 5383,
          "update_date": 1636704063000,
          "record": [...]
        }
      ]
    }
  }
}

```
