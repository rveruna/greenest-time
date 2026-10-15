export const DURATIONS = [1, 2, 3, 4] as const;
export type Duration = (typeof DURATIONS)[number];
