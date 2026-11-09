/**
 * eliminationSpectacle.ts — R-WEB-ELIMINATION-SCREEN-SPECTACULAR-Q1.
 *
 * „Widowiskowy" ekran eliminacji cywilizacji: nagłówek (godło, nazwa, epitafium, tura upadku,
 * czas istnienia, władca), DOKONANIA (maks. miasta, szczyt ludności, cuda, epoka, technologie),
 * STATYSTYKI WOJENNE (dwie kolumny: wyeliminowana cywilizacja kontra zdobywca, słupki +
 * liczby) i zdanie DOCENIENIA zależne od siły pokonanej cywilizacji.
 *
 * Moduł jest CZYSTY (bez zależności od main.ts / import.meta): zawiera
 *  - rejestr kronik (`CivChronicle`) — liczniki per cywilizacja zasilane z main.ts,
 *  - budowę danych ekranu (`buildEliminationSpectacle`),
 *  - HTML + CSS (`eliminationSpectacleHtml`, `ensureSpectacleStyles`) i animację count-up.
 *
 * Zasady danych: liczby wyłącznie z realnych liczników gry. Brak danych (stary zapis sprzed
 * liczników, `legacy`) => `null` => w UI „brak danych" albo pominięty wiersz. Nic nie jest
 * wymyślane. Terminologia: handel = wyłącznie wymiana, produkcja pól/budynków = podatek,
 * pieniądz powstaje w Mennicy — ten ekran nie używa żadnego z tych słów.
 *
 * EN: pure module — chronicle counters, data builder, HTML/CSS and count-up animation for the
 * spectacular elimination screen. Missing data is `null` and rendered as "brak danych".
 */

// ---------------------------------------------------------------------------------------------
// Kroniki (liczniki per cywilizacja)
// ---------------------------------------------------------------------------------------------

/** Liczniki starć dwóch konkretnych cywilizacji (klucz = ownerId przeciwnika). */
export interface CivChronicleVs {
  /** Ile jednostek przeciwnika ta cywilizacja zniszczyła. */
  k: number;
  /** Ile własnych jednostek straciła w starciach z tym przeciwnikiem. */
  l: number;
  /** Liczba bitew z tym przeciwnikiem. */
  b: number;
}

export interface CivChronicle {
  /** Tura, w której kronika zaczęła być prowadzona (start gry / pierwsze miasto). */
  sinceTurn?: number;
  /** true = zapis sprzed liczników: wartości liczone od zera NIE są prawdziwe => „brak danych". */
  legacy?: boolean;
  /** Wyprodukowane (zrekrutowane) jednostki wojskowe. */
  produced: number;
  /** Stracone jednostki w bitwach. */
  lost: number;
  /** Zniszczone jednostki przeciwników. */
  destroyed: number;
  /** Liczba bitew. */
  battles: number;
  citiesTaken: number;
  citiesLost: number;
  maxCities: number;
  peakPop: number;
  /** Cuda świata ukończone przez tę cywilizację (historycznie, niezależnie od późniejszego przejęcia). */
  wonders: number;
  vs: Record<number, CivChronicleVs>;
}

export type ChronicleMap = Map<number, CivChronicle>;

export function newChronicle(turn?: number, legacy = false): CivChronicle {
  const c: CivChronicle = {
    produced: 0, lost: 0, destroyed: 0, battles: 0,
    citiesTaken: 0, citiesLost: 0, maxCities: 0, peakPop: 0, wonders: 0, vs: {},
  };
  if (typeof turn === 'number' && Number.isFinite(turn)) c.sinceTurn = turn;
  if (legacy) c.legacy = true;
  return c;
}

export function chronicleFor(map: ChronicleMap, ownerId: number, turn?: number): CivChronicle {
  let c = map.get(ownerId);
  if (!c) { c = newChronicle(turn); map.set(ownerId, c); }
  return c;
}

function vsOf(c: CivChronicle, other: number): CivChronicleVs {
  return (c.vs[other] ??= { k: 0, l: 0, b: 0 });
}

/** Cud świata ukończony przez `ownerId`. */
export function noteWonderBuilt(map: ChronicleMap, ownerId: number, turn?: number): void {
  chronicleFor(map, ownerId, turn).wonders++;
}

/** Jednostka wojskowa zeszła z linii produkcji (rekrutacja zakończona). */
export function noteUnitProduced(map: ChronicleMap, ownerId: number, turn?: number): void {
  chronicleFor(map, ownerId, turn).produced++;
}

/**
 * Wynik jednej bitwy: `atkDead`/`defDead` to liczba poległych jednostek po stronie
 * atakującego / obrońcy. Atrybucja per właściciel: poległych po stronie A zniszczyła strona B.
 */
export function noteBattleResult(
  map: ChronicleMap, atkOwner: number, defOwner: number,
  atkDead: number, defDead: number, turn?: number,
): void {
  if (atkOwner === defOwner) return;
  const a = chronicleFor(map, atkOwner, turn);
  const d = chronicleFor(map, defOwner, turn);
  const ad = Math.max(0, Math.floor(atkDead) || 0);
  const dd = Math.max(0, Math.floor(defDead) || 0);
  a.battles++; d.battles++;
  a.lost += ad; d.destroyed += ad;
  d.lost += dd; a.destroyed += dd;
  const av = vsOf(a, defOwner); const dv = vsOf(d, atkOwner);
  av.b++; dv.b++;
  av.l += ad; dv.k += ad;
  dv.l += dd; av.k += dd;
}

export function noteCityCapture(map: ChronicleMap, oldOwner: number, newOwner: number, turn?: number): void {
  if (oldOwner === newOwner) return;
  chronicleFor(map, newOwner, turn).citiesTaken++;
  chronicleFor(map, oldOwner, turn).citiesLost++;
}

/** Aktualizacja rekordów: maks. liczba miast i szczyt ludności (sumy po miastach). */
export function noteEmpireSize(
  map: ChronicleMap, ownerId: number, cityCount: number, population: number, turn?: number,
): void {
  const c = chronicleFor(map, ownerId, turn);
  if (Number.isFinite(cityCount) && cityCount > c.maxCities) c.maxCities = Math.floor(cityCount);
  if (Number.isFinite(population) && population > c.peakPop) c.peakPop = Math.floor(population);
}

export function serializeChronicles(map: ChronicleMap): Array<[number, CivChronicle]> {
  return Array.from(map.entries()).map(([k, v]) => [k, JSON.parse(JSON.stringify(v)) as CivChronicle]);
}

/** Wczytanie z zapisu; brak/wadliwe dane => pusta mapa (starsze zapisy ładują się bez migracji). */
export function restoreChronicles(map: ChronicleMap, raw: unknown): void {
  map.clear();
  if (!Array.isArray(raw)) return;
  const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  for (const row of raw) {
    if (!Array.isArray(row) || typeof row[0] !== 'number' || !row[1] || typeof row[1] !== 'object') continue;
    const s = row[1] as Partial<CivChronicle>;
    const c = newChronicle(typeof s.sinceTurn === 'number' ? s.sinceTurn : undefined, s.legacy === true);
    c.produced = n(s.produced); c.lost = n(s.lost); c.destroyed = n(s.destroyed);
    c.battles = n(s.battles); c.citiesTaken = n(s.citiesTaken); c.citiesLost = n(s.citiesLost);
    c.maxCities = n(s.maxCities); c.peakPop = n(s.peakPop); c.wonders = n(s.wonders);
    if (s.vs && typeof s.vs === 'object') {
      for (const [k, v] of Object.entries(s.vs)) {
        const o = v as Partial<CivChronicleVs>;
        c.vs[Number(k)] = { k: n(o?.k), l: n(o?.l), b: n(o?.b) };
      }
    }
    map.set(row[0], c);
  }
}

// ---------------------------------------------------------------------------------------------
// Dane ekranu
// ---------------------------------------------------------------------------------------------

export interface SpectacleStatRow {
  label: string;
  /** Wartość wyeliminowanej cywilizacji; `null` = brak danych. */
  a: number | null;
  /** Wartość zdobywcy; `null` = brak danych. */
  b: number | null;
}

export interface EliminationSpectacleData {
  civLabel: string;
  /** Godło (gotowy SVG) — opcjonalne. */
  iconSvg?: string;
  /** Kolor cywilizacji (#rrggbb) — blask/ornament. */
  colorHex?: string;
  epitaph: string;
  fallTurn: number;
  /** Czas istnienia w turach; `null` = brak danych (stary zapis). */
  lifespanTurns: number | null;
  rulerName: string | null;
  portraitUrl: string | null;
  capitalName: string | null;
  achievements: Array<{ label: string; value: string }>;
  captorLabel: string;
  captorIsPlayer: boolean;
  /** Wiersze porównania wojennego (a = wyeliminowana, b = zdobywca). */
  war: SpectacleStatRow[];
  /** Wiersze „starcia bezpośredniego" (obie strony przeciw sobie). */
  duel: SpectacleStatRow[];
  appreciation: string;
}

export interface BuildSpectacleInput {
  civLabel: string;
  iconSvg?: string;
  colorHex?: string;
  era: number;
  fallTurn: number;
  rulerName?: string | null;
  portraitUrl?: string | null;
  capitalName?: string | null;
  elimOwner: number;
  captorOwner: number;
  captorLabel: string;
  captorIsPlayer: boolean;
  chronicles: ChronicleMap;
  /** Realne bieżące liczby (migawka tuż przed eliminacją). */
  currentCities: number;
  currentPopulation: number;
  wonders: number;
  techs: number;
  /** Siła (Moc) wyeliminowanej i zdobywcy — do zdania docenienia; `null` = brak. */
  elimPower: number | null;
  captorPower: number | null;
  captorMaxCities: number | null;
}

/** Epitafium w stylu epoki: 1 = Kamień, 2 = Brąz, 3+ = Żelazo. */
export function epitaphForEra(era: number): string {
  if (era <= 1) return 'Ognisko wygasło, a plemię rozproszyło się po świecie.';
  if (era === 2) return 'Mury runęły, lecz pamięć o państwie przetrwa na glinianych tabliczkach.';
  return 'Sztandary złożono u stóp zwycięzcy, a kroniki zamknięto na zawsze.';
}

export function eraNamePl(era: number): string {
  if (era <= 1) return 'Kamień';
  if (era === 2) return 'Brąz';
  return 'Żelazo';
}

/**
 * ZAŁOŻENIE (do akceptacji właściciela): progi docenienia liczone ze STOSUNKU siły (Mocy)
 * pokonanej cywilizacji do zdobywcy; gdy brak Mocy — ze stosunku maks. liczby miast.
 *   >= 1,25  — potęga silniejsza od zdobywcy
 *   >= 0,75  — przeciwnik równorzędny
 *   >= 0,35  — przeciwnik wyraźnie słabszy, ale groźny
 *   <  0,35  — niewielkie państwo
 */
export const APPRECIATION_THRESHOLDS = { stronger: 1.25, equal: 0.75, weaker: 0.35 } as const;

export function appreciationLine(
  ratio: number | null, captorIsPlayer: boolean, captorLabel: string, civLabel: string,
): string {
  const you = captorIsPlayer;
  if (ratio === null || !Number.isFinite(ratio)) {
    return `Państwo ${civLabel} przestało istnieć. Historia zapamięta tę chwilę.`;
  }
  if (ratio >= APPRECIATION_THRESHOLDS.stronger) {
    return you
      ? `Pokonałeś potęgę silniejszą od własnej. Takie zwycięstwo opiewa się w pieśniach.`
      : `${captorLabel} obalił potęgę silniejszą od siebie — takie zwycięstwo opiewa się w pieśniach.`;
  }
  if (ratio >= APPRECIATION_THRESHOLDS.equal) {
    return you
      ? `Pokonałeś równorzędnego rywala. Wielkie państwo ugięło się pod twoim naporem.`
      : `${captorLabel} pokonał równorzędnego rywala. Wielkie państwo ugięło się pod jego naporem.`;
  }
  if (ratio >= APPRECIATION_THRESHOLDS.weaker) {
    return you
      ? `Upadł rywal słabszy, lecz groźny i nieustępliwy. Zwycięstwo zasłużone.`
      : `${captorLabel} zdławił słabszego, lecz groźnego rywala.`;
  }
  return you
    ? `Upadło niewielkie państwo. Zwycięstwo łatwe, ale granice twojego imperium urosły.`
    : `${captorLabel} wchłonął niewielkie państwo.`;
}

function fin(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function buildEliminationSpectacle(inp: BuildSpectacleInput): EliminationSpectacleData {
  const elim = inp.chronicles.get(inp.elimOwner);
  const captor = inp.chronicles.get(inp.captorOwner);
  const elimOk = !!elim && elim.legacy !== true;
  const captorOk = !!captor && captor.legacy !== true;

  const since = elimOk && typeof elim!.sinceTurn === 'number' ? elim!.sinceTurn! : null;
  const lifespan = since !== null && inp.fallTurn >= since ? inp.fallTurn - since + 1 : null;

  const maxCities = elimOk ? Math.max(elim!.maxCities, inp.currentCities) : null;
  const peakPop = elimOk ? Math.max(elim!.peakPop, inp.currentPopulation) : null;

  const ach: Array<{ label: string; value: string }> = [];
  if (maxCities !== null) ach.push({ label: 'Największa liczba miast', value: String(maxCities) });
  if (peakPop !== null) ach.push({ label: 'Szczyt ludności', value: String(peakPop) });
  const curW = Math.max(0, Math.floor(inp.wonders) || 0);
  ach.push({
    label: 'Zbudowane cuda świata',
    value: String(elimOk ? Math.max(elim!.wonders, curW) : curW),
  });
  ach.push({ label: 'Osiągnięta epoka', value: eraNamePl(inp.era) });
  ach.push({ label: 'Odkryte technologie', value: String(Math.max(0, Math.floor(inp.techs) || 0)) });
  if (inp.capitalName) ach.push({ label: 'Stolica', value: inp.capitalName });

  const row = (label: string, a: number | null, b: number | null): SpectacleStatRow => ({
    label, a: elimOk ? a : null, b: captorOk ? b : null,
  });
  const war: SpectacleStatRow[] = [
    row('Wyprodukowane jednostki', elim?.produced ?? null, captor?.produced ?? null),
    row('Stracone jednostki', elim?.lost ?? null, captor?.lost ?? null),
    row('Zniszczone jednostki wroga', elim?.destroyed ?? null, captor?.destroyed ?? null),
    row('Zdobyte miasta', elim?.citiesTaken ?? null, captor?.citiesTaken ?? null),
    row('Utracone miasta', elim?.citiesLost ?? null, captor?.citiesLost ?? null),
    row('Stoczone bitwy', elim?.battles ?? null, captor?.battles ?? null),
  ];
  const ev = elim?.vs[inp.captorOwner];
  const cv = captor?.vs[inp.elimOwner];
  const duel: SpectacleStatRow[] = [
    {
      label: 'Jednostki zniszczone w starciach między stronami',
      a: elimOk ? (ev?.k ?? 0) : null,
      b: captorOk ? (cv?.k ?? 0) : null,
    },
    {
      label: 'Bitwy między stronami',
      a: elimOk ? (ev?.b ?? 0) : null,
      b: captorOk ? (cv?.b ?? 0) : null,
    },
  ];

  let ratio: number | null = null;
  const ep = fin(inp.elimPower); const cp = fin(inp.captorPower);
  if (ep !== null && cp !== null && cp > 0) ratio = ep / cp;
  else if (maxCities !== null && fin(inp.captorMaxCities) !== null && (inp.captorMaxCities as number) > 0) {
    ratio = maxCities / (inp.captorMaxCities as number);
  }

  return {
    civLabel: inp.civLabel,
    iconSvg: inp.iconSvg,
    colorHex: inp.colorHex,
    epitaph: epitaphForEra(inp.era),
    fallTurn: inp.fallTurn,
    lifespanTurns: lifespan,
    rulerName: inp.rulerName ?? null,
    portraitUrl: inp.portraitUrl ?? null,
    capitalName: inp.capitalName ?? null,
    achievements: ach,
    captorLabel: inp.captorLabel,
    captorIsPlayer: inp.captorIsPlayer,
    war,
    duel,
    appreciation: appreciationLine(ratio, inp.captorIsPlayer, inp.captorLabel, inp.civLabel),
  };
}

// ---------------------------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------------------------

const STYLE_ID = 'civ-elim-spectacle-css-v1';

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Polska odmiana „tura": 1 tura, 2-4 tury, 5+ tur (z wyjątkiem 12-14). */
export function turnsPl(n: number): string {
  const v = Math.abs(Math.floor(n));
  const m10 = v % 10; const m100 = v % 100;
  if (v === 1) return `${v} tura`;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return `${v} tury`;
  return `${v} tur`;
}

function safeColor(hex: string | undefined): string {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#c9a84c';
}

export function ensureSpectacleStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes elsp-in{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:none}}
@keyframes elsp-glow{0%,100%{box-shadow:0 0 18px var(--elsp-c),0 0 0 1px var(--elsp-c) inset}50%{box-shadow:0 0 34px var(--elsp-c),0 0 0 1px var(--elsp-c) inset}}
@keyframes elsp-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.civ-ccn.civ-ccn-spectacle{max-width:min(800px,calc(100vw - 24px));width:min(800px,calc(100vw - 24px));
  max-height:calc(100vh - 24px);overflow-y:auto;animation:elsp-in .5s cubic-bezier(.2,.8,.2,1);}
.elsp{--elsp-c:#c9a84c;text-align:center;}
.elsp-hd{position:relative;padding:6px 8px 14px;border-bottom:1px solid rgba(232,216,138,.22);
  background:radial-gradient(ellipse at 50% 0%,color-mix(in srgb,var(--elsp-c) 28%,transparent),transparent 70%);}
.elsp-emblem{width:72px;height:72px;margin:0 auto 8px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:rgba(8,12,24,.85);border:2px solid var(--elsp-c);color:var(--elsp-c);animation:elsp-glow 3.2s ease-in-out infinite;}
.elsp-emblem svg{width:44px;height:44px;}
.elsp-kick{font:700 11px/1.2 Georgia,serif;letter-spacing:.32em;text-transform:uppercase;color:#e8a8a8;}
.elsp-ttl{font:700 26px/1.15 Georgia,serif;color:#f4d0b8;margin:6px 0 2px;text-shadow:0 0 18px color-mix(in srgb,var(--elsp-c) 55%,transparent);}
.elsp-civ{font-size:19px;font-weight:700;color:#f0e8b8;}
.elsp-epi{font-style:italic;font-size:12.5px;color:#b8c0d0;margin:8px auto 0;max-width:520px;line-height:1.45;}
.elsp-meta{display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:center;margin-top:10px;font-size:12px;color:#c8cfdc;}
.elsp-meta b{color:#e8d88a;}
.elsp-ruler{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;}
.elsp-ruler img{width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid var(--elsp-c);}
.elsp-ruler span{font:700 13px Georgia,serif;color:#f0e8b8;}
.elsp-ruler small{display:block;font:11px 'Segoe UI',sans-serif;color:#7a8498;font-weight:400;}
.elsp-grid{display:grid;grid-template-columns:1fr;gap:14px;margin-top:14px;text-align:left;}
@media (min-width:720px){.elsp-grid{grid-template-columns:1fr 1.35fr;}}
.elsp-sec{animation:elsp-rise .6s ease-out both;}
.elsp-sec:nth-child(2){animation-delay:.15s;}
.elsp-sh{font:700 10px/1.2 Georgia,serif;letter-spacing:.16em;text-transform:uppercase;color:#c9a84c;padding-bottom:6px;border-bottom:1px solid rgba(232,216,138,.24);}
.elsp-ach{display:flex;justify-content:space-between;gap:12px;padding:6px 1px;border-bottom:1px solid rgba(232,216,138,.10);font-size:12px;}
.elsp-ach span:first-child{color:#7a8498;}
.elsp-ach span:last-child{font-weight:700;color:#e8ebf0;text-align:right;}
.elsp-cols{display:flex;justify-content:space-between;font:700 11px 'Segoe UI',sans-serif;padding:8px 1px 2px;}
.elsp-cols .a{color:#e8a8a8;}.elsp-cols .b{color:#9fe0a4;}
.elsp-wr{padding:5px 1px 6px;font-size:12px;}
.elsp-wl{text-align:center;color:#7a8498;font-size:11px;margin-bottom:3px;}
.elsp-wv{display:flex;align-items:center;gap:8px;}
.elsp-wn{flex:0 0 3.2em;font-weight:700;color:#e8ebf0;font-variant-numeric:tabular-nums;}
.elsp-wn.a{text-align:right;}.elsp-wn.b{text-align:left;}
.elsp-bar{flex:1 1 auto;height:8px;border-radius:4px;background:rgba(122,132,152,.18);display:flex;overflow:hidden;}
.elsp-bar i{display:block;height:100%;width:var(--w);transition:width 1s cubic-bezier(.2,.8,.2,1);}
.elsp-bar i.a{background:linear-gradient(90deg,#8a3a3a,#e8a8a8);}
.elsp-bar i.b{background:linear-gradient(90deg,#9fe0a4,#4a8a50);margin-left:auto;}
.elsp-nd{color:#7a8498;font-weight:400;font-style:italic;}
.elsp-appr{margin:14px 4px 4px;padding:10px 14px;border-radius:10px;text-align:center;font:italic 13.5px/1.5 Georgia,serif;color:#f0e8b8;
  border:1px solid color-mix(in srgb,var(--elsp-c) 55%,transparent);background:color-mix(in srgb,var(--elsp-c) 10%,rgba(8,12,24,.6));}
@media (max-width:520px){.elsp-ttl{font-size:21px;}.elsp-emblem{width:56px;height:56px;}.elsp-emblem svg{width:34px;height:34px;}}
@media (prefers-reduced-motion:reduce){
  .civ-ccn.civ-ccn-spectacle,.elsp-emblem,.elsp-sec{animation:none !important;}
  .elsp-bar i{transition:none !important;}
}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function numCell(v: number | null, cls: string): string {
  return v === null
    ? `<span class="elsp-wn ${cls} elsp-nd">brak danych</span>`
    : `<span class="elsp-wn ${cls}" data-countup="${Math.max(0, Math.floor(v))}">${Math.max(0, Math.floor(v))}</span>`;
}

function statRowHtml(r: SpectacleStatRow): string {
  const a = r.a; const b = r.b;
  let aw = 0; let bw = 0;
  if (a !== null && b !== null && a + b > 0) {
    aw = Math.round((a / (a + b)) * 100);
    bw = 100 - aw;
  }
  return `<div class="elsp-wr"><div class="elsp-wl">${esc(r.label)}</div><div class="elsp-wv">`
    + numCell(a, 'a')
    + `<div class="elsp-bar"><i class="a" style="--w:${aw}%"></i><i class="b" style="--w:${bw}%"></i></div>`
    + numCell(b, 'b')
    + `</div></div>`;
}

/** HTML ekranu (bez przycisków — te dokłada okno wołające). */
export function eliminationSpectacleHtml(d: EliminationSpectacleData): string {
  const c = safeColor(d.colorHex);
  const meta: string[] = [`Upadek w turze <b>${Math.max(0, Math.floor(d.fallTurn) || 0)}</b>`];
  meta.push(d.lifespanTurns !== null
    ? `Istniała <b>${esc(turnsPl(d.lifespanTurns))}</b>`
    : `Czas istnienia: <span class="elsp-nd">brak danych</span>`);
  const ruler = d.rulerName
    ? `<div class="elsp-ruler">${d.portraitUrl ? `<img src="${esc(d.portraitUrl)}" alt="">` : ''}<span><small>Władca</small>${esc(d.rulerName)}</span></div>`
    : '';
  const ach = d.achievements.map(a =>
    `<div class="elsp-ach"><span>${esc(a.label)}</span><span>${esc(a.value)}</span></div>`).join('');
  const rows = [...d.war, ...d.duel].filter(r => !(r.a === null && r.b === null));
  const cols = `<div class="elsp-cols"><span class="a">${esc(d.civLabel)}</span><span class="b">${esc(d.captorIsPlayer ? 'Ty' : d.captorLabel)}</span></div>`;
  return `<div class="elsp" style="--elsp-c:${c}">`
    + `<div class="elsp-hd">`
    + (d.iconSvg ? `<div class="elsp-emblem">${d.iconSvg}</div>` : '')
    + `<div class="elsp-kick">Upadek państwa</div>`
    + `<div class="elsp-ttl">ELIMINACJA!</div>`
    + `<div class="elsp-civ">${esc(d.civLabel)}</div>`
    + `<div class="elsp-epi">${esc(d.epitaph)}</div>`
    + `<div class="elsp-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>`
    + ruler
    + `</div>`
    + `<div class="elsp-grid">`
    + `<div class="elsp-sec"><div class="elsp-sh">Dokonania</div>${ach}</div>`
    + `<div class="elsp-sec"><div class="elsp-sh">Statystyki wojenne</div>${cols}${rows.map(statRowHtml).join('')}</div>`
    + `</div>`
    + `<div class="elsp-appr">${esc(d.appreciation)}</div>`
    + `</div>`;
}

/** Czy użytkownik prosi o ograniczenie ruchu. */
export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch { return false; }
}

/**
 * Animacja „count-up" liczników `[data-countup]` w `root`. Przy ograniczeniu ruchu (lub braku
 * requestAnimationFrame) nic nie robi — w HTML jest już wartość końcowa, więc nigdy nie ma NaN.
 */
export function startCountUp(root: ParentNode, durationMs = 900): void {
  if (prefersReducedMotion() || typeof requestAnimationFrame !== 'function') return;
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-countup]'));
  if (els.length === 0) return;
  const targets = els.map(el => Number(el.getAttribute('data-countup')));
  els.forEach((el, i) => { if (Number.isFinite(targets[i])) el.textContent = '0'; });
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const tick = (now: number): void => {
    const p = Math.min(1, Math.max(0, (now - t0) / durationMs));
    const e = 1 - Math.pow(1 - p, 3);
    els.forEach((el, i) => {
      const t = targets[i]!;
      if (Number.isFinite(t)) el.textContent = String(Math.round(t * e));
    });
    if (p < 1) requestAnimationFrame(tick);
    else els.forEach((el, i) => { if (Number.isFinite(targets[i]!)) el.textContent = String(targets[i]); });
  };
  requestAnimationFrame(tick);
}
