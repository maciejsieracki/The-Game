// Stub prywatny dla recruit-resource-strip-test.cjs — realny audio/muzyka-antyczna.ts
// ciągnie audio/filePlayer.ts, który używa `import.meta.glob` (Vite-only); esbuild w
// Node/iife zeruje `import.meta`, więc wywołanie rzuca w runtime. Ciągnięty WYŁĄCZNIE
// transytywnie (cityPanel.ts -> hud.ts -> diplomacyAudience.ts -> ta muzyka), poza
// zakresem tego tematu — appendRecruitMilitaryResourceStrip nigdy nie odtwarza dźwięku.
export function startDiplomacyMusic(_civId?: string): void {}
export function stopDiplomacyMusic(): void {}
