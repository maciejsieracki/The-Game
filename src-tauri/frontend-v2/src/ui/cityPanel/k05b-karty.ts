/**
 * K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2): karty budynków z DOM — partia 2 (8 jednostek z 19).
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` jest kopią linii A..B pinu, łącznie
 * z komentarzami dokumentacyjnymi (bramka `tools/dom-harness/verify-k05b-copies.mjs`). Jedyna zmiana bajtowa: `export `
 * przy deklaracji najwyższego poziomu. Zależności: prymitywy z portów K01A/K01B/K02/K03 i `entityCards`; reguły gry i
 * pomocniki spoza zakresu przez `k05b-host.ts` (K05B-Z8/Z9). P5.13: UI nie liczy reguł gry.
 */
import { appendDetailSection, el, gridDetailRow } from './k01b-dom';
import { appendDetailGrid, appendDetailGridIn, beginBuildingDetailTile } from './k03-detail';
import { YIELD_BRAND, buildingIconHtml, parentBuildingName } from './k01b-t';
import { buildingBonusChipsHtml, buildingUpkeepDisplay, formatBuildingYieldDetailValue, formatBuildingYieldScaleRow } from './k01b-r';
import { formatBuildingUpkeepGridValue, formatBuildingUpkeepRowHtml } from './k01b-f';
import {
  BUILDING_REQ_SECTION_LABELS,
  BUILDING_UPKEEP_ZERO_LABEL,
  buildingRequirementChipsHtml,
  cityPanelChipIconWrap,
  epochLabelNum,
  isEmptyDataVal,
  tury,
  yieldBrandIconHtml,
} from './k01a-fundament';
import { ENTITY_CARD_BUILDING_STYLE_ID } from './k05a-fundament';
import { appendBuildingRequirementChipSections as appendBuildingRequirementChipSectionsK02, fillIconElement, makeBuildingThumb as makeBuildingThumbK02, techIconHintSpan } from './k02-units';
import { playerFacingNote } from './k03-model';
import { buildingAdapter as buildingAdapterDto } from '../entityCards/buildingAdapter';
import type { BuildingCardCityState } from '../entityCards/buildingAdapter';
import type { BuildingDefDto } from '../../viewmodel/types';
import { ENTITY_CARD_CSS, openEntityCard, renderEntityCard } from '../entityCards/renderer';
import { resolveTechnologyRow, technologyIdFromName } from '../entityCards/registry';
import { buildingRequirementChips, buildingStockCostChipsHtml, missingTechSteps } from './k05b-chipy';
import {
  appendBuildActionButtons,
  buildingStockCost,
  buildingStructuralDefenseBonusLine,
  buildingUiDisplayLevel,
  buildingWorkCost,
  cfg,
  cumulativeMnoznikForBuildingId,
  etaTurns,
  getTechDef,
  itemCost,
  mnoznikRoleForBuildingId,
  naukaCostSuffix,
  productionCtxForCity,
  stockResourceLabel,
  techPrereqChain,
  upgradeCompositionLines,
  upgradeChainSteps,
} from './k05b-host';
import type { AvailabilityContext, BuildingDef, BuildingReqChip, City, GameData, ProductionItem } from './k05b-host';

/**
 * K05B-Z10 (adaptery typu, bez kopii pól): pin `appendBuildingRequirementChipSections(parent, chips)` (cityPanel.ts:6980)
 * składa sekcje z `buildingRequirementChipsHtml` — port K02 przyjmuje ten tekst jako 3. argument.
 */
function appendBuildingRequirementChipSections(parent: HTMLElement, chips: BuildingReqChip[]): boolean {
  return appendBuildingRequirementChipSectionsK02(parent, chips, buildingRequirementChipsHtml);
}

/** K05B-Z10: pin `makeBuildingThumb(def)` (cityPanel.ts:6421) = `makeMiniThumb(buildingIconHtml(def))`. */
function makeBuildingThumb(def: BuildingDef | undefined): HTMLDivElement {
  return makeBuildingThumbK02(buildingIconHtml(def));
}

/**
 * K05B-Z10: wejście `buildingAdapter` (src/ui/entityCards) typu `BuildingDefDto`; lokalny `BuildingDef` ma te same nazwy pól
 * (podzbiór DTO używany przez adapter), bez kopiowania danych.
 */
function buildingAdapter(def: BuildingDef, ctx: { city: BuildingCardCityState }) {
  return buildingAdapterDto(def as unknown as BuildingDefDto, ctx as unknown as Parameters<typeof buildingAdapterDto>[1]);
}
// pin edb8fb56 gra/src/ui/cityPanel.ts:6994-7004
export function appendBuildingRequirementsBlock(
  parent: HTMLElement,
  def: BuildingDef,
  city: City | undefined,
  data: GameData,
  ctx: AvailabilityContext,
  unlockedTechs: readonly string[],
): boolean {
  const chips = buildingRequirementChips(def, city, data, ctx, unlockedTechs);
  return appendBuildingRequirementChipSections(parent, chips);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7012-7134
/** Karta infografiki budynku (Design Poziom B · 2026-07-05). */
export function buildBuildingInfocard(
  def: BuildingDef,
  data: GameData,
  opts?: {
    locked?: boolean;
    lockHint?: string;
    readyTag?: string;
    item?: ProductionItem;
    praca?: number;
    skarb?: number;
    buildLabel?: 'Buduj' | 'Ulepsz';
    upgrade?: boolean;
    city?: City;
    ctx?: AvailabilityContext;
    techs?: readonly string[];
  },
): HTMLDivElement {
  const card = el('div', 'bld-infocard');
  if (opts?.locked) card.classList.add('is-catalog-locked');

  const hd = el('div', 'bld-infocard-hd');
  const ic = el('div', 'bld-infocard-ic');
  fillIconElement(ic, buildingIconHtml(def));
  hd.appendChild(ic);
  const titWrap = el('div');
  titWrap.style.cssText = 'flex:1;min-width:0;';
  titWrap.innerHTML = `<div class="bld-infocard-title">${def.nazwa}</div>`;
  if (def.kategoria) {
    const cat = el('span', 'bld-infocard-cat');
    cat.textContent = def.kategoria;
    titWrap.appendChild(cat);
  }
  hd.appendChild(titWrap);
  card.appendChild(hd);

  const bd = el('div', 'bld-infocard-bd');
  // DAJE (efekty) — bonusy budynku, wyraźnie oddzielone od tego, co jest WYMAGANE do budowy
  // (Maciej 2026-07-24: gracz musi wiedzieć, czego mu brakuje i dlaczego nie może budować).
  const displayLevel = buildingUiDisplayLevel(def, opts?.city);
  const chipsHtml = buildingBonusChipsHtml(def, data.buildings, 3, displayLevel);
  if (chipsHtml) {
    bd.appendChild(el('div', 'bld-infocard-eyebrow', 'Daje'));
    const chips = el('div', 'bld-infocard-chips');
    chips.innerHTML = chipsHtml;
    bd.appendChild(chips);
  }
  // WYMAGANE — badania / budynki / surowce (niebieski = spełnione, czerwony = brak).
  const techs = opts?.techs ?? (opts?.city ? (cfg.getUnlockedTechs?.(opts.city.ownerId) ?? []) : []);
  const ctx = opts?.ctx ?? (opts?.city ? productionCtxForCity(opts.city) : undefined);
  const hasReqBlock = ctx
    ? appendBuildingRequirementsBlock(bd, def, opts?.city, data, ctx, techs)
    : false;
  if (!hasReqBlock) {
    const stockChipsHtml = buildingStockCostChipsHtml(def, opts?.city);
    const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
    if (stockChipsHtml) {
      bd.appendChild(el('div', 'bld-infocard-eyebrow req', BUILDING_REQ_SECTION_LABELS.stock));
      const stockChips = el('div', 'bld-infocard-chips');
      stockChips.innerHTML = stockChipsHtml;
      bd.appendChild(stockChips);
    }
    if (accessReq) {
      bd.appendChild(el('div', 'bld-infocard-eyebrow req', BUILDING_REQ_SECTION_LABELS.other));
      const acc = el('div', 'bld-infocard-req-access');
      acc.textContent = '⛰️ ' + accessReq;
      bd.appendChild(acc);
    }
  }

  const parentName = parentBuildingName(data, def.upgradeFrom);
  if (parentName) {
    const upg = el('div', 'bld-infocard-upg');
    upg.innerHTML = `<span style="color:var(--gold);font-size:1.1em;line-height:1;">↗</span>` +
      `<span>Rozbudowa z <span style="color:var(--gold);">${parentName}</span></span>`;
    bd.appendChild(upg);
  }

  const ft = el('div', 'bld-infocard-ft');
  const era = el('span', 'bld-infocard-era');
  era.innerHTML = `<span class="bld-infocard-era-dot"></span>Epoka ${epochLabelNum(def.epokaWejscia).toLowerCase()}`;
  ft.appendChild(era);
  const upkeepLine = formatBuildingUpkeepRowHtml(buildingUpkeepDisplay(def, 1), true);
  if (upkeepLine !== BUILDING_UPKEEP_ZERO_LABEL) {
    const up = el('span', 'bld-infocard-upkeep');
    up.innerHTML = upkeepLine;
    up.title = 'Utrzymanie co turę';
    ft.appendChild(up);
  }
  const ftR = el('span');
  ftR.textContent = def.maksPoziom > 1 ? `max ${def.maksPoziom} poz.` : 'bez upgrade';
  if (parentName) {
    ftR.innerHTML = def.techUnlock && !isEmptyDataVal(def.techUnlock)
      ? `${techIconHintSpan(def.techUnlock, 12)}${String(def.techUnlock)}`
      : '↗ upgrade';
  }
  ft.appendChild(ftR);
  bd.appendChild(ft);

  if (opts?.item && opts.city) {
    const act = el('div', 'bld-infocard-actions');
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const cost = el('div', 'bld-infocard-cost');
    cost.innerHTML = `${opts.item.koszt}${workIc}${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    act.appendChild(cost);
    const btnWrap = el('div', 'civ-v-bld-btns');
    appendBuildActionButtons(btnWrap, opts.city, opts.item, opts.skarb, opts.buildLabel ?? 'Buduj', opts.upgrade);
    act.appendChild(btnWrap);
    bd.appendChild(act);
  } else if (opts?.readyTag) {
    const tag = el('div', 'bld-catalog-ready-tag');
    tag.textContent = opts.readyTag;
    bd.appendChild(tag);
  } else if (opts?.lockHint && !hasReqBlock) {
    const lock = el('div', 'bld-infocard-lock');
    lock.innerHTML = opts.lockHint;
    bd.appendChild(lock);
  }

  card.appendChild(bd);
  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7397-7463
export function appendTechDetailBlock(parent: HTMLElement, data: GameData, techName: string | null | undefined): void {
  if (!techName || isEmptyDataVal(techName)) {
    const g = appendDetailGridIn(parent);
    gridDetailRow(g, 'Technologia', 'Brak wymogu (startowa)');
    return;
  }
  const t = getTechDef(data, techName);
  const grid = appendDetailGridIn(parent);
  gridDetailRow(grid, 'Odblokowuje tech', `${techIconHintSpan(techName)}${techName}`);
  if (!t) return;

  if (t.Epoka) gridDetailRow(grid, 'Epoka tech', t.Epoka);
  if (t.Poziom != null) gridDetailRow(grid, 'Poziom drzewka', String(t.Poziom));
  if (t['Koszt nauki'] != null) gridDetailRow(grid, 'Koszt badania', `${t['Koszt nauki']}${naukaCostSuffix()}`);

  const chain = techPrereqChain(data, techName);
  if (chain.length > 1) {
    gridDetailRow(grid, 'Łańcuch wymagań', chain.map(n => `${techIconHintSpan(n, 12)}${n}`).join(' → '));
  } else {
    const prereq = t['Wymaga (prereq)'];
    if (prereq && !isEmptyDataVal(prereq)) {
      gridDetailRow(grid, 'Bezpośredni prereq', `${techIconHintSpan(String(prereq))}${String(prereq)}`);
    }
  }

  if (t['wymagany budynek'] && !isEmptyDataVal(t['wymagany budynek'])) {
    gridDetailRow(grid, 'Wymaga budynek', String(t['wymagany budynek']));
  }
  if (t['Dostęp do surowca.'] && !isEmptyDataVal(t['Dostęp do surowca.'])) {
    gridDetailRow(grid, 'Surowiec (tech)', String(t['Dostęp do surowca.']));
  }
  if (t['Odblokowuje budynek'] && !isEmptyDataVal(t['Odblokowuje budynek'])) {
    gridDetailRow(grid, 'Odblokowuje budynek', String(t['Odblokowuje budynek']));
  }
  if (t['Odblokowuje surowiec.'] && !isEmptyDataVal(t['Odblokowuje surowiec.'])) {
    gridDetailRow(grid, 'Odblokowuje surowiec', String(t['Odblokowuje surowiec.']));
  }
  const terrainUnlock = (t as unknown as Record<string, unknown>)['Odblokowuje ulepszenie terenu'];
  if (terrainUnlock && !isEmptyDataVal(terrainUnlock)) {
    gridDetailRow(grid, 'Odblokowuje pole', String(terrainUnlock));
  }
  const techNote = playerFacingNote(t.Uwagi);
  if (techNote) gridDetailRow(grid, 'Uwagi tech', techNote);

  // T10 LINKOWANIE-KRZYZOWE: JEDEN nowy link wyjścia z tego wbudowanego bloku (celowo
  // NIE migrowanego do entityCards, patrz nagłówek funkcji) do PEŁNEJ karty technologii
  // (T3, `technologyAdapter.ts` + `renderEntityCard`) jako OSOBNY, zagnieżdżony overlay
  // — `openEntityCard('technology', slug, {mode:'dialog'})` korzysta z tego samego
  // `pushOverlay`/`popOverlay` (`escapeOverlayStack.ts`) co reszta kart, więc Esc na
  // wierzchu zamyka TYLKO tę nową kartę, karta budynku/jednostki pod spodem zostaje.
  // Wzorem `improvementRangeRow()` wyżej (`.dc-v.dc-v-btn`, T7b) — przycisk jako
  // WŁASNA wartość wiersza (`.dc-v`), nie jako `techIconHintSpan()` wstrzykiwany przez
  // `.innerHTML` (ikonka pozostaje jak dziś, osobno, w wierszu „Odblokowuje tech" wyżej).
  const techSlug = technologyIdFromName(techName);
  if (resolveTechnologyRow(techSlug) != null) {
    const lEl = el('span', 'dc-l');
    lEl.textContent = 'Pełna karta';
    grid.appendChild(lEl);
    const vBtn = el('button', 'dc-v dc-v-btn');
    vBtn.type = 'button';
    vBtn.textContent = 'Zobacz pełną kartę technologii →';
    vBtn.setAttribute('data-entity-kind', 'technology');
    vBtn.setAttribute('data-entity-id', techSlug);
    vBtn.addEventListener('click', () => openEntityCard('technology', techSlug, { mode: 'dialog' }));
    grid.appendChild(vBtn);
  }
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7467-7528
/** Wstrzykuje `ENTITY_CARD_CSS` (bazowe style `.entity-card*` z `entityCards/renderer.ts`)
 * raz do dokumentu, plus lokalne dopasowanie szerokości karty (434px domyślnie) do
 * hover-docku panelu miasta (`HOVER_DETAIL_DOCK_W`=400px, `hoverDetailDock.ts`) i
 * pływającego tooltipu poza dockiem — bez tego karta (dziś renderowana przez wspólny
 * `renderEntityCard`) przycinałaby się w docku. Zaimplementowane TUTAJ (wewnątrz
 * `buildBuildingDetailCard`, jedynej funkcji z allowlisty T5 dotykającej stylów) zamiast
 * w głównym `ensureStyles()`/`css` template (poza allowlistą T5) — wzorem
 * `ensureUnitInfoCardStyles()` z T4 (`unitInfoCard.ts`), tylko wołane lazily przy
 * pierwszym zbudowaniu karty budynku zamiast osobnej eksportowanej funkcji. */
export function ensureEntityCardBuildingStyles(): void {
  if (document.getElementById(ENTITY_CARD_BUILDING_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ENTITY_CARD_BUILDING_STYLE_ID;
  style.textContent = `${ENTITY_CARD_CSS}
.civ-hover-detail-content .entity-card,
.civ-hover-detail-float .entity-card{width:100%;max-width:100%;box-sizing:border-box;}
/* P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1 (trzeci komponent ze zgloszenia).
   Sekcje "Technologie"/"Uwagi" tej karty buduje beginBuildingDetailTile() +
   appendTechDetailBlock() (.bld-detail-tile*, .dc-grid, .dc-l, .dc-v, .dc-note) — czyli
   STARY, wbudowany renderer panelu miasta, swiadomie NIE migrowany do entityCards.
   Caly jego CSS jest jednak zapisany WYLACZNIE pod selektorami zakotwiczonymi w klasie
   detail-card (.civ-detail-scope .detail-card .dc-grid, .civ-cs .detail-card .dc-grid,
   linie ~2529 i ~2618) — a karta z T5/T6 dostaje tylko bld-detail-card/unit-detail-card
   dopiete do .entity-card (stary _legacyBuildBuildingDetailCard tworzyl div o klasach
   "detail-card bld-detail-card", migracja te klase zgubila). Efekt: .dc-grid zostawal
   zwyklym blokiem, a .dc-l/.dc-v inline'owymi spanami bez odstepu — pola zlewaly sie
   w jeden ciag ("Odblokowuje techObrobka drewnaEpoka techKamienPoziom drzewka...").
   Nie dopinamy klasy detail-card (nalozylaby drugie tlo/ramke/padding na i tak juz
   oprawiona .entity-card — podwojna ramka), tylko odtwarzamy TE SAME reguly siatki i
   kafla pod selektorem .entity-card.bld-detail-card, w jednostkach px pasujacych do
   typografii karty encji (13px) zamiast em-ow starej karty (0.78em). */
.entity-card.bld-detail-card .bld-detail-tile{margin:0 14px 10px;padding:6px 9px 7px;
  background:rgba(0,0,0,.24);border:1px solid rgba(212,175,90,.18);border-radius:6px;
  box-shadow:inset 0 1px 0 rgba(232,216,138,.04);}
.entity-card.bld-detail-card .bld-detail-tile-hd{font-size:11px;font-weight:700;
  text-transform:uppercase;letter-spacing:.08em;color:#d4af5a;margin:0 0 4px;
  padding-bottom:3px;border-bottom:1px solid rgba(212,175,90,.2);}
.entity-card.bld-detail-card .dc-grid{display:grid;
  grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:2px 8px;margin-top:2px;
  font-size:13px;line-height:1.35;align-items:baseline;}
.entity-card.bld-detail-card .dc-l{min-width:0;word-break:break-word;
  color:var(--tg-text-muted,#9aa6b6);}
.entity-card.bld-detail-card .dc-v{min-width:0;word-break:break-word;}
.entity-card.bld-detail-card .dc-v .civ-cs-chip-ic-wrap,
.entity-card.bld-detail-card .dc-note .civ-cs-chip-ic-wrap{display:inline-flex;
  align-items:center;vertical-align:middle;margin-right:.08em;}
/* Link "Zobacz pelna karte technologii ->" (T10) — P-ENTITYCARD-LINKI-KRZYZOWE-NA-PRZYCISKI-Q1
   (kopia 3/3 .dc-v-btn): ten sam jezyk wizualny co linki krzyzowe w ENTITY_CARD_CSS, czyli
   od tego tematu PRZYCISK (1px zlota obwodka + ciemne tlo), nie zloty podkreslony link. */
.entity-card.bld-detail-card .dc-v-btn{-webkit-appearance:none;appearance:none;
  display:inline-block;justify-self:start;margin:0;padding:2px 10px;font:inherit;line-height:1.35;
  text-align:left;cursor:pointer;color:var(--tg-gold-primary,#e8d88a);text-decoration:none;
  border:1px solid rgba(232,216,138,.42);border-radius:var(--tg-radius-btn,8px);
  background:linear-gradient(180deg,#161c28,#0a0d14);
  box-shadow:inset 0 1px 0 rgba(232,216,138,.1);}
.entity-card.bld-detail-card .dc-v-btn:hover{color:#f4e6a8;border-color:var(--tg-gold-primary,#e8d88a);}
.entity-card.bld-detail-card .dc-v-btn:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));
  outline-offset:2px;}
.entity-card.bld-detail-card .dc-note{margin-top:4px;font-size:12px;line-height:1.35;
  color:var(--tg-text-muted,#9aa6b6);}`;
  document.head.appendChild(style);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7530-7556
/** Buduje kartę budynku przez `buildingAdapter` + wspólny `renderEntityCard`
 * (T5 MIGRACJA-KARTA-BUDYNKU-PANEL-MIASTA), zamiast własnego DOM-buildera — wzorem T3/T4.
 * Sekcje „Technologie"/„Uwagi" dopełnione TU (host), bo zależą od `data: GameData`/
 * `appendTechDetailBlock` — funkcji świadomie NIE migrowanej w tym kroku (plan
 * architektury §3 krok 2: `appendTechDetailBlock` zostaje nietknięta do T10, współdzielona
 * też z kartą jednostki). Adapter dostarcza WSZYSTKO, co da się policzyć z samego
 * `BuildingDef` + czystych funkcji `game/*` (patrz `buildingAdapter.ts` nagłówek). */
export function buildBuildingDetailCardViaEntityCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {
  ensureEntityCardBuildingStyles();
  const displayLevel = buildingUiDisplayLevel(def, city);
  const cityState: BuildingCardCityState = {
    hasCity: city !== undefined,
    displayLevel,
    buildCostPace: cfg.getBuildingCostPace?.() ?? 'niski',
    difficulty: cfg.getDifficulty?.() ?? 'normal',
    ownerId: 0, // 1:1 ze świadomym hardcode'em dawnego `buildBuildingDetailCard`
  };
  const built = buildingAdapter(def, { city: cityState });
  const card = renderEntityCard(built) as HTMLDivElement;
  card.classList.add('bld-detail-card');

  // --- Technologie / Uwagi — dopełnione TU (host), NIE w adapterze; patrz komentarz wyżej ---
  const techBody = beginBuildingDetailTile(card, 'Technologie');
  appendTechDetailBlock(techBody, data, def.techUnlock);

  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7558-7569
/** Publiczna sygnatura BEZ ZMIAN. Próbuje ścieżkę entityCards (T5), fallback do starej
 * implementacji (`_legacyBuildBuildingDetailCard`) w razie wyjątku — wzorem T3/T4, dopóki
 * Final Control nie potwierdzi parytetu. */
export function buildBuildingDetailCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {
  try {
    return buildBuildingDetailCardViaEntityCard(def, data, city);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[cityPanel] buildBuildingDetailCard: błąd ścieżki entityCards, fallback do starej implementacji:', err);
    return _legacyBuildBuildingDetailCard(def, data, city);
  }
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7571-7697
/** Stara implementacja (DOM-builder własny) — zachowana pod prywatną nazwą jako fallback
 * (wzorem `_legacyBuildUnitInfoCard`/`_legacyShowTechDiscoveryNotice`). ZERO zmian treści. */
export function _legacyBuildBuildingDetailCard(def: BuildingDef, data: GameData, city?: City): HTMLDivElement {
  const card = el('div', 'detail-card bld-detail-card');
  const head = el('div', 'dc-h');
  head.appendChild(makeBuildingThumb(def));
  const ht = el('span');
  ht.textContent = def.nazwa;
  head.appendChild(ht);
  card.appendChild(head);

  const displayLevel = buildingUiDisplayLevel(def, city);

  const charBody = beginBuildingDetailTile(card, 'Charakterystyka');
  const gChar = appendDetailGridIn(charBody);
  gridDetailRow(gChar, 'Kategoria', def.kategoria);
  gridDetailRow(gChar, 'Epoka wejścia', epochLabelNum(def.epokaWejscia));
  gridDetailRow(gChar, 'Typ', def.wielokrotny ? 'Wielokrotny' : 'Unikalny w mieście');
  if (displayLevel > 1 || def.maksPoziom > 1) {
    gridDetailRow(
      gChar,
      'Poziom w tym mieście',
      city
        ? `L${displayLevel} (epoka miasta — jak liczy silnik)`
        : `L1 (podgląd; w mieście rośnie z epoką, max ${def.maksPoziom})`,
    );
  }

  const yieldBody = beginBuildingDetailTile(card, 'Plony i efekty (przychód na turę)');
  const gYield = appendDetailGridIn(yieldBody);
  let anyYield = false;
  for (const y of YIELD_BRAND) {
    const base = def.baza[y.key] ?? 0;
    const inc = def.przyrost[y.key] ?? 0;
    if (base !== 0 || inc !== 0) {
      anyYield = true;
      gridDetailRow(
        gYield,
        y.label,
        `${formatBuildingYieldDetailValue(base, inc, displayLevel)} ${yieldBrandIconHtml(y.brandId)}`,
      );
      const scale = formatBuildingYieldScaleRow(def, base, inc);
      if (scale) {
        gridDetailRow(gYield, `${y.label} — skala poziomów`, scale);
      }
    }
  }
  // Sciezki ulepszen jednostek (2026-07-25, druga tura -- suma lancucha
  // upgradeFrom): jak w buildingBonusChipsHtml powyzej -- mnoznik nie idzie juz
  // do Pracy, wiec pokazujemy PRAWDZIWY SKUMULOWANY efekt tylko dla 6
  // rozpoznanych budynkow (Pancerz / Parametry); dla reszty jest martwy -> ukryty.
  {
    const role = mnoznikRoleForBuildingId(def.id);
    if (role) {
      const cumulative = cumulativeMnoznikForBuildingId(def.id, data.buildings);
      if (cumulative !== 0) {
        anyYield = true;
        const label = role === 'pancerz' ? 'Pancerz (jednostki, trwale)' : 'Parametry poza Pancerzem (jednostki, trwale)';
        gridDetailRow(gYield, label, `+${cumulative}%`);
      }
    }
  }
  const defenseLine = buildingStructuralDefenseBonusLine(def.id);
  if (defenseLine) {
    anyYield = true;
    gridDetailRow(gYield, 'Obrona strukturalna', defenseLine);
  }
  if (!anyYield) gridDetailRow(gYield, 'Efekty', '—');

  const costBody = beginBuildingDetailTile(card, 'Koszty budowy i utrzymania');
  const gCost = appendDetailGridIn(costBody);
  const pace = cfg.getBuildingCostPace?.() ?? 'niski';
  const difficulty = cfg.getDifficulty?.() ?? 'normal';
  const ownerId = 0;
  const baseWork = itemCost('budynek', def.id, { buildings: data.buildings, units: data.units }, 1);
  const workCost = buildingWorkCost(baseWork, undefined, pace, ownerId, difficulty);
  gridDetailRow(gCost, 'Koszt budowy (jednorazowy)', `${workCost} pkt Pracy ${cityPanelChipIconWrap('res-work', 14)}`);
  if (def.przyrostKosztu) {
    gridDetailRow(
      gCost,
      'Przyrost kosztu budowy',
      `+${def.przyrostKosztu} pkt Pracy ${cityPanelChipIconWrap('res-work', 14)} / poziom`,
    );
  }
  gridDetailRow(
    gCost,
    'Utrzymanie (co turę)',
    formatBuildingUpkeepGridValue(buildingUpkeepDisplay(def, 1)),
  );
  if (def.przyrostUtrzymania) {
    gridDetailRow(
      gCost,
      'Przyrost utrzymania',
      `+${def.przyrostUtrzymania} pkt Pieniądza ${cityPanelChipIconWrap('res-treasury', 14)} / poziom`,
    );
  }
  const stockCostDetail = buildingStockCost(def);
  if (Object.keys(stockCostDetail).length > 0) {
    gridDetailRow(
      gCost,
      'Koszt surowcowy (jednorazowy)',
      Object.entries(stockCostDetail).map(([k, v]) => `${v} ${stockResourceLabel(k)}`).join(' + ')
        + ' — z magazynu państwa',
    );
  }

  if (def.maksPoziom > 1) {
    const lvlBody = beginBuildingDetailTile(card, 'Poziomy');
    const gLvl = appendDetailGridIn(lvlBody);
    gridDetailRow(gLvl, 'Maks. poziom', String(def.maksPoziom));
    // Przytnij WYŚWIETLANIE do maksPoziom -- nazwyPoziomow bywa dłuższe w danych
    // (zarezerwowane pod przyszłe epoki), ale pokazujemy tylko realnie osiągalne.
    const names = def.nazwyPoziomow.slice(0, def.maksPoziom).filter(Boolean);
    if (names.length) gridDetailRow(gLvl, 'Nazwy', names.join(' → '));
  }

  if (def.wymagania && !isEmptyDataVal(def.wymagania)) {
    const reqBody = beginBuildingDetailTile(card, 'Wymagania budynku');
    const gReq = appendDetailGridIn(reqBody);
    gridDetailRow(gReq, 'Wymagania', def.wymagania);
  }

  const techBody = beginBuildingDetailTile(card, 'Technologie');
  appendTechDetailBlock(techBody, data, def.techUnlock);

  return card;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:7699-7804
/**
 * Karta szczegółów budynku w zakładce Budowa — pełne info (bonusy, koszty,
 * utrzymanie, wymagania, epoka) w panelu bocznym po najechaniu / kliknięciu.
 * Na liście zostaje tylko ikona + nazwa + Buduj.
 */
export function buildBuildingBuildTabDetailCard(
  def: BuildingDef,
  data: GameData,
  city: City | undefined,
  opts?: {
    item?: ProductionItem;
    praca?: number;
    skarb?: number;
    lockHint?: string;
    locked?: boolean;
    buildLabel?: 'Buduj' | 'Ulepsz';
    upgrade?: boolean;
    ctx?: AvailabilityContext;
    techs?: readonly string[];
  },
): HTMLDivElement {
  const card = buildBuildingDetailCard(def, data, city);

  const techs = opts?.techs ?? (city ? (cfg.getUnlockedTechs?.(city.ownerId) ?? []) : []);
  const ctx = opts?.ctx ?? (city ? productionCtxForCity(city) : undefined);
  let hasReqBlock = false;
  if (ctx) {
    const reqBody = beginBuildingDetailTile(card, 'Wymagane');
    const reqTile = reqBody.parentElement as HTMLElement;
    hasReqBlock = appendBuildingRequirementsBlock(reqBody, def, city, data, ctx, techs);
    if (hasReqBlock) {
      card.insertBefore(reqTile, card.children[1] ?? null);
    } else {
      reqTile.remove();
    }
  }

  if (opts?.lockHint && !hasReqBlock) {
    const lockBody = beginBuildingDetailTile(card, 'Niedostępne');
    const lockTile = lockBody.parentElement as HTMLElement;
    const lock = el('div', 'dc-note');
    lock.style.cssText = 'color:#d36b5e;font-style:normal;';
    lock.textContent = opts.lockHint;
    lockBody.appendChild(lock);
    card.insertBefore(lockTile, card.children[1] ?? null);
  }

  if (!hasReqBlock) {
    const stockChipsHtml = city ? buildingStockCostChipsHtml(def, city) : '';
    const accessReq = (def.wymagania && !isEmptyDataVal(def.wymagania)) ? String(def.wymagania) : '';
    if (stockChipsHtml) {
      const stockBody = beginBuildingDetailTile(card, BUILDING_REQ_SECTION_LABELS.stock);
      const chips = el('div', 'bld-infocard-chips');
      chips.innerHTML = stockChipsHtml;
      stockBody.appendChild(chips);
    }
    if (accessReq) {
      const accessBody = beginBuildingDetailTile(card, BUILDING_REQ_SECTION_LABELS.other);
      const acc = el('div', 'dc-note');
      acc.style.fontStyle = 'normal';
      acc.textContent = accessReq;
      accessBody.appendChild(acc);
    }
  }

  const displayLevel = city ? buildingUiDisplayLevel(def, city) : 1;
  const chipsHtml = buildingBonusChipsHtml(def, data.buildings, 3, displayLevel);
  if (chipsHtml) {
    const givesBody = beginBuildingDetailTile(card, 'Daje');
    const chips = el('div', 'bld-infocard-chips');
    chips.innerHTML = chipsHtml;
    givesBody.appendChild(chips);
  }

  const parentName = parentBuildingName(data, def.upgradeFrom);
  if (parentName) {
    const chainBody = beginBuildingDetailTile(card, 'Łańcuch');
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = `Rozbudowa z: ${parentName}`;
    chainBody.appendChild(note);
  }

  if (opts?.item && city && !opts.locked) {
    const act = el('div', 'bld-detail-actions');
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const cost = el('div', 'bld-infocard-cost');
    cost.style.cssText = 'flex:1 1 100%;margin-bottom:0.2em;';
    cost.innerHTML = `Koszt kolejki: ${opts.item.koszt}${workIc}${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    act.appendChild(cost);
    const btnWrap = el('div', 'civ-v-bld-btns');
    appendBuildActionButtons(btnWrap, city, opts.item, opts.skarb, opts.buildLabel ?? 'Buduj', opts.upgrade);
    act.appendChild(btnWrap);
    card.appendChild(act);
  } else if (!opts?.locked && opts?.item) {
    const e = etaTurns(opts.item.koszt, 0, opts.praca ?? 0);
    const workIc = cityPanelChipIconWrap('res-work', 12);
    const note = el('div', 'dc-note');
    note.style.fontStyle = 'normal';
    note.textContent = `Koszt: ${opts.item.koszt} pracy${e !== null ? ' · ~' + e + ' ' + tury(e) : ''}`;
    card.appendChild(note);
  }

  return card;
}

