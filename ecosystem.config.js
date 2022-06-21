module.exports = {
  apps: [
    {
      name: 'theta-data-api',
      script: './dist/main.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      increment_var : 'PORT',
      instance_var: 'INSTANCE_ID',
      env_test: {
        NODE_ENV: 'test',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    },
    {
      name: 'analyse-wallets',
      script: './dist/analyse/analyse-wallets.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'analyse-nft',
      script: './dist/analyse/analyse-nft.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'analyse-smart-contract',
      script: './dist/analyse/analyse-smart-contract.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'analyse-stake',
      script: './dist/analyse/analyse-stake.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'analyse-tx',
      script: './dist/analyse/analyse-tx.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    },
    {
      name: 'analyse-nft-statistics',
      script: './dist/analyse/analyse-nft-statistics.js',
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env_test: {
        NODE_ENV: 'test',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
}
