/**
 * K06B-1: garnizon, okolica i pinowanie panelu (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1).
 *
 * Ciała jednostek są kopiami z pinu edb8fb56 (`gra/src/ui/cityPanel.ts`); każda kopia ma znacznik `// pin edb8fb56 …:A-B`.
 * Zależności: `dep(…)` / `valueProxy(…)` / `constStr(…)` z `k06b-deps.ts` (K06B-Z2, Z4), stałe literalne (K06B-Z3),
 * typy pinu jako `any` (K06B-Z5), stan K06A przez akcesory (K06B-Z6), odłożone 3D/MAPA jako placeholdery (K06B-Z7).
 */

import { getK06aState, setK06aPinnedGarrisonCityId } from './k06a-fundament';
import { constStr, dep, valueProxy } from './k06b-deps';

// ─── K06B-Z5: typy pinu (alias any; zgodność z viewmodel/types.ts NIE_ZMIERZONO) ─────────────────────────────
type City = any;
type GameMap = any;
type GarrisonUnit = any;
type Hex = any;
type IMPROVEMENT_KEY_TO_NAME = any;
type Nakladka = any;
type OkolicaFocus = any;
type OkolicaTryb = any;

// ─── K06B-Z3: stałe literalne z pinu ───────────────────────────────────────────────────────────────────────────

// ─── K06B-Z2/Z4: delegaty funkcji i wartości ───────────────────────────────────────────────────────────────────
const appendDetailAlgo = (...args: any[]): any => dep('appendDetailAlgo')(...args);
const appendDetailFormula = (...args: any[]): any => dep('appendDetailFormula')(...args);
const appendDetailGrid = (...args: any[]): any => dep('appendDetailGrid')(...args);
const appendDetailSection = (...args: any[]): any => dep('appendDetailSection')(...args);
const appendGarrisonUnitChip = (...args: any[]): any => dep('appendGarrisonUnitChip')(...args);
const attachInteractiveDetail = (...args: any[]): any => dep('attachInteractiveDetail')(...args);
const cityPanelChipIconWrap = (...args: any[]): any => dep('cityPanelChipIconWrap')(...args);
const clearPinnedDetail = (...args: any[]): any => dep('clearPinnedDetail')(...args);
const cpInlineIcons = (...args: any[]): any => dep('cpInlineIcons')(...args);
const daninaLabelForCity = (...args: any[]): any => dep('daninaLabelForCity')(...args);
const el = (...args: any[]): any => dep('el')(...args);
const gridDetailRow = (...args: any[]): any => dep('gridDetailRow')(...args);
const improvementKeysForHex = (...args: any[]): any => dep('improvementKeysForHex')(...args);
const improvementRangeRow = (...args: any[]): any => dep('improvementRangeRow')(...args);
const improvementsInCityRange = (...args: any[]): any => dep('improvementsInCityRange')(...args);
const rangeName = (...args: any[]): any => dep('rangeName')(...args);
const ringsTiles = (...args: any[]): any => dep('ringsTiles')(...args);
const setNoteHtml = (...args: any[]): any => dep('setNoteHtml')(...args);
const showPinnedDetail = (...args: any[]): any => dep('showPinnedDetail')(...args);
const tileYield = (...args: any[]): any => dep('tileYield')(...args);
const IMPROVEMENT_KEY_TO_NAME: any = valueProxy('IMPROVEMENT_KEY_TO_NAME');
const Nakladka: any = valueProxy('Nakladka');
const cfg: any = valueProxy('cfg');

// ─── K06B-Z6: stan rootEl (pin: ui/cityPanel.ts:10158) ─────────────────────────────────────────────────────────
// pin edb8fb56 gra/src/ui/cityPanel.ts:10158-10158
let rootEl: HTMLDivElement | null = null;
// pin-end
export function setK06bRootEl(next: HTMLDivElement | null): void {
  rootEl = next;
}
export function getK06bRootEl(): HTMLDivElement | null {
  return rootEl;
}

// ─── Jednostki K06B (kopie pinu) ───────────────────────────────────────────────────────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:9392-9427
export function renderTopBarGarrison(mount: HTMLElement, city: City): void {
  mount.innerHTML = '';
  const units = cfg.getUnitsAt?.(city.q, city.r);
  const count = units?.length ?? 0;
  const showDetail = () => buildGarnizonDetailCard(units ?? null, count, city.q, city.r);
  const isPinned = getK06aState().pinnedGarrisonCityId === city.id;

  const label = el('button', 'civ-v-garrison-label');
  label.type = 'button';
  label.setAttribute('aria-label', count === 0
    ? 'Garnizon pusty — kliknij, aby zobaczyć szczegóły'
    : `Garnizon — ${count} jedn. w mieście — kliknij, aby zobaczyć listę`);
  setGarrisonLabelPinned(label, isPinned);
  label.title = count === 0
    ? 'Garnizon pusty — kliknij, aby zobaczyć szczegóły'
    : `Garnizon — ${count} jedn. w mieście · kliknij, aby zobaczyć listę`;
  const icon = el('span', 'civ-v-garrison-icon');
  icon.innerHTML = cityPanelChipIconWrap('chip-garrison', 18);
  label.appendChild(icon);
  const name = el('span');
  name.textContent = 'Garnizon';
  label.appendChild(name);
  const cnt = el('span', 'civ-v-garrison-count');
  cnt.textContent = units !== undefined ? String(count) : '—';
  label.appendChild(cnt);
  mount.appendChild(label);
  attachInteractiveDetail(label, showDetail, {
    delayMs: 220,
    sideHint: 'left',
    pinOnActivate: () => {
      pinGarrisonPanel(city.id, label);
    },
  });
  if (isPinned) showPinnedDetail(label, showDetail, 'left');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:9428-9494
export function buildGarnizonDetailCard(
  units: GarrisonUnit[] | null,
  count: number,
  cityQ?: number,
  cityR?: number,
): HTMLDivElement {
  const card = el('div', 'detail-card');
  const header = el('div', 'dc-h');
  const headerTitle = el('span');
  headerTitle.textContent = 'Garnizon — szczegóły';
  header.appendChild(headerTitle);
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'civ-v-garrison-detail-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Zamknij szczegóły garnizonu');
  close.title = 'Zamknij szczegóły garnizonu';
  close.addEventListener('click', (ev: any) => {
    ev.stopPropagation();
    clearGarrisonPanel();
  });
  header.appendChild(close);
  card.appendChild(header);
  const intro = el('div', 'dc-note');
  intro.style.fontStyle = 'normal';
  intro.textContent =
    'Jednostki w mieście — wzmacniają prawo (porządek) i bronią przed atakiem.';
  card.appendChild(intro);
  appendDetailSection(card, 'Stan');
  const g = appendDetailGrid(card);
  gridDetailRow(g, 'Jednostki', units === null ? '— (brak hooka silnika)' : count === 0 ? 'Brak garnizonu' : String(count));
  if (units && units.length > 0) {
    appendDetailSection(card, 'Lista jednostek');
    const list = el('div', 'civ-v-garrison-detail-list');
    for (const u of units) appendGarrisonUnitChip(list, u);
    card.appendChild(list);
    const hiddenCount = units.filter((u: any) => u.inGarnizon === true).length;
    if (hiddenCount >= 1 && cfg.onLeaveAllGarrison && cityQ !== undefined && cityR !== undefined) {
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'civ-v-garrison-leave-all-btn';
      allBtn.textContent = hiddenCount > 1 ? 'Odfortyfikuj wszystkie' : 'Odfortyfikuj';
      allBtn.title = hiddenCount > 1
        ? `Odfortyfikuj wszystkie ${hiddenCount} jednostki — zostają na heksie miasta`
        : 'Odfortyfikuj jednostkę — zostaje na heksie miasta';
      allBtn.addEventListener('click', () => cfg.onLeaveAllGarrison?.(cityQ, cityR));
      card.appendChild(allBtn);
    }
  }
  appendDetailSection(card, 'Wpływ na Prawo');
  const gp = appendDetailGrid(card);
  gridDetailRow(gp, '1 jednostka', '+20 pkt Prawa (szac.)');
  gridDetailRow(gp, '5+ jednostek', 'PrawPct do 100% (cap)');
  gridDetailRow(gp, 'Duże miasto bez wojska', 'Kara Prawa (≥6 mieszk.)');
  appendDetailAlgo(card, 'Mechanika', [
    'Garnizon podnosi Prawo — tłumi bunt i niepokoje; nie podnosi znacząco Szczęścia.',
    'Podczas oblężenia jednostki zużywają żywność z puli imperium / miasta.',
    'Słaby garnizon = łatwiejsze zdobycie miasta przez wroga.',
    'Utrzymanie wojska kosztuje — stacjonuj tam, gdzie naprawdę potrzebujesz porządku lub obrony.',
  ]);
  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9617-9728
export function buildOkolicaDetailCard(
  city: City,
  opts: {
    Rwork?: number;
    workedCount?: number;
    tilesInRange?: number;
    borderR: number;
    focus: OkolicaFocus;
    tryb: OkolicaTryb;
    clickHint: string;
    /** T7b: potrzebna do zebrania ulepszeń w zasięgu (sekcja „Ulepszenia w zasięgu"). */
    map?: GameMap;
  },
): HTMLDivElement {
  const { Rwork, workedCount, tilesInRange, borderR, focus, tryb, clickHint, map } = opts;
  const card = el('div', 'detail-card okolica-detail-card');
  const head = el('div', 'dc-h');
  head.innerHTML = '<span>Okolica — ściąga</span>';
  card.appendChild(head);

  const wN = workedCount !== undefined ? workedCount : '—';
  const rTxt = Rwork !== undefined ? `r${Rwork}` : 'r?';
  const cultTxt = borderR > 0
    ? `${cityPanelChipIconWrap('res-culture', 14)} +${borderR}`
    : `${cityPanelChipIconWrap('res-culture', 14)} 0`;
  const summary = el('div', 'dc-summary muted');
  summary.style.cssText = 'font-size:0.88em;margin-bottom:0.35em;';
  summary.innerHTML = cpInlineIcons(
    `${cityPanelChipIconWrap('chip-manpower', 14)} ${wN}/${city.population} · ${rTxt} · ${cultTxt}`,
  );
  card.appendChild(summary);

  appendDetailSection(card, 'Zasięg i pola');
  const g1 = appendDetailGrid(card);
  gridDetailRow(g1, 'Zasięg roboczy', Rwork !== undefined ? `r${Rwork} (${rangeName(Rwork)})` : '—');
  gridDetailRow(g1, 'Pól w zasięgu', tilesInRange !== undefined ? `${tilesInRange} heksów` : '—');
  gridDetailRow(g1, 'Pól obrabianych', workedCount !== undefined
    ? `${workedCount} 👤 (max ${city.population} obok miasta)`
    : '—');
  gridDetailRow(g1, 'Centrum miasta', 'Plony z terenu bez 👤 (jak Civ V)');

  appendDetailSection(card, 'Kultura i terytorium');
  const g2 = appendDetailGrid(card);
  gridDetailRow(g2, 'Granica kultury', borderR > 0 ? `+${borderR} pierścień(e) poza zasięgiem` : 'Brak dodatkowego pierścienia');
  if (Rwork !== undefined) {
    const total = 1 + 3 * Rwork * (Rwork + 1) + (borderR > 0 ? ringsTiles(Rwork, borderR) : 0);
    gridDetailRow(g2, 'Pełny zasięg', `~${total} pól (roboczy + kultura)`);
  }
  gridDetailRow(g2, 'Mapa świata', 'Granice i pełny zasięg widoczne na mapie');

  appendDetailSection(card, 'Profile i tryb');
  const g3 = appendDetailGrid(card);
  const focusLbl: Record<OkolicaFocus, string> = {
    zywnosc: `${cityPanelChipIconWrap('chip-grain', 14)} Żywność`,
    produkcja: `${cityPanelChipIconWrap('res-work', 14)} Produkcja`,
    podatki: `${cityPanelChipIconWrap('res-treasury', 14)} Podatki`,
    zrownowazone: `${cityPanelChipIconWrap('field-balanced', 14)} Zrównoważone`,
  };
  gridDetailRow(g3, 'Profil auto', focusLbl[focus] ?? focus);
  gridDetailRow(g3, 'Tryb', tryb === 'reczny' ? 'Ręczny 👤 na mapie' : 'Automatyczny');

  appendDetailFormula(card, `score = w🌾×żywność + w🔨×praca + w💰×${daninaLabelForCity(city).toLowerCase()}`);
  appendDetailFormula(card, 'Zasięg: r = min(max(5, populacja), 15)');

  appendDetailAlgo(card, 'Auto-przydział pól (assignWorkedTiles)', [
    'Zbierz wszystkie heksy w promieniu r od centrum (bez centrum miasta).',
    'Dla każdego pola oblicz plony (teren + rzeka + las + ulepszenie).',
    `Profil „${focusLbl[focus] ?? focus}”: wagi score — np. Żywność 3/0.5/0.5, Zrówn. 1/1/1.`,
    'Posortuj malejąco po score; remis → bliżej centrum → klucz „q,r”.',
    `Weź top N pól, gdzie N = populacja (${city.population} 👤).`,
    'Centrum miasta daje plony bez pracownika (jak Civ V).',
  ]);

  appendDetailAlgo(card, 'Tryb ręczny', [
    'Klik +👤 / PPM −👤 przypisuje pracownika na heksie.',
    'Max 👤 = populacja; nadmiarowe kliknięcia ignorowane.',
    '„↩ Przywróć auto” kopiuje bieżący auto-przydział i wraca do profilu.',
  ]);

  appendDetailSection(card, 'Sterowanie');
  const g4 = appendDetailGrid(card);
  gridDetailRow(g4, 'Mapa', 'Klik heks = +👤 · PPM = −👤');
  gridDetailRow(g4, 'Zoom', 'Kółko myszy na mapie okolicy');
  gridDetailRow(g4, 'Pełna pula', 'Brak efektu gdy brak wolnego pola');
  gridDetailRow(g4, 'Auto', 'Przycisk „↩ Przywróć auto” po ręcznych zmianach');
  gridDetailRow(
    g4,
    'Stan',
    `${tryb === 'reczny' ? 'Ręczny' : 'Auto'} · ${focusLbl[focus] ?? focus} · ${wN}/${city.population} 👤`,
  );

  // T7b (KARTA-ULEPSZENIA-TERENU), call-site 3/3 — recon T7a potwierdził brak dziś
  // jakiejkolwiek listy ulepszeń terenu z nazwami w tej zakładce (tylko zagregowane
  // plony per-hex). Unikalne typy w zasięgu roboczym miasta + licznik heksów, każdy
  // wiersz klikalny → ta sama karta co pozostałe 2 miejsca wywołania.
  const improvementCounts = improvementsInCityRange(city, map, Rwork);
  if (improvementCounts.size > 0) {
    appendDetailSection(card, 'Ulepszenia w zasięgu');
    const gImp = appendDetailGrid(card);
    const sortedImprovements = [...improvementCounts.entries()].sort((a: any, b: any) => b[1] - a[1]);
    for (const [key, count] of sortedImprovements) {
      improvementRangeRow(gImp, key, IMPROVEMENT_KEY_TO_NAME[key] ?? key, count);
    }
  }

  const note = el('div', 'dc-note');
  setNoteHtml(note, clickHint.trim()
    || `Profile ustawiają priorytet pól (${cityPanelChipIconWrap('chip-grain', 14)} ${cityPanelChipIconWrap('res-work', 14)} ${cityPanelChipIconWrap('res-treasury', 14)}). Pełne statystyki i algorytm powyżej.`);
  card.appendChild(note);
  return card;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:9785-9820
export function appendOkolicaYieldLabel(
  svg: SVGSVGElement,
  c: { cx: number; cy: number; hex: Hex | null; isCity: boolean },
  SIZE: number,
  fontScale: number,
): void {
  if (!c.hex) return;
  const ulepszeniaKeys = improvementKeysForHex(c.hex);
  const y = tileYield({
    terenBazowy: c.hex.terenBazowy,
    nakladka: c.hex.nakladka ?? Nakladka.Brak,
    maRzeke: !!(c.hex.rzeka && c.hex.rzeka.obecna),
    zloze: (c.hex as { zloze?: string }).zloze,
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : undefined,
  });
  const ytxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  ytxt.setAttribute('x', String(c.cx));
  ytxt.setAttribute('y', String(c.cy - SIZE * fontScale));
  ytxt.setAttribute('text-anchor', 'middle');
  ytxt.setAttribute('font-size', String(Math.round(SIZE * (fontScale === 0.35 ? 0.38 : 0.48))));
  ytxt.setAttribute('fill', c.isCity ? '#e0b24a' : '#c8d0dc');
  ytxt.setAttribute('pointer-events', 'none');
  const short: string[] = [];
  if (y.zywnosc !== 0) short.push(String(y.zywnosc));
  if (y.praca !== 0) short.push(String(y.praca));
  if (y.handel !== 0) short.push(String(y.handel));
  ytxt.textContent = short.join('/') || '·';
  svg.appendChild(ytxt);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9821-10017

/**
 * Kompaktowy podgląd pól obrabianych wokół miasta (ograniczone okno DISPLAY_R).
 * Pełna okolica (do r15) i granice kultury renderuje MAPA na świecie — tu tylko zerknięcie.
 * worked = realny zbiór z getWorkedTiles; brak haka -> fallback (pierścień d<=1).
 */
export function renderWorkedPreview(gridEl: HTMLElement, city: City, map: GameMap, worked: { q: number; r: number }[] | undefined, reczne?: Record<string, number>, tryb: OkolicaTryb = 'auto', illegalReczneKeys?: Set<string>): void {
  void gridEl; void city; void map; void worked; void reczne; void tryb; void illegalReczneKeys; // K06B-Z7: placeholder MAPA (P5-8 §6)
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:10165-10169
export function setGarrisonLabelPinned(label: HTMLElement, pinned: boolean): void {
  label.classList.toggle('is-pinned', pinned);
  label.setAttribute('aria-pressed', pinned ? 'true' : 'false');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:10170-10174
export function pinGarrisonPanel(cityId: number, label: HTMLElement): void {
  setK06aPinnedGarrisonCityId(cityId);
  setGarrisonLabelPinned(label, true);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:10175-10183
export function clearGarrisonPanel(): void {
  setK06aPinnedGarrisonCityId(null);
  clearPinnedDetail();
  document.querySelectorAll<HTMLElement>('.civ-v-garrison-label').forEach((label: any) => {
    setGarrisonLabelPinned(label, false);
  });
}

// pin-end
