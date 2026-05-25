// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "api-demo",
      script: "./src/server.js",
      env: {
        PORT: 5000,
        NODE_ENV: "production"
      }
    },
    {
      name: "tunnel",
      script: "cloudflared",
      args: "tunnel --url http://127.0.0.1:5000",
      autorestart: true
    }
  ]
};