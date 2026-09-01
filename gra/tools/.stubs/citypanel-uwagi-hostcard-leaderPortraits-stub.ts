// Stub prywatny dla citypanel-uwagi-hostcard-removed-real-render-test.cjs.
// `leaderPortraits.ts` woła `import.meta.glob` (Vite-only) przy ewaluacji modułu —
// esbuild/node tego nie rozumie. Test nie weryfikuje portretów liderów.
export function leaderPortraitUrl(_civId?: string): string | null { return null; }
export function leaderName(_civId?: string): string { return ''; }
export function leaderNameFromPool(_civId?: string, _seed?: unknown): string { return ''; }
export function civCardDisplayName(_civId?: string): string { return ''; }
export function civIconIdFromCivLabel(_label?: string): string { return ''; }
