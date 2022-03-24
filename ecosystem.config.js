module.exports = {
  apps: [
    {
      name: 'theta-data-api',
      script: './dist/main.js',
      instances: 2,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      increment_var : 'PORT',
      instance_var: 'INSTANCE_ID',
      env_test: {
        NODE_ENV: 'test',
        PORT: 2999,
        max_memory_restart: '4G',
        // TZ: 'Asia/Shanghai'
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
}
