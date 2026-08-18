/**
 * Tymczasowa, generyczna karta informacyjna jednostki.
 *
 * Dane pochodzą z GameData/UnitDef. Slot wizualny korzysta z istniejącego
 * pipeline'u Three.js; medalion SVG jest wyłącznie identyfikacją jednostki.
 */
import type { GameData, UnitDef } from '../data/loader';
import { categoryOf } from '../units/setup';
import { unitInfographicLabel, unitInfographicMedallionHtml } from './unitInfographic';
import { defaultOwnerColor, mountUnitMiniPreview } from './unitMiniPreview';

export const UNIT_3D_RENDER_HOOK = 'buildUnitModel';

export interface UnitInfoCardOptions {
  ownerColor?: number;
  statusLines?: readonly string[];
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

function appendRow(grid: HTMLElement, label: string, value: unknown): void {
  if (!hasValue(value)) return;
  const row = node('div', 'unit-info-card-row');
  const key = node('span', 'unit-info-card-key');
  key.textContent = label;
  const val = node('span', 'unit-info-card-value');
  val.textContent = text(value);
  row.append(key, val);
  grid.appendChild(row);
}

function appendSection(card: HTMLElement, title: string): HTMLElement {
  const section = node('section', 'unit-info-card-section');
  const heading = node('h3');
  heading.textContent = title;
  section.appendChild(heading);
  card.appendChild(section);
  return section;
}

function appendCounters(section: HTMLElement, unit: UnitDef, data: GameData): void {
  const typ = text(unit.Typ).toLowerCase();
  if (!typ) return;
  const counters = data.counters
    .filter(row => text(row['Typ atakujący']).toLowerCase() === typ)
    .map(row => {
      const target = text(row['Cel (typ)']);
      const bonus = text(row.Bonus);
      return bonus ? `${target}: ${bonus}` : target;
    })
    .filter(Boolean);
  if (counters.length > 0) appendRow(section, 'Kontry', counters.join(' · '));
}

export function buildUnitInfoCard(
  unit: UnitDef,
  data: GameData,
  options: UnitInfoCardOptions = {},
): HTMLDivElement {
  const card = node('div', 'unit-info-card');
  card.dataset.unitName = text(unit.Jednostka);
  card.dataset.unit3dHook = UNIT_3D_RENDER_HOOK;

  const header = node('header', 'unit-info-card-header');
  header.innerHTML = unitInfographicMedallionHtml(unit, unit.Jednostka, 34);
  const titleWrap = node('div', 'unit-info-card-title-wrap');
  const title = node('h2');
  title.textContent = text(unit.Jednostka);
  titleWrap.appendChild(title);
  const category = categoryOf(
    text(unit.Jednostka),
    text(unit['Rola (linia)']),
    unit['Super-jednostka'] === 'TAK',
    unit.Typ,
  );
  const subtitle = node('div', 'unit-info-card-subtitle');
  subtitle.textContent = [text(unit.Epoka), text(unit.Typ), unitInfographicLabel(category)]
    .filter(Boolean).join(' · ');
  titleWrap.appendChild(subtitle);
  header.appendChild(titleWrap);
  card.appendChild(header);

  const previewSection = appendSection(card, 'Model 3D');
  const preview = node('div', 'unit-info-card-3d-slot');
  preview.dataset.renderHook = UNIT_3D_RENDER_HOOK;
  preview.setAttribute('aria-label', `Prawdziwy render 3D: ${text(unit.Jednostka)}`);
  preview.textContent = 'Render 3D ładowany…';
  previewSection.appendChild(preview);
  mountUnitMiniPreview(
    preview,
    unit,
    options.ownerColor ?? defaultOwnerColor(),
    'Render 3D niedostępny w tym środowisku',
  );

  const combat = appendSection(card, 'Statystyki bojowe');
  appendRow(combat, 'Atak', unit.Atak);
  appendRow(combat, 'Obrona', unit.Obrona);
  appendRow(combat, 'HP', unit.Health);
  appendRow(combat, 'Ruch', unit.Ruch != null ? `${unit.Ruch} hex` : null);
  appendRow(combat, 'Zasięg', unit['Zasięg ataku (hex)']);
  appendRow(combat, 'Atak dystansowy', unit['Atak dystansowy']);
  appendRow(combat, 'Pancerz', unit.Pancerz);
  appendRow(combat, 'Przebicie', unit.Przebicie);

  const economy = appendSection(card, 'Koszty i utrzymanie');
  appendRow(economy, 'Koszt Pieniądza', unit['Pieniądz (koszt)']);
  appendRow(economy, 'Koszt surowca', hasValue(unit.Surowiec)
    ? `${text(unit.Surowiec)} × ${text(unit['Surowiec (ilość)'])}` : null);
  appendRow(economy, 'Utrzymanie Pieniądza/turę', unit['Utrzymanie (Pieniądz/turę)']);
  appendRow(economy, 'Utrzymanie surowca/turę', hasValue(unit['Utrzymanie surowiec'])
    ? `${text(unit['Utrzymanie surowiec'])} × ${text(unit['Utrzymanie surowiec (ilość)'])}` : null);
  appendRow(economy, 'Ludność', unit.Ludność);
  appendRow(economy, 'Żywność/turę', unit['żywność/turę']);

  const requirements = appendSection(card, 'Wymagania i kontry');
  appendRow(requirements, 'Technologia', unit.Tech);
  appendRow(requirements, 'Kultura', unit.Kultura);
  appendRow(requirements, 'Zastępuje', unit['W zamian za']);
  appendCounters(requirements, unit, data);

  const statuses = appendSection(card, 'Statusy');
  appendRow(statuses, 'Status technologii', hasValue(unit.Tech)
    ? 'wymaga technologii z danych' : 'brak wymogu');
  for (const line of options.statusLines ?? []) appendRow(statuses, 'Status runtime', line);
  return card;
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
  const close = node('button', 'unit-info-card-close');
  close.type = 'button';
  close.textContent = '✕';
  close.setAttribute('aria-label', 'Zamknij kartę jednostki');
  const card = buildUnitInfoCard(unit, data, options);
  dialog.append(close, card);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);
  let closed = false;
  const dismiss = (): void => {
    if (closed) return;
    closed = true;
    backdrop.remove();
  };
  close.addEventListener('click', dismiss);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) dismiss();
  });
  return dismiss;
}

export const UNIT_INFO_CARD_CSS = `
.unit-info-card-backdrop{position:fixed;inset:0;z-index:520;display:flex;align-items:center;
  justify-content:center;padding:1em;background:rgba(0,0,0,.62);}
.unit-info-card-dialog{position:relative;max-height:calc(100vh - 2em);overflow:auto;}
.unit-info-card-close{position:absolute;right:.45em;top:.45em;z-index:1;border:1px solid rgba(232,216,138,.4);
  border-radius:50%;width:2em;height:2em;background:#111923;color:#e8d88a;cursor:pointer;}
.unit-info-card{width:min(31em,calc(100vw - 2em));border:1px solid rgba(232,216,138,.45);
  border-radius:12px;background:linear-gradient(180deg,rgba(20,26,34,.99),rgba(8,10,16,.99));
  color:#e8e0c8;box-shadow:0 10px 28px rgba(0,0,0,.65);overflow:hidden;}
.unit-info-card-header{display:flex;align-items:center;gap:.65em;padding:.75em .9em;
  border-bottom:1px solid rgba(232,216,138,.18);}
.unit-info-card-header .unit-infographic-medallion{width:2.8em;height:2.8em;}
.unit-info-card-title-wrap{min-width:0;padding-right:2em;}
.unit-info-card h2{margin:0;font:600 1.05em/1.15 Georgia,serif;}
.unit-info-card-subtitle{margin-top:.25em;font-size:.68em;color:#a8a090;}
.unit-info-card-section{padding:.55em .9em;border-bottom:1px solid rgba(232,216,138,.1);}
.unit-info-card-section:last-child{border-bottom:0;}
.unit-info-card h3{margin:0 0 .4em;font-size:.72em;letter-spacing:.08em;text-transform:uppercase;color:#d7c77e;}
.unit-info-card-3d-slot{min-height:8em;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 50% 35%,rgba(65,95,120,.42),rgba(8,10,16,.1));
  border:1px solid rgba(130,200,224,.28);border-radius:8px;color:#a8a090;font-size:.75em;overflow:hidden;}
.unit-info-card-3d-slot .unit-mini-canvas{width:8em;height:8em;}
.unit-info-card-3d-slot.unit-mini-fallback{color:#e0a06a;padding:1em;text-align:center;}
.unit-info-card-row{display:grid;grid-template-columns:minmax(8em,auto) 1fr;gap:.6em;
  padding:.16em 0;font-size:.72em;line-height:1.3;}
.unit-info-card-key{color:#948c7c;}
.unit-info-card-value{text-align:right;color:#eee5d2;overflow-wrap:anywhere;}
`;

const STYLE_ID = 'civ-unit-info-card-css-v1';
export function ensureUnitInfoCardStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = UNIT_INFO_CARD_CSS;
  document.head.appendChild(style);
}
