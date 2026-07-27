/**
 * diplomacyPanel.ts
 * Panel Dyplomacji — lista relacji gracza z innymi cywilizacjami + etykiety statusu.
 *
 * CEL: wyświetlić przegląd relacji (cywilizacja, tier, Zaufanie/Respekt).
 * DOM-only; dane przez getRelations() w konfiguracji.
 *
 * Panel v1.0 = podgląd + audiencja (D3). Callbacki wpina SILNIK.
 */
import { formatEntityDisplayName } from '../game/display-names';
import {
  civPennantHtml,
  civPennantHtmlById,
  DIPLO_1E_SHARED_CSS,
  dipBrandIconHtml,
  ensureDiploBrandScope,
  tierBadgeHtml,
  treatyChipsHtml,
} from './diploUiSkin';
// Typy publiczne
// ---------------------------------------------------------------------------

/** Warstwa dyplomacji (D-START-2B / 3A). */
export type DiplomacyLayerMode = 'simplified' | 'full' | 'pre_contact';

/** Akcja dyplomatyczna gracza (warstwa uproszczona). */
export type DiploPlayerAction = 'pokoj' | 'wojna' | 'handel';

/** Relacja z jedną cywilizacją przekazywana do panelu przez silnik. */
export interface DiploRelation {
  /** ownerId rywala (wymagane do akcji gracza). */
  ownerId?: number;
  /** Nazwa wyświetlana (miasto rywala klastra lub nacja). */
  civ: string;
  /** Miasto-państwo klastra — silnik ustawia flagę; UI formatuje przez display-names. */
  isCityState?: boolean;
  /** Uproszczony klaster vs pełna dyplomacja obcego typu. */
  layer?: DiplomacyLayerMode;
  /** Dozwolone akcje w tej warstwie (podgląd v1). */
  allowedActions?: readonly string[];
  /**
   * Tier statusu 0..4 — obliczany przez SILNIK (diplomacy.relationTier):
   *   0 = Wojna    (STAN: status='wojna' — nadrzędne, nie score)
   *   1 = Wrogi
   *   2 = Neutralny  (start relacji = 50)
   *   3 = Przyjazny
   *   4 = Sojusz   (STAN: status='sojusz' LUB score >= 120)
   * UI nie oblicza progów — bierze gotowy tier z getRelations().
   */
  tier: number;
  /** Zaufanie 0–100 (opcjonalne — jeśli dostarczone, wyświetlane). */
  zaufanie?: number;
  /** Respekt / Strach 0–100 (opcjonalne) — nasz respekt wobec tej cywilizacji. */
  respekt?: number;
  /** Ich respekt wobec gracza (0–100). */
  theirRespekt?: number;
  /** Łączna ludność nacji (suma miast). */
  population?: number;
  /** Liczba jednostek wojskowych na mapie. */
  armyCount?: number;
  /** Etykieta okręgu kulturowego (np. „Grecka"). */
  cultureLabel?: string;
  /** Etykieta epoki (np. „Kamień"). */
  epochLabel?: string;
  /** D3 audiencja — formalny kontakt nawiązany (D3-Q2A). */
  contactEstablished?: boolean;
  /** ikonaId nacji (z silnika). */
  ikonaId?: string;
  /** kolorHex nacji (#RRGGBB). */
  kolorHex?: string;
  /** Aktywne traktaty między graczem a tą cywilizacją (etykiety PL z silnika). */
  activeTreaties?: readonly string[];
}

/** Wojna między dwiema cywilizacjami (wywiad) — A1-Q5; nie musi dotyczyć gracza. */
export interface KnownWarBetweenCivs {
  civA: string;
  civB: string;
}

/** Konfiguracja panelu — wstrzykiwana przez silnik. */
export interface DiplomacyPanelConfig {
  /**
   * Hak danych: silnik zwraca aktualną listę relacji gracza.
   * Brak haka → panel pokazuje placeholder (tryb podglądu).
   */
  getRelations?: () => DiploRelation[];
  /**
   * A1-Q5: wojny między innymi nacjami, o których gracz wie (dyplomacja / wywiad).
   * Wyświetlane w sekcji pod listą relacji gracza.
   */
  getKnownWarsBetweenOthers?: () => KnownWarBetweenCivs[];
  /** D3 audiencja — otwórz ekran 2. */
  onOpenAudience?: (ownerId: number) => void;
}

// ---------------------------------------------------------------------------
// Stałe — 5 tierów (oficjalna skala potwierdzona przez CYWILIZACJE)
// ---------------------------------------------------------------------------

/** Etykiety tieru (indeks = tier 0..4). */
const TIER_LABEL: readonly string[] = [
  'Wojna',      // 0 — STAN (status='wojna'), nie próg score
  'Wrogi',      // 1
  'Neutralny',  // 2 — start relacji = 50
  'Przyjazny',  // 3
  'Sojusz',     // 4 — STAN (status='sojusz') LUB score >= 120
] as const;

/** Kolory tła badge per tier (inline style). */
const TIER_BG: readonly string[] = [
  'rgba(211,55,55,0.82)',    // 0 Wojna — czerwony
  'rgba(210,120,30,0.82)',   // 1 Wrogi — pomarańczowy
  'rgba(100,110,120,0.82)',  // 2 Neutralny — szary
  'rgba(75,170,90,0.82)',    // 3 Przyjazny — jasnozielony
  'rgba(80,170,120,0.82)',   // 4 Sojusz — zielony/złoty
] as const;

/** Kolory tekstu badge per tier. */
const TIER_FG: readonly string[] = [
  '#ffd0cc', // 0 Wojna
  '#ffe5c0', // 1 Wrogi
  '#d0d6de', // 2 Neutralny
  '#d0f4d8', // 3 Przyjazny
  '#d0f4e8', // 4 Sojusz
] as const;

/** Zwraca etykietę tieru (bezpiecznie dla t poza zakresem). */
export function tierLabel(t: number): string {
  return TIER_LABEL[Math.max(0, Math.min(4, Math.round(t)))] ?? 'Neutralny';
}

/** Zwraca kolor tła badge tieru. */
export function tierBg(t: number): string {
  return TIER_BG[Math.max(0, Math.min(4, Math.round(t)))] ?? TIER_BG[2]!;
}

/** Zwraca kolor tekstu badge tieru. */
export function tierFg(t: number): string {
  return TIER_FG[Math.max(0, Math.min(4, Math.round(t)))] ?? TIER_FG[2]!;
}

// ---------------------------------------------------------------------------
// Stan modułu
// ---------------------------------------------------------------------------

let cfg: DiplomacyPanelConfig | null = null;
let rootEl: HTMLDivElement | null = null;

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-diplo-css-1e';
function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-diplo{position:fixed;top:60px;right:250px;width:min(360px,30vw);max-height:70vh;overflow-y:auto;z-index:320;
  background:var(--tg-panel-grad,linear-gradient(180deg,rgba(16,22,34,.97),rgba(6,8,14,.96)));
  color:var(--tg-text-primary,#e8e0c8);
  border:var(--tg-border-gold,2px solid rgba(232,216,138,.35));border-radius:var(--tg-radius-panel,12px);
  padding:12px 14px;font:13px var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);box-shadow:0 10px 32px rgba(0,0,0,.62);}
.civ-diplo *{box-sizing:border-box;}
.civ-diplo .cd-title{font-family:var(--tg-font-title,Georgia,serif);font-size:1.05em;font-weight:700;
  letter-spacing:.04em;color:var(--tg-gold-primary,#e8d88a);border-bottom:1px solid rgba(232,216,138,.22);
  padding-bottom:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-diplo .cd-title-ic{display:inline-flex;align-items:center;gap:0.4em;}
.civ-diplo .cd-title-ic .dip-ic{width:20px;height:20px;}
.civ-diplo .cd-ph{font-size:0.62em;color:var(--tg-text-muted,#8a8070);border:1px solid rgba(232,216,138,.25);
  border-radius:4px;padding:0 5px;letter-spacing:.08em;text-transform:uppercase;}
.civ-diplo .cd-row{display:flex;align-items:center;gap:0.75em;padding:0.65em 0.5em;margin:0.35em 0;
  border-radius:var(--tg-radius-panel,12px);border:1px solid rgba(232,216,138,.16);background:rgba(255,255,255,.02);}
.civ-diplo .cd-row.cd-war{border-color:rgba(200,64,64,.3);background:rgba(200,64,64,.04);}
.civ-diplo .cd-civ-wrap{flex:1;min-width:0;}
.civ-diplo .cd-civ{display:block;color:var(--tg-text-primary,#e8e0c8);font-weight:700;
  font-family:var(--tg-font-title,Georgia,serif);font-size:0.95em;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-diplo .cd-stats{font-size:0.72em;color:#8a8070;margin-top:3px;line-height:1.35;}
.civ-diplo .cd-tier-row{margin-top:4px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;}
.civ-diplo .cd-empty{font-size:0.86em;color:#8a8070;text-align:center;padding:12px 0;font-style:italic;}
.civ-diplo .cd-sub{font-size:0.72em;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:#e08a8a;margin:10px 0 4px;padding-top:6px;border-top:1px solid rgba(200,64,64,.25);}
.civ-diplo .cd-war-row{font-size:0.78em;color:#e8c0c0;padding:4px 0;display:flex;align-items:center;gap:8px;}
.civ-diplo .cd-war-row .dip-ic{width:14px;height:14px;flex-shrink:0;color:#e08a8a;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Dane placeholder (podgląd bez haka) — jeden wiersz per tier, oficjalna skala
// ---------------------------------------------------------------------------

const PLACEHOLDER_RELATIONS: DiploRelation[] = [
  { civ: formatEntityDisplayName({ baseName: 'Sparta', isCityState: true }), isCityState: true, tier: 0, zaufanie: 3,  respekt: 70 },
  { civ: 'Hunowie',    tier: 1, zaufanie: 12, respekt: 50 },
  { civ: 'Chińczycy',  tier: 2, zaufanie: 50, respekt: 30 },
  { civ: 'Grecy',      tier: 3, zaufanie: 65, respekt: 40 },
  { civ: 'Egipcjanie', tier: 4, zaufanie: 90, respekt: 55 },
];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function panelRelTotal(zaufanie: number, respekt: number): number {
  return Math.round(Math.max(0, Math.min(200, zaufanie + respekt)));
}

function renderRow(rel: DiploRelation, isPlaceholder: boolean): string {
  const btnLabel = rel.contactEstablished ? 'Porozmawiaj' : 'Nawiąż kontakt';
  let actionBtn = '';
  if (!isPlaceholder && rel.ownerId !== undefined && cfg?.onOpenAudience) {
    actionBtn = '<button type="button" class="dip-gold-btn cd-aud-btn" data-act="audience" data-oid="' + rel.ownerId + '">'
      + esc(btnLabel) + '</button>';
  }
  const treatyChips = rel.activeTreaties?.length
    ? treatyChipsHtml(rel.activeTreaties)
    : '';
  const tierBadge = '<div class="cd-tier-row">' + tierBadgeHtml(rel.tier, tierLabel(rel.tier)) + treatyChips + '</div>';
  const zauf = rel.zaufanie ?? 0;
  const relTotal = panelRelTotal(zauf, rel.respekt ?? 0);
  const stats = (rel.zaufanie != null || rel.respekt != null)
    ? '<div class="cd-stats">' + esc('Relacja: ' + relTotal + ' · Zaufanie: ' + zauf) + '</div>'
    : '';
  const rowCls = rel.tier === 0 ? 'cd-row cd-war' : 'cd-row';
  const pennant = rel.ikonaId
    ? civPennantHtmlById(rel.ikonaId, rel.kolorHex, rel.tier)
    : civPennantHtml(rel.civ, rel.tier);
  return (
    '<div class="' + rowCls + '" data-owner="' + (rel.ownerId ?? '') + '">' +
      pennant +
      '<div class="cd-civ-wrap">' +
        '<span class="cd-civ">' + esc(rel.civ) + '</span>' +
        tierBadge + stats +
      '</div>' +
      actionBtn +
    '</div>'
  );
}

/** Prosta eskapada znaków specjalnych HTML. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function render(): void {
  if (rootEl === null) return;
  const relations = cfg?.getRelations ? cfg.getRelations() : null;
  const isPlaceholder = relations === null;
  const list = isPlaceholder ? PLACEHOLDER_RELATIONS : relations;

  const phBadge = isPlaceholder ? '<span class="cd-ph">podgląd</span>' : '';
  const titleIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic') ?? '';
  let html = '<div class="cd-title"><span class="cd-title-ic">' + titleIc + '<span>Dyplomacja</span></span>' + phBadge + '</div>';

  if (list.length === 0) {
    html += '<div class="cd-empty">Nie spotkałeś jeszcze żadnej obcej cywilizacji.</div>';
  } else {
    for (const rel of list) {
      html += renderRow(rel, isPlaceholder);
    }
  }

  const knownWars = cfg?.getKnownWarsBetweenOthers?.() ?? null;
  if (knownWars !== null && knownWars.length > 0) {
    html += '<div class="cd-sub">Wojny znane (wywiad)</div>';
    for (const w of knownWars) {
      const warIc = dipBrandIconHtml('dip-war', 24, 'dip-ic') ?? '';
      html += '<div class="cd-war-row">' + warIc + '<span>'
        + esc(w.civA) + ' \u2194 ' + esc(w.civB) + '</span></div>';
    }
  }

  rootEl.innerHTML = html;
  bindActionButtons(list, isPlaceholder);
}

function bindActionButtons(list: DiploRelation[], isPlaceholder: boolean): void {
  if (isPlaceholder || rootEl === null || cfg === null) return;
  rootEl.querySelectorAll<HTMLButtonElement>('button[data-act="audience"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const oidStr = btn.getAttribute('data-oid');
      if (oidStr === null || !cfg!.onOpenAudience) return;
      cfg!.onOpenAudience(parseInt(oidStr, 10));
    });
  });
}

// ---------------------------------------------------------------------------
// API publiczne
// ---------------------------------------------------------------------------

/**
 * Pokaż panel dyplomacji.
 * @param config - konfiguracja z opcjonalnym hakiem getRelations.
 *   Brak haka → placeholder 5 przykładowych cywilizacji (tryb podglądu, jeden per tier).
 */
export function showDiplomacyPanel(config: DiplomacyPanelConfig): void {
  cfg = config;
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-diplo';
    document.body.appendChild(rootEl);
  }
  render();
  rootEl.style.display = 'block';
}

/**
 * Odśwież dane panelu (np. po zakończeniu tury lub zdarzeniu dyplomatycznym).
 */
export function updateDiplomacyPanel(): void {
  render();
}

/**
 * Ukryj panel (bez usuwania z DOM).
 */
export function hideDiplomacyPanel(): void {
  if (rootEl !== null) rootEl.style.display = 'none';
}

/**
 * Czy panel jest aktualnie widoczny.
 */
export function isDiplomacyPanelOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}
