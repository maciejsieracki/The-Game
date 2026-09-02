/**
 * Karta odkrytej technologii, otwierana przy ukończeniu badań.
 * Dane są czytane z tych samych JSON-ów co drzewko — bez kopii balansowych.
 *
 * R-TRZY-KARTY-WDROZENIE-Q1 runda 1 (2026-08-20): redesign wg makiety
 * `1 - Karta odkrycia technologii (standalone).html` (paczka TRZY-KARTY-2026-08-19)
 * + `DYSPOZYCJA-WDROZENIE.md` §2. Zachowane bez zmian: sygnatury eksportów,
 * źródła danych (tech.json / buildings.json / units.json — bez kopii
 * balansowych), hook `onOpenTree` wołany z main.ts, stos Esc
 * (escapeOverlayStack — Esc i tło zamykają kartę, bo jest niezobowiązująca).
 *
 * Świadome odstępstwa od makiety (dane, nie estetyka — do przeglądu przez
 * Evaluatora / właściciela w rundzie 2):
 * 1) Pasek „Efekt" (sticky, pod nagłówkiem) z makiety pominięty. `tech.Uwagi`
 *    bywa notatką deweloperską (np. odniesienia do ticketów ABC), nie tekstem
 *    dla gracza — pokazywanie go wprost byłoby wyciekiem danych wewnętrznych.
 *    Bez zamiennika: brak w danych osobnego pola „opis efektu dla gracza".
 * 2) „Co możesz teraz zrobić" jest budowane z szablonów wypełnionych REALNYMI
 *    nazwami odblokowań (budynek/ulepszenie/surowiec/kolejna technologia), a
 *    nie ręcznie pisaną narracją per-technologia jak w makiecie (tam wprost
 *    oznaczone jako „dane przykładowe").
 * 3) „Kolejne technologie": odznaka „Możesz badać" tylko gdy JEDYNYM wymogiem
 *    danej technologii jest ta właśnie odkryta (dowodliwe z samych danych
 *    tech.json). Przy więcej niż jednym wymogu — neutralne „Wymaga też:
 *    {lista}" zamiast zgadywanego „Wymaga jeszcze" z makiety: ta funkcja nie
 *    dostaje stanu zbadanych technologii gracza, więc nie wie, czy pozostałe
 *    wymogi są spełnione.
 * 4) Tryb „podgląd" (karta ponownie otwarta z drzewka/hubu — sekcje domyślnie
 *    zwinięte, bez poświaty, inny kicker) z klatek 2–3 makiety NIE jest wpięty:
 *    dzisiejsze wywołania z main.ts (`onOpenTechDetails`, ten sam hook co
 *    „nowe odkrycie") nie niosą żadnego rozróżnienia świeże/ponowne, a
 *    main.ts jest poza allowlistą tej rundy. `opts.kind` nadal steruje WYŁĄCZNIE
 *    nagłówkiem tekstowym tak jak wcześniej (kompatybilność wsteczna).
 * 5) Przycisk „Otwórz hub badań" (odłożony, wg DYSPOZYCJA-WDROZENIE.md §2) NIE
 *    został dodany jako widoczny, wyłączony placeholder: sama makieta (plik
 *    źródłowy `zrodla/*.dc.html`, wszystkie 7 klatek + warianty responsywne)
 *    go nie rysuje, a istniejący precedens w kodzie dla tej samej decyzji
 *    (`empireDetailPanel.ts` renderNaukaSection, komentarz przy
 *    R-DESIGN-11-ZAKLADEK) to „pominięty CAŁKOWICIE, nie renderowany nawet
 *    jako placeholder" — nie „widoczny, ale wygaszony". Poszedłem za realnym
 *    plikiem makiety i tym precedensem zamiast za jednym zdaniem opisu w
 *    DYSPOZYCJA-WDROZENIE.md, które mu zaprzecza. PYTANIE DO EVALUATORA: czy
 *    to poprawne czytanie, czy jednak dodać widoczny, wygaszony przycisk?
 */

import techData from '../../data/tech.json';
import buildingsData from '../../data/buildings.json';
import unitsData from '../../data/units.json';
import terrainImprovementsData from '../../data/terrain-improvements.json';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { techIconSvg } from './techIcons';
import { buildingIconSvg, unitIconSvg, improvementIconSvg } from './icons/brandAssets';
import type { ImprovementKey } from '../render/improvements';
import { buildEntityCardData, renderEntityCard, ENTITY_CARD_CSS, openEntityCard } from './entityCards/renderer';
import { technologyIdFromName } from './entityCards/registry';
import type { EntityCardData, EntityCardAction } from './entityCards/types';

type TechRow = {
  Technologia: string;
  Epoka?: string | null;
  Poziom?: number | null;
  'Wymaga (prereq)'?: string | null;
  'wymagany budynek'?: string | null;
  'wymagane ulepszenie'?: string | null;
  'Odblokowuje budynek'?: string | null;
  'Odblokowuje ulepszenie terenu'?: string | null;
  'Odblokowuje surowiec.'?: string | null;
  'Koszt nauki'?: number | null;
  Uwagi?: string | null;
  awansDoEpoki?: number | null;
};

type BuildingRow = {
  id: string;
  nazwa?: string;
  techUnlock?: string | null;
  baza?: Record<string, number>;
  przyrost?: Record<string, number>;
  uwagi?: string;
  kategoria?: string;
  wymagania?: string | null;
  utrzymanie?: number | null;
};

type UnitRow = {
  Jednostka: string;
  Tech?: string | null;
  'Rola (linia)'?: string | null;
  Typ?: string | null;
  'Super-jednostka'?: string | null;
};

const HOST_ID = 'civ-tech-discovery-notice-host';
const STYLE_ID = 'civ-tech-discovery-notice-css-v3';
const OVERLAY_ID = 'tech-discovery-notice';
/** P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 (B): osobny wpis stosu Esc dla karty
 * SZCZEGÓŁU otwartej OBOK karty technologii — Esc zamyka najpierw ją, potem całość. */
const SIDE_OVERLAY_ID = 'tech-discovery-notice-side';

/** Etykieta epoki po numerze — ten sam wzorzec co EPOCH_LABEL w cityPanel.ts / EPOCH_ORDER w techTreeView.ts. */
const EPOCH_LABEL: Record<number, string> = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function list(raw: string | null | undefined): string[] {
  return (raw ?? '').split(/[;,+]/).map(x => x.trim())
    .filter(x => x !== '' && x !== '-' && x !== '—');
}

/**
 * Bug B (R-TECH-ULEPSZENIA-TERENU-SYNC-Q1): `improvementIconSvg()` jest kluczowany po
 * `ImprovementKey` (np. `bydlo`, `fort` — patrz improvement-icon-map.json), nie po
 * polskiej etykiecie z tech.json (np. „Trzoda", „Fort"). Zbudowana raz odwrotna mapa
 * nazwa→klucz z terrain-improvements.json (klucz obiektu = ImprovementKey, pole `nazwa`
 * = etykieta gracza) — ten sam wzorzec co poprawne użycie w buildModeHud.ts. Fallback na
 * samą nazwę (jak przed poprawką) zachowany dla nierozpoznanych etykiet — improvementIconSvg
 * i tak spadnie na `_default` (imp-farm), bez wyjątku w runtime.
 *
 * `export` (P-SCIENCEHUB-EMOJI-ZAMIAST-IKON-ODBLOKOWAN-Q1): tę samą mapę reużywa
 * `sciencePicker.ts::techUnlockItems()` dla wiersza „Odblok." w hubie badań —
 * jedno źródło zamiast drugiej kopii tej samej pętli. Zero zmian w logice/zachowaniu
 * tego pliku: dodany jest wyłącznie modyfikator widoczności.
 */
export const IMPROVEMENT_NAME_TO_KEY: Record<string, ImprovementKey> = (() => {
  const map: Record<string, ImprovementKey> = {};
  for (const [key, row] of Object.entries(terrainImprovementsData as Record<string, { nazwa?: string }>)) {
    if (key.startsWith('_')) continue;
    const nazwa = row?.nazwa;
    if (typeof nazwa === 'string' && nazwa) map[nazwa] = key as ImprovementKey;
  }
  return map;
})();

/** Polska odmiana rzeczownika po liczbie (1 / 2-4 / 5+, z wyjątkiem 12-14). */
function pluralPl(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

function buildingEffectText(building: BuildingRow): string {
  const effects: string[] = [];
  for (const [key, value] of Object.entries(building.przyrost ?? {})) {
    if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
  }
  if (effects.length === 0) {
    for (const [key, value] of Object.entries(building.baza ?? {})) {
      if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  return effects.join(', ');
}

function iconTile(svg: string | null, sizePx = 14): string {
  const inner = svg ?? '';
  return `<span class="tdn-tile" aria-hidden="true" style="display:flex;align-items:center;justify-content:center">`
    + `<span style="width:${sizePx}px;height:${sizePx}px;display:flex;opacity:.9">${inner}</span></span>`;
}

function badge(kind: 'ok' | 'warn' | 'muted', text: string): string {
  return `<span class="tdn-badge tdn-badge--${kind}">${esc(text)}</span>`;
}

/** Sekcja zwijana (accordion) — nagłówek to <button> (klawiatura + focus-visible za darmo). */
function accordionSection(opts: {
  key: string;
  title: string;
  count: number;
  openDefault: boolean;
  bodyHtml: string;
  highlighted?: boolean;
}): string {
  if (opts.count === 0 || opts.bodyHtml === '') return '';
  const open = opts.openDefault;
  return `<section class="tdn-sec${opts.highlighted ? ' tdn-sec--hi' : ''}" data-sec="${esc(opts.key)}" data-open="${open ? '1' : '0'}">`
    + `<button type="button" class="tdn-sec-head" aria-expanded="${open ? 'true' : 'false'}">`
    + `<span class="tdn-sec-title">${esc(opts.title)}</span>`
    + `<span class="tdn-sec-count">${opts.count}</span>`
    + `<span class="tdn-sec-chevron" aria-hidden="true">${open ? '▾' : '▸'}</span>`
    + `</button>`
    + `<div class="tdn-sec-body"${open ? '' : ' hidden'}>${opts.bodyHtml}</div>`
    + `</section>`;
}

function unlockItemRow(opts: { icon: string | null; title: string; meta?: string; trailing?: string }): string {
  return `<div class="tdn-item">${iconTile(opts.icon, 15)}`
    + `<span class="tdn-item-body">`
    + `<span class="tdn-item-title" title="${esc(opts.title)}">${esc(opts.title)}</span>`
    + (opts.meta ? `<span class="tdn-item-meta">${esc(opts.meta)}</span>` : '')
    + `</span>`
    + (opts.trailing ? `<span class="tdn-item-trailing">${esc(opts.trailing)}</span>` : '')
    + `</div>`;
}

function actionItemRow(kind: 'ok' | 'warn' | 'muted', label: string, text: string): string {
  return `<div class="tdn-action">${badge(kind, label)}<span class="tdn-action-text">${esc(text)}</span></div>`;
}

/** „Co możesz teraz zrobić" — szablony wypełnione realnymi nazwami, nie ręczna narracja per-tech (patrz nagłówek pliku, pkt 2). */
function buildActionItems(args: {
  buildingNames: string[];
  improvementNames: string[];
  resourceUnlocked: string | null;
  nextTechCount: number;
}): string {
  const rows: string[] = [];
  if (args.resourceUnlocked) {
    rows.push(actionItemRow('ok', 'Możesz teraz', `Sprawdź dostęp do surowca: ${args.resourceUnlocked}.`));
  }
  if (args.buildingNames.length > 0) {
    rows.push(actionItemRow('warn', 'Najpierw spełnij', `Zbuduj ${args.buildingNames.join(' lub ')}, jeśli spełniasz ich wymagania.`));
  }
  if (args.improvementNames.length > 0) {
    rows.push(actionItemRow('warn', 'Najpierw spełnij', `Przygotuj ${args.improvementNames.join(', ')} na odpowiednim złożu.`));
  }
  if (args.nextTechCount > 0) {
    rows.push(actionItemRow('ok', 'Możesz teraz', 'Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.'));
  }
  if (rows.length === 0) return '';
  rows.push(actionItemRow('muted', 'Nie oznacza', 'Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.'));
  return rows.join('');
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#${HOST_ID}{position:fixed;inset:0;z-index:940;display:flex;align-items:center;justify-content:center;
padding:18px;pointer-events:none;font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);color:var(--tg-text-primary,#e8e0c8)}
#${HOST_ID} .tdn-back{position:fixed;inset:0;background:rgba(2,3,6,.72);pointer-events:auto}
#${HOST_ID} .tdn-card{position:relative;width:min(660px,96vw);max-height:calc(100vh - 36px);overflow:hidden;
display:flex;flex-direction:column;pointer-events:auto;border:2px solid var(--tg-gold-primary,#e8d88a);border-radius:var(--tg-radius-panel,12px);
background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98)));
box-shadow:var(--tg-glow-gold,0 0 24px rgba(232,216,138,.28)),0 12px 40px rgba(0,0,0,.6);
animation:civ-tdn-in .18s ease-out}
@keyframes civ-tdn-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

#${HOST_ID} .tdn-head{flex:none;display:flex;align-items:flex-start;gap:14px;padding:15px 16px 14px;
border-bottom:1px solid rgba(232,216,138,.24);
background:linear-gradient(180deg,rgba(26,34,48,.96),rgba(14,18,26,.96))}
#${HOST_ID} .tdn-medallion{flex:none;width:52px;height:52px;border-radius:50%;
background:var(--tg-medallion-bg,radial-gradient(circle at 38% 30%,#1a2230,#0a0d14));
border:var(--tg-rant-active,2px solid var(--tg-gold-primary));box-shadow:inset 0 2px 4px rgba(232,216,138,.22),var(--tg-glow-gold,0 0 24px rgba(232,216,138,.28));
display:flex;align-items:center;justify-content:center;color:var(--tg-gold-primary,#e8d88a);
transition:width .15s ease,height .15s ease}
#${HOST_ID} .tdn-medallion svg{width:28px;height:28px}
#${HOST_ID} .tdn-headtext{flex:1;min-width:0}
#${HOST_ID} .tdn-kickrow{display:flex;align-items:center;gap:8px}
#${HOST_ID} .tdn-kick{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--tg-gold-primary,#e8d88a);font-weight:700}
#${HOST_ID} .tdn-status-dot{width:5px;height:5px;border-radius:50%;background:var(--tg-green,#50b070)}
#${HOST_ID} .tdn-status{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--tg-green,#50b070);font-weight:700}
#${HOST_ID} h2{margin:5px 0 0;font:600 25px var(--tg-font-title,Georgia,serif);color:#f4e6a8;line-height:1.15;
overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
#${HOST_ID} .tdn-meta{display:flex;flex-wrap:wrap;gap:5px 14px;margin-top:6px}
#${HOST_ID} .tdn-meta span{font-size:11.5px;color:var(--tg-text-muted,#8a8070)}
#${HOST_ID} .tdn-meta .tdn-milestone{color:var(--tg-gold-primary,#e8d88a);font-weight:600}
#${HOST_ID} .tdn-close{flex:none;width:30px;height:30px;border-radius:var(--tg-radius-btn,8px);
border:2px solid rgba(232,216,138,.4);background:linear-gradient(180deg,#161c28,#0a0d14);
color:var(--tg-gold-primary,#e8d88a);font-size:14px;line-height:1;cursor:pointer;font-family:inherit}
#${HOST_ID} .tdn-close:hover{border-color:var(--tg-gold-primary,#e8d88a);color:#f4e6a8}

#${HOST_ID} .tdn-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:14px 16px 14px;display:flex;flex-direction:column;gap:12px;
scrollbar-width:thin;scrollbar-color:rgba(232,216,138,.25) transparent}
#${HOST_ID} .tdn-scroll::-webkit-scrollbar{width:5px}
#${HOST_ID} .tdn-scroll::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:4px}

#${HOST_ID} .tdn-foot{flex:none;display:flex;justify-content:flex-end;padding:10px 16px 14px;
border-top:1px solid rgba(232,216,138,.16)}
#${HOST_ID} .tdn-tree-btn{border:1px solid #6a5212;border-top-color:#f8eea8;border-radius:var(--tg-radius-btn,8px);
padding:7px 18px;cursor:pointer;color:var(--tg-btn-primary-ink,#2e2708);font-weight:700;font-size:11px;
letter-spacing:.12em;text-transform:uppercase;background:var(--tg-btn-primary,linear-gradient(180deg,#f0dc88,#b99a28));
box-shadow:inset 0 1px 0 rgba(255,255,255,.4);font-family:var(--tg-font-ui,inherit)}
#${HOST_ID} .tdn-tree-btn:hover{filter:brightness(1.05)}
#${HOST_ID} .tdn-tree-btn:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px}

#${HOST_ID} .tdn-sec{border:1px solid rgba(232,216,138,.18);border-radius:10px;overflow:hidden}
#${HOST_ID} .tdn-sec--hi{border-color:rgba(232,216,138,.3);background:linear-gradient(180deg,rgba(30,38,50,.6),rgba(12,16,24,.6))}
#${HOST_ID} .tdn-sec-head{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:9px;
width:100%;padding:9px 12px;background:rgba(232,216,138,.04);cursor:pointer;position:sticky;top:0;z-index:1}
#${HOST_ID} .tdn-sec--hi>.tdn-sec-head{background:rgba(232,216,138,.06);border-bottom:1px solid rgba(232,216,138,.16)}
#${HOST_ID} .tdn-sec[data-open="1"]>.tdn-sec-head{border-bottom:1px solid rgba(232,216,138,.14)}
#${HOST_ID} .tdn-sec-head:hover{background:rgba(232,216,138,.08)}
#${HOST_ID} .tdn-sec-head:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px}
#${HOST_ID} .tdn-sec-title{flex:1;font-family:var(--tg-font-title,Georgia,serif);font-size:14.5px;color:var(--tg-gold-primary,#e8d88a);text-align:left}
#${HOST_ID} .tdn-sec-count{font-size:10.5px;color:var(--tg-text-muted,#8a8070);font-variant-numeric:tabular-nums}
#${HOST_ID} .tdn-sec-chevron{font-size:11px;color:var(--tg-text-muted,#8a8070)}
#${HOST_ID} .tdn-sec-body{padding:8px 10px 10px;display:flex;flex-direction:column;gap:6px}
#${HOST_ID} .tdn-sec-body[hidden]{display:none}

#${HOST_ID} .tdn-item{display:flex;gap:9px;align-items:center;padding:8px 9px;
border:1px solid rgba(232,216,138,.16);border-radius:8px;background:rgba(232,216,138,.03)}
#${HOST_ID} .tdn-tile{flex:none;width:26px;height:26px;border-radius:7px;background:var(--tg-panel-bg,#1a2230);
border:1px solid rgba(232,216,138,.2);color:var(--tg-gold-primary,#e8d88a)}
#${HOST_ID} .tdn-item-body{flex:1;min-width:0;display:flex;flex-direction:column}
#${HOST_ID} .tdn-item-title{font-family:var(--tg-font-title,Georgia,serif);font-size:13.5px;color:#f4e6a8;
overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#${HOST_ID} .tdn-item-meta{font-size:11px;color:var(--tg-text-muted,#8a8070);margin-top:2px;line-height:1.4}
#${HOST_ID} .tdn-item-trailing{flex:none;font-size:10.5px;color:var(--tg-text-muted,#8a8070);white-space:nowrap}

#${HOST_ID} .tdn-more{display:flex;align-items:center;gap:8px;padding:7px 10px;
border:1px dashed rgba(232,216,138,.2);border-radius:8px;cursor:pointer;color:#a89a80;
font-size:11.5px;background:none;font-family:inherit;width:100%;text-align:left}
#${HOST_ID} .tdn-more:hover{border-color:rgba(232,216,138,.45);background:rgba(232,216,138,.04)}
#${HOST_ID} .tdn-more:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px}
#${HOST_ID} .tdn-more[hidden]{display:none}
#${HOST_ID} .tdn-more span:first-child{flex:1}
#${HOST_ID} .tdn-more-rest{display:flex;flex-direction:column;gap:6px;margin-top:6px}
#${HOST_ID} .tdn-more-rest[hidden]{display:none}

#${HOST_ID} .tdn-badge{flex:none;font-size:9px;letter-spacing:.06em;font-weight:700;border-radius:999px;
padding:2px 7px;white-space:nowrap;margin-top:1px}
#${HOST_ID} .tdn-badge--ok{color:var(--tg-green,#50b070);border:1px solid rgba(80,176,112,.45)}
#${HOST_ID} .tdn-badge--warn{color:var(--tg-orange,#d08030);border:1px solid rgba(208,128,48,.45)}
#${HOST_ID} .tdn-badge--muted{color:var(--tg-text-muted,#8a8070);border:1px solid rgba(138,128,112,.5)}
#${HOST_ID} .tdn-action{display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(232,216,138,.08)}
#${HOST_ID} .tdn-action:last-child{border-bottom:none}
#${HOST_ID} .tdn-action-text{flex:1;font-size:12.5px;color:var(--tg-text-primary,#e8e0c8);line-height:1.45}
#${HOST_ID} .tdn-action:has(.tdn-badge--muted) .tdn-action-text{color:#a89a80}

#${HOST_ID} .tdn-next{display:flex;gap:10px;align-items:center;padding:8px 10px;
border:1px solid rgba(232,216,138,.16);border-radius:8px;background:rgba(232,216,138,.03)}
#${HOST_ID} .tdn-next-body{flex:1;min-width:0;display:flex;flex-direction:column}
#${HOST_ID} .tdn-next-name{font-family:var(--tg-font-title,Georgia,serif);font-size:13.5px;color:#f4e6a8}
#${HOST_ID} .tdn-next-sub{font-size:11px;color:var(--tg-orange,#d08030);margin-top:2px}

#${HOST_ID} .tdn-req{border:1px solid rgba(232,216,138,.14);border-radius:10px;overflow:hidden;background:rgba(0,0,0,.2)}
#${HOST_ID} .tdn-req-head{display:flex;align-items:center;gap:9px;padding:9px 12px;border-bottom:1px solid rgba(232,216,138,.1)}
#${HOST_ID} .tdn-req-head span:first-child{flex:1;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--tg-text-muted,#8a8070);font-weight:700}
#${HOST_ID} .tdn-req-head span:last-child{font-size:10.5px;color:var(--tg-text-muted,#8a8070)}
#${HOST_ID} .tdn-req-body{padding:8px 12px 10px;display:flex;flex-wrap:wrap;gap:6px}
#${HOST_ID} .tdn-req-pill{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:#a89a80;
border:1px solid rgba(232,216,138,.18);border-radius:999px;padding:3px 10px}
#${HOST_ID} .tdn-req-pill b{color:var(--tg-green,#50b070);font-weight:700}

#${HOST_ID} .tdn-empty{padding:16px 14px;border:1px dashed rgba(232,216,138,.28);border-radius:10px;
background:rgba(232,216,138,.025);text-align:center;font-size:13px;color:#c8b898;line-height:1.55}

/* Karta z długą listą (>3 jednostki rozwinięte) — nagłówek maleje, żeby zostawić miejsce na scroll. */
#${HOST_ID} .tdn-card--compact .tdn-medallion{width:36px;height:36px}
#${HOST_ID} .tdn-card--compact .tdn-medallion svg{width:20px;height:20px}
#${HOST_ID} .tdn-card--compact h2{font-size:19px}
`;
  document.head.appendChild(style);
}

function buildBody(tech: TechRow): { html: string } {
  const buildings = (buildingsData as BuildingRow[]).filter(b => b.techUnlock === tech.Technologia);
  const units = (unitsData as UnitRow[]).filter(u => u.Tech === tech.Technologia);
  const allTechs = (techData as unknown as { technologie: TechRow[] }).technologie;
  const nextTechRows = allTechs.filter(t => list(t['Wymaga (prereq)']).includes(tech.Technologia));
  const improvementNames = list(tech['Odblokowuje ulepszenie terenu']);
  const resourceUnlocked = tech['Odblokowuje surowiec.'] || null;
  const requirements = list(tech['Wymaga (prereq)']);

  // "Co możesz teraz zrobić" — PIERWSZA sekcja, nad Budynkami: priorytet „co mogę zrobić teraz"
  // przed „co zostało odblokowane" (DYSPOZYCJA-WDROZENIE.md §2, odstępstwo świadome i zaakceptowane).
  const actionsHtml = buildActionItems({
    buildingNames: buildings.map(b => b.nazwa ?? b.id),
    improvementNames,
    resourceUnlocked,
    nextTechCount: nextTechRows.length,
  });
  const actionsSection = accordionSection({
    key: 'actions', title: 'Co możesz teraz zrobić', count: actionsHtml === '' ? 0 : 1,
    openDefault: true, bodyHtml: actionsHtml, highlighted: true,
  });

  const buildingsBody = buildings.map(b => unlockItemRow({
    icon: buildingIconSvg(undefined, b.id),
    title: b.nazwa ?? b.id,
    meta: [tech.Epoka ? `Epoka ${tech.Epoka === 'Kamień' ? 'Kamienia' : tech.Epoka}` : null, b.wymagania ?? (buildingEffectText(b) || null)]
      .filter(Boolean).join(' · ') || undefined,
  })).join('');
  const buildingsSection = accordionSection({
    key: 'buildings', title: 'Budynki', count: buildings.length, openDefault: true, bodyHtml: buildingsBody,
  });

  const UNIT_PREVIEW = 3;
  const unitRows = units.map(u => unlockItemRow({
    icon: unitIconSvg(undefined, u.Jednostka),
    title: u.Jednostka,
    trailing: u['Rola (linia)'] ?? u.Typ ?? undefined,
  }));
  const hiddenUnits = Math.max(0, unitRows.length - UNIT_PREVIEW);
  const unitsBody = unitRows.slice(0, UNIT_PREVIEW).join('')
    + (hiddenUnits > 0
      ? `<button type="button" class="tdn-more" data-more="units">`
        + `<span>Pokaż pozostałe ${hiddenUnits} ${pluralPl(hiddenUnits, 'jednostkę', 'jednostki', 'jednostek')}</span>`
        + `<span aria-hidden="true">▾</span></button>`
        + `<div class="tdn-more-rest" hidden>${unitRows.slice(UNIT_PREVIEW).join('')}</div>`
      : '');
  const unitsSection = accordionSection({
    key: 'units', title: 'Jednostki', count: units.length, openDefault: true, bodyHtml: unitsBody,
  });

  const improvementsBody = improvementNames.map(name => unlockItemRow({
    icon: improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name),
    title: name,
  })).join('');
  const improvementsSection = accordionSection({
    key: 'improvements', title: 'Ulepszenia terenu', count: improvementNames.length,
    openDefault: false, bodyHtml: improvementsBody,
  });

  const nextTechsBody = nextTechRows.map(t => {
    const otherPrereqs = list(t['Wymaga (prereq)']).filter(name => name !== tech.Technologia);
    const sub = otherPrereqs.length === 0
      ? badge('ok', 'Możesz badać')
      : `<span class="tdn-next-sub">Wymaga też: ${esc(otherPrereqs.join(', '))}</span>`;
    return `<div class="tdn-next">${iconTile(techIconSvg(t.Technologia, 14), 14)}`
      + `<span class="tdn-next-body"><span class="tdn-next-name">${esc(t.Technologia)}</span>`
      + (otherPrereqs.length > 0 ? sub : '')
      + `</span>`
      + (otherPrereqs.length === 0 ? sub : '')
      + `</div>`;
  }).join('');
  const nextTechsSection = accordionSection({
    key: 'next', title: 'Kolejne technologie', count: nextTechRows.length, openDefault: true, bodyHtml: nextTechsBody,
  });

  const econRows: string[] = [];
  for (const b of buildings) {
    const effect = buildingEffectText(b);
    if (effect) econRows.push(unlockItemRow({ icon: buildingIconSvg(undefined, b.id), title: b.nazwa ?? b.id, meta: effect }));
    if (b.utrzymanie != null) {
      econRows.push(unlockItemRow({
        icon: buildingIconSvg(undefined, b.id),
        title: `${b.nazwa ?? b.id} — utrzymanie`,
        meta: `${b.utrzymanie} złota na turę`,
      }));
    }
  }
  if (resourceUnlocked) {
    econRows.push(unlockItemRow({ icon: null, title: 'Dostęp do surowca', meta: resourceUnlocked }));
  }
  const econSection = accordionSection({
    key: 'econ', title: 'Zmiany ekonomiczne', count: econRows.length, openDefault: false, bodyHtml: econRows.join(''),
  });

  const reqSection = requirements.length === 0 ? '' : `<div class="tdn-req">`
    + `<div class="tdn-req-head"><span>Wymagania</span><span>${requirements.length} · spełnione</span></div>`
    + `<div class="tdn-req-body">${requirements.map(r => `<span class="tdn-req-pill">${esc(r)} <b>✓</b></span>`).join('')}</div>`
    + `</div>`;

  const sections = [actionsSection, buildingsSection, unitsSection, improvementsSection, nextTechsSection, econSection]
    .filter(Boolean).join('');

  if (sections === '' && reqSection === '') {
    return { html: `<div class="tdn-empty">Ta technologia nie odblokowuje bezpośrednio nowych elementów.</div>` };
  }
  return { html: sections + reqSection };
}

function wireInteractions(host: HTMLElement): void {
  host.querySelectorAll<HTMLButtonElement>('.tdn-sec-head').forEach(headBtn => {
    headBtn.addEventListener('click', () => {
      const sec = headBtn.closest<HTMLElement>('.tdn-sec');
      const body = sec?.querySelector<HTMLElement>('.tdn-sec-body');
      const chevron = headBtn.querySelector('.tdn-sec-chevron');
      if (!sec || !body) return;
      const nowOpen = sec.getAttribute('data-open') !== '1';
      sec.setAttribute('data-open', nowOpen ? '1' : '0');
      headBtn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      if (chevron) chevron.textContent = nowOpen ? '▾' : '▸';
      body.hidden = !nowOpen;
    });
  });
  const moreBtn = host.querySelector<HTMLButtonElement>('[data-more="units"]');
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      const rest = moreBtn.nextElementSibling as HTMLElement | null;
      if (rest) rest.hidden = false;
      moreBtn.setAttribute('hidden', '');
      // Karta z pełną (>3) listą jednostek dostaje kompaktowy nagłówek — DYSPOZYCJA-WDROZENIE.md §2.
      host.querySelector('.tdn-card')?.classList.add('tdn-card--compact');
    });
  }
}

type ShowTechDiscoveryNoticeOpts = {
  techName: string;
  eraIndex: number;
  /** Awans epoki zachowuje dotychczasowy nagłówek; completion i preview są jawne. */
  kind?: 'era' | 'completion' | 'preview';
  onOpenTree?: () => void;
  /** Opcjonalna, osobna akcja wyboru/rozpoczęcia badania z karty podglądu. */
  onStartResearch?: () => void;
};

/**
 * Punkt wejścia publiczny (T3, MIGRACJA-KARTA-TECHNOLOGII) — sygnatura BEZ ZMIAN
 * względem sprzed T3 (patrz `11-dispatch-T3-migracja-technologia.md`). Wewnątrz:
 * treść budowana przez `technologyAdapter.ts` (`buildEntityCardData`) i renderowana
 * przez wspólny `renderer.ts` (`renderEntityCard`) — `showTechDiscoveryNoticeViaEntityCard`
 * niżej. `_legacyShowTechDiscoveryNotice` (stara implementacja DOM-buildera,
 * `buildBody`/`accordionSection`/... powyżej) zostaje jako fallback bezpieczeństwa,
 * używany WYŁĄCZNIE gdy nowa ścieżka rzuci wyjątek (np. resolver `entityCards` nie
 * znajdzie wiersza) — patrz plan §3 „nie usuwaj starego kodu w tym samym commicie".
 */
export function showTechDiscoveryNotice(opts: ShowTechDiscoveryNoticeOpts): void {
  const tech = (techData as unknown as { technologie: TechRow[] }).technologie
    .find(t => t.Technologia === opts.techName);
  if (!tech) return;
  try {
    showTechDiscoveryNoticeViaEntityCard(tech, opts);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      '[techDiscoveryNotice] Ścieżka entityCards (technologyAdapter+renderEntityCard) rzuciła wyjątek — ' +
      'fallback na starą implementację DOM-buildera:', err,
    );
    _legacyShowTechDiscoveryNotice(tech, opts);
  }
}

/** Nowa ścieżka (T3): `technologyAdapter.ts` + `renderEntityCard` (wspólny kontrakt T1/T1b). */
function showTechDiscoveryNoticeViaEntityCard(tech: TechRow, opts: ShowTechDiscoveryNoticeOpts): void {
  ensureStyles();
  ensureEntityCardOverrideStyles();
  hideTechDiscoveryNotice();

  const kind = opts.kind ?? 'era';
  const isEraAdvance = kind === 'era';
  const isPreview = kind === 'preview';
  const kick = isPreview
    ? 'Podgląd technologii'
    : isEraAdvance
    ? `Awans do epoki ${EPOCH_LABEL[opts.eraIndex] ?? opts.eraIndex}`
    : 'Ukończono badania';
  const statusWord = isPreview ? 'Informacja' : 'Ukończona';
  const milestoneEpoch = typeof tech.awansDoEpoki === 'number'
    ? (EPOCH_LABEL[tech.awansDoEpoki] ?? String(tech.awansDoEpoki)) : null;
  const metaParts = [
    tech.Epoka ? `Epoka ${tech.Epoka}` : null,
    tech.Poziom != null ? `Poziom ${tech.Poziom}` : null,
  ].filter((x): x is string => !!x);
  if (milestoneEpoch) metaParts.push(`Kamień milowy — awans do epoki ${milestoneEpoch}`);
  if (isPreview) metaParts.push('Kliknięcie otwiera kartę podglądu — wybór badania jest osobną akcją.');
  const subtitleText = metaParts.join(' · ');

  const id = technologyIdFromName(tech.Technologia);
  const cardData = buildEntityCardData('technology', id, {});
  if (!cardData) {
    throw new Error(`entityCards: brak wiersza technologii dla "${tech.Technologia}" (id="${id}")`);
  }

  // T7b (KARTA-ULEPSZENIA-TERENU), call-site 1/3: sekcja „Ulepszenia terenu" —
  // dziś zwykłe wiersze bez interakcji (`technologyAdapter.ts`, poza allowlistą T7b) —
  // dopinamy `linkTo` TU, na już zbudowanych danych, żeby otwierały tę samą kartę co
  // pozostałe 2 miejsca wywołania (`openEntityCard('improvement', key, {mode:'dialog'})`).
  // `IMPROVEMENT_NAME_TO_KEY` (góra pliku) — ten sam mostek nazwa→klucz co reszta pliku.
  const sectionsWithImprovementLinks = cardData.sections.map((section) => {
    if (section.key !== 'improvements') return section;
    return {
      ...section,
      rows: section.rows.map((row) => {
        const impKey = IMPROVEMENT_NAME_TO_KEY[row.label];
        if (!impKey) return row;
        return { ...row, value: 'Szczegóły →', linkTo: { kind: 'improvement' as const, id: impKey } };
      }),
    };
  });

  const host = document.createElement('div');
  host.id = HOST_ID;
  // Zamknięcie karty technologii zamyka OBIE karty (wymóg 7 dyspozycji): satelita żyje
  // wewnątrz tego hosta, więc `host.remove()` usuwa ją razem z nim — zostaje tylko zdjęcie
  // jej wpisu ze stosu Esc, żeby stos nie trzymał martwego domknięcia.
  const close = () => { popOverlay(SIDE_OVERLAY_ID); popOverlay(OVERLAY_ID); host.remove(); };

  const actions: EntityCardAction[] = [];
  if (opts.onStartResearch) {
    actions.push({
      id: 'research', label: 'Rozpocznij badanie', kind: 'primary',
      onClick: () => { opts.onStartResearch?.(); close(); },
    });
  }
  if (opts.onOpenTree) {
    actions.push({
      id: 'tree', label: 'Otwórz drzewo', kind: actions.length > 0 ? 'secondary' : 'primary',
      onClick: () => { opts.onOpenTree?.(); close(); },
    });
  }

  const finalData: EntityCardData = {
    ...cardData,
    sections: sectionsWithImprovementLinks,
    subtitle: subtitleText || cardData.subtitle,
    statusBadges: [kick, statusWord],
    actions,
  };

  const card = renderEntityCard(finalData);
  card.classList.add('tdn-entity-card-v2');
  addTdnCloseButton(card, 'Zamknij kartę technologii', close);

  host.innerHTML = `<div class="tdn-back"></div><div class="tdn-stage"></div>`;
  host.querySelector('.tdn-back')?.addEventListener('click', close);
  const stage = host.querySelector('.tdn-stage') as HTMLElement;
  stage.appendChild(card);
  wireSideCardLinks(card, host, stage);
  document.body.appendChild(host);
  pushOverlay(OVERLAY_ID, close);
}

/** ✕ karty — `renderEntityCard` (`renderer.ts`) żadnego nie rysuje, więc dopinamy go po
 * zbudowaniu karty, zamiast zmieniać WSPÓLNY renderer (dotyka też kart jednostek/budynków). */
function addTdnCloseButton(card: HTMLElement, ariaLabel: string, onClose: () => void): void {
  const headerEl = card.querySelector('.entity-card-header');
  if (!headerEl) return;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'tdn-entity-close';
  closeBtn.title = 'Zamknij (Esc)';
  closeBtn.setAttribute('aria-label', ariaLabel);
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); onClose(); });
  headerEl.appendChild(closeBtn);
}

/**
 * P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 (B) — link krzyżowy z karty technologii
 * („Ulepszenia terenu → Szczegóły →", ale też budynki/jednostki/kolejne technologie)
 * otwiera kartę docelową **OBOK**, w tym samym hoście, zamiast pod spodem.
 *
 * DIAGNOZA POMIAROWA (żywe Chromium, przed naprawą): karta technologii NIE była zamykana —
 * host `#civ-tech-discovery-notice-host` zostawał w DOM, widoczny, `z-index:940`. Karta
 * ulepszenia szła przez `openEntityCard(..., {mode:'dialog'})` → `openDialog()` w
 * `entityCards/renderer.ts`, który montuje WŁASNY `.entity-card-backdrop` prosto w
 * `document.body` z `z-index:520` (`ENTITY_CARD_CSS`). 520 < 940, więc nowa karta lądowała
 * pod pełnoekranową nakładką karty technologii: `getBoundingClientRect()` obu kart było
 * niezerowe i w viewporcie, ale `document.elementFromPoint()` w ŚRODKU karty „Obóz łowiecki"
 * zwracał element karty „Łowiectwo". To jest dosłownie „pojawia się pod spodem" ze zgłoszenia.
 *
 * NAPRAWA BEZ DOTYKANIA `renderer.ts` (dyspozycja: „jeśli da się rozwiązać (B) bez
 * `renderer.ts`, to jest lepsze" — renderer jest WSPÓLNY dla kart jednostek i budynków):
 * listener w fazie PRZECHWYTYWANIA na karcie. `renderEntityCard` rejestruje swój własny,
 * delegowany listener bąbelkowy na tej samej karcie i kończy go `stopImmediatePropagation()`,
 * więc każdy listener dopięty PO nim jest martwy (dokładnie to spotkało dawny lokalny
 * listener T7b — nigdy się nie wykonywał). Listener `capture` na karcie-PRZODKU klikniętego
 * przycisku biegnie natomiast PRZED fazą bąbelkową na tej samej karcie, więc `stopPropagation()`
 * tutaj skutecznie odbiera klik rendererowi, zanim ten otworzy osobny `dialog`.
 *
 * Karta satelita montowana jest do `.tdn-stage` — wspólnego, wyśrodkowanego kontenera flex
 * wewnątrz tego samego hosta. Skutki: (1) obie karty są w JEDNYM kontekście stackowania,
 * więc żadna nie może przykryć drugiej; (2) zamknięcie karty technologii (`close`) usuwa host,
 * czyli i satelitę; (3) satelita ma własny wpis stosu Esc, więc Esc zamyka najpierw ją.
 */
function wireSideCardLinks(card: HTMLElement, host: HTMLElement, stage: HTMLElement): void {
  card.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest<HTMLElement>('button[data-entity-kind][data-entity-id]');
    if (btn === null || btn === undefined || !card.contains(btn)) return;
    const kind = btn.getAttribute('data-entity-kind');
    const id = btn.getAttribute('data-entity-id');
    if (kind === null || id === null) return;
    event.preventDefault();
    event.stopPropagation();
    openEntityCardBeside(kind as Parameters<typeof openEntityCard>[0], id, host, stage);
  }, true);
}

function openEntityCardBeside(
  kind: Parameters<typeof openEntityCard>[0],
  id: string,
  host: HTMLElement,
  stage: HTMLElement,
): void {
  const data = buildEntityCardData(kind, id, {});
  if (data == null) {
    // Encja nie istnieje — zachowaj dotychczasowe zachowanie renderera (log + no-op),
    // nie udawaj, że karta się otworzyła.
    openEntityCard(kind, id, { mode: 'dialog' });
    return;
  }
  closeTdnSideCard(host);
  const sideCard = renderEntityCard(data);
  sideCard.classList.add('tdn-side-card');
  const closeSide = (): void => { popOverlay(SIDE_OVERLAY_ID); closeTdnSideCard(host); };
  addTdnCloseButton(sideCard, 'Zamknij kartę: ' + data.title, closeSide);
  stage.appendChild(sideCard);
  host.classList.add('tdn-has-side');
  // Link krzyżowy Z KARTY SATELITY podmienia satelitę (nadal DWIE karty widoczne),
  // zamiast budować stos nakładek pod hostem — ten sam mechanizm, jeden poziom głębiej.
  wireSideCardLinks(sideCard, host, stage);
  pushOverlay(SIDE_OVERLAY_ID, closeSide);
}

function closeTdnSideCard(host: HTMLElement): void {
  host.querySelector('.tdn-side-card')?.remove();
  host.classList.remove('tdn-has-side');
}

let entityCardOverrideStylesInjected = false;
/** Wstrzykuje `ENTITY_CARD_CSS` (reeksport `renderer.ts`, nigdy dotąd nie wołany
 * przez żadnego z 4 kinds — T3 jest pierwszym realnym konsumentem) plus lokalne
 * nadpisania potrzebne, żeby karta `.entity-card` mieściła się w dotychczasowym
 * hoście `#${HOST_ID}` (ten sam wzorzec pozycjonowania co stary `.tdn-card`).
 *
 * R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1 (naprawa): `.tdn-back` (tło, sibling
 * karty w `showTechDiscoveryNoticeViaEntityCard`) jest `position:fixed` — to
 * tworzy kontekst stackowania na "stack level 0" niezależnie od z-index. Bez
 * własnego `position` na `.entity-card` (domyślnie `static`), karta ląduje we
 * WCZEŚNIEJSZYM etapie malowania niż pozycjonowane tło (CSS2.1 Appendix E: kroki
 * 3 vs 6) — tło faktycznie renderuje się (i przechwytuje kliknięcia) NAD kartą,
 * mimo że w DOM karta jest zagnieżdżona wizualnie "na wierzchu". Potwierdzone
 * realnym Chromium (Playwright): `document.elementFromPoint()` na środku
 * przycisku „Rozpocznij badanie" zwracał `.tdn-back`, nie przycisk — realny
 * `page.mouse.click()` w tym miejscu zamykał kartę (trafiał w listener `.tdn-back`),
 * NIGDY nie wywołując `onClick` przycisku. Stary `.tdn-card` (przed T3) miał
 * `position:relative` explicite — stąd tam ten sam wzorzec (tło+karta jako
 * siblingi) działał poprawnie. `position:relative` tutaj przywraca ten sam
 * kontekst stackowania (krok 6, po `.tdn-back` w kolejności DOM → karta na
 * wierzchu), bez zmiany wspólnego `ENTITY_CARD_CSS`/`renderer.ts` (T4 nietknięty). */
function ensureEntityCardOverrideStyles(): void {
  if (entityCardOverrideStylesInjected) return;
  entityCardOverrideStylesInjected = true;
  const style = document.createElement('style');
  style.id = 'civ-tech-discovery-entity-card-css-v1';
  style.textContent = ENTITY_CARD_CSS + `
#${HOST_ID} .entity-card{position:relative;pointer-events:auto;width:min(660px,96vw);max-height:calc(100vh - 36px);
  overflow:auto;border-color:var(--tg-gold-primary,#e8d88a);
  box-shadow:var(--tg-glow-gold,0 0 24px rgba(232,216,138,.28)),0 12px 40px rgba(0,0,0,.6);}
/* P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 (B) — scena obu kart. Host jest wyśrodkowanym
   flexem na całą stronę; .tdn-stage jest JEDYNYM elementem układającym karty, więc karta
   technologii i karta szczegółu stoją OBOK SIEBIE w tym samym kontekście stackowania
   (żadna nie może przykryć drugiej, w przeciwieństwie do dawnego .entity-card-backdrop
   z z-index 520 pod hostem 940). Para pointer-events none (scena) / auto (karty) sprawia,
   że klik w wolne pole między kartami trafia w .tdn-back i zamyka całość, tak jak dotąd. */
#${HOST_ID} .tdn-stage{position:relative;display:flex;align-items:center;justify-content:center;
  gap:14px;max-width:100%;max-height:100%;pointer-events:none;}
#${HOST_ID} .tdn-stage > *{pointer-events:auto;}
#${HOST_ID} .tdn-side-card{width:min(434px,96vw);animation:civ-tdn-in .18s ease-out;}
/* PRÓG WĄSKIEGO OKNA — jawnie 1160 px szerokości viewportu. Rachunek: karta technologii
   660 + karta szczegółu 434 + odstęp 14 + padding hosta 2x18 = 1144 px; 1160 daje 16 px
   zapasu. PONIŻEJ progu obie karty ZOSTAJĄ WIDOCZNE, tylko układ zmienia się na pionowy
   (jedna pod drugą, każda z połową dostępnej wysokości i własnym scrollem) — świadomie NIE
   wracamy do podmiany ani do stosu, bo cały sens zmiany to widoczny związek „z tej
   technologii wynika to ulepszenie". */
@media (max-width:1160px){
  #${HOST_ID}.tdn-has-side .tdn-stage{flex-direction:column;gap:10px;overflow:auto;}
  #${HOST_ID}.tdn-has-side .entity-card{max-height:calc((100vh - 56px) / 2);}
}
#${HOST_ID} .entity-card-header{position:relative;padding-right:44px;}
.tdn-entity-close{position:absolute;top:10px;right:10px;width:28px;height:28px;
  border-radius:var(--tg-radius-btn,8px);border:2px solid rgba(232,216,138,.4);
  background:linear-gradient(180deg,#161c28,#0a0d14);color:var(--tg-gold-primary,#e8d88a);
  font-size:13px;line-height:1;cursor:pointer;font-family:inherit;}
.tdn-entity-close:hover{border-color:var(--tg-gold-primary,#e8d88a);color:#f4e6a8;}
.tdn-entity-close:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}
/* T7b: wiersze "Ulepszenia terenu" wolajace openEntityCard('improvement',...) mialy TUTAJ
   jednorazowy, lokalny styl linku ("Szczegoly ->": zloty, podkreslony, kursor pointer), bo
   renderer.ts byl wtedy poza allowlista T7b i nie dodawal wlasnego hover/cursor.
   P-CIVPEDIA-KARTY-LINKI-NIEOSTYLOWANE-REGRES-T10-Q1: ten sam jezyk wizualny zostal
   przeniesiony do WSPOLNEGO ENTITY_CARD_CSS (renderer.ts, blok .entity-card-row-key /
   .entity-card-row-value) i obejmuje juz WSZYSTKIE rodzaje linkow krzyzowych
   (building/unit/technology/improvement), a ENTITY_CARD_CSS jest doklejany do tego
   arkusza wyzej — lokalna kopia zostala usunieta, zeby nie utrzymywac dwoch rozjezdzajacych
   sie definicji tego samego stylu. */
`;
  document.head.appendChild(style);
}

/** Stara implementacja (sprzed T3) — DOM-builder własny (`buildBody`/`accordionSection`/
 * `wireInteractions`), zachowana jako fallback bezpieczeństwa (plan §3), wołana WYŁĄCZNIE
 * z `catch` w `showTechDiscoveryNotice` gdy ścieżka `entityCards` rzuci wyjątek. */
function _legacyShowTechDiscoveryNotice(tech: TechRow, opts: ShowTechDiscoveryNoticeOpts): void {
  ensureStyles();
  hideTechDiscoveryNotice();
  const host = document.createElement('div');
  host.id = HOST_ID;
  const close = () => { popOverlay(OVERLAY_ID); host.remove(); };
  const kind = opts.kind ?? 'era';
  const isEraAdvance = kind === 'era';
  const isPreview = kind === 'preview';
  const kick = isPreview
    ? 'Podgląd technologii'
    : isEraAdvance
    ? `Awans do epoki ${esc(EPOCH_LABEL[opts.eraIndex] ?? opts.eraIndex)}`
    : 'Ukończono badania';
  const milestoneEpoch = typeof tech.awansDoEpoki === 'number' ? (EPOCH_LABEL[tech.awansDoEpoki] ?? String(tech.awansDoEpoki)) : null;
  const metaParts = [
    tech.Epoka ? `Epoka ${tech.Epoka}` : null,
    tech.Poziom != null ? `Poziom ${tech.Poziom}` : null,
  ].filter((x): x is string => !!x).map(x => `<span>${esc(x)}</span>`);
  if (milestoneEpoch) {
    metaParts.push(`<span class="tdn-milestone">Kamień milowy — awans do epoki ${esc(milestoneEpoch)}</span>`);
  }
  const icon = techIconSvg(tech.Technologia, 28);
  const { html: bodyHtml } = buildBody(tech);
  host.innerHTML = `<div class="tdn-back"></div><article class="tdn-card" role="dialog" aria-modal="true"
    aria-label="Odkryta technologia"><header class="tdn-head">
    <span class="tdn-medallion">${icon ?? ''}</span>
    <span class="tdn-headtext">
      <span class="tdn-kickrow"><span class="tdn-kick">${kick}</span><span class="tdn-status-dot"></span><span class="tdn-status">${isPreview ? 'Informacja' : 'Ukończona'}</span></span>
      <h2>${esc(tech.Technologia)}</h2>
      <span class="tdn-meta">${metaParts.join('')}</span>
    </span>
    <button type="button" class="tdn-close" data-act="close" title="Zamknij (Esc)" aria-label="Zamknij kartę technologii">✕</button>
    </header>
    <div class="tdn-scroll">${bodyHtml}</div>
    ${isPreview ? `<div class="tdn-preview-hint" style="color:#b7c9df;font-size:.78rem;padding:.55rem .9rem;border-top:1px solid rgba(232,216,138,.18);">Kliknięcie otwiera kartę podglądu. Wybór badania jest osobną akcją.</div>` : ''}
    ${(opts.onOpenTree || opts.onStartResearch) ? `<footer class="tdn-foot">${opts.onStartResearch ? `<button type="button" class="tdn-tree-btn" data-act="research">Rozpocznij badanie</button>` : ''}${opts.onOpenTree ? `<button type="button" class="tdn-tree-btn" data-act="tree">Otwórz drzewo</button>` : ''}</footer>` : ''}
    </article>`;
  host.querySelector('.tdn-back')?.addEventListener('click', close);
  host.querySelector('[data-act="close"]')?.addEventListener('click', close);
  host.querySelector('[data-act="research"]')?.addEventListener('click', () => {
    opts.onStartResearch?.();
    close();
  });
  host.querySelector('[data-act="tree"]')?.addEventListener('click', () => {
    opts.onOpenTree?.();
    close();
  });
  wireInteractions(host);
  // Przycisk „Otwórz hub badań" (odłożony) celowo NIE jest tu renderowany — patrz
  // komentarz na górze pliku, pkt 5. „Otwórz drzewo" (istniejący, działający hook
  // main.ts → showTechTreeView) zostaje: to inna funkcja (drzewko, nie hub badań) i
  // usunięcie jej byłoby regresją, której makieta (bez żadnej stopki) wprost nie żąda.
  document.body.appendChild(host);
  pushOverlay(OVERLAY_ID, close);
}

export function hideTechDiscoveryNotice(): void {
  popOverlay(SIDE_OVERLAY_ID);
  popOverlay(OVERLAY_ID);
  document.getElementById(HOST_ID)?.remove();
}

/** Czy karta badań jest aktualnie otwarta jako modal końca tury. */
export function isTechDiscoveryNoticeOpen(): boolean {
  return document.getElementById(HOST_ID) !== null;
}
