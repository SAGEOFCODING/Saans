import { fetchWithRetry } from '../lib/http';

export interface GeocodeResult {
  name: string;
  admin?: string;
  lat: number;
  lon: number;
}

interface OpenMeteoGeoItem {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export async function searchLocality(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q || q.length > 80) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;

  try {
    const res = await fetchWithRetry(url, { timeoutMs: 4000, retries: 1 });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: OpenMeteoGeoItem[] };
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.slice(0, 5).map((item) => ({
      name: item.name,
      admin: [item.admin1, item.country].filter(Boolean).join(', ') || undefined,
      lat: Number(item.latitude.toFixed(2)),
      lon: Number(item.longitude.toFixed(2)),
    }));
  } catch {
    return [];
  }
}
