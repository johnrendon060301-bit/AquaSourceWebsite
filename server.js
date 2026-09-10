/**
 * AquaSource Lightweight Local Development Server (Zero-Dependency)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function handleRequest(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const filePath = path.join(ROOT, reqPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>404 Not Found</h2><p>Could not find file: <code>${reqPath}</code></p><p><a href="/index.html">Return to AquaSource Portal</a></p>`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

function listenOnPort(port) {
  const srv = http.createServer(handleRequest);

  srv.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}/index.html`;
    console.log(`\n======================================================`);
    console.log(`🚀 AquaSource Local Web Server is LIVE!`);
    console.log(`🌐 Unified Portal:     http://localhost:${port}/index.html`);
    console.log(`📦 Buyer Tracking:     http://localhost:${port}/BuyerAquaSource.html`);
    console.log(`🏢 Farm Owner Console: http://localhost:${port}/SellerAquaSource.html`);
    console.log(`🛡️ BFAR Admin Console: http://localhost:${port}/AdminAquaSource.html`);
    console.log(`======================================================\n`);

    // Open default browser on Windows
    exec(`start ${url}`, () => {});
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      listenOnPort(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

listenOnPort(PORT);
