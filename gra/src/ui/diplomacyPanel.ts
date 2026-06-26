/**
 * diplomacyPanel.ts
 * Panel Dyplomacji — lista relacji gracza z innymi cywilizacjami + etykiety statusu.
 *
 * CEL: wyswietlic przeglad relacji dyplomatycznych (cywilizacja, tier statusu,
 *      Zaufanie i Respekt jesli dostepne).
 *
 * DOM-only, DECOUPLED: zero importow z game/* ani types/*; dane podaje silnik
 *   przez getRelations() w konfiguracji.  Bez haka: placeholder 5 przyk. cywilizacji.
 *
 * Skala 5 tierów potwierdzona przez CYWILIZACJE. Tier liczy SILNIK (diplomacy.relationTier);
 * tier 0=Wojna to STAN (status='wojna'), nie score. UI bierze GOTOWY tier z getRelations()
 * — nie duplikuje progów.
 *
 * Tło + paleta: slate rgba(20,24,32,.94), złoto #e0b24a — spójne z empireBalance.ts.
 * Scope CSS: .civ-diplo.
 *
 * Panel v0.1 = PODGLĄD (tier + Zaufanie/Respekt). BEZ akcji (wojna/pakt) —
 * akcje dyplomatyczne w osobnej iteracji po wpięciu applyDiplomaticEvent do pętli tury.
 */

// ---------------------------------------------------------------------------
// Typy publiczne
// ---------------------------------------------------------------------------

/** Relacja z jedną cywilizacją przekazywana do panelu przez silnik. */
export interface DiploRelation {
  /** Nazwa lub id cywilizacji (wyświetlana w panelu). */
  civ: string;
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
  /** Respekt / Strach 0–100 (opcjonalne — jeśli dostarczone, wyświetlane). */
  respekt?: number;
}

/** Konfiguracja panelu — wstrzykiwana przez silnik. */
export interface DiplomacyPanelConfig {
  /**
   * Hak danych: silnik zwraca aktualną listę relacji gracza.
   * Brak haka → panel pokazuje placeholder (tryb podglądu).
   */
  getRelations?: () => DiploRelation[];
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

const STYLE_ID = 'civ-diplo-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-diplo{position:fixed;top:60px;right:250px;width:260px;max-height:70vh;overflow-y:auto;z-index:320;
  --gold:#e0b24a;--muted:#9aa6b6;--sub:#c0c8d4;
  background:rgba(20,24,32,0.94);color:#e8ebf0;
  border:1px solid rgba(224,178,74,0.3);border-radius:8px;
  padding:10px 12px;font:13px monospace;box-shadow:0 4px 20px rgba(0,0,0,0.6);}
.civ-diplo *{box-sizing:border-box;}
.civ-diplo .cd-title{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--gold);border-bottom:1px solid rgba(224,178,74,0.25);
  padding-bottom:4px;margin-bottom:7px;display:flex;justify-content:space-between;align-items:center;}
.civ-diplo .cd-ph{font-size:0.64em;color:var(--muted);border:1px solid rgba(224,178,74,0.25);
  border-radius:3px;padding:0 4px;}
.civ-diplo .cd-row{display:flex;align-items:center;padding:4px 0;
  border-bottom:1px solid rgba(255,255,255,0.05);}
.civ-diplo .cd-row:last-child{border-bottom:none;}
.civ-diplo .cd-civ{flex:1;color:#e8ebf0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-diplo .cd-badge{display:inline-block;font-size:0.72em;font-weight:700;padding:1px 7px;
  border-radius:3px;white-space:nowrap;letter-spacing:.04em;margin-left:6px;flex-shrink:0;}
.civ-diplo .cd-stats{font-size:0.72em;color:var(--muted);margin-top:2px;padding-left:0;}
.civ-diplo .cd-stat{margin-right:8px;}
.civ-diplo .cd-stat span{color:var(--sub);}
.civ-diplo .cd-empty{font-size:0.82em;color:var(--muted);text-align:center;padding:10px 0;}
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
  { civ: 'Spartanie',  tier: 0, zaufanie: 3,  respekt: 70 },  // Wojna (STAN)
  { civ: 'Hunowie',    tier: 1, zaufanie: 12, respekt: 50 },  // Wrogi
  { civ: 'Chińczycy',  tier: 2, zaufanie: 50, respekt: 30 },  // Neutralny (start = 50)
  { civ: 'Grecy',      tier: 3, zaufanie: 65, respekt: 40 },  // Przyjazny
  { civ: 'Egipcjanie', tier: 4, zaufanie: 90, respekt: 55 },  // Sojusz
];

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function renderRow(rel: DiploRelation): string {
  const t = Math.max(0, Math.min(4, Math.round(rel.tier)));
  const label  = tierLabel(t);
  const bg     = tierBg(t);
  const fg     = tierFg(t);
  const badge  = '<span class="cd-badge" style="background:' + bg + ';color:' + fg + '">' + label + '</span>';

  let stats = '';
  if (rel.zaufanie !== undefined || rel.respekt !== undefined) {
    const parts: string[] = [];
    if (rel.zaufanie !== undefined) {
      parts.push('Zaufanie ' + String(rel.zaufanie));
    }
    if (rel.respekt !== undefined) {
      parts.push('Respekt ' + String(rel.respekt));
    }
    stats = '<div class="cd-stats"><span class="cd-stat"><span>' + esc(parts.join(' · ')) + '</span></span></div>';
  }

  return (
    '<div class="cd-row">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;align-items:center">' +
          '<span class="cd-civ">' + esc(rel.civ) + '</span>' + badge +
        '</div>' +
        stats +
      '</div>' +
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
  let html = '<div class="cd-title"><span>Dyplomacja</span>' + phBadge + '</div>';

  if (list.length === 0) {
    html += '<div class="cd-empty">Brak znanych cywilizacji.</div>';
  } else {
    for (const rel of list) {
      html += renderRow(rel);
    }
  }

  rootEl.innerHTML = html;
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
