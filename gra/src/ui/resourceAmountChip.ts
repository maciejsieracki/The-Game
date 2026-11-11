/**
 * R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1 — chip „liczba + ikona surowca" dla wierszy
 * budynków w panelu miasta (utrzymanie, produkcja konwertera, łączne utrzymanie).
 *
 * Ikona pochodzi z tego samego źródła co pasek zasobów i Spichlerz
 * (`mapResourceIconSvg` → resources-map/). Nazwa surowca żyje wyłącznie w `title` i
 * `aria-label` ikony, nie w widocznym tekście — wiersz zawiera tylko liczbę i symbol.
 */
import { mapResourceIconSvg } from './icons/brandAssets';
import { stockResourceLabel } from '../game/building-stock-cost';

/** Rozmiar ikony surowca w wierszu budynku (px); skalowany do 1,1em w CSS. */
export const BUILDING_RESOURCE_CHIP_ICON_PX = 14;

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * HTML chipa: `<span class="bld-res-chip">{amountText} {ikona}{unitSuffix}</span>`.
 * `amountText` np. "−2" lub "+50" (już ze znakiem); `unitSuffix` np. "/t" lub "".
 */
export function resourceAmountChipHtml(key: string, amountText: string, unitSuffix = ''): string {
  const label = stockResourceLabel(key);
  const svg = mapResourceIconSvg(label, BUILDING_RESOURCE_CHIP_ICON_PX);
  const attrs = `title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}"`;
  const icon = svg
    ? `<span class="bld-res-chip-ic" role="img" ${attrs}>${svg}</span>`
    : `<span class="bld-res-chip-ic bld-res-chip-ic--text" role="img" ${attrs}>${escapeAttr(label)}</span>`;
  return `<span class="bld-res-chip">${amountText} ${icon}${unitSuffix}</span>`;
}

/** Escapowanie tekstu wstawianego do HTML chipa (kwoty pochodzą z danych/adapterów). */
export function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Style chipa (wspólne dla panelu miasta i imperium — oba panele muszą mieć je bez zależności od kolejności otwarcia). */
export const RESOURCE_CHIP_CSS = `
/* R-WEB-UI-CITY-BUILDINGS-RESOURCE-ICONS-Q1: surowiec = liczba + ikona (bez nazwy słownej). Chip jest
   niełamliwy, wiersz zawija się między chipami (flex-wrap), ikona skaluje się z tekstem. */
.bld-res-chip{display:inline-flex;align-items:center;gap:0;white-space:nowrap;}
.bld-res-chip-ic{display:inline-flex;align-items:center;justify-content:center;width:1.35em;height:1.35em;flex:none;line-height:0;vertical-align:-0.3em;}
.bld-res-chip-ic svg{width:100%;height:100%;display:block;}
.bld-res-chip-ic--text{font-size:0.6em;line-height:1;}
`;
