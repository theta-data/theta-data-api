## Description
Theta data analyse server and graphql api server.

## Installation

```bash
$ npm install
```
## Config
```bash
# edit file in config/test.json and replace with your own prams.
{
  "THETA_DATA_DB": {
    "host": "replace with your own",     
    "port": "replace with your own",
    "username": "replace with your own",
    "password": "replace with your own",
    "database": "replace with your own",
    "synchronize": true,
    "autoLoadEntities": true,
    "entities": ["src/**/*.entity{.ts,.js}"],
    "logging": false,
    "extra": {
      "charset": "utf8mb4_unicode_ci"
    }
  },
  "THETA_NODE_HOST" : "https://theta-bridge-rpc.thetatoken.org/rpc",
  "LOG_PATH": "replace with your own",
  "REDIS": {
    "host": "replace with your own",
    "port": "replace with your own"
  }
}

```

## Running the app

```bash
# graphql api development
$ npm run start

# analyse server development
$ npm run analyse

# watch mode
$ npm run start:dev

# build
$ npm run build

# run graphql api server
$ node dist/main

# run analyse server
$ node dist/analyse

```

## PlayGround
visit http://localhost:3000/graphql to the graphql api.