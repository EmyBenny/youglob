import type { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';

export interface PushEventPayload {
  event: 'order:created' | 'order:status_updated' | 'inventory:low_stock' | 'promo:broadcast' | 'email:dispatched';
  targetUserId?: string;
  title: string;
  message: string;
  orderId?: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

interface ConnectedClient {
  socket: WebSocket;
  userId?: string;
  isAdmin: boolean;
}

const clients = new Set<ConnectedClient>();

export function initPushWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    const client: ConnectedClient = { socket, isAdmin: false };
    clients.add(client);

    socket.send(
      JSON.stringify({
        event: 'system:connected',
        message: 'Connected to real-time store updates',
        timestamp: new Date().toISOString(),
      })
    );

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string; userId?: string; isAdmin?: boolean };
        if (msg.type === 'register') {
          client.userId = typeof msg.userId === 'string' ? msg.userId : undefined;
          client.isAdmin = Boolean(msg.isAdmin);
        }
      } catch {
        // Ignore malformed frames
      }
    });

    socket.on('close', () => {
      clients.delete(client);
    });

    socket.on('error', () => {
      clients.delete(client);
    });
  });
}

export function broadcastPushEvent(payload: PushEventPayload): void {
  const encoded = JSON.stringify(payload);
  for (const client of clients) {
    if (client.socket.readyState !== WebSocket.OPEN) continue;

    if (payload.event === 'promo:broadcast') {
      client.socket.send(encoded);
      continue;
    }

    if (payload.event === 'inventory:low_stock' || payload.event === 'email:dispatched') {
      if (client.isAdmin) {
        client.socket.send(encoded);
      }
      continue;
    }

    if (
      !payload.targetUserId ||
      payload.targetUserId === 'all' ||
      client.userId === payload.targetUserId ||
      client.isAdmin
    ) {
      client.socket.send(encoded);
    }
  }
}
