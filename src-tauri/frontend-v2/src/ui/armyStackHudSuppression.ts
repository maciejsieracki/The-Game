/**
 * armyStackHudSuppression.ts — most `preBattle.ts` → `hud.ts` (P5.6, `R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1`).
 *
 * Na pinie `preBattle.ts:19` importuje `setArmyStackHudSuppressed` z `hud.ts` (`hud.ts:1768-1778`: ukrycie/przywrócenie
 * panelu rosteru armii na czas nakładki „ROZSTAWIENIE BITWY”). `hud.ts` (cykl C3) nie wchodzi do tej paczki (dispatch
 * P5.6: osobny temat P5.7+), więc `preBattle.ts` woła tę samą nazwę z tego modułu, a `hud.ts` po porcie rejestruje tu
 * swoją implementację (`registerArmyStackHudSuppression`).
 *
 * ZAŁOŻENIE P5.6-Z3: do czasu portu `hud.ts` brak rejestracji = brak efektu — jak na pinie, gdy panel rosteru nie
 * istnieje (`hud.ts:1771`: `if (armyStackApi === null) return;`). Moduł niczego nie liczy (stan UI, nie reguła gry).
 */
let handler: ((suppressed: boolean) => void) | null = null;

export function registerArmyStackHudSuppression(fn: ((suppressed: boolean) => void) | null): void {
  handler = fn;
}

export function setArmyStackHudSuppressed(suppressed: boolean): void {
  handler?.(suppressed);
}
