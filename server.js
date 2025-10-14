// server.js
const express = require('express');
const next = require('next');
const path = require('path');

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Example API route (update as needed)
  // server.use('/api', require('./app/api/test-api'));

  // Serve static files
  server.use(express.static(path.join(__dirname, 'public')));

  // Handle Next.js pages
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});

// Log uncaught exceptions to a file
process.on('uncaughtException', function (err) {
  require('fs').appendFileSync('error.log', err.stack + '\n');
});
