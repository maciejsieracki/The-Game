/**
 * cityPanelUxBridge.ts — most `cityUxFrame.ts` → `cityPanel.ts` (P5.7 r3, `R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`).
 *
 * Na pinie `cityUxFrame.ts:6-11` importuje z `cityPanel.ts` (cykl C1) trzy funkcje i typ:
 *   - `paintCityPanelSections` (`cityPanel.ts:11756-11762`) — malowanie sekcji panelu w zamontowanych kontenerach ramki,
 *   - `clearCityPanelUxMode` (`cityPanel.ts:10367`) — sprzątanie stanu panelu przy zamknięciu ramki,
 *   - `navigateCityPanel` (`cityPanel.ts:10224-10226`) — skróty ←/→ (przełączenie miasta),
 *   - typ `CityPanelUxMounts` (`cityPanel.ts:10349-10363`; tu przeniesiony 1:1 razem z komentarzami).
 * `cityPanel.ts` (11 986 LOC) jest portowany w osobnej rundzie (P5.7 r4, §11 dokumentu tematu), więc `cityUxFrame.ts`
 * woła te same nazwy z tego modułu, a `cityPanel.ts` po porcie rejestruje tu swoją implementację
 * (`registerCityPanelUx`) — wzorzec mostu P5.6-Z3 (`armyStackHudSuppression.ts`).
 *
 * ZAŁOŻENIE P5.7-Z7: do czasu portu `cityPanel.ts` brak rejestracji = brak efektu (ramka montuje puste kontenery).
 * Sygnatura `paintCityPanelSections` w v2: `(mounts, city: CityRefDto, refresh, onClose?)` — bez `map: GameMap`
 * (pin `:11759`): stan mapy żyje w Rust (P4-5B), ramka nigdy nie czytała `map` (tylko przekazywała dalej), a panel
 * miasta w v2 czyta dane z `CityPanelDto` (P5-0 §6.2), nie z `GameMap`. Moduł niczego nie liczy (stan UI, nie reguła gry).
 */
import type { CityRefDto } from '../viewmodel/types';

export interface CityPanelUxMounts {
  top: HTMLElement;
  left: HTMLElement;
  /** Pionowy pasek ikon produkcji (budowa, rekrutacja). */
  leftIconRail?: HTMLElement;
  /** Pionowy pasek ikon parametrów miasta (spichlerz, handel…). */
  rightIconRail?: HTMLElement;
  /** Panel szczegółów na prawo od lewej kolumny (garnizon, produkcja…). */
  leftDetailDock?: HTMLElement;
  /** Panel szczegółów na lewo od prawej kolumny (okolica, ekonomia…). */
  detailDock?: HTMLElement;
  right: HTMLElement;
  /** Pływające elementy na mapie (tabliczka miasta, przyciski u dołu). */
  mapChrome?: HTMLElement;
}

export interface CityPanelUxImpl {
  paintCityPanelSections(mounts: CityPanelUxMounts, city: CityRefDto, refresh: () => void, onClose?: () => void): void;
  clearCityPanelUxMode(): void;
  navigateCityPanel(dir: -1 | 1): void;
}

let impl: CityPanelUxImpl | null = null;

export function registerCityPanelUx(fn: CityPanelUxImpl | null): void {
  impl = fn;
}

export function paintCityPanelSections(
  mounts: CityPanelUxMounts,
  city: CityRefDto,
  refresh: () => void,
  onClose?: () => void,
): void {
  impl?.paintCityPanelSections(mounts, city, refresh, onClose);
}

export function clearCityPanelUxMode(): void {
  impl?.clearCityPanelUxMode();
}

export function navigateCityPanel(dir: -1 | 1): void {
  impl?.navigateCityPanel(dir);
}
