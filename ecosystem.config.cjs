module.exports = {
  apps: [
    {
      name: "campusmarket",
      script: "server/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 4001,
      },
    },
  ],
};

