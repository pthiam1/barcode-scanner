import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;

type Product = { id: number | string; name: string; price: number };

export async function getItemByBarcode(barcode: string): Promise<Product> {
  const res = await fetch(`${API_URL}/items/barcode/${encodeURIComponent(barcode)}`);
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
}

export default { getItemByBarcode };
