# Market Information
market信息的相关数据来源于 [https://coinmarketcap.com/](https://coinmarketcap.com/)
### theta
* circulating_supply : theta的流通量
* last_updated : 数据更新时间
* market_cap : theta的市值
* name : 代币名字,始终返回THETA
* price : theta单个代币的价格
* total_supply : theta的总的供应量
* volume_24h : theta的24小时交易量

### theta_fuel
* circulating_supply : theta fuel的流通量
* last_updated : 数据更新时间
* market_cap : theta fuel的市值
* name : 代币名字,始终返回Theta Fuel
* price : theta单个代币的价格
* total_supply : theta的总的供应量
* volume_24h : theta的24小时交易量

# 实例
**请求**
```graphql
{
  MarketInformation {
    theta {
      circulating_supply
      last_updated
      market_cap
      name
      price
      total_supply
      volume_24h
    }
    theta_fuel {
      circulating_supply
      last_updated
      name
      market_cap
      price
      total_supply
      volume_24h
    }
  }
}
```
** 返回 **
```json
{
  "data": {
    "MarketInformation": {
      "theta": {
        "circulating_supply": 1000000000,
        "last_updated": "2021-11-12T08:28:05.000Z",
        "market_cap": 7127853656.200094,
        "name": "THETA",
        "price": 7.127853656200094,
        "total_supply": 1000000000,
        "volume_24h": 266384185.84655797
      },
      "theta_fuel": {
        "circulating_supply": 5301214400,
        "last_updated": "2021-11-12T08:27:21.000Z",
        "name": "Theta Fuel",
        "market_cap": 1790191655.795407,
        "price": 0.3376946338551044,
        "total_supply": 5301214400,
        "volume_24h": 63943763.81150441
      }
    }
  }
}
```