module.exports = {
  apps: [
    {
      name: 'theta-data-api',
      script: './dist/main.js',
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      increment_var : 'PORT',
      env_test: {
        NODE_ENV: 'test',
        PORT: 3000,
        max_memory_restart: '2G',
        // TZ: 'Asia/Shanghai'
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
}
