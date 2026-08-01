/**
 * perfReport.ts — trwały raport czasów mapy: auto-download, localStorage, chip HUD (FALA 159).
 */
import { CIV_BUILD_STAMP } from '../buildInfo';
import type { MapGenPhaseTimings } from '../map/mapGenProgress';
import { MAP_GEN_PHASE_LABELS } from '../map/mapGenProgress';
import { getRiverGenEnabled } from '../map/riverGenSwitch';
import type { SceneBuildTimings } from '../render/scene';

export const PERF_REPORT_STORAGE_KEY = 'civ-last-perf-report';
export const PERF_REPORT_FILENAME_KEY = 'civ-last-perf-filename';

const CHIP_ID = 'civ-perf-chip';
const MODAL_ID = 'civ-perf-modal';
const STYLE_ID = 'civ-perf-hud-css';

/** Jedna linia podziału post-scene (FALA 163 — 9 podkroków doStartGame). */
export interface PostSceneStepMs {
  label: string;
  ms: number;
}

export interface PerfReportPersistOptions {
  mapGen?: MapGenPhaseTimings;
  scene?: SceneBuildTimings;
  rozmiarLabel?: string;
  ksztaltLabel?: string;
  typLabel?: string;
  error?: string;
  /** Czas przekazania mapy z workera (structured clone) ponad sumę faz mapGen — ms. */
  mapGenHandoffMs?: number;
  /** Wszystko między końcem buildScene a hide overlay (init gry, renderery, mgła…) — ms. */
  postSceneMs?: number;
  /** Podkroki post-scene (ms każdego z 9) — wskazuje winowajcę bez F12. */
  postSceneSteps?: PostSceneStepMs[];
  /** Wall-clock od showMapLoadingOverlay do hide — ms. */
  wallClockMs?: number;
}

function emptySceneTimings(): SceneBuildTimings {
  return {
    hexes: 0, coast: 0, overlays: 0, rivers: 0, tail: 0, total: 0,
    hexCount: 0, overlayTotal: 0, riverStage: 0,
  };
}

function slugLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'nieznany';
}

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function buildPerfReportFilename(opts: PerfReportPersistOptions): string {
  const roz = slugLabel(opts.rozmiarLabel ?? 'mapa');
  const ksz = slugLabel(opts.ksztaltLabel ?? opts.typLabel ?? 'swiat');
  return `civ-perf-${roz}-${ksz}-${formatTimestamp()}.txt`;
}

export function buildPerfReportText(opts: PerfReportPersistOptions): string {
  const s = opts.scene ?? emptySceneTimings();
  const gen = opts.mapGen;
  const lines: string[] = [];

  lines.push('=== Civ — raport czasów ładowania mapy ===');
  lines.push(`Data: ${new Date().toLocaleString('pl-PL')}`);

  const metaParts: string[] = [];
  if (opts.rozmiarLabel) metaParts.push(`rozmiar: ${opts.rozmiarLabel}`);
  const ksztalt = opts.ksztaltLabel ?? opts.typLabel;
  if (ksztalt) metaParts.push(`kształt: ${ksztalt}`);
  if (metaParts.length) lines.push(metaParts.join(' · '));
  if (s.hexCount > 0) {
    lines.push(`${s.hexCount} heksów · nakładek ${s.overlayTotal}`);
  }

  if (opts.error) {
    lines.push('');
    lines.push(`BŁĄD buildScene: ${opts.error}`);
  }

  lines.push('');
  lines.push('GENERATOR (ms):');
  if (!getRiverGenEnabled()) {
    lines.push('  Rzeki (gen): WYŁĄCZONE');
  }
  if (gen) {
    for (const [k, label] of Object.entries(MAP_GEN_PHASE_LABELS) as [keyof MapGenPhaseTimings, string][]) {
      if (k !== 'total') lines.push(`  ${label}: ${gen[k]} ms`);
    }
    lines.push(`  RAZEM: ${gen.total} ms`);
  } else {
    lines.push('  (brak danych)');
  }

  lines.push('');
  lines.push('SCENA (ms):');
  lines.push(`  Heksy: ${s.hexes} ms`);
  lines.push(`  Brzeg: ${s.coast} ms`);
  lines.push(`  Nakładki: ${s.overlays} ms`);
  lines.push(`  Rzeki: ${s.rivers} ms`);
  lines.push(`  Finał: ${s.tail} ms`);
  lines.push(`  RAZEM: ${s.total} ms`);

  const d = s.detail;
  if (d) {
    const h = d.heksy;
    lines.push('');
    lines.push('Heksy — podetapy (ms):');
    lines.push(`  alokacja=${h.alokacja} pryzmy=${h.pryzmy} relief=${h.instancjeReliefu}`);
    lines.push(`  styled=${h.styledWPetli} brzeg=${h.brzegWPetli} pustynia=${h.pustynia} fin=${h.finalizacja}`);
    const n = d.nakladki;
    lines.push('');
    lines.push('Nakładki — podetapy (ms):');
    lines.push(`  scalMerge=${n.scalMerge} instancje=${n.instancjePlazaWydmy}`);
  }

  lines.push('');
  lines.push(`RAZEM (generator + scena): ${(gen?.total ?? 0) + s.total} ms`);

  const handoff = opts.mapGenHandoffMs ?? 0;
  const postScene = opts.postSceneMs ?? 0;
  const wall = opts.wallClockMs ?? 0;
  if (handoff > 0 || postScene > 0 || wall > 0) {
    lines.push('');
    lines.push('PO SCENIE / CAŁOŚĆ (ms):');
    if (handoff > 0) lines.push(`  Przekazanie z workera (ponad fazy gen): ${handoff} ms`);
    if (postScene > 0) lines.push(`  Po scenie / finishLoading: ${postScene} ms`);
    if (wall > 0) lines.push(`  WALL-CLOCK (Nowa gra → hide overlay): ${wall} ms`);
    const measured = (gen?.total ?? 0) + s.total + handoff + postScene;
    if (wall > 0 && wall > measured + 50) {
      lines.push(`  Niemierzone (wall − suma faz): ${wall - measured} ms`);
    }
  }

  const steps = opts.postSceneSteps;
  if (steps?.length) {
    lines.push('');
    lines.push('POST-SCENE — podkroki (ms):');
    for (const st of steps) {
      lines.push(`  ${st.label}: ${st.ms} ms`);
    }
    const sumSteps = steps.reduce((a, st) => a + st.ms, 0);
    lines.push(`  RAZEM podkroki: ${sumSteps} ms`);
  }

  lines.push('');
  lines.push(`Stempel builda: ${CIV_BUILD_STAMP}`);

  return lines.join('\n');
}

export function downloadTextFile(text: string, filename: string): void {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 200);
  } catch (err) {
    console.warn('[civ-perf] download failed', err);
  }
}

export function persistPerfReport(opts: PerfReportPersistOptions): { text: string; filename: string } {
  const text = buildPerfReportText(opts);
  const filename = buildPerfReportFilename(opts);
  try {
    localStorage.setItem(PERF_REPORT_STORAGE_KEY, text);
    localStorage.setItem(PERF_REPORT_FILENAME_KEY, filename);
  } catch (err) {
    console.warn('[civ-perf] localStorage failed', err);
  }
  downloadTextFile(text, filename);
  ensurePerfReportChip();
  return { text, filename };
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.civ-perf-chip{
  position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));
  z-index:2500000;padding:6px 12px;
  font:11px/1.3 system-ui,sans-serif;
  color:#f5c542;background:rgba(12,14,18,.88);
  border:1px solid #f5c542;border-radius:16px;
  cursor:pointer;pointer-events:auto;
  box-shadow:0 2px 10px rgba(0,0,0,.35);
}
.civ-perf-chip:hover{background:rgba(24,28,36,.95);}
.civ-perf-modal-backdrop{
  position:fixed;inset:0;z-index:2600000;
  background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;
  padding:16px;box-sizing:border-box;
}
.civ-perf-modal{
  max-width:min(560px,96vw);max-height:min(80vh,640px);
  background:#111;color:#eee;border:2px solid #f5c542;border-radius:8px;
  display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.5);
}
.civ-perf-modal-head{
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:10px 12px;border-bottom:1px solid #333;
  font:600 13px/1.3 system-ui,sans-serif;color:#f5c542;
}
.civ-perf-modal-close{
  background:transparent;border:1px solid #555;color:#ccc;
  border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:16px;line-height:1;
}
.civ-perf-modal-close:hover{border-color:#f5c542;color:#f5c542;}
.civ-perf-modal-body{
  flex:1;overflow:auto;padding:12px;
  font:11px/1.45 monospace;white-space:pre-wrap;word-break:break-word;
  user-select:text;
}
.civ-perf-modal-foot{
  display:flex;gap:8px;padding:10px 12px;border-top:1px solid #333;
}
.civ-perf-modal-btn{
  padding:6px 14px;font:12px system-ui,sans-serif;
  border:1px solid #f5c542;border-radius:4px;
  background:#222;color:#f5c542;cursor:pointer;
}
.civ-perf-modal-btn:hover{background:#2a2a2a;}
`;
  document.head.appendChild(style);
}

function closePerfReportModal(): void {
  document.getElementById(MODAL_ID)?.remove();
}

export function showPerfReportModal(text?: string): void {
  const body = text ?? localStorage.getItem(PERF_REPORT_STORAGE_KEY) ?? '';
  if (!body.trim()) return;
  ensureStyles();
  closePerfReportModal();

  const backdrop = document.createElement('div');
  backdrop.id = MODAL_ID;
  backdrop.className = 'civ-perf-modal-backdrop';
  backdrop.innerHTML = `
    <div class="civ-perf-modal" role="dialog" aria-label="Czasy ostatniej mapy">
      <div class="civ-perf-modal-head">
        <span>Czasy ostatniej mapy</span>
        <button type="button" class="civ-perf-modal-close" aria-label="Zamknij">×</button>
      </div>
      <pre class="civ-perf-modal-body"></pre>
      <div class="civ-perf-modal-foot">
        <button type="button" class="civ-perf-modal-btn" data-action="download">Pobierz ponownie</button>
        <button type="button" class="civ-perf-modal-btn" data-action="close">Zamknij</button>
      </div>
    </div>`;

  const pre = backdrop.querySelector('.civ-perf-modal-body') as HTMLPreElement;
  pre.textContent = body;

  backdrop.querySelector('.civ-perf-modal-close')?.addEventListener('click', closePerfReportModal);
  backdrop.querySelector('[data-action="close"]')?.addEventListener('click', closePerfReportModal);
  backdrop.querySelector('[data-action="download"]')?.addEventListener('click', () => {
    const fn = localStorage.getItem(PERF_REPORT_FILENAME_KEY)
      ?? `civ-perf-raport-${formatTimestamp()}.txt`;
    downloadTextFile(body, fn);
  });
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) closePerfReportModal();
  });

  document.documentElement.appendChild(backdrop);
}

/** Chip lewy dolny — widoczny gdy jest zapisany raport w localStorage. */
export function ensurePerfReportChip(): void {
  const text = localStorage.getItem(PERF_REPORT_STORAGE_KEY);
  if (!text?.trim()) return;
  ensureStyles();

  let chip = document.getElementById(CHIP_ID) as HTMLButtonElement | null;
  if (!chip) {
    chip = document.createElement('button');
    chip.id = CHIP_ID;
    chip.type = 'button';
    chip.className = 'civ-perf-chip';
    chip.textContent = 'Czasy ostatniej mapy';
    chip.title = 'Pokaż raport czasów ładowania mapy';
    chip.addEventListener('click', () => showPerfReportModal());
    document.documentElement.appendChild(chip);
  }
  chip.style.display = '';
}
