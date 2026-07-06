/**
 * perfTestPanel.ts — panel „Test wydajności" (Batch 7, pomysł Macieja 2026-07-05).
 *
 * Sekcje:
 *  1. Detekcja natychmiastowa (✅/⚠️/❌ + zdanie zalecenia PL) — bez benchmarku.
 *  2. Mikro-benchmark za przyciskiem „Uruchom test" (~10-15 s, pasek postępu, przerwanie):
 *     a) CPU 1 wątek: generujSwiatAsync(42,'malenki','kontynenty'),
 *     b) CPU wielowątkowo: 4 równoległe generacje (skala vs 1 wątek),
 *     c) GPU: offscreen Three.js (512×512, ~20k instancji Box, 60 klatek) — avg frame time.
 *     Każdy etap z timeoutem — bench nie może zawiesić panelu.
 *  3. Werdykty + „Kopiuj raport" (clipboard, fallback textarea).
 *  4. „Zastosuj zalecane" → preset (jakość / maks. rozmiar mapy / limit workerów) do hardwareProfile;
 *     kreator nowej gry czyta ten preset jako wartość startową.
 *
 * Styl spójny z mapLoadingOverlay.ts (te same tokeny brand).
 */
import * as THREE from 'three';
import { UI_PARAMS } from './uiParams';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';
import { brandIconSvg } from './icons/brandAssets';
import { generujSwiatAsync } from '../map/mapGenAsync';
import {
  buildRecommendedPreset,
  classifyHardware,
  classifyHardwareDetailed,
  detectHardware,
  loadHardwareProfile,
  qualityLabelPl,
  saveHardwareProfile,
  type HardwareBenchmark,
  type HardwareClass,
  type HardwareDetection,
  type HardwarePreset,
} from '../perf/hardwareProfile';

const STYLE_ID = 'civ-perftest-css';

export interface PerfTestPanelOptions {
  /** Stempel wersji builda (do raportu / zgłoszeń). */
  version?: string;
  /** Wołane po „Zastosuj zalecane" (np. odświeżenie wartości startowych kreatora). */
  onPresetApplied?: (preset: HardwarePreset) => void;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Style
// ---------------------------------------------------------------------------

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  ensureBrandRootTokens();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.civ-perftest-overlay{
  ${CIV_BRAND_SCOPE_VARS}
  position:fixed;inset:0;z-index:100650;
  background:rgba(8,12,18,.88);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--civ-font-ui,system-ui,sans-serif);
  color:var(--text-primary);
}
.civ-perftest-panel{
  width:min(560px,94vw);max-height:90vh;overflow-y:auto;
  padding:1.5rem 1.75rem;
  background:var(--bg-card);
  border:1px solid var(--border-mid);
  border-radius:var(--radius-lg);
  box-shadow:0 12px 48px rgba(0,0,0,.45);
}
.civ-perftest-title{
  font-family:var(--civ-font-title,serif);
  font-size:1.35rem;color:var(--text-gold);
  margin:0 0 .25rem;
}
.civ-perftest-sub{font-size:.8rem;color:var(--text-muted);margin:0 0 1rem;}
.civ-perftest-h3{
  font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;
  color:var(--text-gold);margin:1.1rem 0 .5rem;
  border-bottom:1px solid var(--border-subtle);padding-bottom:.25rem;
}
.civ-perftest-list{list-style:none;margin:0;padding:0;}
.civ-perftest-item{
  display:flex;gap:.55rem;align-items:flex-start;
  font-size:.9rem;line-height:1.35;padding:.28rem 0;
}
.civ-perftest-ico{flex:0 0 auto;width:1.2em;text-align:center;}
.civ-perftest-item b{color:var(--text-primary);font-weight:600;}
.civ-perftest-item .civ-perftest-tip{color:var(--text-muted);}
.civ-perftest-item.ok .civ-perftest-ico{color:var(--civ-success,#7ac47a);}
.civ-perftest-item.warn .civ-perftest-ico{color:#e8c05a;}
.civ-perftest-item.bad .civ-perftest-ico{color:#f08a7a;}
.civ-perftest-bar-wrap{
  height:8px;background:rgba(255,255,255,.08);border-radius:4px;
  overflow:hidden;margin:.6rem 0 .4rem;display:none;
}
.civ-perftest-bar{
  height:100%;width:0%;
  background:linear-gradient(90deg,var(--gold-dim),var(--gold));
  border-radius:4px;transition:width .25s ease-out;
}
.civ-perftest-bench-status{font-size:.82rem;color:var(--text-muted);min-height:1.3em;margin:.1rem 0 0;}
.civ-perftest-verdict{
  font-size:.9rem;color:var(--text-primary);margin:.4rem 0;
  padding:.6rem .75rem;background:rgba(255,255,255,.03);
  border:1px solid var(--border-subtle);border-radius:var(--radius);
}
.civ-perftest-verdict b{color:var(--text-gold);}
.civ-perftest-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1.1rem;}
.civ-perftest-btn{
  padding:.5rem 1.05rem;font:inherit;cursor:pointer;
  border-radius:var(--radius);border:1px solid var(--border-mid);
  background:transparent;color:var(--text-gold);
}
.civ-perftest-btn:hover:not(:disabled){background:var(--bg-sel);}
.civ-perftest-btn:disabled{opacity:.5;cursor:default;}
.civ-perftest-btn.primary{
  background:linear-gradient(180deg,var(--gold),var(--gold-dim));
  color:#241a06;border-color:var(--border-strong);font-weight:600;
}
.civ-perftest-btn.close{margin-left:auto;}
.civ-perftest-applied{font-size:.82rem;color:var(--civ-success,#7ac47a);margin:.5rem 0 0;min-height:1.2em;}
`;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Pomocnicze: pozycja raportu (ikona ✅/⚠️/❌ + tekst + zalecenie)
// ---------------------------------------------------------------------------

type Status = 'ok' | 'warn' | 'bad';
interface ReportRow {
  status: Status;
  label: string;
  tip: string;
}

const STATUS_ICON: Record<Status, string> = {
  ok: brandIconSvg('ui-check', 16),
  warn: brandIconSvg('chip-warning', 16),
  bad: brandIconSvg('ui-denied', 16),
};
const STATUS_CLASS: Record<Status, string> = { ok: 'ok', warn: 'warn', bad: 'bad' };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function detectionRows(det: HardwareDetection): ReportRow[] {
  const rows: ReportRow[] = [];

  // GPU / renderowanie programowe — najważniejszy alarm.
  if (det.softwareRendering) {
    rows.push({
      status: 'bad',
      label: `Renderowanie programowe (${det.gpuRenderer ?? 'brak nazwy GPU'})`,
      tip: 'Gra działa na procesorze zamiast karty graficznej — włącz akcelerację sprzętową: chrome://settings/system i zrestartuj przeglądarkę.',
    });
  } else if (det.integratedGpu) {
    rows.push({
      status: 'warn',
      label: `Karta zintegrowana: ${det.gpuRenderer ?? 'nieznana'}`,
      tip: 'W Windows: Ustawienia → System → Ekran → Grafika → przeglądarka → Wysoka wydajność (jeśli masz też kartę dedykowaną).',
    });
  } else {
    rows.push({
      status: 'ok',
      label: `GPU: ${det.gpuRenderer ?? 'wykryta'}`,
      tip: 'Karta graficzna rozpoznana — pełna moc renderu.',
    });
  }

  // WebGL2.
  rows.push(
    det.webgl2
      ? { status: 'ok', label: 'WebGL 2', tip: 'Nowoczesny render dostępny.' }
      : { status: 'bad', label: 'Brak WebGL 2', tip: 'Zaktualizuj przeglądarkę i sterowniki karty graficznej.' },
  );

  // WebGPU (informacyjnie).
  rows.push(
    det.webgpu
      ? { status: 'ok', label: 'WebGPU', tip: 'Dostępne — przyszłe wersje mogą z niego skorzystać.' }
      : { status: 'warn', label: 'Brak WebGPU', tip: 'Nie jest wymagane — gra działa na WebGL 2.' },
  );

  // maxTextureSize.
  if (det.maxTextureSize != null) {
    rows.push(
      det.maxTextureSize >= 8192
        ? { status: 'ok', label: `Maks. tekstura ${det.maxTextureSize}px`, tip: 'Duże mapy dekoracji obsłużone.' }
        : { status: 'warn', label: `Maks. tekstura ${det.maxTextureSize}px`, tip: 'Mała wartość — możliwe ograniczenia jakości.' },
    );
  }

  // CPU wątki.
  if (det.cpuThreads != null) {
    if (det.cpuThreads >= 12) {
      rows.push({ status: 'ok', label: `${det.cpuThreads} wątków CPU`, tip: 'Możesz generować nawet Super Huge.' });
    } else if (det.cpuThreads >= 6) {
      rows.push({ status: 'ok', label: `${det.cpuThreads} wątków CPU`, tip: 'Zalecany rozmiar mapy do Ogromny.' });
    } else {
      rows.push({
        status: 'warn',
        label: `${det.cpuThreads} wątki/wątków CPU`,
        tip: 'Zalecany rozmiar mapy: Standardowy. Super Huge będzie generować się kilka minut.',
      });
    }
  } else {
    rows.push({ status: 'warn', label: 'Liczba wątków CPU nieznana', tip: 'Przeglądarka nie udostępnia hardwareConcurrency.' });
  }

  // RAM.
  if (det.deviceMemoryGb != null) {
    rows.push(
      det.deviceMemoryGb >= 8
        ? { status: 'ok', label: `~${det.deviceMemoryGb} GB RAM`, tip: 'Pamięci wystarczy z zapasem.' }
        : det.deviceMemoryGb >= 4
          ? { status: 'warn', label: `~${det.deviceMemoryGb} GB RAM`, tip: 'Wystarczy dla mniejszych map.' }
          : { status: 'bad', label: `~${det.deviceMemoryGb} GB RAM`, tip: 'Mało pamięci — trzymaj się małych map i niskiej jakości.' },
    );
  } else {
    rows.push({ status: 'warn', label: 'RAM nieznany', tip: 'Przeglądarka nie udostępnia deviceMemory (przybliżenie niedostępne).' });
  }

  // Web Workery.
  rows.push(
    det.workersSupported
      ? { status: 'ok', label: 'Web Workery', tip: 'Generacja mapy w tle bez zacinania interfejsu.' }
      : { status: 'warn', label: 'Brak Web Workerów', tip: 'Generacja pójdzie w głównym wątku (interfejs może przymarzać).' },
  );

  // Ekran.
  rows.push({
    status: 'ok',
    label: `Ekran ${det.screenWidth}×${det.screenHeight}, DPR ${det.devicePixelRatio}`,
    tip: det.devicePixelRatio > 2 ? 'Wysokie DPR — przy słabym GPU rozważ niższą jakość.' : 'Standardowa gęstość pikseli.',
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Benchmark — narzędzia
// ---------------------------------------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(`Przekroczono limit czasu: ${label}`)), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

const nowMs = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

/** CPU 1 wątek — generacja „malenki". Zwraca ms. */
async function benchCpuSingle(signal: { aborted: boolean }): Promise<number> {
  const t0 = nowMs();
  await generujSwiatAsync(42, 'malenki', 'kontynenty');
  if (signal.aborted) throw new Error('Przerwano');
  return nowMs() - t0;
}

/** CPU wielowątkowo — 4 równoległe generacje. Zwraca ms całości. */
async function benchCpuParallel(signal: { aborted: boolean }): Promise<number> {
  const t0 = nowMs();
  await Promise.all([
    generujSwiatAsync(42, 'malenki', 'kontynenty'),
    generujSwiatAsync(43, 'malenki', 'kontynenty'),
    generujSwiatAsync(44, 'malenki', 'kontynenty'),
    generujSwiatAsync(45, 'malenki', 'kontynenty'),
  ]);
  if (signal.aborted) throw new Error('Przerwano');
  return nowMs() - t0;
}

/**
 * GPU — offscreen mini-scena: 512×512 canvas, ~20k instancji BoxGeometry, 60 klatek.
 * Zwraca średni frame time [ms]. Sam sprząta kontekst.
 */
async function benchGpu(signal: { aborted: boolean }): Promise<number> {
  const INSTANCES = 20000;
  const FRAMES = 60;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    throw new Error('Nie udało się utworzyć kontekstu WebGL: ' + (e instanceof Error ? e.message : String(e)));
  }
  renderer.setPixelRatio(1);
  renderer.setSize(512, 512, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.set(0, 0, 90);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040, 1));

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: 0x88aacc });
  const mesh = new THREE.InstancedMesh(geo, mat, INSTANCES);
  const dummy = new THREE.Object3D();
  const side = Math.ceil(Math.sqrt(INSTANCES));
  for (let i = 0; i < INSTANCES; i++) {
    const gx = (i % side) - side / 2;
    const gy = Math.floor(i / side) - side / 2;
    dummy.position.set(gx * 0.9, gy * 0.9, ((i * 13) % 7) - 3);
    dummy.rotation.set((i % 5) * 0.3, (i % 7) * 0.2, 0);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  const cleanup = () => {
    try {
      geo.dispose();
      mat.dispose();
      mesh.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
    } catch {
      /* ignore */
    }
    renderer = null;
  };

  try {
    // Rozgrzewka — 3 klatki poza pomiarem.
    for (let i = 0; i < 3; i++) {
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    const t0 = nowMs();
    for (let f = 0; f < FRAMES; f++) {
      if (signal.aborted) throw new Error('Przerwano');
      mesh.rotation.y += 0.02;
      mesh.rotation.x += 0.01;
      renderer.render(scene, camera);
      // co ~10 klatek oddaj wątek, żeby panel/abort mógł zadziałać.
      if (f % 10 === 9) await new Promise<void>((r) => window.setTimeout(r, 0));
    }
    // Wymuś zakończenie GPU przez odczyt 1 piksela.
    try {
      const gl = renderer.getContext();
      const px = new Uint8Array(4);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    } catch {
      /* readPixels może rzucić na niektórych sterownikach — pomiar i tak ważny */
    }
    const total = nowMs() - t0;
    return total / FRAMES;
  } finally {
    cleanup();
  }
}

// ---------------------------------------------------------------------------
// Werdykty benchmarku → wiersze raportu
// ---------------------------------------------------------------------------

function benchmarkRows(b: HardwareBenchmark): ReportRow[] {
  const rows: ReportRow[] = [];

  if (b.cpuSingleMs != null) {
    const ms = Math.round(b.cpuSingleMs);
    rows.push(
      b.cpuSingleMs <= 400
        ? { status: 'ok', label: `Generacja mapy (1 wątek): ${ms} ms`, tip: 'Szybki procesor — nawet duże mapy pójdą sprawnie.' }
        : b.cpuSingleMs <= 1200
          ? { status: 'ok', label: `Generacja mapy (1 wątek): ${ms} ms`, tip: 'Wydajność przyzwoita.' }
          : { status: 'warn', label: `Generacja mapy (1 wątek): ${ms} ms`, tip: 'Wolniejszy procesor — trzymaj się mniejszych map.' },
    );
  }

  if (b.cpuParallelSpeedup != null) {
    const sp = b.cpuParallelSpeedup.toFixed(1);
    rows.push(
      b.cpuParallelSpeedup >= 2.5
        ? { status: 'ok', label: `Skala wielowątkowa: ×${sp}`, tip: 'Rdzenie realnie przyspieszają generację.' }
        : b.cpuParallelSpeedup >= 1.5
          ? { status: 'warn', label: `Skala wielowątkowa: ×${sp}`, tip: 'Umiarkowany zysk z rdzeni (możliwy throttling).' }
          : { status: 'warn', label: `Skala wielowątkowa: ×${sp}`, tip: 'Słaby zysk z wielu rdzeni — nie licz na szybkie duże mapy.' },
    );
  }

  if (b.gpuFrameMs != null) {
    const fps = b.gpuFps != null ? Math.round(b.gpuFps) : Math.round(1000 / b.gpuFrameMs);
    rows.push(
      b.gpuFrameMs <= 8
        ? { status: 'ok', label: `GPU: ${b.gpuFrameMs.toFixed(1)} ms/klatkę (~${fps} FPS)`, tip: 'Wysoka jakość renderu w zasięgu.' }
        : b.gpuFrameMs <= 20
          ? { status: 'warn', label: `GPU: ${b.gpuFrameMs.toFixed(1)} ms/klatkę (~${fps} FPS)`, tip: 'Zalecana średnia jakość renderu.' }
          : { status: 'bad', label: `GPU: ${b.gpuFrameMs.toFixed(1)} ms/klatkę (~${fps} FPS)`, tip: 'Ustaw niską jakość i mniejsze mapy.' },
    );
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Tekstowy raport do schowka
// ---------------------------------------------------------------------------

function buildTextReport(
  det: HardwareDetection,
  bench: HardwareBenchmark | null,
  cls: HardwareClass,
  preset: HardwarePreset,
  version?: string,
): string {
  const L: string[] = [];
  L.push('=== TEST WYDAJNOŚCI — The Game (4X) ===');
  if (version) L.push(`Wersja builda: ${version}`);
  L.push(`Data: ${new Date().toISOString()}`);
  L.push(`Klasa sprzętu: ${cls}`);
  // 4b: pokaż, KTÓRY próg zdecydował o klasie (diagnostyka kalibracji dla zgłoszeń).
  const detail = classifyHardwareDetailed(det, bench);
  if (detail.decidedBy) {
    L.push(`Zdecydował: ${detail.decidedBy.label} → ${detail.decidedBy.cls} [${detail.decidedBy.from === 'benchmark' ? 'benchmark' : 'detekcja'}]`);
  }
  L.push('');
  L.push('-- Detekcja --');
  L.push(`GPU: ${det.gpuRenderer ?? 'nieznana'} (vendor: ${det.gpuVendor ?? 'nieznany'})`);
  L.push(`Software rendering: ${det.softwareRendering ? 'TAK (!)' : 'nie'}, GPU zintegrowane: ${det.integratedGpu ? 'tak' : 'nie'}`);
  L.push(`WebGL2: ${det.webgl2 ? 'tak' : 'NIE'}, WebGPU: ${det.webgpu ? 'tak' : 'nie'}, maxTexture: ${det.maxTextureSize ?? '?'}`);
  L.push(`CPU wątki: ${det.cpuThreads ?? '?'}, RAM: ${det.deviceMemoryGb != null ? det.deviceMemoryGb + ' GB' : '?'}`);
  L.push(`Ekran: ${det.screenWidth}×${det.screenHeight}, DPR ${det.devicePixelRatio}`);
  L.push(`Web Workery: ${det.workersSupported ? 'tak' : 'nie'}`);
  if (bench) {
    L.push('');
    L.push('-- Benchmark --');
    L.push(`CPU 1 wątek: ${bench.cpuSingleMs != null ? Math.round(bench.cpuSingleMs) + ' ms' : 'n/d'}`);
    L.push(`CPU 4 równolegle: ${bench.cpuParallelMs != null ? Math.round(bench.cpuParallelMs) + ' ms' : 'n/d'} (skala ×${bench.cpuParallelSpeedup?.toFixed(1) ?? 'n/d'})`);
    L.push(`GPU: ${bench.gpuFrameMs != null ? bench.gpuFrameMs.toFixed(1) + ' ms/klatkę (~' + (bench.gpuFps != null ? Math.round(bench.gpuFps) : '?') + ' FPS)' : 'n/d'}`);
  }
  L.push('');
  L.push('-- Zalecany preset --');
  L.push(`Jakość renderu: ${qualityLabelPl(preset.renderQuality)}`);
  L.push(`Maks. rozmiar mapy: ${preset.maxMapSizeLabel}`);
  L.push(`Limit workerów: ${preset.workerLimit}`);
  return L.join('\n');
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback poniżej */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

let activeRoot: HTMLElement | null = null;

export function showPerfTestPanel(opts: PerfTestPanelOptions = {}): void {
  if (activeRoot) return; // już otwarty
  const version = opts.version ?? UI_PARAMS.menu.wersja;
  ensureStyles();

  const det = detectHardware();
  const detRows = detectionRows(det);
  let bench: HardwareBenchmark | null = loadHardwareProfile()?.benchmark ?? null;

  const root = document.createElement('div');
  activeRoot = root;
  root.className = 'civ-perftest-overlay';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.innerHTML = `
    <div class="civ-perftest-panel">
      <h2 class="civ-perftest-title">Test wydajności</h2>
      <p class="civ-perftest-sub">Sprawdzenie sprzętu i przeglądarki${version ? ' · wersja ' + escapeHtml(version) : ''}</p>

      <div class="civ-perftest-h3">Wykryto natychmiast</div>
      <ul class="civ-perftest-list" id="civ-perftest-detlist"></ul>

      <div class="civ-perftest-h3">Benchmark (~10–15 s)</div>
      <div class="civ-perftest-bar-wrap" id="civ-perftest-barwrap"><div class="civ-perftest-bar" id="civ-perftest-bar"></div></div>
      <p class="civ-perftest-bench-status" id="civ-perftest-benchstatus">Kliknij „Uruchom test", aby zmierzyć CPU i GPU.</p>
      <ul class="civ-perftest-list" id="civ-perftest-benchlist"></ul>

      <div class="civ-perftest-verdict" id="civ-perftest-verdict"></div>
      <p class="civ-perftest-applied" id="civ-perftest-applied"></p>

      <div class="civ-perftest-actions">
        <button class="civ-perftest-btn primary" id="civ-perftest-run" type="button">Uruchom test</button>
        <button class="civ-perftest-btn" id="civ-perftest-apply" type="button">Zastosuj zalecane</button>
        <button class="civ-perftest-btn" id="civ-perftest-copy" type="button">Kopiuj raport</button>
        <button class="civ-perftest-btn close" id="civ-perftest-close" type="button">Zamknij</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  const detListEl = root.querySelector('#civ-perftest-detlist') as HTMLUListElement;
  const benchListEl = root.querySelector('#civ-perftest-benchlist') as HTMLUListElement;
  const barWrapEl = root.querySelector('#civ-perftest-barwrap') as HTMLDivElement;
  const barEl = root.querySelector('#civ-perftest-bar') as HTMLDivElement;
  const statusEl = root.querySelector('#civ-perftest-benchstatus') as HTMLParagraphElement;
  const verdictEl = root.querySelector('#civ-perftest-verdict') as HTMLDivElement;
  const appliedEl = root.querySelector('#civ-perftest-applied') as HTMLParagraphElement;
  const runBtn = root.querySelector('#civ-perftest-run') as HTMLButtonElement;
  const applyBtn = root.querySelector('#civ-perftest-apply') as HTMLButtonElement;
  const copyBtn = root.querySelector('#civ-perftest-copy') as HTMLButtonElement;
  const closeBtn = root.querySelector('#civ-perftest-close') as HTMLButtonElement;

  const renderRows = (el: HTMLUListElement, rows: ReportRow[]) => {
    el.innerHTML = rows
      .map(
        (r) =>
          `<li class="civ-perftest-item ${STATUS_CLASS[r.status]}"><span class="civ-perftest-ico">${STATUS_ICON[r.status]}</span><span><b>${escapeHtml(r.label)}</b> — <span class="civ-perftest-tip">${escapeHtml(r.tip)}</span></span></li>`,
      )
      .join('');
  };

  const currentClass = (): HardwareClass => classifyHardware(det, bench);
  const currentPreset = (): HardwarePreset => buildRecommendedPreset(currentClass());

  const refreshVerdict = () => {
    const cls = currentClass();
    const preset = currentPreset();
    const clsLabel = cls === 'MOCNY' ? 'MOCNY' : cls === 'SREDNI' ? 'ŚREDNI' : 'SŁABY';
    verdictEl.innerHTML =
      `Klasa sprzętu: <b>${clsLabel}</b>. Zalecane: jakość <b>${escapeHtml(qualityLabelPl(preset.renderQuality))}</b>, ` +
      `maks. rozmiar mapy <b>${escapeHtml(preset.maxMapSizeLabel)}</b>, limit workerów <b>${preset.workerLimit}</b>.`;
  };

  renderRows(detListEl, detRows);
  if (bench) renderRows(benchListEl, benchmarkRows(bench));
  refreshVerdict();

  // -- Benchmark run / abort --
  let running = false;
  const abortSignal = { aborted: false };

  const setProgress = (pct: number, msg: string) => {
    barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    statusEl.textContent = msg;
  };

  const runBench = async () => {
    if (running) {
      // drugi klik = przerwij
      abortSignal.aborted = true;
      statusEl.textContent = 'Przerywanie…';
      return;
    }
    running = true;
    abortSignal.aborted = false;
    runBtn.textContent = 'Przerwij';
    applyBtn.disabled = true;
    copyBtn.disabled = true;
    barWrapEl.style.display = 'block';
    benchListEl.innerHTML = '';
    appliedEl.textContent = '';

    const partial: HardwareBenchmark = {
      cpuSingleMs: null,
      cpuParallelMs: null,
      cpuParallelSpeedup: null,
      gpuFrameMs: null,
      gpuFps: null,
    };

    try {
      // Etap 1: CPU 1 wątek.
      setProgress(5, 'CPU (1 wątek): generacja mapy…');
      const singleMs = await withTimeout(benchCpuSingle(abortSignal), 20000, 'CPU 1 wątek');
      partial.cpuSingleMs = singleMs;
      if (abortSignal.aborted) throw new Error('Przerwano');
      setProgress(35, `CPU (1 wątek): ${Math.round(singleMs)} ms`);

      // Etap 2: CPU 4 równolegle.
      setProgress(40, 'CPU (4 równolegle)…');
      const parallelMs = await withTimeout(benchCpuParallel(abortSignal), 40000, 'CPU wielowątkowo');
      partial.cpuParallelMs = parallelMs;
      if (abortSignal.aborted) throw new Error('Przerwano');
      if (parallelMs > 0) partial.cpuParallelSpeedup = (singleMs * 4) / parallelMs;
      setProgress(65, `CPU (4 równolegle): ${Math.round(parallelMs)} ms`);

      // Etap 3: GPU.
      setProgress(70, 'GPU: mini-scena 3D…');
      const frameMs = await withTimeout(benchGpu(abortSignal), 15000, 'GPU');
      partial.gpuFrameMs = frameMs;
      if (frameMs > 0) partial.gpuFps = 1000 / frameMs;
      setProgress(100, 'Gotowe.');

      bench = partial;
      saveHardwareProfile(det, bench, null);
      renderRows(benchListEl, benchmarkRows(bench));
      refreshVerdict();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Zachowaj to, co zdążyliśmy zmierzyć.
      const hasAny = partial.cpuSingleMs != null || partial.gpuFrameMs != null;
      if (hasAny) {
        bench = partial;
        renderRows(benchListEl, benchmarkRows(bench));
        refreshVerdict();
      }
      statusEl.textContent = abortSignal.aborted ? 'Test przerwany. Wyniki cząstkowe zachowane.' : `Test nieukończony: ${msg}`;
    } finally {
      running = false;
      runBtn.textContent = 'Uruchom ponownie';
      applyBtn.disabled = false;
      copyBtn.disabled = false;
    }
  };

  runBtn.addEventListener('click', () => void runBench());

  applyBtn.addEventListener('click', () => {
    const preset = currentPreset();
    saveHardwareProfile(det, bench, preset);
    appliedEl.textContent = `Zapisano: jakość ${qualityLabelPl(preset.renderQuality)}, maks. mapa ${preset.maxMapSizeLabel}, workery ${preset.workerLimit}. Wejdzie w życie w kreatorze nowej gry.`;
    opts.onPresetApplied?.(preset);
  });

  copyBtn.addEventListener('click', () => {
    const text = buildTextReport(det, bench, currentClass(), currentPreset(), version);
    void copyToClipboard(text).then((ok) => {
      appliedEl.textContent = ok ? 'Raport skopiowany do schowka.' : 'Nie udało się skopiować — zaznacz i skopiuj ręcznie.';
    });
  });

  const close = () => {
    abortSignal.aborted = true;
    root.remove();
    activeRoot = null;
    opts.onClose?.();
  };
  closeBtn.addEventListener('click', close);
  root.addEventListener('click', (e) => {
    if (e.target === root && !running) close();
  });
}

export function isPerfTestPanelOpen(): boolean {
  return activeRoot !== null;
}
