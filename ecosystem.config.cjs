module.exports = {
  apps: [
    {
      name: 'atelie-api',
      script: 'server/index.js',
      node_args: '--env-file=.env',
      autorestart: true,
      watch: false,
    },
    {
      name: 'atelie-web',
      script: 'node_modules/vite/bin/vite.js',
      args: '--host 127.0.0.1 --port 5173 --strictPort',
      autorestart: true,
      watch: false,
    },
  ],
};