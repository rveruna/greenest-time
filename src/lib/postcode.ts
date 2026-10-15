/**
 * The outward code of a UK postcode: the part before the space ("EH1" from "EH1 1AA"). Only this is ever
 * sent to the API. It is enough to pick the grid region, and it keeps the full address on the device.
 * Accepts either half on its own or a full postcode, in any case and spacing. Returns null if it isn't one.
 */
export function outwardCode(input: string): string | null {
  const compact = input.toUpperCase().replace(/\s+/g, '');
  if (!compact) return null;
  // A full postcode ends in a digit and two letters (the inward code), e.g. 1AA.
  const full = compact.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})$/);
  if (full) return full[1];
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?$/.test(compact) ? compact : null;
}
