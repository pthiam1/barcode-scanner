import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;
const DEFAULT_USER = Constants.expoConfig?.extra?.USER_ID ?? '';

export async function createPaymentIntent(customerId: string | undefined, pendingItems: Array<{ id: number; amount: number }>) {
  const cid = customerId ?? DEFAULT_USER;
  const res = await fetch(`${API_URL}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: cid, pending_items: pendingItems }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment API error: ${res.status} ${text}`);
  }

  return res.json();
}

export async function checkPayment(paymentIntentId: string, customerId: string) {
  const cid = customerId ?? DEFAULT_USER;
  const res = await fetch(`${API_URL}/payments/check/${paymentIntentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: cid }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment check error: ${res.status} ${text}`);
  }
  return res.json();
}

export default { createPaymentIntent, checkPayment };
