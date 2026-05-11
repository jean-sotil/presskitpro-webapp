import 'server-only';

import type { PayPalClient } from './paypal-client';

export type PayPalWebhookHeaders = {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
};

export async function verifyPayPalWebhook(args: {
  headers: PayPalWebhookHeaders;
  rawBody: string;
  webhookId: string;
  paypal: PayPalClient;
}): Promise<boolean> {
  const { headers, rawBody, webhookId, paypal } = args;

  const response = await paypal.post('/v1/notifications/verify-webhook-signature', {
    transmission_id: headers.transmissionId,
    transmission_time: headers.transmissionTime,
    cert_url: headers.certUrl,
    auth_algo: headers.authAlgo,
    transmission_sig: headers.transmissionSig,
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody),
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { verification_status?: string };
  return result.verification_status === 'SUCCESS';
}
