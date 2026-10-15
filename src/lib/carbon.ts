export type Index = 'very low' | 'low' | 'moderate' | 'high' | 'very high';

export interface Slot {
  from: Date;
  to: Date;
  /** Forecast carbon intensity in gCO2 per kWh. */
  intensity: number;
  index: Index;
}

interface ApiSlot {
  from: string;
  to: string;
  intensity: { forecast: number; index: Index };
}

const BASE = 'https://api.carbonintensity.org.uk';

/** The API wants a start time as YYYY-MM-DDThh:mmZ, so seconds and milliseconds are cut off. */
export function formatStart(d: Date): string {
  return d.toISOString().slice(0, 16) + 'Z';
}

export function parseSlots(body: unknown): Slot[] {
  const data = (body as { data?: ApiSlot[] } | null)?.data;
  if (!Array.isArray(data)) throw new Error('Unexpected response from the Carbon Intensity API');
  return data.map((s) => ({
    from: new Date(s.from),
    to: new Date(s.to),
    intensity: s.intensity.forecast,
    index: s.intensity.index,
  }));
}

/** Half-hourly national forecast for the next 48 hours, starting from `now`. */
export async function fetchForecast(now: Date, signal?: AbortSignal): Promise<Slot[]> {
  const res = await fetch(`${BASE}/intensity/${formatStart(now)}/fw48h`, { signal });
  if (!res.ok) throw new Error(`The Carbon Intensity API answered ${res.status}`);
  return parseSlots(await res.json());
}
