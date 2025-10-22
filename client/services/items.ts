import Constants from 'expo-constants';

function getApiUrl(): string {
  const fromExpo = Constants.expoConfig?.extra?.API_URL || (Constants.manifest as any)?.extra?.API_URL;
  const fromEnv = (typeof process !== 'undefined' && (process.env as any)?.API_URL) || undefined;
  let url = fromExpo || fromEnv || '';
  if (!url && typeof __DEV__ !== 'undefined' && __DEV__) {
    url = 'http://10.0.2.2:8000';
    console.warn('API_URL not found in config. Falling back to', url, 'for development. Set API_URL in .env/app.config.js to override.');
  }
  if (!url) throw new Error('API_URL is not configured. Ensure process.env.API_URL is set and exposed via app.config.js');
  return url;
}

type Product = { id: number | string; name: string; price: number };

export async function getItemByBarcode(barcode: string): Promise<Product> {
  const base = getApiUrl();
  try {
    const res = await fetch(`${base}/items/barcode/${encodeURIComponent(barcode)}`);
    if (res.status === 200) return res.json();
    if (res.status === 404) {
      const e: any = new Error('NOT_FOUND');
      e.status = 404;
      throw e;
    }
    const text = await res.text();
    const e: any = new Error(`API_ERROR: ${res.status} ${text}`);
    e.status = res.status;
    throw e;
  } catch (err: any) {
    if (err?.message && err.message.includes('Network request failed')) {
      throw new Error(`Network error when calling ${base}/items/barcode/${barcode}: ${err.message}`);
    }
    throw err;
  }
}

export default { getItemByBarcode };
