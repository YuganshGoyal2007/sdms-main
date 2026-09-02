module.exports = {
  apps: [
    {
      name: 'gbu-sdsm-backend',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      max_restarts: 10,
      min_uptime: '30s',
      kill_timeout: 5000,
      wait_ready: false,
      node_args: ['--max-old-space-size=512'],
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        HOST: '0.0.0.0',
      },
      out_file: './logs/output-pm2.log',
      error_file: './logs/error-pm2.log',
      merge_logs: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
