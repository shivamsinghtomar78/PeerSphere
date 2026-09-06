/**
 * The single JWT implementation for the app: HS256 via Web Crypto.
 * Web Crypto is used (not jsonwebtoken) because middleware.ts runs on the
 * Edge runtime. Both sign and verify live here — no other module may
 * implement either.
 */

export type TokenPayload = {
  userId: string;
  role: 'STUDENT' | 'PLACEMENT_ADMIN';
};

type Claims = TokenPayload & { iat: number; exp: number };

const encoder = new TextEncoder();

function base64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecodeToString(s: string): string {
  return atob(s.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    usage,
  ]);
}

/** Signs an HS256 JWT with iat/exp claims. */
export async function signToken(
  payload: TokenPayload,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: Claims = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = base64urlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64urlEncode(encoder.encode(JSON.stringify(claims)));
  const data = `${header}.${body}`;
  const key = await hmacKey(secret, 'sign');
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${base64urlEncode(new Uint8Array(signature))}`;
}

/** Verifies signature, algorithm, shape, and expiry. Returns null on any failure. */
export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    let parsedHeader: { alg?: string } = {};
    try {
      parsedHeader = JSON.parse(base64urlDecodeToString(header));
    } catch {
      return null;
    }
    if (parsedHeader.alg !== 'HS256') return null;

    const key = await hmacKey(secret, 'verify');
    const sigBytes = Uint8Array.from(base64urlDecodeToString(signature), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(`${header}.${payload}`)
    );
    if (!valid) return null;

    const claims = JSON.parse(base64urlDecodeToString(payload)) as Partial<Claims>;
    if (!claims.userId || !claims.role) return null;
    if (claims.role !== 'STUDENT' && claims.role !== 'PLACEMENT_ADMIN') return null;
    if (typeof claims.exp === 'number' && claims.exp * 1000 < Date.now()) return null;

    return { userId: claims.userId, role: claims.role };
  } catch {
    return null;
  }
}
