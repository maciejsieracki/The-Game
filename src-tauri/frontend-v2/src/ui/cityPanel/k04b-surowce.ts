/**
 * K04 batch 3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1, runda 1): pasek „Surowce w zasięgu” miasta.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `renderSurowce` (:3663-3716).
 *
 * Reguła P5.13: dostęp do surowców z DTO (`CityPanelInputsDto.surowce`, ZAŁOŻENIE K04B-Z3: `legacy` = forma tablicy pinu).
 * Pin czytał `cfg.getResourceAccess?.(city.id)`; brak hooka = `undefined` (placeholder „PODGLĄD”), tu: brak `panelInputs`.
 * Ikony i detal (hover) wstrzykiwane — pin wołał `resourceBrandIconHtml` / `attachInteractiveDetail` / `buildSurowceDetailCard`.
 */
import { el } from './k01b-dom';
import { normalizeResourceAccess } from './k01b-t';
import { appendSurowceGrid } from './k02-units';

/** Dostęp do surowców z DTO (`CityPanelInputsDto.surowce`). */
export interface SurowceAccessDtoK04b {
  readonly potential: readonly string[];
  readonly active: readonly string[];
  /** ZAŁOŻENIE K04B-Z3: `true` = pinowa forma tablicy (`getResourceAccess` zwracał `string[]`). */
  readonly legacy: boolean;
}

/** Wstrzykiwane zależności UI (pin: `resourceBrandIconHtml`, `attachInteractiveDetail`, `buildSurowceDetailCard`). */
export interface RenderSurowceDepsK04b {
  readonly brandIconHtml: (nazwa: string) => string;
  readonly attachDetail: (
    target: HTMLElement,
    buildContent: () => HTMLElement,
    opts: { delayMs: number; sideHint: 'right' },
  ) => void;
  readonly buildDetail: (potential: string[], active: string[], legacy: boolean) => HTMLElement;
}

/** Podgląd pinowy, gdy brak hooka (pin: `const preview = ['Koń', 'Sól', 'Złoto']`). */
export const SUROWCE_PREVIEW_K04b: readonly string[] = ['Koń', 'Sól', 'Złoto'];

/** Pin :3682-3683: forma wejściowa dla `normalizeResourceAccess` z DTO (legacy → tablica aktywnych). */
export function surowceRawFromDtoK04b(
  dto: SurowceAccessDtoK04b | undefined,
): string[] | { potential: string[]; active: string[] } | undefined {
  if (dto === undefined) return undefined;
  if (dto.legacy) return [...dto.active];
  return { potential: [...dto.potential], active: [...dto.active] };
}

/** Pin :3663-3716 `renderSurowce` (wersja DTO). */
export function renderSurowceK04b(
  mount: HTMLElement,
  dto: SurowceAccessDtoK04b | undefined,
  compact: boolean,
  deps: RenderSurowceDepsK04b,
): void {
  mount.innerHTML = '';
  const raw = surowceRawFromDtoK04b(dto);
  const { potential, active, legacy } = normalizeResourceAccess(raw);
  const wrap = el('div', compact ? 'okolica-surowce-strip' : 'civ-w4-surowce-foot');
  const hd = el('div', 'civ-w4-surowce-hd');
  const surowceTitle = el('span', compact ? 'okolica-surowce-title' : 'civ-w4-surowce-title');
  surowceTitle.textContent = compact ? 'Surowce w zasięgu' : 'Surowce w zasięgu';
  const surowceDetail = el('button', compact ? 'okolica-info-link civ-w4-surowce-detail gold' : 'civ-w4-surowce-detail civ-w4-panel-detail gold');
  surowceDetail.type = 'button';
  surowceDetail.textContent = 'i szczegóły';
  surowceDetail.setAttribute('aria-label', 'Pokaż szczegóły surowców');
  hd.appendChild(surowceTitle);
  hd.appendChild(surowceDetail);
  wrap.appendChild(hd);
  const surowceBuild = () => deps.buildDetail(potential, active, legacy);
  deps.attachDetail(surowceDetail, surowceBuild, { delayMs: 220, sideHint: 'right' });

  const preview = [...SUROWCE_PREVIEW_K04b];
  const hasSplit = raw !== undefined && !legacy;
  const hasAny = hasSplit ? (active.length + potential.length > 0) : (raw !== undefined ? active.length > 0 : true);

  if (raw !== undefined && !hasAny) {
    const none = el('div', 'muted');
    none.style.fontSize = '0.72em';
    none.textContent = '(brak surowców w zasięgu miasta)';
    wrap.appendChild(none);
  } else if (hasSplit) {
    if (active.length > 0) {
      const subA = el('div', 'civ-w4-surowce-sub');
      subA.textContent = 'Dostęp aktywny';
      wrap.appendChild(subA);
      appendSurowceGrid(wrap, active, 'active', deps.brandIconHtml);
    }
    if (potential.length > 0) {
      const subP = el('div', 'civ-w4-surowce-sub');
      subP.textContent = 'Potencjał (złoże — zbuduj ulepszenie)';
      wrap.appendChild(subP);
      appendSurowceGrid(wrap, potential, 'potential', deps.brandIconHtml);
    }
  } else {
    const items = raw !== undefined ? active : preview;
    appendSurowceGrid(wrap, items, 'active', deps.brandIconHtml);
  }

  if (raw === undefined) {
    const ph = el('div', 'muted');
    ph.style.cssText = 'font-size:0.68em;margin-top:0.32em;';
    ph.textContent = 'PODGLĄD — czeka hak getResourceAccess';
    wrap.appendChild(ph);
  }

  mount.appendChild(wrap);
}
