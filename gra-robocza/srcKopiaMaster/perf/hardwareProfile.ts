/**
 * hardwareProfile.ts — POJEDYNCZE ŹRÓDŁO PRAWDY o sprzęcie/przeglądarce gracza.
 *
 * Batch 7 (DYSPOZYCJA-TEST-WYDAJNOSCI-GRACZA-2026-07-05):
 *  - natychmiastowa detekcja (bez benchmarku): CPU/RAM/GPU/WebGL/WebGPU/software-rendering,
 *  - `recommendedWorkerLimit()` = min(max(1, hardwareConcurrency-2), 4), fallback 1 bez workerów,
 *  - klasyfikacja MOCNY/ŚREDNI/SŁABY wg progów w JEDNEJ stałej (łatwe strojenie),
 *  - zapis/odczyt profilu + wybranego presetu w localStorage (klucz `civ-hw-profile-v1`).
 *
 * ZASADA STAŁA (master-plan): nigdzie nie zakładać 16 wątków — pule czytają limit STĄD.
 * Zero kosztu, gdy gracz nie odpali testu (detekcja lekka; benchmark osobno w perfTestPanel).
 */

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------

export type HardwareClass = 'MOCNY' | 'SREDNI' | 'SLABY';

/** Jakość renderu — spójna z QualityTier w newGameMapDefaults ('low' | 'medium' | 'high'). */
export type RenderQualityTier = 'low' | 'medium' | 'high';

/** Wynik natychmiastowej detekcji (bez benchmarku). */
export interface HardwareDetection {
  /** navigator.hardwareConcurrency (liczba wątków logicznych) lub null. */
  cpuThreads: number | null;
  /** navigator.deviceMemory (GB, przybliżenie) lub null. */
  deviceMemoryGb: number | null;
  webgl2: boolean;
  webgpu: boolean;
  /** UNMASKED_RENDERER (WEBGL_debug_renderer_info) — nazwa GPU lub null. */
  gpuRenderer: string | null;
  gpuVendor: string | null;
  maxTextureSize: number | null;
  devicePixelRatio: number;
  screenWidth: number;
  screenHeight: number;
  /** Renderer wygląda na software (SwiftShader/Software/Basic Render/llvmpipe). */
  softwareRendering: boolean;
  /** GPU wygląda na zintegrowane (Intel HD/UHD/Iris, AMD Radeon Vega iGPU, Apple). */
  integratedGpu: boolean;
  /** Web Workery w ogóle wspierane (typeof Worker !== 'undefined'). */
  workersSupported: boolean;
}

/** Wynik mikro-benchmarku (opcjonalny — panel zapisuje po „Uruchom test"). */
export interface HardwareBenchmark {
  /** Czas generacji „malenki" 1 wątek [ms]. */
  cpuSingleMs: number | null;
  /** Czas 4 równoległych generacji [ms]. */
  cpuParallelMs: number | null;
  /** Skala przyspieszenia (cpuSingle*4 / cpuParallel) — >1 = korzyść z wielowątkowości. */
  cpuParallelSpeedup: number | null;
  /** Średni frame time mini-sceny GPU [ms]. */
  gpuFrameMs: number | null;
  /** Szacowany FPS z gpuFrameMs. */
  gpuFps: number | null;
}

/** Preset zastosowany przez gracza („Zastosuj zalecane"). */
export interface HardwarePreset {
  renderQuality: RenderQualityTier;
  /** Zalecany MAKS. rozmiar mapy (etykieta menu PL, np. „Standardowy"). */
  maxMapSizeLabel: string;
  /** Limit workerów dla pul (generacja, w przyszłości AI/pathfinding/szum). */
  workerLimit: number;
  /** Wynikowa klasa sprzętu, dla której preset policzono. */
  hardwareClass: HardwareClass;
}

/** Zapisany w localStorage rekord profilu. */
export interface StoredHardwareProfile {
  v: 1;
  savedAt: number;
  detection: HardwareDetection;
  benchmark: HardwareBenchmark | null;
  preset: HardwarePreset | null;
  hardwareClass: HardwareClass;
}

// ---------------------------------------------------------------------------
// Progi klasyfikacji — JEDNO MIEJSCE (łatwe strojenie, zasada z dyspozycji)
// ---------------------------------------------------------------------------

/**
 * Progi decydujące o klasie sprzętu. Trzymane razem, żeby strojenie było proste.
 * Klasa końcowa = MIN z klas cząstkowych (najsłabsze ogniwo decyduje).
 */
export const HW_THRESHOLDS = {
  cpu: {
    /** >= tylu wątków → MOCNY; >= sredni → ŚREDNI; poniżej → SŁABY. */
    strongThreads: 12,
    mediumThreads: 6,
  },
  ram: {
    strongGb: 8,
    mediumGb: 4,
  },
  /**
   * GPU: benchmark frame time [ms] mini-sceny (im mniej tym lepiej).
   * KALIBRACJA 4b (RTX5070 = 0.1 ms/klatkę → MOCNY): MOCNY ≤ 4 ms, SŁABY ≥ 12 ms.
   */
  gpuFrameMs: {
    strongMax: 4, // ~250+ FPS mini-sceny → MOCNY (0.1 ms RTX mieści się z zapasem)
    mediumMax: 12, // ≥ 12 ms → SŁABY (~<85 FPS mini-sceny)
  },
  /**
   * CPU: czas generacji „malenki" 1 wątek [ms] (im mniej tym lepiej).
   * KALIBRACJA 4b (RTX5070+16w: 614-620 ms MUSI być MOCNY): MOCNY ≤ 900 ms, SŁABY ≥ 2500 ms.
   * (Stare 400/1200 dawały 614 ms → ŚREDNI i psuły klasę całości przez minClass.)
   */
  cpuSingleMs: {
    strongMax: 900,
    mediumMax: 2500,
  },
} as const;

/**
 * Zalecany MAKS. rozmiar mapy per klasa (etykiety menu PL z kreatora).
 * Muszą pokrywać się z ROZMIAR_MENU_LABELS w src/map/generator.ts:
 * Malenki · Mały · Standardowy · Duży · Ogromny · Super Huge.
 */
export const RECOMMENDED_MAX_MAP_SIZE: Record<HardwareClass, string> = {
  MOCNY: 'Super Huge',
  SREDNI: 'Ogromny',
  SLABY: 'Standardowy',
};

/** Zalecana jakość renderu per klasa. */
export const RECOMMENDED_QUALITY: Record<HardwareClass, RenderQualityTier> = {
  MOCNY: 'high',
  SREDNI: 'medium',
  SLABY: 'low',
};

const STORAGE_KEY = 'civ-hw-profile-v1';

// ---------------------------------------------------------------------------
// Limit workerów — sedno zasady „nie zakładać 16 wątków"
// ---------------------------------------------------------------------------

/**
 * Zalecany limit workerów dla WSZYSTKICH pul w grze.
 * = min(max(1, hardwareConcurrency - 2), 4); fallback 1 gdy brak wsparcia workerów.
 */
export function recommendedWorkerLimit(): number {
  if (typeof Worker === 'undefined') return 1;
  const hc = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  const threads = typeof hc === 'number' && Number.isFinite(hc) && hc > 0 ? hc : 2;
  return Math.min(Math.max(1, threads - 2), 4);
}

// ---------------------------------------------------------------------------
// Detekcja natychmiastowa
// ---------------------------------------------------------------------------

const SOFTWARE_RENDERER_MARKERS = ['swiftshader', 'software', 'basic render', 'llvmpipe', 'microsoft basic'];
const INTEGRATED_GPU_MARKERS = ['intel', 'iris', 'uhd graphics', 'hd graphics', 'apple', 'vega', 'radeon graphics', 'radeon(tm) graphics'];

function looksLikeSoftwareRenderer(renderer: string | null): boolean {
  if (!renderer) return false;
  const r = renderer.toLowerCase();
  return SOFTWARE_RENDERER_MARKERS.some((m) => r.includes(m));
}

function looksLikeIntegratedGpu(renderer: string | null): boolean {
  if (!renderer) return false;
  const r = renderer.toLowerCase();
  // NVIDIA / dedykowane AMD RX/Radeon Pro nie są zintegrowane.
  if (r.includes('nvidia') || r.includes('geforce') || r.includes('rtx') || r.includes('gtx')) return false;
  if (r.includes('radeon rx') || r.includes('radeon pro')) return false;
  return INTEGRATED_GPU_MARKERS.some((m) => r.includes(m));
}

interface WebglInfo {
  webgl2: boolean;
  renderer: string | null;
  vendor: string | null;
  maxTextureSize: number | null;
}

function probeWebgl(): WebglInfo {
  const info: WebglInfo = { webgl2: false, renderer: null, vendor: null, maxTextureSize: null };
  if (typeof document === 'undefined') return info;
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    const gl: WebGLRenderingContext | WebGL2RenderingContext | null =
      gl2 ?? canvas.getContext('webgl') ?? (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    info.webgl2 = gl2 !== null;
    if (!gl) return info;
    try {
      const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number | null;
      if (typeof maxTex === 'number') info.maxTextureSize = maxTex;
    } catch {
      /* niektóre konteksty rzucają na getParameter */
    }
    try {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const r = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string | null;
        const v = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) as string | null;
        info.renderer = typeof r === 'string' ? r : null;
        info.vendor = typeof v === 'string' ? v : null;
      }
    } catch {
      /* rozszerzenie zablokowane (np. hardened Firefox) */
    }
    // Zwolnij kontekst, żeby nie zajmować slotu GPU.
    try {
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    } catch {
      /* ignore */
    }
  } catch {
    /* brak WebGL w środowisku */
  }
  return info;
}

function detectWebgpu(): boolean {
  try {
    return typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as { gpu?: unknown }).gpu != null;
  } catch {
    return false;
  }
}

/** Lekka, synchroniczna detekcja — bezpieczna do wołania wielokrotnie. */
export function detectHardware(): HardwareDetection {
  const gl = probeWebgl();
  const hc = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined;
  const dm = typeof navigator !== 'undefined' ? (navigator as { deviceMemory?: number }).deviceMemory : undefined;
  const dpr = typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : 1;
  const sw = typeof window !== 'undefined' && window.screen ? window.screen.width : 0;
  const sh = typeof window !== 'undefined' && window.screen ? window.screen.height : 0;

  return {
    cpuThreads: typeof hc === 'number' && Number.isFinite(hc) && hc > 0 ? hc : null,
    deviceMemoryGb: typeof dm === 'number' && Number.isFinite(dm) && dm > 0 ? dm : null,
    webgl2: gl.webgl2,
    webgpu: detectWebgpu(),
    gpuRenderer: gl.renderer,
    gpuVendor: gl.vendor,
    maxTextureSize: gl.maxTextureSize,
    devicePixelRatio: dpr,
    screenWidth: sw,
    screenHeight: sh,
    softwareRendering: looksLikeSoftwareRenderer(gl.renderer),
    integratedGpu: looksLikeIntegratedGpu(gl.renderer),
    workersSupported: typeof Worker !== 'undefined',
  };
}

// ---------------------------------------------------------------------------
// Klasyfikacja
// ---------------------------------------------------------------------------

const CLASS_RANK: Record<HardwareClass, number> = { SLABY: 0, SREDNI: 1, MOCNY: 2 };
const RANK_CLASS: readonly HardwareClass[] = ['SLABY', 'SREDNI', 'MOCNY'];

function minClass(a: HardwareClass, b: HardwareClass): HardwareClass {
  return CLASS_RANK[a] <= CLASS_RANK[b] ? a : b;
}

function classFromThreshold(value: number, strongMaxOrMin: number, mediumMaxOrMin: number, lowerIsBetter: boolean): HardwareClass {
  if (lowerIsBetter) {
    if (value <= strongMaxOrMin) return 'MOCNY';
    if (value <= mediumMaxOrMin) return 'SREDNI';
    return 'SLABY';
  }
  if (value >= strongMaxOrMin) return 'MOCNY';
  if (value >= mediumMaxOrMin) return 'SREDNI';
  return 'SLABY';
}

/** Nazwane ogniwo klasyfikacji — do raportu „który próg zdecydował" (sekcja 4b). */
export interface HardwareClassPart {
  /** Etykieta PL sygnału. */
  label: string;
  cls: HardwareClass;
  /** Skąd sygnał: detekcja (natychmiast) czy benchmark. */
  from: 'detection' | 'benchmark';
}

export interface HardwareClassResult {
  cls: HardwareClass;
  /** Ogniwo, które ostatecznie ZDECYDOWAŁO o klasie (najsłabsze branane pod uwagę). */
  decidedBy: HardwareClassPart | null;
  parts: HardwareClassPart[];
}

function minPart(parts: HardwareClassPart[]): HardwareClassPart | null {
  let best: HardwareClassPart | null = null;
  for (const p of parts) {
    if (!best || CLASS_RANK[p.cls] < CLASS_RANK[best.cls]) best = p;
  }
  return best;
}

/**
 * Szczegółowa klasyfikacja: najsłabsze ogniwo + KTÓRY próg zdecydował + zasada podłogi detekcji.
 *
 * KALIBRACJA 4b:
 *  - software-rendering = twardy SŁABY (nadrzędne),
 *  - benchmark NIE może obniżyć klasy PONIŻEJ detekcji „bez wyraźnego powodu": tylko twarde
 *    SŁABY z benchmarku (GPU ≥ mediumMax lub CPU1w ≥ mediumMax) może zejść niżej niż detekcja;
 *    benchmark lądujący na ŚREDNI (np. chwilowy throttle) NIE ściąga MOCNEJ detekcji w dół
 *    (to był defekt: 614 ms → ŚREDNI psuł MOCNY zestaw). decidedBy pokazuje realny powód.
 */
export function classifyHardwareDetailed(det: HardwareDetection, bench?: HardwareBenchmark | null): HardwareClassResult {
  if (det.softwareRendering) {
    const p: HardwareClassPart = { label: 'Renderowanie programowe (software)', cls: 'SLABY', from: 'detection' };
    return { cls: 'SLABY', decidedBy: p, parts: [p] };
  }

  const detParts: HardwareClassPart[] = [];
  const benchParts: HardwareClassPart[] = [];

  if (det.cpuThreads != null) {
    detParts.push({
      label: `CPU ${det.cpuThreads} wątków (próg MOCNY ≥ ${HW_THRESHOLDS.cpu.strongThreads})`,
      cls: classFromThreshold(det.cpuThreads, HW_THRESHOLDS.cpu.strongThreads, HW_THRESHOLDS.cpu.mediumThreads, false),
      from: 'detection',
    });
  }
  if (det.deviceMemoryGb != null) {
    detParts.push({
      label: `RAM ${det.deviceMemoryGb} GB (próg MOCNY ≥ ${HW_THRESHOLDS.ram.strongGb})`,
      cls: classFromThreshold(det.deviceMemoryGb, HW_THRESHOLDS.ram.strongGb, HW_THRESHOLDS.ram.mediumGb, false),
      from: 'detection',
    });
  }
  // Zintegrowane GPU degraduje najwyżej do ŚREDNI (o ile brak twardego benchmarku GPU).
  if (det.integratedGpu && (!bench || bench.gpuFrameMs == null)) {
    detParts.push({ label: 'GPU zintegrowane (bez benchmarku GPU)', cls: 'SREDNI', from: 'detection' });
  }

  if (bench) {
    if (bench.gpuFrameMs != null) {
      benchParts.push({
        label: `GPU ${bench.gpuFrameMs.toFixed(1)} ms/klatkę (próg MOCNY ≤ ${HW_THRESHOLDS.gpuFrameMs.strongMax}, SŁABY ≥ ${HW_THRESHOLDS.gpuFrameMs.mediumMax})`,
        cls: classFromThreshold(bench.gpuFrameMs, HW_THRESHOLDS.gpuFrameMs.strongMax, HW_THRESHOLDS.gpuFrameMs.mediumMax, true),
        from: 'benchmark',
      });
    }
    if (bench.cpuSingleMs != null) {
      benchParts.push({
        label: `CPU 1 wątek ${Math.round(bench.cpuSingleMs)} ms (próg MOCNY ≤ ${HW_THRESHOLDS.cpuSingleMs.strongMax}, SŁABY ≥ ${HW_THRESHOLDS.cpuSingleMs.mediumMax})`,
        cls: classFromThreshold(bench.cpuSingleMs, HW_THRESHOLDS.cpuSingleMs.strongMax, HW_THRESHOLDS.cpuSingleMs.mediumMax, true),
        from: 'benchmark',
      });
    }
  }

  const allParts = [...detParts, ...benchParts];
  if (allParts.length === 0) {
    return { cls: 'SREDNI', decidedBy: null, parts: [] };
  }

  const detWeakest = minPart(detParts);
  const benchWeakest = minPart(benchParts);
  const detCls = detWeakest?.cls ?? 'MOCNY';

  // Kandydaci na „decydenta": zawsze detekcja; z benchmarku tylko gdy NIE ściąga poniżej detekcji
  // bez twardego powodu (twardy = benchmark SŁABY). To realizuje zasadę „nie niżej niż detekcja".
  const considered: HardwareClassPart[] = [...detParts];
  for (const bp of benchParts) {
    const hardWeak = bp.cls === 'SLABY';
    if (CLASS_RANK[bp.cls] >= CLASS_RANK[detCls] || hardWeak) {
      considered.push(bp);
    }
    // benchmark ŚREDNI przy detekcji MOCNEJ → pomijamy jako „decydenta" (guard 4b), ale zostaje w parts.
  }
  void benchWeakest;

  const decidedBy = minPart(considered) ?? detWeakest ?? minPart(allParts);
  return { cls: decidedBy?.cls ?? 'SREDNI', decidedBy, parts: allParts };
}

/**
 * Klasa sprzętu z detekcji (+ opcjonalnego benchmarku) — wrapper zgodny wstecznie.
 * Bierze najsłabsze BRANE POD UWAGĘ ogniwo (z zasadą podłogi detekcji z 4b).
 * Software-rendering = zawsze SŁABY.
 */
export function classifyHardware(det: HardwareDetection, bench?: HardwareBenchmark | null): HardwareClass {
  return classifyHardwareDetailed(det, bench).cls;
}

/** Numeryczna ranga klasy (SŁABY=0…MOCNY=2) — do porównań/sortowania. */
export function hardwareClassRank(cls: HardwareClass): number {
  return CLASS_RANK[cls];
}

export function hardwareClassFromRank(rank: number): HardwareClass {
  const clamped = Math.min(RANK_CLASS.length - 1, Math.max(0, Math.round(rank)));
  return RANK_CLASS[clamped] ?? 'SREDNI';
}

// ---------------------------------------------------------------------------
// Preset zalecany
// ---------------------------------------------------------------------------

/** Etykieta PL jakości renderu (spójna z QUALITY_MENU_LABELS w newGameMapDefaults). */
export function qualityLabelPl(tier: RenderQualityTier): string {
  if (tier === 'low') return 'Niska';
  if (tier === 'high') return 'Wysoka';
  return 'Średnia';
}

/** Zbuduj zalecany preset z klasy sprzętu (+ realny limit workerów z detekcji). */
export function buildRecommendedPreset(cls: HardwareClass): HardwarePreset {
  return {
    renderQuality: RECOMMENDED_QUALITY[cls],
    maxMapSizeLabel: RECOMMENDED_MAX_MAP_SIZE[cls],
    workerLimit: recommendedWorkerLimit(),
    hardwareClass: cls,
  };
}

// ---------------------------------------------------------------------------
// localStorage: zapis / odczyt
// ---------------------------------------------------------------------------

function isRenderQualityTier(v: unknown): v is RenderQualityTier {
  return v === 'low' || v === 'medium' || v === 'high';
}

function isHardwareClass(v: unknown): v is HardwareClass {
  return v === 'MOCNY' || v === 'SREDNI' || v === 'SLABY';
}

/** Zapis pełnego profilu (detekcja + benchmark + preset). Cicho ignoruje brak localStorage. */
export function saveHardwareProfile(
  detection: HardwareDetection,
  benchmark: HardwareBenchmark | null,
  preset: HardwarePreset | null,
): void {
  try {
    const cls = preset?.hardwareClass ?? classifyHardware(detection, benchmark);
    const rec: StoredHardwareProfile = {
      v: 1,
      savedAt: Date.now(),
      detection,
      benchmark,
      preset,
      hardwareClass: cls,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    /* prywatny tryb / brak localStorage */
  }
}

/** Odczyt zapisanego profilu (lub null). Waliduje preset defensywnie. */
export function loadHardwareProfile(): StoredHardwareProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredHardwareProfile>;
    if (!parsed || parsed.v !== 1 || !parsed.detection) return null;
    const cls = isHardwareClass(parsed.hardwareClass) ? parsed.hardwareClass : 'SREDNI';
    let preset: HardwarePreset | null = null;
    const p = parsed.preset;
    if (p && isRenderQualityTier(p.renderQuality) && typeof p.maxMapSizeLabel === 'string') {
      preset = {
        renderQuality: p.renderQuality,
        maxMapSizeLabel: p.maxMapSizeLabel,
        workerLimit: typeof p.workerLimit === 'number' && p.workerLimit > 0 ? p.workerLimit : recommendedWorkerLimit(),
        hardwareClass: isHardwareClass(p.hardwareClass) ? p.hardwareClass : cls,
      };
    }
    return {
      v: 1,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0,
      detection: parsed.detection,
      benchmark: parsed.benchmark ?? null,
      preset,
      hardwareClass: cls,
    };
  } catch {
    return null;
  }
}

/** Skrót: zapisany preset gracza (lub null). Używa kreator nowej gry jako wartość startową. */
export function loadSavedPreset(): HardwarePreset | null {
  return loadHardwareProfile()?.preset ?? null;
}

/** Zapis tylko presetu (zachowuje istniejącą detekcję/benchmark, jeśli są). */
export function saveSelectedPreset(preset: HardwarePreset): void {
  const existing = loadHardwareProfile();
  const detection = existing?.detection ?? detectHardware();
  saveHardwareProfile(detection, existing?.benchmark ?? null, preset);
}
