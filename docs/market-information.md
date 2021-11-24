# Market Information
Data related to market information from [https://coinmarketcap.com/](https://coinmarketcap.com/)
* circulating_supply : Circulation of theta
* last_updated : Data update time
* market_cap : Theta's market value
* name : Token name, always return THETA
* price : Theta single token price
* total_supply : Total supply of theta
* volume_24h : Theta's 24-hour trading volume

### theta_fuel
* circulating_supply : Circulation of theta fuel
* last_updated : Data update time
* market_cap : Market value of Theta Fuel
* name : Token name, always return Theta Fuel
* price :Theta Fuel single token price
* total_supply : Total supply of theta
* volume_24h : Theta's 24-hour trading volume

# Example
**Request**
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
**Response**
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