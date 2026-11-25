/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = IS_PRODUCTION ? Number(process.env.PORT) || 3000 : 3000;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 10;
const rateBuckets = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const timestamps = (rateBuckets.get(ip) ?? []).filter((ts) => ts > windowStart);

  if (timestamps.length >= RATE_MAX_REQUESTS) {
    rateBuckets.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  rateBuckets.set(ip, timestamps);

  if (rateBuckets.size > 500) {
    for (const [key, list] of rateBuckets.entries()) {
      const fresh = list.filter((ts) => ts > windowStart);
      if (fresh.length === 0) {
        rateBuckets.delete(key);
      } else {
        rateBuckets.set(key, fresh);
      }
    }
  }

  return false;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeWhatsAppPhone(rawPhone: string): string | null {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) {
    return null;
  }
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return digits;
}

function isBlockedPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }

  const ipType = net.isIP(lower);
  if (ipType === 4) {
    const parts = lower.split('.').map(Number);
    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
  } else if (ipType === 6) {
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }

  return false;
}

function validateWebhookUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    if (isBlockedPrivateHost(parsed.hostname)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function dispatchWhatsAppThankYou(params: {
  name: string;
  email: string;
  normalizedPhone: string;
}): Promise<{ status: 'sent' | 'pending_config' | 'deferred'; provider?: string }> {
  const thankYouMessage = [
    `Halo ${params.name}, terima kasih telah menghubungi Mitra Property Indonesia!`,
    '',
    'Permintaan informasi Anda terkait Tanah Strategis 4 Hektare (40.000 m²) SHM Zona Kuning di Jl. Raya Telukjambe, Karawang telah kami terima.',
    'Tim pemasaran kami akan segera menghubungi Anda untuk detail lengkap dan penjadwalan survei lokasi.',
    '',
    'Balas pesan ini atau hubungi 0857 8106 8441 jika ada pertanyaan mendesak.',
  ].join('\n');

  const webhookUrlRaw = process.env.WHATSAPP_WEBHOOK_URL?.trim();
  const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (webhookUrlRaw) {
    const safeUrl = validateWebhookUrl(webhookUrlRaw);
    if (!safeUrl) {
      return { status: 'deferred', provider: 'webhook' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (webhookSecret) {
      headers['X-Webhook-Secret'] = webhookSecret;
    }

    try {
      const response = await fetch(safeUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event: 'inquiry.thank_you',
          channel: 'whatsapp',
          to: params.normalizedPhone,
          recipient: {
            name: params.name,
            email: params.email,
            phone: params.normalizedPhone,
          },
          message: thankYouMessage,
          property: 'Tanah Strategis 4 Hektare Telukjambe Karawang',
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        return { status: 'sent', provider: 'webhook' };
      }
      return { status: 'deferred', provider: 'webhook' };
    } catch {
      return { status: 'deferred', provider: 'webhook' };
    }
  }

  if (waToken && waPhoneId && /^\d{5,30}$/.test(waPhoneId)) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: params.normalizedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: thankYouMessage,
          },
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        return { status: 'sent', provider: 'whatsapp_cloud' };
      }
      return { status: 'deferred', provider: 'whatsapp_cloud' };
    } catch {
      return { status: 'deferred', provider: 'whatsapp_cloud' };
    }
  }

  return { status: 'pending_config' };
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/inquiry', async (req: Request, res: Response) => {
    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        error: 'Terlalu banyak permintaan dalam waktu singkat. Silakan coba beberapa menit lagi.',
      });
      return;
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      res.status(400).json({
        ok: false,
        error: 'Format data tidak valid.',
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const cleanName = sanitizeText(body.name, 100);
    const cleanEmail = sanitizeText(body.email, 160);
    const cleanPhone = sanitizeText(body.phone, 24);

    if (cleanName.length < 2) {
      res.status(400).json({
        ok: false,
        error: 'Masukkan nama lengkap Anda (minimal 2 karakter).',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({
        ok: false,
        error: 'Masukkan alamat email yang valid.',
      });
      return;
    }

    const normalizedPhone = normalizeWhatsAppPhone(cleanPhone);
    if (!normalizedPhone) {
      res.status(400).json({
        ok: false,
        error: 'Masukkan nomor telepon / WhatsApp yang valid.',
      });
      return;
    }

    const delivery = await dispatchWhatsAppThankYou({
      name: cleanName,
      email: cleanEmail,
      normalizedPhone,
    });

    res.status(200).json({
      ok: true,
      deliveryStatus: delivery.status,
      provider: delivery.provider ?? null,
      recipientPhone: normalizedPhone,
    });
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*path', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});
