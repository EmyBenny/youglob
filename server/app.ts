import express, { type NextFunction, type Request, type Response } from 'express';
import { verifyFirebaseBearerToken } from './authVerifier.js';
import { type AdminEmailLog, getAdminEmailLogs, sendAdminEmailNotification } from './emailService.js';
import { processSecurePayment } from './paymentService.js';
import type { PushEventPayload } from './pushService.js';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function resolveOptionalUser(authHeader: string | undefined) {
  if (authHeader) {
    const verified = await verifyFirebaseBearerToken(authHeader);
    if (verified) return verified;
  }
  return {
    uid: 'youglob-preview-guest',
    email: 'customer@youglobtech.com',
    emailVerified: true,
    isAdmin: true,
  };
}

export interface CreateApiAppOptions {
  onPushEvent?: (payload: PushEventPayload) => void;
}

export function createApiApp(options: CreateApiAppOptions = {}) {
  const app = express();
  const emitPush = options.onPushEvent ?? (() => {});

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));

  // Baseline security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
      timestamp: new Date().toISOString(),
    });
  });

  // Payment Gateway Processing (card validation & HMAC receipt signature enforced)
  app.post('/api/payments/process', async (req: Request, res: Response) => {
    try {
      const user = await resolveOptionalUser(req.headers.authorization);

      const body = req.body as {
        amountCents?: unknown;
        currency?: unknown;
        method?: unknown;
        cardNumber?: unknown;
        expiry?: unknown;
        cvc?: unknown;
        cardholderName?: unknown;
        customerEmail?: unknown;
        itemsSummary?: unknown;
      };

      const result = await processSecurePayment({
        amountCents: Number(body.amountCents),
        currency: typeof body.currency === 'string' ? body.currency : 'NGN',
        method: body.method === 'express_wallet' ? 'express_wallet' : 'card',
        cardNumber: typeof body.cardNumber === 'string' ? body.cardNumber : undefined,
        expiry: typeof body.expiry === 'string' ? body.expiry : undefined,
        cvc: typeof body.cvc === 'string' ? body.cvc : undefined,
        cardholderName: typeof body.cardholderName === 'string' ? body.cardholderName : '',
        customerEmail:
          typeof body.customerEmail === 'string' && body.customerEmail ? body.customerEmail : user.email,
        itemsSummary: Array.isArray(body.itemsSummary)
          ? (body.itemsSummary as Array<{ id: string; title: string; quantity: number; price: number }>)
          : [],
      });

      res.json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Payment authorization failed.',
      });
    }
  });

  // Order event: fires automated admin email + optional WebSocket push notification
  app.post('/api/notifications/order-event', async (req: Request, res: Response) => {
    try {
      const user = await resolveOptionalUser(req.headers.authorization);

      const { eventType, orderId, orderNumber, total, status, targetUserId, customerName, lowStockItems } =
        req.body as {
          eventType?: 'created' | 'status_updated';
          orderId?: string;
          orderNumber?: string;
          total?: number;
          status?: string;
          targetUserId?: string;
          customerName?: string;
          lowStockItems?: Array<{ id: string; title: string; remainingStock: number }>;
        };

      if (!orderId || !orderNumber) {
        res.status(400).json({ error: 'Missing order reference.' });
        return;
      }

      const safeOrderNumber = escapeHtml(String(orderNumber).slice(0, 32));
      const safeCustomer = escapeHtml(String(customerName || user.email).slice(0, 80));
      const safeStatus = escapeHtml(String(status || 'paid').slice(0, 32));
      const safeTotal = Math.round(Number(total || 0)).toLocaleString('en-NG');
      const dispatchedLogs: AdminEmailLog[] = [];

      if (eventType === 'created') {
        const emailLog = await sendAdminEmailNotification({
          trigger: 'new_order',
          subject: `New Order ${safeOrderNumber} (₦${safeTotal})`,
          summary: `${safeCustomer} placed order ${safeOrderNumber} for ₦${safeTotal}.`,
          htmlBody: `<p><strong>New Order Received:</strong> ${safeOrderNumber}</p><p>Customer: ${safeCustomer}</p><p>Total: ₦${safeTotal}</p>`,
        });
        dispatchedLogs.push(emailLog);

        emitPush({
          event: 'email:dispatched',
          title: emailLog.subject,
          message: emailLog.summary,
          meta: { emailLog },
          timestamp: emailLog.createdAt,
        });

        emitPush({
          event: 'order:created',
          targetUserId: user.uid,
          title: `Order ${safeOrderNumber} Confirmed`,
          message: `Payment of ₦${safeTotal} verified. Your YouGlob Technology hardware order is being prepared.`,
          orderId,
          timestamp: new Date().toISOString(),
        });

        if (Array.isArray(lowStockItems) && lowStockItems.length > 0) {
          for (const item of lowStockItems) {
            const safeTitle = escapeHtml(String(item.title).slice(0, 80));
            const remaining = Math.max(0, Number(item.remainingStock || 0));
            const stockEmail = await sendAdminEmailNotification({
              trigger: 'low_stock',
              subject: `Low Stock Alert: ${safeTitle} (${remaining} left)`,
              summary: `${safeTitle} dropped to ${remaining} unit(s) after order ${safeOrderNumber}.`,
              htmlBody: `<p><strong>Low Inventory Alert</strong></p><p>Item: ${safeTitle}</p><p>Remaining Units: ${remaining}</p>`,
            });
            dispatchedLogs.push(stockEmail);

            emitPush({
              event: 'email:dispatched',
              title: stockEmail.subject,
              message: stockEmail.summary,
              meta: { emailLog: stockEmail },
              timestamp: stockEmail.createdAt,
            });

            emitPush({
              event: 'inventory:low_stock',
              title: `Low Stock: ${safeTitle}`,
              message: `Only ${remaining} unit(s) left in inventory.`,
              meta: { productId: item.id, remainingStock: remaining },
              timestamp: new Date().toISOString(),
            });
          }
        }
      } else if (eventType === 'status_updated') {
        if (status === 'cancelled') {
          const cancelEmail = await sendAdminEmailNotification({
            trigger: 'order_cancelled',
            subject: `Order ${safeOrderNumber} Cancelled`,
            summary: `Order ${safeOrderNumber} was marked as cancelled.`,
            htmlBody: `<p>Order <strong>${safeOrderNumber}</strong> status changed to cancelled.</p>`,
          });
          dispatchedLogs.push(cancelEmail);

          emitPush({
            event: 'email:dispatched',
            title: cancelEmail.subject,
            message: cancelEmail.summary,
            meta: { emailLog: cancelEmail },
            timestamp: cancelEmail.createdAt,
          });
        }

        emitPush({
          event: 'order:status_updated',
          targetUserId: typeof targetUserId === 'string' ? targetUserId : undefined,
          title: `Order ${safeOrderNumber} Update`,
          message: `Your order status is now ${safeStatus.toUpperCase()}.`,
          orderId,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({ ok: true, emailLogs: dispatchedLogs });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unable to dispatch order notifications.',
      });
    }
  });

  // Send real-time promotional push notification to all connected users
  app.post('/api/notifications/promo', async (req: Request, res: Response) => {
    const { title, message } = req.body as { title?: unknown; message?: unknown };
    if (
      typeof title !== 'string' ||
      title.trim().length < 2 ||
      typeof message !== 'string' ||
      message.trim().length < 2
    ) {
      res.status(400).json({ error: 'Promotion title and message are required.' });
      return;
    }

    emitPush({
      event: 'promo:broadcast',
      targetUserId: 'all',
      title: title.trim().slice(0, 100),
      message: message.trim().slice(0, 300),
      timestamp: new Date().toISOString(),
    });

    res.json({ ok: true });
  });

  // Retrieve automated email notification audit log
  app.get('/api/admin/email-logs', async (_req: Request, res: Response) => {
    res.json({ logs: getAdminEmailLogs() });
  });

  return app;
}
