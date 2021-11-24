# StakeStatistics
Return to statistics related to token pledges
* block_height : Height of the block where pledge statistics are performed 
* effective_guardian_node_number : Number of online guardian nodes
* active_guardian_stake_amount : Total number of theta pledges for the online guardian nodes
* effective_validator_node_number : Number of validator nodes online 
* effective_validator_stake_amount : The number of tokens pledged by the online validator nodes
* theta_fuel_stake_ratio : Theta Fuel pledge ratio
* total_edge_node_stake_amount : Number of theta fuel pledged to elite edge nodes
* timestamp : Block time for performing pledge statistics
* total_elite_edge_node_number : Total number of elite edge nodes
* total_guardian_node_number : Total number of guardian nodes
* total_guardian_stake_amount : Total number of theta tokens pledged to the guardian nodes
* total_validator_stake_amount ： Total number of theta tokens pledged to the validator nodes
* total_validator_node_number ： Total number of validator nodes
## Example
**Request**
```graphql
{
  StakeStatistics {
    theta_stake_ratio
    total_validator_node_number
    block_height
    effective_guardian_node_number
    effective_guardian_stake_amount
    effective_validator_node_number
    effective_validator_stake_amount
    theta_fuel_stake_ratio
    total_edge_node_stake_amount
    timestamp
    total_elite_edge_node_number
    total_guardian_node_number
    total_guardian_stake_amount
    total_validator_stake_amount
  }
}
```
**Response**
```json
{
  "data": {
    "StakeStatistics": {
      "theta_stake_ratio": 0.646273,
      "total_validator_node_number": 16,
      "block_height": 12812401,
      "effective_guardian_node_number": 2116,
      "effective_guardian_stake_amount": "333563168",
      "effective_validator_node_number": 13,
      "effective_validator_stake_amount": "180910499",
      "theta_fuel_stake_ratio": 0.437952,
      "total_edge_node_stake_amount": "2364786672",
      "timestamp": 1636720997,
      "total_elite_edge_node_number": 8425,
      "total_guardian_node_number": 3440,
      "total_guardian_stake_amount": "395862657",
      "total_validator_stake_amount": "250410499"
    }
  }
}

```

  
  
  