/**
 * Karta informacyjna jednostki (mapa) — T4 MIGRACJA-KARTA-JEDNOSTKI-MAPA.
 *
 * `buildUnitInfoCard`/`showUnitInfoCardDialog` (sygnatury BEZ ZMIAN) budują treść przez
 * `entityCards/unitAdapter.ts` i renderują przez wspólny `entityCards/renderer.ts`
 * (`renderEntityCard`), zamiast własnego DOM-buildera — wzorem T3
 * (`techDiscoveryNotice.ts`). Stara implementacja zostaje pod prywatną nazwą
 * (`_legacyBuildUnitInfoCard`) jako fallback, dopóki nie potwierdzimy parytetu w
 * produkcji (patrz `_legacyShowTechDiscoveryNotice` z T3).
 *
 * KRYTYCZNE — mechanizm 3D (patrz `19-dispatch-T4-migracja-jednostka-mapa.md` i
 * `entityCards/renderer.ts` komentarz nad `data.medallion.mount(medallionEl)`):
 * `renderEntityCard()` woła `medallion.mount(medallionEl)` DOPIERO PO `appendChild`
 * medalionu do nagłówka karty (i nagłówka do karty) — więc `mountUnitMiniPreview`
 * zawsze dostaje element już osadzony w drzewku karty w momencie wywołania, dokładnie
 * jak w dawnym `unitInfoCard.ts:150-162` (`commitSection()` PRZED `mountUnitMiniPreview`).
 * Zweryfikowane czytaniem `renderer.ts` (nie zmienione w tym kroku) — kolejność
 * potwierdzona też testem `unit-info-card-entitycard-migration-test.cjs`.
 *
 * Medalion 3D w nowym kontrakcie mieści się w małym okrągłym slocie nagłówka karty
 * (`.entity-card-medallion`, 34×34px — patrz `entityCards/types.ts` `EntityCardMedallion`
 * i `renderer.ts` `buildMedallionEl`), NIE w osobnej, dużej sekcji „Model 3D" jak dawniej
 * — to jest zamierzony kształt kontraktu T1/T1b (medalion = mały nagłówkowy podgląd dla
 * wszystkich 4 kinds), nie regresja wprowadzona w T4. Lokalne nadpisania CSS niżej
 * (`ensureUnitInfoCardStyles`) tylko dopasowują canvas/fallback do rozmiaru slotu.
 */
import type { GameData, UnitDef } from '../data/loader';
import { unitAdapter } from './entityCards/unitAdapter';
import { renderEntityCard, ENTITY_CARD_CSS } from './entityCards/renderer';
import type { EntityCardData } from './entityCards/types';
import { categoryOf } from '../units/setup';
import { unitInfographicLabel, unitInfographicMedallionHtml } from './unitInfographic';
import { defaultOwnerColor, mountUnitMiniPreview } from './unitMiniPreview';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

export const UNIT_3D_RENDER_HOOK = 'buildUnitModel';

export interface UnitInfoCardOptions {
  ownerColor?: number;
  statusLines?: readonly string[];
  onClose?: () => void;
}

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  return text(value) !== '' && text(value) !== '—';
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

// ---------------------------------------------------------------------------------------
// Ścieżka T4 — adapter + renderer wspólny.
// ---------------------------------------------------------------------------------------

/** Buduje kartę przez `unitAdapter` + `renderEntityCard`. Woła adapter BEZPOŚREDNIO
 * (nie `buildEntityCardData`/resolver) — wołający ma już konkretny `UnitDef`, nie
 * samo `id`, więc pomijamy zbędne wyszukiwanie w rejestrze. */
function buildUnitInfoCardViaEntityCard(
  unit: UnitDef,
  options: UnitInfoCardOptions,
): HTMLDivElement {
  const built = unitAdapter(unit, {});
  const ownerColor = options.ownerColor ?? defaultOwnerColor();
  const fallbackMsg = 'Render 3D niedostępny w tym środowisku';

  // Medalion 3D i sekcja „Statusy" (dopełniona o `options.statusLines`) zależą od
  // KONKRETNEGO wywołania, nie samych danych jednostki — nadpisywane tu, wzorem
  // nagłówka karty technologii w T3 (patrz komentarz nad `unitAdapter.ts`).
  const cardData: EntityCardData = {
    ...built,
    medallion: {
      kind: 'unit3d',
      mount: (slot: HTMLElement) => mountUnitMiniPreview(slot, unit, ownerColor, fallbackMsg),
    },
    sections: built.sections.map((section) => {
      if (section.key !== 'statuses' || !options.statusLines || options.statusLines.length === 0) return section;
      return { ...section, badges: [...(section.badges ?? []), ...options.statusLines] };
    }),
  };

  const card = renderEntityCard(cardData) as HTMLDivElement;
  // Parytet z dawnym markerem DOM (testowany string-match, `unit-info-card-contract-test.cjs`
  // i wiring realnego renderu 3D) — zachowany niezależnie od wewnętrznej implementacji.
  card.dataset.unitName = text(unit.Jednostka);
  card.dataset.unit3dHook = UNIT_3D_RENDER_HOOK;

  if (options.onClose) {
    const header = card.querySelector<HTMLElement>('.entity-card-header');
    if (header) {
      const close = node('button', 'unit-info-card-close');
      close.type = 'button';
      close.textContent = '✕';
      close.title = 'Zamknij (Esc)';
      close.setAttribute('aria-label', 'Zamknij kartę jednostki');
      close.addEventListener('click', () => options.onClose?.());
      header.appendChild(close);
    }
  }

  return card;
}

// ---------------------------------------------------------------------------------------
// Publiczne API — sygnatury BEZ ZMIAN. Próbuje ścieżki T4, fallback do starej
// implementacji w razie wyjątku (wzorem `_legacyShowTechDiscoveryNotice`, T3).
// ---------------------------------------------------------------------------------------

export function buildUnitInfoCard(
  unit: UnitDef,
  data: GameData,
  options: UnitInfoCardOptions = {},
): HTMLDivElement {
  try {
    return buildUnitInfoCardViaEntityCard(unit, options);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[unitInfoCard] błąd ścieżki entityCards, fallback do starej implementacji:', err);
    return _legacyBuildUnitInfoCard(unit, data, options);
  }
}

export function showUnitInfoCardDialog(
  unit: UnitDef,
  data: GameData,
  options: UnitInfoCardOptions = {},
): () => void {
  const backdrop = node('div', 'unit-info-card-backdrop');
  const dialog = node('div', 'unit-info-card-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-label', `Informacje: ${text(unit.Jednostka)}`);
  let closed = false;
  const dismiss = (): void => {
    if (closed) return;
    closed = true;
    popOverlay('unit-info-card');
    backdrop.remove();
  };
  const card = buildUnitInfoCard(unit, data, { ...options, onClose: dismiss });
  dialog.appendChild(card);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) dismiss();
  });
  pushOverlay('unit-info-card', dismiss);
  return dismiss;
}

// ---------------------------------------------------------------------------------------
// Stara implementacja (DOM-builder własny) — zachowana pod prywatną nazwą jako fallback
// (wzorem `_legacyShowTechDiscoveryNotice` z T3). ZERO zmian w treści.
// ---------------------------------------------------------------------------------------

function appendRow(grid: HTMLElement, label: string, value: unknown, emphasize = false): void {
  if (!hasValue(value)) return;
  const row = node('div', emphasize ? 'unit-info-card-row unit-info-card-row-emphasis' : 'unit-info-card-row');
  const key = node('span', 'unit-info-card-key');
  key.textContent = label;
  const val = node('span', 'unit-info-card-value');
  val.textContent = text(value);
  row.append(key, val);
  grid.appendChild(row);
}

function appendBadgeRow(section: HTMLElement, label: string, values: readonly string[]): void {
  if (values.length === 0) return;
  const row = node('div', 'unit-info-card-row unit-info-card-row-badges');
  const key = node('span', 'unit-info-card-key');
  key.textContent = label;
  const badges = node('div', 'unit-info-card-badges');
  for (const value of values) {
    const badge = node('span', 'unit-info-card-badge');
    badge.textContent = value;
    badges.appendChild(badge);
  }
  row.append(key, badges);
  section.appendChild(row);
}

function appendStatusBadges(section: HTMLElement, statuses: readonly string[]): void {
  if (statuses.length === 0) return;
  const wrap = node('div', 'unit-info-card-status-badges');
  for (const status of statuses) {
    const badge = node('span', 'unit-info-card-status-badge');
    badge.appendChild(node('span', 'unit-info-card-status-dot'));
    badge.append(status);
    wrap.appendChild(badge);
  }
  section.appendChild(wrap);
}

/** Buduje sekcję odłączoną od karty; dołącz ją przez `commitSection()` dopiero po
 * wypełnieniu treścią, żeby puste sekcje (bez ani jednego wiersza) nie renderowały nagłówka. */
function appendSection(title: string): HTMLElement {
  const section = node('section', 'unit-info-card-section');
  const heading = node('h3');
  heading.textContent = title;
  section.appendChild(heading);
  return section;
}

/** Dołącza sekcję do karty tylko jeśli poza nagłówkiem ma jeszcze jakąś treść. */
function commitSection(card: HTMLElement, section: HTMLElement): void {
  if (section.childElementCount > 1) card.appendChild(section);
}

function collectCounters(unit: UnitDef, data: GameData): string[] {
  const typ = text(unit.Typ).toLowerCase();
  if (!typ) return [];
  return data.counters
    .filter(row => text(row['Typ atakujący']).toLowerCase() === typ)
    .map(row => {
      const target = text(row['Cel (typ)']);
      const bonus = text(row.Bonus);
      return bonus ? `${target}: ${bonus}` : target;
    })
    .filter(Boolean);
}

function _legacyBuildUnitInfoCard(
  unit: UnitDef,
  data: GameData,
  options: UnitInfoCardOptions = {},
): HTMLDivElement {
  const card = node('div', 'unit-info-card');
  card.dataset.unitName = text(unit.Jednostka);
  card.dataset.unit3dHook = UNIT_3D_RENDER_HOOK;

  const isSuperUnit = unit['Super-jednostka'] === 'TAK';

  const header = node('header', 'unit-info-card-header');
  header.innerHTML = unitInfographicMedallionHtml(unit, unit.Jednostka, 34);
  const titleWrap = node('div', 'unit-info-card-title-wrap');
  const titleRow = node('div', 'unit-info-card-title-row');
  const title = node('h2');
  title.textContent = text(unit.Jednostka);
  titleRow.appendChild(title);
  if (isSuperUnit) {
    const superBadge = node('span', 'unit-info-card-super-badge');
    superBadge.textContent = 'Super-jednostka';
    titleRow.appendChild(superBadge);
  }
  titleWrap.appendChild(titleRow);
  const category = categoryOf(
    text(unit.Jednostka),
    text(unit['Rola (linia)']),
    isSuperUnit,
    unit.Typ,
  );
  const subtitle = node('div', 'unit-info-card-subtitle');
  subtitle.textContent = [text(unit.Epoka), text(unit.Typ), unitInfographicLabel(category)]
    .filter(Boolean).join(' · ');
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  if (options.onClose) {
    const close = node('button', 'unit-info-card-close');
    close.type = 'button';
    close.textContent = '✕';
    close.title = 'Zamknij (Esc)';
    close.setAttribute('aria-label', 'Zamknij kartę jednostki');
    close.addEventListener('click', () => options.onClose?.());
    header.appendChild(close);
  }
  card.appendChild(header);

  const previewSection = appendSection('Model 3D');
  const preview = node('div', 'unit-info-card-3d-slot');
  preview.dataset.renderHook = UNIT_3D_RENDER_HOOK;
  preview.setAttribute('aria-label', `Prawdziwy render 3D: ${text(unit.Jednostka)}`);
  preview.textContent = 'Render 3D ładowany…';
  previewSection.appendChild(preview);
  commitSection(card, previewSection);
  mountUnitMiniPreview(
    preview,
    unit,
    options.ownerColor ?? defaultOwnerColor(),
    'Render 3D niedostępny w tym środowisku',
  );

  const combat = appendSection('Statystyki bojowe');
  appendRow(combat, 'Atak', unit.Atak);
  appendRow(combat, 'Obrona', unit.Obrona);
  appendRow(combat, 'HP', unit.Health);
  appendRow(combat, 'Ruch', unit.Ruch != null ? `${unit.Ruch} hex` : null);
  appendRow(combat, 'Zasięg', unit['Zasięg ataku (hex)'], true);
  appendRow(combat, 'Atak dystansowy', unit['Atak dystansowy'], true);
  appendRow(combat, 'Pancerz', unit.Pancerz);
  appendRow(combat, 'Przebicie', unit.Przebicie);
  commitSection(card, combat);

  const economy = appendSection('Koszty i utrzymanie');
  appendRow(economy, 'Koszt Pieniądza', unit['Pieniądz (koszt)']);
  appendRow(economy, 'Koszt surowca', hasValue(unit.Surowiec)
    ? `${text(unit.Surowiec)} × ${text(unit['Surowiec (ilość)'])}` : null);
  appendRow(economy, 'Utrzymanie Pieniądza/turę', unit['Utrzymanie (Pieniądz/turę)']);
  appendRow(economy, 'Utrzymanie surowca/turę', hasValue(unit['Utrzymanie surowiec'])
    ? `${text(unit['Utrzymanie surowiec'])} × ${text(unit['Utrzymanie surowiec (ilość)'])}` : null);
  appendRow(economy, 'Ludność', unit.Ludność);
  appendRow(economy, 'Żywność/turę', unit['żywność/turę']);
  commitSection(card, economy);

  const requirements = appendSection('Wymagania i kontry');
  appendRow(requirements, 'Technologia', unit.Tech);
  appendRow(requirements, 'Kultura', unit.Kultura);
  appendRow(requirements, 'Zastępuje', unit['W zamian za']);
  appendBadgeRow(requirements, 'Kontry', collectCounters(unit, data));
  commitSection(card, requirements);

  const statuses = appendSection('Statusy');
  const statusTexts = [
    hasValue(unit.Tech) ? 'wymaga technologii z danych' : 'brak wymogu',
    ...(options.statusLines ?? []),
  ];
  appendStatusBadges(statuses, statusTexts);
  commitSection(card, statuses);

  return card;
}

export const UNIT_INFO_CARD_CSS = `
.unit-info-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:center;
  justify-content:center;padding:16px;background:rgba(0,0,0,.62);}
.unit-info-card-dialog{position:relative;max-height:calc(100vh - 32px);overflow:auto;}
.unit-info-card{width:min(434px,calc(100vw - 32px));border:1px solid rgba(232,216,138,.45);
  border-radius:12px;background:linear-gradient(180deg,rgba(20,26,34,.99),rgba(8,10,16,.99));
  color:#e8e0c8;box-shadow:0 10px 28px rgba(0,0,0,.65);overflow:hidden;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);}
.unit-info-card-header{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;
  background:rgba(232,216,138,.06);border-bottom:1px solid rgba(232,216,138,.18);}
.unit-info-card-header .unit-infographic-medallion{width:34px;height:34px;flex:none;}
.unit-info-card-title-wrap{min-width:0;flex:1;}
.unit-info-card-title-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.unit-info-card h2{margin:0;font:600 17px/1.15 Georgia,'Times New Roman',serif;}
.unit-info-card-super-badge{font-size:10px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:#2e2708;background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));
  border-radius:999px;padding:2px 8px;white-space:nowrap;}
.unit-info-card-subtitle{margin-top:4px;font-size:11px;color:#a8a090;}
.unit-info-card-close{flex:none;border:1px solid rgba(232,216,138,.4);border-radius:50%;
  width:28px;height:28px;background:#111923;color:#e8d88a;cursor:pointer;font-size:13px;
  line-height:1;}
.unit-info-card-close:focus-visible{outline:2px solid var(--tg-focus-ring,#e8d88a);outline-offset:2px;}
.unit-info-card-section{padding:10px 14px;border-bottom:1px solid rgba(232,216,138,.1);}
.unit-info-card-section:last-child{border-bottom:0;}
.unit-info-card h3{margin:0 0 6px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  color:#d7c77e;}
.unit-info-card-3d-slot{height:150px;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 50% 35%,rgba(65,95,120,.42),rgba(8,10,16,.1));
  border:var(--tg-rant-active,2px solid rgba(232,216,138,.45));border-radius:8px;
  color:#a8a090;font-size:11px;overflow:hidden;}
.unit-info-card-3d-slot .unit-mini-canvas{width:104px;height:104px;}
.unit-info-card-3d-slot.unit-mini-fallback{color:var(--tg-render-fallback,#e0a06a);padding:16px;
  text-align:center;}
.unit-info-card-row{display:grid;grid-template-columns:minmax(112px,auto) 1fr;gap:8px;
  padding:5px 0;font-size:12px;line-height:1.3;border-top:1px solid rgba(232,216,138,.08);}
.unit-info-card-row:first-of-type{border-top:0;}
.unit-info-card-key{color:#948c7c;}
.unit-info-card-value{text-align:right;color:#eee5d2;overflow-wrap:anywhere;
  font-variant-numeric:tabular-nums;}
.unit-info-card-row-emphasis{background:rgba(232,216,138,.06);border-radius:4px;
  padding:5px 6px;margin:0 -6px;}
.unit-info-card-row-emphasis .unit-info-card-value{font-weight:700;color:#f4e6a8;}
.unit-info-card-row-badges{grid-template-columns:minmax(112px,auto) 1fr;align-items:start;}
.unit-info-card-badges{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;}
.unit-info-card-badge{font-size:11px;line-height:1.3;color:#eee5d2;background:rgba(232,216,138,.1);
  border:1px solid rgba(232,216,138,.22);border-radius:999px;padding:2px 8px;}
.unit-info-card-status-badges{display:flex;flex-wrap:wrap;gap:6px;}
.unit-info-card-status-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;
  color:#eee5d2;background:rgba(232,216,138,.08);border:1px solid rgba(232,216,138,.2);
  border-radius:999px;padding:3px 9px 3px 7px;}
.unit-info-card-status-dot{width:6px;height:6px;border-radius:50%;background:var(--tg-gold-primary,#e8d88a);
  flex:none;}
@media (max-width:420px){
  .unit-info-card-3d-slot{height:128px;}
  .unit-info-card-3d-slot .unit-mini-canvas{width:96px;height:96px;}
}
/* Ścieżka T4 (entityCards): karta jest zbudowana przez \`renderEntityCard\` (klasy
   \`.entity-card*\`, style bazowe z \`ENTITY_CARD_CSS\` wstrzykiwane niżej w
   \`ensureUnitInfoCardStyles()\`) — poniższe reguły to WYŁĄCZNIE lokalne nadpisania
   dopasowujące medalion 3D (34×34, kontrakt T1/T1b) do canvasu miniatury jednostki
   i przycisku zamknięcia, bez edycji \`entityCards/renderer.ts\`. */
.entity-card-unit .entity-card-medallion{overflow:hidden;border-radius:50%;
  background:radial-gradient(circle at 50% 35%,rgba(65,95,120,.42),rgba(8,10,16,.1));}
.entity-card-unit .entity-card-medallion .unit-mini-canvas{width:100%;height:100%;
  object-fit:cover;}
.entity-card-unit .entity-card-medallion .unit-mini-loading{font-size:9px;color:#a8a090;}
.entity-card-unit .entity-card-medallion.unit-mini-fallback{font-size:12px;
  color:var(--tg-render-fallback,#e0a06a);}
`;

const STYLE_ID = 'civ-unit-info-card-css-v1';
const ENTITY_STYLE_ID = 'civ-unit-info-card-entity-css-v1';
export function ensureUnitInfoCardStyles(): void {
  if (!document.getElementById(ENTITY_STYLE_ID)) {
    // Ścieżka T4 renderuje przez `renderEntityCard` (klasy `.entity-card*`) — te style
    // bazowe muszą być wstrzyknięte, bo dotąd żaden kod produkcyjny nie wołał
    // `renderEntityCard` z kontekstu `unitInfoCard.ts` (poza testami T1). Wzorem
    // `ensureEntityCardOverrideStyles()` z T3 (`techDiscoveryNotice.ts`).
    const entityStyle = document.createElement('style');
    entityStyle.id = ENTITY_STYLE_ID;
    entityStyle.textContent = ENTITY_CARD_CSS;
    document.head.appendChild(entityStyle);
  }
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = UNIT_INFO_CARD_CSS;
  document.head.appendChild(style);
}
