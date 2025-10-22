import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL ?? '';
const DEFAULT_USER = Constants.expoConfig?.extra?.USER_ID ?? '';

function ensureApiUrl(): string {
  if (!API_URL) {
    throw new Error('API_URL is not configured. Ensure process.env.API_URL is set and exposed via app.config.js');
  }
  return API_URL;
}

export async function createPaymentIntent(customerId: string | undefined, pendingItems: Array<{ id: number; amount: number }>) {
  const cid = customerId ?? DEFAULT_USER;
  const base = ensureApiUrl();
  try {
    const res = await fetch(`${base}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: cid, pending_items: pendingItems }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Payment API error: ${res.status} ${text}`);
    }

    return res.json();
  } catch (err: any) {
    // Normalize network errors to surface clearer messages in RN
    if (err?.message && err.message.includes('Network request failed')) {
      throw new Error(`Network error when calling ${base}/payments/: ${err.message}`);
    }
    throw err;
  }
}

export async function checkPayment(paymentIntentId: string, customerId: string) {
  const cid = customerId ?? DEFAULT_USER;
  const base = ensureApiUrl();
  try {
    const res = await fetch(`${base}/payments/check/${paymentIntentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: cid }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Payment check error: ${res.status} ${text}`);
    }
    return res.json();
  } catch (err: any) {
    if (err?.message && err.message.includes('Network request failed')) {
      throw new Error(`Network error when calling ${base}/payments/check/${paymentIntentId}: ${err.message}`);
    }
    throw err;
  }
}

export default { createPaymentIntent, checkPayment };
