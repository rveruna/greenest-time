import type { FuelShare } from './carbon';

/** The fuels the forecast counts as emitting no carbon when they generate. */
const ZERO_CARBON = new Set(['wind', 'solar', 'nuclear', 'hydro']);

export interface MixPart {
  fuel: string;
  perc: number;
}

export interface MixSummary {
  /** The biggest sources, largest first, in whole percent. Anything under 1% is left out. */
  parts: MixPart[];
  /** Wind, solar, nuclear and hydro together, in whole percent. */
  zeroCarbonPercent: number;
}

/** The few sources that explain the mix, so "0 gCO2/kWh" comes with its reason: mostly wind, say. */
export function summariseMix(mix: FuelShare[] | null, top = 3): MixSummary | null {
  if (!mix || mix.length === 0) return null;
  const parts = mix
    .map((m) => ({ fuel: m.fuel, perc: Math.round(m.perc) }))
    .filter((m) => m.perc >= 1)
    .sort((a, b) => b.perc - a.perc)
    .slice(0, top);
  if (parts.length === 0) return null;
  const zero = mix.filter((m) => ZERO_CARBON.has(m.fuel)).reduce((sum, m) => sum + m.perc, 0);
  return { parts, zeroCarbonPercent: Math.round(zero) };
}

/** "71% wind, 25% nuclear and 4% solar" */
export function describeMix(summary: MixSummary): string {
  const items = summary.parts.map((p) => `${p.perc}% ${p.fuel}`);
  return items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
