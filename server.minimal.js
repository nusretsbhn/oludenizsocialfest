console.log('=== BOOT ===');
console.log('time:', new Date().toISOString());
console.log('node:', process.version);
console.log('cwd:', process.cwd());
console.log('PORT raw:', JSON.stringify(process.env.PORT));

const PORT = Number(process.env.PORT) || 3000;

const http = require('http');

const server = http.createServer((req, res) => {
  console.log('request:', req.method, req.url);
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><body style="font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px">
    <h1 style="color:#e91e8c">Electrofest container AYAKTA</h1>
    <p>Node ${process.version}</p>
    <p>PORT ${PORT}</p>
    <p>Zaman: ${new Date().toISOString()}</p>
    <p>Bu ekranı görüyorsan Easypanel container çalışıyor. Sonraki adımda uygulamayı geri yükleyeceğiz.</p>
  </body></html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LISTEN OK on 0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('got SIGTERM');
  server.close(() => process.exit(0));
});
