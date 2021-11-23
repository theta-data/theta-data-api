## Inspiration
受益于区块链的公共账本，我们可以基于公开账本上的数据做一些简单分析就可以
得到很多区块链的运行数据，包括质押量，合约活跃度，个人账户余额和质押奖励等。
在目前的theta生态上面，已经有了非常多的相关数据获取渠道，包括
* theta团队提供出来的[explore数据接口](https://docs.thetatoken.org/docs/explorer-overview) 和  [js sdk](https://docs.thetatoken.org/docs/theta-js-sdk-overview) 
* [guardianmonitor](https://guardianmonitor.io) 提供的节点统计，质押数据，守护节点状态统计
* [thetaboard](https://thetaboard.io/) 提供的市场行情数据和账户余额以及质押奖励统计
* [theta scan](http://www.thetascan.io/document/) 提供的历史市值，历史行情，以及钱包账户，区块详情等数据
* 其他等等....

尽管有了这些数据获取渠道，但是目前对社区的开发者，还没有一个综合性，全面的同时又足够简单进行查询的数据解决方案，
我们希望给开发者提供一种非常简单友好的方式查询所有他需要的关于theta的数据。

在我们提供的所有数据中，除了市场行情相关的数据来源cmc，其他所有数据都是从我们自己运行的守护节点通过分析得到的，这也意味着，
所有运行守护节点的人，都可以通过部署我们开源的数据方案，成为数据提供方，来提升守护节点的能力。

目前在线的有效守护节点有2000多个，这些节点都有潜力成为提供数据的接入点，这可以
提升生态的稳健度，让社区开发者的数据查询不再依赖单一的数据中心，也能有效减少中心节点的服务器压力。

## How we built it
目前，我们的数据都是通过graphql接口提供的，开发者只需要通过一条graphql语句，发送一次网络请求就能获取自己需要的数据。
使用到的技术栈包括这些：
* 前端：React, Material UI
* 后端：Graphql, Typescript, Nest.js, Mysql , Redis, Nginx
* 云服务器 : Aws Signapore
* 发布：Github CI&CD


## Challenges we ran into
最大的挑战还是推广，因为服务开发者的定位，这个群体目前相对小众，
所以目前还没有一个好的渠道接受足够多的使用反馈，来进一步增加和完善我们的数据。

## Accomplishments that we're proud of
1. 目前的数据基本覆盖官方所有数据接口，包括rpc、explore等，同时增加了智能合约，交易量，质押收益统计等官方没有提供的数据统计，
并且除了市场的相关数据，所有数据都是从我们自己运行的守护节点查询和分析得来，不依赖任何第三方数据接口。
2. 形成了一套简单的，快捷的新数据开发接入流程

## What we learned
对graphql有了更深的理解，对theta网络的rpc接口更加熟悉

## What's next for Theta Data 
* 进一步提升数据的丰富度，让覆盖的数据能够更加的全面。 
* 进一步提升服务的稳健性，完善日志，监控告警模块
* 进一步优化程序，让其他感兴趣的守护节点运行者，能够更加简单方便的部署我们的程序。
* 提升运营能力，和使用者形成一个交流互动，根据反馈需求来进一步优化产品