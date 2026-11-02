import { config } from '../config.js';

export type EmailMessage = { to: string; subject: string; text: string; html?: string; category: 'transactional' | 'product' | 'promotional' };
export interface EmailProvider { name: string; configured: boolean; send(msg: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }>; }

/** En desarrollo/pruebas los correos se guardan en memoria y se imprimen en consola. */
export const outbox: EmailMessage[] = [];

const consoleProvider: EmailProvider = {
  name: 'console', configured: true,
  async send(msg) {
    outbox.push(msg);
    if (config.NODE_ENV !== 'test') console.log(`[email:console] → ${msg.to} | ${msg.subject}\n${msg.text}`);
    return { ok: true, id: `console-${outbox.length}` };
  },
};

const resendProvider: EmailProvider = {
  name: 'resend', configured: Boolean(config.RESEND_API_KEY),
  async send(msg) {
    if (!config.RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY no configurada' };
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.EMAIL_FROM, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  },
};

export function getEmailProvider(): EmailProvider {
  if (config.EMAIL_PROVIDER === 'resend') return resendProvider;
  // SMTP: pendiente de implementar (ver docs/servicios-externos.md). Se usa consola para no fingir envíos.
  return consoleProvider;
}
