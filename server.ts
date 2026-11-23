import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server/app.js';
import { broadcastPushEvent, initPushWebSocketServer } from './server/pushService.js';

async function startServer() {
  const app = createApiApp({ onPushEvent: broadcastPushEvent });
  const PORT = Number(process.env.PORT || 3000);

  const server = http.createServer(app);
  initPushWebSocketServer(server);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`YouGlob Technology server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
