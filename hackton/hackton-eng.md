## Inspiration
Thanks to the public ledger of the blockchain, we can do some simple analysis based on the data on the public ledger
to get a lot of data about the operation of the blockchain, including pledge volume, contract activity, individual account balance and pledge rewards, etc.
In the current theta ecosystem, there are already many relevant data acquisition channels, including
* Theta team provided out the [explore data interface](https://docs.thetatoken.org/docs/explorer-overview) 和  [js sdk](https://docs.thetatoken.org/docs/theta-js-sdk-overview) 
* [Guardianmonitor](https://guardianmonitor.io) providing node statistics, pledge data, guardian node status statistics
* [Thetaboard](https://thetaboard.io/) providing market ticker data and account balance and pledge award statistics
* [Theta scan](http://www.thetascan.io/document/) providing historical market capitalization, historical quotes, and data such as wallet accounts, block details, etc.
* Others, etc.

Despite the availability of these data sources, there is currently no comprehensive, comprehensive and easy to query data solution for community developers，
We want to give the developer a very simple and user-friendly way to query all the data he needs about theta.

In all the data we provide, except for the data sources related to market quotes [cmc](https://coinmarketcap.com/), all the other data are obtained from our own running guardian node through analysis, which means that
all people who run guardian nodes can enhance the capability of the guardian nodes by deploying our open source data solution and becoming a data provider

There are currently more than 2,000 active guardian nodes online, all of which have the potential to become access points for providing data, which can
improve the robustness of the ecosystem, allowing community developers to no longer rely on a single data center for data queries, and effectively reducing the server pressure on the central node.

## How we built it
Currently, all our data is provided through the graphql interface, and developers only need to send a single network request to get the data they need through a single graphql statement.
The technology stack used includes these.
* Front End：React, Material UI
* Back End：Graphql, Typescript, Nest.js, Mysql , Redis, Nginx
* Cloud Server : Aws Signapore
* Code Deployment：Github CI&CD


## Challenges we ran into
The biggest challenge is still promotion, because of the positioning of the service developers, this group is relatively niche at the moment.
So there is not yet a good channel to receive enough feedback on usage to further increase and improve our data.

## Accomplishments that we're proud of
1. The current data basically covers all official data interfaces, including rpc, explore, etc., while adding smart contracts, transaction volume, pledge revenue statistics and other data statistics not provided by the official.
   In addition to market-related data, all data are obtained from our own running daemon node query and analysis, without relying on any third-party data interface.
2. Well-documented for developers to use our services
3. Formed a simple, quick access process for new data development

## What we learned
Deeper understanding of graphql and more familiarity with theta network's rpc interface

## What's next for Theta Data 
* Enhance the richness of the data, so that the coverage can be more comprehensive.
* Enhance the robustness of the service, improve the logs, monitor the alarm module
* Optimize the program so that other interested daemon runners can deploy our program more easily and conveniently
* Improve the operation ability, form a communication interaction with users, and further optimize the product according to the feedback requirements