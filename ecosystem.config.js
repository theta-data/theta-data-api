module.exports = {
  apps: [
    {
      name: 'theta-data-api',
      script: './dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
        max_memory_restart: '2G',
        // TZ: 'Asia/Shanghai'
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
}
