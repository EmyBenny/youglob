import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
}

const ADMIN_EMAIL = 'uzorbenny51@gmail.com';
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

function getFirebaseProjectId(): string {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return typeof parsed.projectId === 'string' ? parsed.projectId : '';
    }
  } catch {
    // Fallback handled below
  }
  return process.env.FIREBASE_PROJECT_ID || '';
}

async function fetchGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certsExpiresAt && Object.keys(cachedCerts).length > 0) {
    return cachedCerts;
  }

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase public signing certificates.');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600 * 1000;

  cachedCerts = (await response.json()) as Record<string, string>;
  certsExpiresAt = now + maxAgeMs;
  return cachedCerts;
}

function base64UrlToBuffer(segment: string): Buffer {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64');
}

export async function verifyFirebaseBearerToken(authHeader?: string): Promise<VerifiedFirebaseUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlToBuffer(headerB64).toString('utf-8')) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(base64UrlToBuffer(payloadB64).toString('utf-8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      email?: string;
      email_verified?: boolean;
      exp?: number;
      iat?: number;
    };

    const projectId = getFirebaseProjectId();
    const nowSec = Math.floor(Date.now() / 1000);

    if (header.alg !== 'RS256' || !header.kid) return null;
    if (!projectId || payload.aud !== projectId) return null;
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    if (!payload.exp || payload.exp <= nowSec) return null;

    const certs = await fetchGoogleCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();

    const isValidSignature = verifier.verify(cert, base64UrlToBuffer(signatureB64));
    if (!isValidSignature) return null;

    const email = typeof payload.email === 'string' ? payload.email : '';
    const emailVerified = payload.email_verified === true;

    return {
      uid: payload.sub,
      email,
      emailVerified,
      isAdmin: emailVerified && email.toLowerCase() === ADMIN_EMAIL,
    };
  } catch {
    return null;
  }
}
