export interface Env {
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
}

interface ContactBody {
  name: string;
  email: string;
  subject: string;
  message: string;
  botField: string;
  timestamp: number;
  turnstileToken: string;
}

function json(data: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function str(val: unknown): string {
  return val == null ? '' : String(val);
}

function parseBody(raw: unknown): ContactBody {
  const body = raw as Record<string, unknown>;
  return {
    name: str(body.name).trim(),
    email: str(body.email).trim(),
    subject: str(body.subject).trim(),
    message: str(body.message).trim(),
    botField: str(body.botField),
    timestamp: Number(str(body.ts)) || 0,
    turnstileToken: str(body['cf-turnstile-response']),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function allFilled(...values: string[]): boolean {
  return values.every((v) => v.length > 0);
}

function validate(body: ContactBody, ip: string): Response | null {
  if (!allFilled(body.name, body.email, body.subject, body.message)) {
    return json({ error: 'All fields are required.' }, 400);
  }
  if (body.botField) {
    return json({ error: 'Bad request' }, 400);
  }
  if (Date.now() - body.timestamp < 3000) {
    return json({ error: 'Too fast – possible bot' }, 429);
  }
  if (!checkRateLimit(ip)) {
    return json({ error: 'Too many requests. Please try again later.' }, 429);
  }
  return null;
}

async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string,
): Promise<Response | null> {
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });

  const result = (await resp.json()) as { success: boolean };
  if (!result.success) {
    console.warn('Turnstile verification failed', result);
    return json({ error: 'CAPTCHA verification failed' }, 400);
  }
  return null;
}

async function sendEmail(body: ContactBody, env: Env): Promise<Response | null> {
  const { RESEND_API_KEY: resendKey, RESEND_FROM_EMAIL: fromEmail } = env;

  const name = escapeHtml(body.name);
  const email = escapeHtml(body.email);
  const escapedMessage = escapeHtml(body.message).replace(/\n/g, '<br/>');

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: fromEmail,
      subject: `[Contact] ${body.subject}`,
      reply_to: body.email,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${escapedMessage}</p>
      `,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Resend email failed', errText);
    return json({ error: 'Failed to send message' }, 500);
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const body = parseBody(raw);

    const validationError = validate(body, ip);
    if (validationError) return validationError;

    const turnstileError = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (turnstileError) return turnstileError;

    const emailError = await sendEmail(body, env);
    if (emailError) return emailError;

    return json({ ok: true }, 200);
  },
};
