// Stub prywatny dla citypanel-uwagi-hostcard-removed-real-render-test.cjs.
// `hud.ts` jest ciężkim modułem HUD-a mapy (canvas/WebGL); jedyne dwie nazwy
// importowane skądkolwiek w drzewie zależności `cityPanel.ts` (potwierdzone grepem
// całego `src/`) to poniższe dwa no-opy.
export function setArmyStackHudSuppressed(_v?: boolean): void {}
export function setMapHudChromeSuppressed(_v?: boolean): void {}
