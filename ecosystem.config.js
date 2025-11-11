module.exports = {
  apps: [
    {
      name: "YY-frontend",
      script: "node_modules/next/dist/bin/next",
      args: ["start", "-p", "3947"],
      watch: false,
      restart_delay: 1000,
      max_restarts: 5,
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      log_file: "logs/combined.log",
    },
  ],
};
