import 'server-only';

export type PayPalClient = {
  get(path: string): Promise<Response>;
  post(path: string, body: unknown): Promise<Response>;
  patch(path: string, body: unknown): Promise<Response>;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error(
      `PayPal credentials not configured. PAYPAL_CLIENT_ID: ${clientId ? 'set' : 'missing'}, PAYPAL_CLIENT_SECRET: ${clientSecret ? 'set' : 'missing'}`
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PayPal OAuth Debug]', {
      status: response.status,
      apiBase,
      clientIdLength: clientId?.length,
      error: errorText,
    });
    throw new Error(`PayPal OAuth failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

function createClient(): PayPalClient {
  const apiBase = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

  return {
    async get(path: string) {
      const token = await getAccessToken();
      const response = await fetch(`${apiBase}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        cachedToken = null;
        const retryToken = await getAccessToken();
        return fetch(`${apiBase}${path}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${retryToken}` },
        });
      }
      return response;
    },

    async post(path: string, body: unknown) {
      const token = await getAccessToken();
      const response = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        cachedToken = null;
        const retryToken = await getAccessToken();
        return fetch(`${apiBase}${path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${retryToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }
      return response;
    },

    async patch(path: string, body: unknown) {
      const token = await getAccessToken();
      const response = await fetch(`${apiBase}${path}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        cachedToken = null;
        const retryToken = await getAccessToken();
        return fetch(`${apiBase}${path}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${retryToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }
      return response;
    },
  };
}

let clientInstance: PayPalClient | null = null;

export function getPayPalClientOrThrow(): PayPalClient {
  if (!clientInstance) {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal is not configured');
    }
    clientInstance = createClient();
  }
  return clientInstance;
}
