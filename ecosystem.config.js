module.exports = {
  apps: [
    {
      name: 'theta-data-api',
      script: './dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,

      //@todo remove this config in the pro dev
      cron_restart: '0 */1 * * * ',

      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test'
        // TZ: 'Asia/Shanghai'
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
    // {
    //   name: 'theta-data-analyse',
    //   script: './dist/analyse.js',
    //   instances: 1,
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '2G',
    //   env_test: {
    //     NODE_ENV: 'test' // TZ: 'Asia/Shanghai'
    //   },
    //   env_production: {
    //     NODE_ENV: 'production',
    //     NODE_CONFIG_DIR: '/home/ubuntu/actions-runner/_work/config/config/theta-data-api'
    //   }
    // }
  ]
}
