// Stub prywatny dla recruit-resource-strip-test.cjs — realny leaderPortraits.ts używa
// `import.meta.glob` (Vite-only), który esbuild w Node/iife nie wykonuje (rzuca w
// runtime). appendRecruitMilitaryResourceStrip pod testem NIGDY nie woła tego modułu —
// jest ciągnięty tylko transytywnie przez inne pliki cityPanel.ts importuje (hud.ts,
// diploUiSkin.ts, itd.), poza zakresem tego tematu.
export function leaderNameFromPool(..._args: unknown[]): string | null { return null; }
export function civDisplayNameFromKey(_civKey: string | null | undefined): string | null { return null; }
export function civCardDisplayName(label: string, _ikonaId?: string | null): string { return label; }
export function civIconIdFromCivLabel(_label: string | null | undefined): string | null { return null; }
export function leaderPortraitUrl(_civId: string | null | undefined, _era: number): string | null { return null; }
export function leaderName(_civId: string | null | undefined, _era: number): string | null { return null; }
