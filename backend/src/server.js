const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`[Server] DevTrack backend listening on port ${PORT}`);
  });

  server.on('error', (error) => {
    console.error('[Server] Failed to start HTTP server', {
      message: error.message,
    });
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error('[Server] Failed to initialize application', {
    message: error.message,
  });
  process.exit(1);
});

