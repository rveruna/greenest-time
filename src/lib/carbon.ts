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

export interface Forecast {
  slots: Slot[];
  /** Where the forecast is for: "Great Britain", or a grid region such as "South Scotland". */
  region: string;
}

/** The API answers an unknown postcode with a body of `null`, not an error status. */
export class PostcodeNotFoundError extends Error {
  constructor(public outcode: string) {
    super(`No forecast found for ${outcode}`);
    this.name = 'PostcodeNotFoundError';
  }
}

export function parseRegional(body: unknown, outcode: string): Forecast {
  const data = (body as { data?: { shortname?: string; data?: ApiSlot[] } | null } | null)?.data;
  if (!data) throw new PostcodeNotFoundError(outcode);
  return { slots: parseSlots({ data: data.data }), region: data.shortname ?? outcode };
}

/**
 * Half-hourly forecast for the next 48 hours from `now`: national, or for the grid region of an outward
 * postcode. Only the outward code is sent (see postcode.ts).
 */
export async function fetchForecast(
  now: Date,
  outcode: string | null,
  signal?: AbortSignal,
): Promise<Forecast> {
  const path = outcode
    ? `regional/intensity/${formatStart(now)}/fw48h/postcode/${encodeURIComponent(outcode)}`
    : `intensity/${formatStart(now)}/fw48h`;
  const res = await fetch(`${BASE}/${path}`, { signal });
  if (!res.ok) throw new Error(`The Carbon Intensity API answered ${res.status}`);
  const body = await res.json();
  return outcode ? parseRegional(body, outcode) : { slots: parseSlots(body), region: 'Great Britain' };
}
