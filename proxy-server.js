#!/usr/bin/env node

// Simple HTTP proxy server to work around Chrome extension CORS restrictions
const http = require('http');
const { URL } = require('url');

const PORT = 3001;
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

const server = http.createServer((req, res) => {
  // Set CORS headers to allow Chrome extension access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`${req.method} ${req.url}`);
  
  // Proxy the request to Ollama
  const proxyUrl = `${OLLAMA_BASE_URL}${req.url}`;
  console.log(`Proxying to: ${proxyUrl}`);
  
  const proxyReq = http.request(proxyUrl, {
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json'
    }
  }, (proxyRes) => {
    console.log(`Ollama response: ${proxyRes.statusCode}`);
    
    // Copy status and headers
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': proxyRes.headers['content-type'] || 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Pipe the response
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  });
  
  // Pipe the request body
  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`✅ Ollama proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying requests to ${OLLAMA_BASE_URL}`);
  console.log('');
  console.log('Usage:');
  console.log(`- GET http://localhost:${PORT}/api/tags`);
  console.log(`- POST http://localhost:${PORT}/api/generate`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop any existing server on this port.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});