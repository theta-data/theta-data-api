## Inspiration
Thanks to the public ledger of the blockchain, we can attain numerous data of blockchain operation with simple analysis, including pledge volume, contract activity, individual account balance and pledge rewards, etc.
In the current theta ecosystem, there are various relevant data sources, including:
* [explore data interface](https://docs.thetatoken.org/docs/explorer-overview) and  [js sdk](https://docs.thetatoken.org/docs/theta-js-sdk-overview), provided by the Theta team
* [Guardianmonitor](https://guardianmonitor.io) provides node statistics, pledge data, guardian node status statistics
* [Thetaboard](https://thetaboard.io/) provides market ticker data, account balance and pledge award statistics
* [Theta scan](http://www.thetascan.io/document/) provides historical market cap, historical quotes, wallet accounts and block details


Despite the availability of these data from different sources, there is not a comprehensive and simple data query solution for community developer. We want to build a user-friendly interface which can access all the data the developers want about Theta.

All the data we provide now, except for those related to market quotes (from [cmc](https://coinmarketcap.com/)), are obtained from our own guardian node, which means 
all guardian node managers can strengthen the capability of the nodes by deploying our open source solution and moreover, become a data provider.

There are more than 2,000 active guardian nodes online, all of which can become access data sources. With more nodes provding data, comes the higher robustness of the ecosystem. Therefore, community developers no longer rely on a single data node, which effectively reduces the server pressure on the central node.

## How we built it
Currently, all data is provided through the graphql interface. Developers only can get the data they need with a single graphql statement in one network request.
The technology stack includes:
* Front End：React, Material UI
* Back End：Graphql, Typescript, Nest.js, Mysql , Redis, Nginx
* Cloud Server : Aws Singapore
* Code Deployment：Github CI&CD


## Challenges we ran into
The biggest challenge is promotion. Our main target users are developers, which is a small group at the moment.
Consequently, we have not received enough feedback from users so that we can furthur improve our product.

## Accomplishments that we're proud of
1. The current data covers all official data interfaces, including rpc and explore. On top of that, we also add smart contracts, transaction volume, pledge revenue statistics and other data statistics that are provided by the official so far.
2. Except for the market-related data, all data are obtained from our own daemon node query and analysis, without any third-party reliance.
3. Our product is well-documented for developers.
4. We also built a simple, quick access for new data.

## What we learned
- Deeper understanding of graphql and theta network's rpc interface
- Cooperation with oversea teammates

## What's next for Theta Data 
* Enrich the data so that more data can be covered and more analysis can be done
* Enhance the robustness of the service, more comprehensive logs and monitor
* Simplify the product so that node runners can deploy and manage conveniently
* More user interaction and collect more user feedback for further improvement