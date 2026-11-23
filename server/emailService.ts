import crypto from 'crypto';
import nodemailer from 'nodemailer';

export type AdminEmailTrigger = 'new_order' | 'low_stock' | 'order_cancelled';

export interface AdminEmailLog {
  id: string;
  recipient: string;
  subject: string;
  trigger: AdminEmailTrigger;
  summary: string;
  deliveryMode: 'smtp' | 'internal_queue';
  status: 'sent' | 'queued';
  createdAt: string;
}

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'uzorbenny51@gmail.com';
const emailLogBuffer: AdminEmailLog[] = [];

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendAdminEmailNotification(params: {
  trigger: AdminEmailTrigger;
  subject: string;
  summary: string;
  htmlBody: string;
}): Promise<AdminEmailLog> {
  const transporter = createTransporter();
  const recipient = DEFAULT_ADMIN_EMAIL;
  let deliveryMode: 'smtp' | 'internal_queue' = 'internal_queue';
  let status: 'sent' | 'queued' = 'queued';

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"YouGlob Technology Ops" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: params.subject,
        text: params.summary,
        html: params.htmlBody,
      });
      deliveryMode = 'smtp';
      status = 'sent';
    } catch (err) {
      console.error('SMTP dispatch fallback:', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  const logEntry: AdminEmailLog = {
    id: `em_${crypto.randomBytes(6).toString('hex')}`,
    recipient,
    subject: params.subject,
    trigger: params.trigger,
    summary: params.summary,
    deliveryMode,
    status,
    createdAt: new Date().toISOString(),
  };

  emailLogBuffer.unshift(logEntry);
  if (emailLogBuffer.length > 100) {
    emailLogBuffer.pop();
  }

  return logEntry;
}

export function getAdminEmailLogs(): AdminEmailLog[] {
  return [...emailLogBuffer];
}
