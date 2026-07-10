// ============================================================================
// muzyka-antyczna.ts — proceduralna muzyka tła gry 4X: EPOKI x NASTROJE.
// Czysty Web Audio API, zero plików audio, zero zależności, single-file.
//
// API:
//   startMusic(mood?: 'mapa'|'bitwa')  — wywołać PO geście użytkownika (klik!)
//   setMood(mood)                      — płynne przejście (crossfade ~4 s)
//   setEra(era: number)                — 1=Kamień, 2=Brąz; era>=3 gra (na razie)
//                                        brązem; crossfade epoki ~6 s (nagroda!)
//   getEra(): 1|2
//   setMusicVolume(v: 0..1) / stopMusic() / isMusicPlaying() / getMood()
//
// EPOKA 1 — KAMIEŃ ("odgłosy natury i dzikich ludów, bez przesady"):
//   NATURA    — wiatr (filtrowany szum, falowanie 0.03–0.08 Hz; gra ZAWSZE),
//               ptaki (3 syntetyczne gatunki, co 4–15 s), świerszcze (rzadko),
//               odległe wycie wilka / pohukiwanie sowy (max co 40–90 s, cicho).
//   INSTRUMENTY — kościana piszczałka (pentatonika; 2 POWRACAJĄCE MOTYWY A/B
//               z wariacjami, długie pauzy), bęben-kłoda (głuchy nieregularny
//               puls), klekot kamieni/patyków, grzechotka z nasion.
//   GŁOSY     — pomruki/zawołania formantowe (o/a/u, NIGDY słowa); na mapie
//               bardzo rzadko i odlegle, w bitwie gęściej (okrzyki grupowe).
// EPOKA 2 — BRĄZ (świat antyczny):
//   LIRA/KITHARA (Karplus-Strong), AULOS, DRON-bourdon D, bęben ramowy, krotale.
//   Modusy greckie od finalis D; kompozytor: 2 RODZINY MOTYWÓW powracające
//   z wariacjami — A dorycka (spokojna, nisko) / B miksolidyjska (jaśniejsza).
// Nastroje: 'mapa' (kontemplacja) / 'bitwa' (puls, zawołania).
// Miks: FDN-reverb (3 linie delay + LP w pętli), soft-limiter tanh na masterze.
// Render offline (Node) jest lustrzany: te same funkcje przez export _silnik.
// ============================================================================

export type Mood = 'mapa' | 'bitwa';
export type Era = 1 | 2;

// ---------------------------------------------------------------------------
// RNG (mulberry32) — deterministyczny od seeda; seed bierzemy z Math.random()
// ---------------------------------------------------------------------------
type Rng = () => number;

function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return function (): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rr(r: Rng, a: number, b: number): number { return a + r() * (b - a); }
function pick<T>(r: Rng, arr: readonly T[]): T {
  return arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))] as T;
}

// ---------------------------------------------------------------------------
// Teoria. Brąz: modusy greckie (półtony od finalis). Kamień: pentatonika
// minorowa — celowo PROSTSZA niż siedmiostopniowe modusy brązu.
// ---------------------------------------------------------------------------
const MODUSY = {
  dorycki:       [0, 2, 3, 5, 7, 9, 10],
  frygijski:     [0, 1, 3, 5, 7, 8, 10],
  miksolidyjski: [0, 2, 4, 5, 7, 9, 10],
} as const;
type ModeName = keyof typeof MODUSY;

const PENTA: readonly number[] = [0, 3, 5, 7, 10]; // D F G A C — od finalis D

function midiHz(m: number): number { return 440 * Math.pow(2, (m - 69) / 12); }

/** Stopień skali (może być ujemny / >7) -> numer MIDI. */
function degToMidi(root: number, mode: ModeName, deg: number): number {
  const sc = MODUSY[mode];
  const n = sc.length;
  const oct = Math.floor(deg / n);
  const i = ((deg % n) + n) % n;
  return root + 12 * oct + (sc[i] as number);
}

/** Stopień pentatoniki kamienia -> numer MIDI. */
function pentToMidi(root: number, deg: number): number {
  const n = PENTA.length;
  const oct = Math.floor(deg / n);
  const i = ((deg % n) + n) % n;
  return root + 12 * oct + (PENTA[i] as number);
}

// ---------------------------------------------------------------------------
// Stałe brzmienia i miksu (wspólne dla wersji live i renderu offline)
// ---------------------------------------------------------------------------
const LEVELS = {
  // brąz
  lira: 0.40, aulos: 0.26, dum: 0.60, tek: 0.30, krotal: 0.11,
  // kamień — natura
  wiatr: 0.30, ptak: 0.17, swierszcz: 0.10, wycie: 0.17,
  // kamień — instrumenty i głosy
  piszcz: 0.38, kloda: 0.62, klekot: 0.34, grzechot: 0.18, glos: 0.55,
  dronMapa: 0.115, dronBitwa: 0.165,
  dry: 0.80, wet: 0.26,
  busMapa: 2.2, busBitwa: 1.6,           // trym głośności nastrojów brązu
  busKamienMapa: 1.5, busKamienBitwa: 1.1, // trym nastrojów kamienia
} as const;

/** Bourdon (BRĄZ): składowe względem rootHz (D2). Kwinta L/R = szerokość. */
const DRON = {
  rootMidi: 38, // D2
  partials: [
    { ratio: 1.0,    gain: 0.34, pan:  0.0 },
    { ratio: 0.5,    gain: 0.22, pan:  0.0 },
    { ratio: 1.4983, gain: 0.15, pan: -0.45 },
    { ratio: 1.5017, gain: 0.15, pan:  0.45 },
    { ratio: 2.0,    gain: 0.055, pan: 0.0 },
    { ratio: 2.9966, gain: 0.028, pan: 0.0 },
  ],
  lfoHz: 0.05, lfoDepth: 0.18, attack: 4.0,
} as const;

const REVERB = {
  pre: 0.02,
  delays: [0.0891, 0.1273, 0.1567],
  fb: 0.60, lpHz: 3000, lpQ: 0.5,
  taps: [[0.9, 0.0], [0.0, 0.9], [0.55, 0.55]],
} as const;

const XFADE = 4.0;      // s — crossfade nastrojów (w obrębie epoki)
const ERA_XFADE = 6.0;  // s — crossfade zmiany EPOKI (awans = słyszalna nagroda)
const LOOKAHEAD = 2.6;  // s — planowanie do przodu (odporność na throttling karty)

/** Wiatr kamienia: segmenty nakładane — szum gra bez żadnej przerwy. */
const WIATR_SEG = 11.0;  // s — długość segmentu
const WIATR_KROK = 8.0;  // s — odstęp startów (3 s nakładki, equal-power fade)

// ---------------------------------------------------------------------------
// Zdarzenia nutowe
// ---------------------------------------------------------------------------
type InstrTyp =
  | 'lira' | 'aulos' | 'dum' | 'tek' | 'krotal'                    // brąz
  | 'wiatr' | 'ptak' | 'swierszcz' | 'wycie'                       // kamień: natura
  | 'piszcz' | 'kloda' | 'klekot' | 'grzechot' | 'glos';           // kamień: ludzie

interface NoteEvent {
  t: number;      // s od startu silnika sceny
  typ: InstrTyp;
  midi: number;   // wysokość; dla perkusji/natury: wariant brzmienia (0,1,2...)
  dur: number;    // czas wybrzmienia / długość segmentu
  gain: number;   // 0..1 (mnożony przez LEVELS[typ])
  pan: number;    // -1..1
  seed: number;   // deterministyczny seed brzmienia tej nuty
}

// ---------------------------------------------------------------------------
// BRĄZ — kompozytor: 2 rodziny motywów (powracające z wariacjami)
//   Rodzina A (dorycka, spokojna): nisko, małe kroki, grawitacja do finalis.
//   Rodzina B (miksolidyjska, jaśniejsza): wyżej, śmielsze skoki, kotwica 4/7.
// ---------------------------------------------------------------------------
const RODZINA_A: readonly (readonly number[])[] = [
  [0, 1, 2, 0, -1, 0],
  [2, 1, 0, 2, 4, 2, 0],
  [4, 2, 3, 1, 0],
  [0, 2, 1, -1, 0],
];
const RODZINA_B: readonly (readonly number[])[] = [
  [4, 5, 7, 5, 4],
  [7, 8, 7, 5, 4, 5, 7],
  [4, 6, 7, 9, 7],
  [5, 4, 5, 7, 4],
];
type Rodzina = 'A' | 'B';

function rodzinaDlaModu(mode: ModeName): Rodzina {
  return mode === 'miksolidyjski' ? 'B' : 'A'; // frygijski śpiewa rodzinę A
}

/** Wariant motywu rodziny: baza + co najwyżej drobna mutacja — motyw ma
 *  pozostać ROZPOZNAWALNY przy każdym powrocie. */
function wariantMotywu(r: Rng, fam: Rodzina): number[] {
  const bank = fam === 'B' ? RODZINA_B : RODZINA_A;
  const m = [...pick(r, bank)];
  const lo = -3, hi = fam === 'B' ? 9 : 8;
  const x = r();
  if (x < 0.35) {          // mutacja jednej nuty o sekundę
    const i = Math.floor(r() * m.length);
    m[i] = Math.max(lo, Math.min(hi, (m[i] as number) + pick(r, [-1, 1])));
  } else if (x < 0.5) {    // dopisany zwrot ku kotwicy rodziny
    m.push(fam === 'B' ? pick(r, [4, 7]) : pick(r, [0, 4]));
  } else if (x < 0.62 && m.length > 4) { // skrót
    m.pop();
  }                        // w pozostałych ~40%: czysty powrót bazy
  return m;
}

function makeOstinato(r: Rng): { deg: number[]; dur: number[] } {
  // 4 nuty na takt; rytm w slotach-ósemkach (suma = 8)
  const deg: number[] = [];
  let d = 0;
  for (let i = 0; i < 4; i++) {
    deg.push(d);
    d = Math.max(-3, Math.min(4, d + pick(r, [-2, -1, -1, 1, 1, 2])));
  }
  const dur = r() < 0.55 ? [2, 2, 2, 2] : (r() < 0.5 ? [1, 1, 2, 4] : [2, 1, 1, 4]);
  return { deg, dur };
}

const PATTERNS_BITWA: readonly string[] = [
  'D...t...D...t...',
  'D...t...D.D.t...',
  'D.t...t.D.t.t...',
  'D...t.D.D...t..t',
  'D.D...t...D.t...',
  'D..t..D.D..t..t.',
];

// ---------------------------------------------------------------------------
// KAMIEŃ — kompozytor piszczałki: 2 POWRACAJĄCE MOTYWY (A/B) z wariacjami,
// pentatonika od D5, krótkie zawołania 3–6 nut z długimi pauzami.
// ---------------------------------------------------------------------------
const MOTYW_PISZCZ_A: readonly number[] = [4, 3, 4, 2, 0];    // kołuje i opada do D
const MOTYW_PISZCZ_B: readonly number[] = [0, 2, 1, 2, 3, 0]; // zaplątane kołysanie
const RYTM_PISZCZ: readonly (readonly number[])[] = [
  [0.5, 0.9, 0.55, 1.4, 1.9],
  [0.7, 0.5, 0.9, 0.6, 1.6],
  [0.45, 0.45, 0.8, 1.2, 2.0],
];

interface FrazaPiszcz { deg: number[]; dur: number[]; }

function frazaPiszcz(r: Rng, ktory: 0 | 1): FrazaPiszcz {
  const baza = ktory === 0 ? MOTYW_PISZCZ_A : MOTYW_PISZCZ_B;
  let deg: number[] = [...baza];
  const x = r();
  if (x < 0.28) {                       // ozdobnik: przednutka nad pierwszą nutą
    deg = [(deg[0] as number) + 1, ...deg];
  } else if (x < 0.48) {                // transpozycja w górę (jaśniejszy powrót)
    const tr = pick(r, [1, 2]);
    deg = deg.map((d) => d + tr);
  } else if (x < 0.64 && deg.length > 4) { // skrót zawołania
    deg = deg.slice(0, 3 + Math.floor(r() * 2));
  }                                     // w pozostałych ~36%: czysty powrót motywu
  const wzor = pick(r, RYTM_PISZCZ);
  const dur: number[] = [];
  for (let i = 0; i < deg.length; i++) {
    const w = wzor[Math.min(i, wzor.length - 1)] as number;
    dur.push(w * rr(r, 0.9, 1.15));
  }
  dur[dur.length - 1] = (dur[dur.length - 1] as number) * rr(r, 1.3, 1.8);
  return { deg, dur };
}

/** Bęben-kłoda w bitwie: K = mocne, k = słabsze (mniejsza kłoda), . = pauza.
 *  8 slotów po ~0.55 s + jitter i losowe oddechy => puls wolny i NIERÓWNY. */
const PATTERNS_KLODA: readonly string[] = [
  'K..k.K..', 'K...K.k.', 'K.k..K..', 'K..K..k.', 'K....Kk.',
];

// ---------------------------------------------------------------------------
// Stan kompozytora (jedna scena = era x mood)
// ---------------------------------------------------------------------------
interface CompState {
  era: Era; mood: Mood; rng: Rng; mode: ModeName;
  root: number;          // finalis melodii brązu (D4 = 62)
  sectionEnd: number;
  // brąz — lira (mapa): rodzina motywów + spacer po stopniach
  rodzina: Rodzina; motif: number[]; motifPos: number; pulse: number; tLira: number;
  // brąz — aulos
  tAulos: number;
  // brąz — perkusja + ostinato (bitwa); w kamieniu sloty służą kłodom bitwy
  slotDur: number; pattern: string; slot: number; tPerc: number;
  ostinato: number[]; ostDur: number[]; ostPos: number; ostReps: number; tOst: number;
  tKrotal: number;
  // kamień — natura
  tWiatr: number; tPtak: number; tSwierszcz: number; tWycie: number;
  // kamień — instrumenty i głosy
  tPiszcz: number; tKloda: number; tKlekot: number; tGrzechot: number; tGlos: number;
  piszczOstatni: 0 | 1; piszczPowtorki: number;
}

function newState(era: Era, mood: Mood, seed: number): CompState {
  const rng = mulberry32(seed);
  const slotDur = era === 1 ? 0.55 : 60 / 92 / 2; // kamień wolny / brąz 92 BPM
  const st: CompState = {
    era, mood, rng,
    mode: mood === 'bitwa' ? 'frygijski' : 'dorycki',
    root: 62, // D4
    rodzina: 'A',
    sectionEnd: mood === 'bitwa' ? rr(rng, 14, 22) : rr(rng, 22, 38),
    motif: [], motifPos: 0,
    pulse: mood === 'bitwa' ? slotDur * 2 : rr(rng, 1.05, 1.3),
    tLira: rr(rng, 0.4, 1.2),
    tAulos: mood === 'bitwa' ? rr(rng, 6, 12) : rr(rng, 7, 14),
    slotDur, pattern: PATTERNS_BITWA[0] as string, slot: 0, tPerc: 0.12,
    ostinato: [0, 1, 0, -2], ostDur: [2, 2, 2, 2], ostPos: 0, ostReps: 0,
    tOst: 0.12 + slotDur * 8,
    tKrotal: mood === 'bitwa' ? 0.12 + slotDur * 12 : rr(rng, 12, 26),
    tWiatr: 0,
    tPtak: rr(rng, 2, 7),
    tSwierszcz: rr(rng, 20, 70),
    tWycie: rr(rng, 25, 70),
    tPiszcz: mood === 'bitwa' ? rr(rng, 6, 14) : rr(rng, 4, 10),
    tKloda: mood === 'bitwa' ? rr(rng, 1.0, 2.5) : rr(rng, 5, 12),
    tKlekot: mood === 'bitwa' ? rr(rng, 1.5, 4) : rr(rng, 15, 40),
    tGrzechot: mood === 'bitwa' ? rr(rng, 4, 10) : rr(rng, 18, 45),
    tGlos: mood === 'bitwa' ? rr(rng, 3, 8) : rr(rng, 20, 50),
    piszczOstatni: 0, piszczPowtorki: 0,
  };
  if (era === 2) {
    st.rodzina = rodzinaDlaModu(st.mode);
    st.motif = wariantMotywu(rng, st.rodzina);
    if (mood === 'bitwa') {
      st.pattern = pick(rng, PATTERNS_BITWA);
      const o = makeOstinato(rng);
      st.ostinato = o.deg; st.ostDur = o.dur;
    }
  } else {
    st.pattern = pick(rng, PATTERNS_KLODA);
  }
  return st;
}

/** Nowa sekcja (BRĄZ): zmiana modusu => zmiana RODZINY motywów. */
function newSection(s: CompState, t: number): void {
  const r = s.rng;
  if (s.mood === 'bitwa') {
    s.sectionEnd = t + rr(r, 14, 22);
    s.mode = r() < 0.72 ? 'frygijski' : 'dorycki';
    const o = makeOstinato(r);
    s.ostinato = o.deg; s.ostDur = o.dur; s.ostPos = 0; s.ostReps = 0;
    if (r() < 0.6) s.pattern = pick(r, PATTERNS_BITWA);
  } else {
    s.sectionEnd = t + rr(r, 22, 38);
    const x = r();
    s.mode = x < 0.5 ? 'dorycki' : (x < 0.8 ? 'miksolidyjski' : 'frygijski');
    s.rodzina = rodzinaDlaModu(s.mode);
    s.motif = wariantMotywu(r, s.rodzina); s.motifPos = 0;
    s.pulse = rr(r, 1.0, 1.35);
  }
}

function ev(s: CompState, t: number, typ: InstrTyp, midi: number, dur: number,
            gain: number, pan: number): NoteEvent {
  return { t, typ, midi, dur, gain, pan, seed: Math.floor(s.rng() * 2147483647) };
}

/** Po wyczerpaniu motywu (BRĄZ, mapa): kolejny WARIANT tej samej rodziny —
 *  motywy wracają, wariacje pozostają drobne (bank bazowy jest stały). */
function motifNext(s: CompState): void {
  const r = s.rng;
  s.motifPos = 0;
  s.motif = wariantMotywu(r, s.rodzina);
  if (r() < 0.5) s.tLira += rr(r, 0.6, 2.4); // oddech między frazami
}

// ---------------------------------------------------------------------------
// KAMIEŃ — inkrementalna kompozycja sceny.
// "Bez przesady": każda warstwa ma pauzy dużo dłuższe niż zdarzenia;
// jedynym dźwiękiem ciągłym jest wiatr (fundament zamiast drona).
// ---------------------------------------------------------------------------
function composeKamien(s: CompState, toT: number, out: NoteEvent[]): void {
  const r = s.rng;
  const bitwa = s.mood === 'bitwa';
  // WIATR — segmenty nakładane: gra zawsze, bez dziur
  while (s.tWiatr < toT) {
    out.push(ev(s, s.tWiatr, 'wiatr', 0, WIATR_SEG,
      rr(r, 0.8, 1.0) * (bitwa ? 0.75 : 1), 0));
    s.tWiatr += WIATR_KROK;
  }
  // PISZCZAŁKA — mapa: motywy A/B z wariacjami; bitwa: krótki sygnał alarmowy
  while (s.tPiszcz < toT) {
    if (bitwa) {
      let t = s.tPiszcz;
      const k = 2 + Math.floor(r() * 3);
      const degA = pick(r, [4, 5, 6]);
      for (let i = 0; i < k; i++) {
        const last = i === k - 1;
        const dur = last ? rr(r, 0.5, 0.8) : rr(r, 0.2, 0.32);
        const deg = last && r() < 0.5 ? degA - 2 : degA;
        out.push(ev(s, t, 'piszcz', pentToMidi(74, deg), dur,
          rr(r, 0.8, 1.0), rr(r, -0.15, 0.25)));
        t += dur + rr(r, 0.05, 0.12);
      }
      s.tPiszcz = t + rr(r, 14, 32);
    } else {
      let ktory: 0 | 1 = r() < 0.55 ? 0 : 1;      // A częściej niż B
      if (ktory === s.piszczOstatni && s.piszczPowtorki >= 2) {
        ktory = ktory === 0 ? 1 : 0;              // nie powtarzaj >2x z rzędu
      }
      s.piszczPowtorki = ktory === s.piszczOstatni ? s.piszczPowtorki + 1 : 1;
      s.piszczOstatni = ktory;
      const f = frazaPiszcz(r, ktory);
      let t = s.tPiszcz;
      for (let i = 0; i < f.deg.length; i++) {
        const dur = f.dur[i] as number;
        out.push(ev(s, t, 'piszcz', pentToMidi(74, f.deg[i] as number), dur,
          rr(r, 0.65, 0.9), rr(r, -0.2, 0.2)));
        t += dur * rr(r, 0.95, 1.1) + (r() < 0.25 ? rr(r, 0.15, 0.5) : 0.02);
      }
      s.tPiszcz = t + rr(r, 13, 28); // długa pauza — zawołanie, nie melodia ciągła
    }
  }
  // BĘBEN-KŁODA — mapa: rzadkie tętno; bitwa: gęsty, wciąż nierówny puls
  if (bitwa) {
    while (s.tPerc < toT) {
      const ch = s.pattern.charAt(s.slot);
      const jit = rr(r, -0.04, 0.04);
      if (ch === 'K' && r() > 0.06) {
        out.push(ev(s, s.tPerc + jit, 'kloda', 0, 0.6, rr(r, 0.85, 1.0),
          rr(r, -0.12, 0.06)));
      } else if (ch === 'k' && r() > 0.15) {
        out.push(ev(s, s.tPerc + jit, 'kloda', 1, 0.5, rr(r, 0.5, 0.7),
          rr(r, 0.0, 0.2)));
      }
      s.slot++;
      if (s.slot >= s.pattern.length) {
        s.slot = 0;
        if (r() < 0.3) s.pattern = pick(r, PATTERNS_KLODA);
        s.tPerc += rr(r, 0, 0.35); // oddech — puls celowo nie kwantyzowany
      }
      s.tPerc += s.slotDur * rr(r, 0.94, 1.08);
    }
  } else {
    while (s.tKloda < toT) {
      out.push(ev(s, s.tKloda, 'kloda', 0, 0.6, rr(r, 0.55, 0.8),
        rr(r, -0.15, 0.1)));
      if (r() < 0.35) { // czasem podwójne tętno
        out.push(ev(s, s.tKloda + rr(r, 0.35, 0.7), 'kloda', 1, 0.5,
          rr(r, 0.4, 0.6), rr(r, -0.1, 0.15)));
      }
      s.tKloda += rr(r, 9, 20);
    }
  }
  // KLEKOT kamieni (0) / patyków (1): seria 2–4 kliknięć, oszczędnie
  while (s.tKlekot < toT) {
    let t = s.tKlekot;
    const k = 2 + Math.floor(r() * (bitwa ? 3 : 2));
    const rodzaj = r() < 0.5 ? 0 : 1;
    const g0 = bitwa ? rr(r, 0.6, 0.9) : rr(r, 0.35, 0.55);
    const pan = rr(r, -0.5, 0.5);
    for (let i = 0; i < k; i++) {
      out.push(ev(s, t, 'klekot', rodzaj, 0.08, g0 * rr(r, 0.8, 1.0),
        pan + rr(r, -0.06, 0.06)));
      t += rr(r, 0.09, 0.22);
    }
    s.tKlekot += bitwa ? rr(r, 2, 5) : rr(r, 25, 60);
  }
  // GRZECHOTKA z nasion
  while (s.tGrzechot < toT) {
    out.push(ev(s, s.tGrzechot, 'grzechot', 0, rr(r, 0.5, 1.0),
      bitwa ? rr(r, 0.55, 0.8) : rr(r, 0.35, 0.55), rr(r, -0.45, 0.45)));
    s.tGrzechot += bitwa ? rr(r, 8, 18) : rr(r, 30, 70);
  }
  // GŁOSY — mapa: pojedynczy odległy pomruk; bitwa: okrzyki grupowe
  while (s.tGlos < toT) {
    if (bitwa) {
      const k = 2 + Math.floor(r() * 3);
      const t = s.tGlos;
      for (let i = 0; i < k; i++) {
        out.push(ev(s, t + rr(r, 0, 0.18), 'glos', 41 + Math.floor(r() * 10),
          rr(r, 0.3, 0.6), rr(r, 0.7, 0.95), rr(r, -0.5, 0.5)));
      }
      s.tGlos += rr(r, 10, 22);
    } else {
      out.push(ev(s, s.tGlos, 'glos', 40 + Math.floor(r() * 8),
        rr(r, 1.2, 2.6), rr(r, 0.35, 0.55), pick(r, [-1, 1]) * rr(r, 0.3, 0.6)));
      s.tGlos += rr(r, 35, 80);
    }
  }
  // NATURA — tylko na mapie; w bitwie ptaki i zwierzęta milkną
  if (!bitwa) {
    while (s.tPtak < toT) {
      out.push(ev(s, s.tPtak, 'ptak', Math.floor(r() * 3), rr(r, 0.8, 1.8),
        rr(r, 0.5, 0.9), rr(r, -0.7, 0.7)));
      s.tPtak += rr(r, 4, 15);
    }
    while (s.tSwierszcz < toT) {
      out.push(ev(s, s.tSwierszcz, 'swierszcz', 0, rr(r, 5, 9),
        rr(r, 0.5, 0.8), pick(r, [-1, 1]) * rr(r, 0.4, 0.7)));
      s.tSwierszcz += rr(r, 45, 100);
    }
    while (s.tWycie < toT) {
      out.push(ev(s, s.tWycie, 'wycie', r() < 0.5 ? 0 : 1, rr(r, 2.2, 3.6),
        rr(r, 0.5, 0.85), pick(r, [-1, 1]) * rr(r, 0.5, 0.85)));
      s.tWycie += rr(r, 40, 90);
    }
  } else {
    if (s.tPtak < toT) s.tPtak = toT + rr(r, 4, 15);
    if (s.tSwierszcz < toT) s.tSwierszcz = toT + 60;
    if (s.tWycie < toT) s.tWycie = toT + 60;
  }
}

/** Inkrementalna kompozycja: emituje zdarzenia do czasu toT (s). */
function composeUntil(s: CompState, toT: number, out: NoteEvent[]): void {
  if (s.era === 1) { composeKamien(s, toT, out); return; }
  const r = s.rng;
  if (s.mood === 'mapa') {
    while (s.tLira < toT) {
      if (s.tLira >= s.sectionEnd) newSection(s, s.tLira);
      if (r() < 0.14) { s.tLira += rr(r, 2.2, 5.5); continue; } // pauza-oddech
      const deg = s.motif[s.motifPos] as number;
      s.motifPos++;
      const midi = degToMidi(s.root, s.mode, deg);
      const dur = rr(r, 2.0, 3.4);
      const g = rr(r, 0.7, 1.0);
      const pan = rr(r, -0.35, 0.35);
      if (r() < 0.2) {
        // arpeggio "kithara": rozłożona triada modalna w górę
        const k = 3 + Math.floor(r() * 3);
        for (let i = 0; i < k; i++) {
          const dd = deg + ([0, 2, 4, 7, 9][i] as number);
          out.push(ev(s, s.tLira + i * rr(r, 0.07, 0.11), 'lira',
            degToMidi(s.root, s.mode, dd), dur * (1 - i * 0.08), g * (1 - i * 0.13), pan));
        }
      } else {
        out.push(ev(s, s.tLira, 'lira', midi, dur, g, pan));
      }
      if (s.motifPos >= s.motif.length) motifNext(s);
      s.tLira += pick(r, [0.75, 1, 1, 1, 1.5, 1.5, 2, 3]) * s.pulse * rr(r, 0.96, 1.06);
    }
    while (s.tAulos < toT) {
      if (s.tAulos >= s.sectionEnd) newSection(s, s.tAulos);
      // fraza aulosu: 3..6 nut legato, przewaga zejść, koniec dłuższy
      let t = s.tAulos;
      let deg = pick(r, [4, 5, 6, 7, 8]);
      const k = 3 + Math.floor(r() * 4);
      for (let i = 0; i < k; i++) {
        const last = i === k - 1;
        const dur = rr(r, 1.6, 3.0) * (last ? 1.5 : 1);
        out.push(ev(s, t, 'aulos', degToMidi(s.root, s.mode, deg), dur,
          rr(r, 0.75, 1.0), rr(r, -0.15, 0.15)));
        t += dur * 0.94;
        deg = Math.max(0, Math.min(9, deg + pick(r, [-2, -1, -1, -1, 1, 1, 2])));
      }
      s.tAulos = t + rr(r, 12, 26);
    }
    while (s.tKrotal < toT) {
      out.push(ev(s, s.tKrotal, 'krotal', 0, 0.5, rr(r, 0.7, 1.0), rr(r, -0.4, 0.4)));
      s.tKrotal += rr(r, 22, 48);
    }
  } else {
    // ------ BITWA (BRĄZ) ------
    while (s.tPerc < toT) {
      if (s.tPerc >= s.sectionEnd) newSection(s, s.tPerc);
      const ch = s.pattern.charAt(s.slot);
      const hum = rr(r, -0.006, 0.006);
      if (ch === 'D') {
        out.push(ev(s, s.tPerc + hum, 'dum', 0, 0.5, rr(r, 0.85, 1.0), -0.06));
      } else if (ch === 't') {
        out.push(ev(s, s.tPerc + hum, 'tek', 0, 0.15, rr(r, 0.6, 0.85), 0.14));
      } else if (r() < 0.07) {
        out.push(ev(s, s.tPerc + hum, 'tek', 0, 0.12, rr(r, 0.25, 0.4), 0.2)); // ghost
      }
      s.slot++;
      if (s.slot >= 16) { s.slot = 0; if (r() < 0.22) s.pattern = pick(r, PATTERNS_BITWA); }
      s.tPerc += s.slotDur;
    }
    while (s.tOst < toT) {
      if (s.tOst >= s.sectionEnd) newSection(s, s.tOst);
      const deg = s.ostinato[s.ostPos] as number;
      const sl = s.ostDur[s.ostPos] as number;
      const dur = Math.max(0.5, sl * s.slotDur * 1.7);
      out.push(ev(s, s.tOst, 'lira', degToMidi(s.root, s.mode, deg), dur,
        rr(r, 0.62, 0.85), rr(r, -0.2, 0.1)));
      s.tOst += sl * s.slotDur;
      s.ostPos++;
      if (s.ostPos >= s.ostinato.length) {
        s.ostPos = 0; s.ostReps++;
        if (s.ostReps >= 4 && s.rng() < 0.4) {
          const i = Math.floor(r() * s.ostinato.length);
          s.ostinato[i] = Math.max(-3, Math.min(4,
            (s.ostinato[i] as number) + pick(r, [-1, 1])));
          s.ostReps = 0;
        }
      }
    }
    while (s.tAulos < toT) {
      // zawołanie aulosu: 2..4 nuty, zejście ku finalis (lament frygijski)
      let t = s.tAulos;
      let deg = pick(r, [7, 8, 9]);
      const k = 2 + Math.floor(r() * 3);
      for (let i = 0; i < k; i++) {
        const last = i === k - 1;
        const dur = rr(r, 0.7, 1.5) * (last ? 1.6 : 1);
        out.push(ev(s, t, 'aulos', degToMidi(s.root, s.mode, deg), dur,
          rr(r, 0.85, 1.0), rr(r, -0.1, 0.2)));
        t += dur * 0.92;
        deg = Math.max(0, deg - pick(r, [1, 1, 2]));
      }
      s.tAulos = t + rr(r, 9, 20);
    }
    while (s.tKrotal < toT) {
      if (r() < 0.55) {
        out.push(ev(s, s.tKrotal, 'krotal', 0, 0.4, rr(r, 0.4, 0.6), 0.3));
      }
      s.tKrotal += s.slotDur * 16;
    }
  }
}

// ---------------------------------------------------------------------------
// SYNTEZA — czyste funkcje: nuta -> Float32Array (mono, fs).
// Identyczny kod działa w przeglądarce (AudioBuffer) i w renderze Node.
// ---------------------------------------------------------------------------

/** Biquad lowpass/bandpass wg RBJ Audio-EQ-Cookbook (jak BiquadFilterNode). */
function biquadCoef(typ: 'lowpass' | 'bandpass', fs: number, fc: number, q: number):
  { b0: number; b1: number; b2: number; a1: number; a2: number } {
  const w0 = 2 * Math.PI * fc / fs;
  const cw = Math.cos(w0), sw = Math.sin(w0);
  const alpha = sw / (2 * q);
  let b0: number, b1: number, b2: number;
  if (typ === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; }
  else { b0 = alpha; b1 = 0; b2 = -alpha; } // bandpass (peak gain = Q)
  const a0 = 1 + alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: (-2 * cw) / a0, a2: (1 - alpha) / a0 };
}

interface BiquadState { x1: number; x2: number; y1: number; y2: number; }

function biquadRun(c: ReturnType<typeof biquadCoef>, st: BiquadState, x: number): number {
  const y = c.b0 * x + c.b1 * st.x1 + c.b2 * st.x2 - c.a1 * st.y1 - c.a2 * st.y2;
  st.x2 = st.x1; st.x1 = x; st.y2 = st.y1; st.y1 = y;
  return y;
}

function fadeEdges(buf: Float32Array, fs: number, inMs: number, outMs: number): void {
  const nIn = Math.min(buf.length, Math.floor(fs * inMs / 1000));
  const nOut = Math.min(buf.length, Math.floor(fs * outMs / 1000));
  for (let i = 0; i < nIn; i++) buf[i] = (buf[i] as number) * (i / nIn);
  for (let i = 0; i < nOut; i++) {
    const j = buf.length - 1 - i;
    buf[j] = (buf[j] as number) * (i / nOut);
  }
}

// ------------------------------- BRĄZ --------------------------------------

/** LIRA/KITHARA — Karplus-Strong, 2 głosy z detune (chór), DC-block. */
function renderLira(fs: number, f0: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.max(16, Math.floor(fs * (dur + 0.25)));
  const out = new Float32Array(len);
  const voices: ReadonlyArray<readonly [number, number]> =
    [[0.9988, 0.62], [1.0014, 0.42]];
  for (const [det, vg] of voices) {
    const f = f0 * det;
    const n = Math.max(2, Math.round(fs / f));
    const buf = new Float32Array(n);
    for (let i = 0; i < n; i++) buf[i] = rng() * 2 - 1;
    for (let i = 1; i < n; i++) buf[i] = ((buf[i] as number) + (buf[i - 1] as number)) / 2;
    const rho = Math.exp(Math.log(0.001) / (f * dur)); // -60 dB po `dur` s
    let p = 0;
    for (let i = 0; i < len; i++) {
      const nxt = (p + 1) % n;
      out[i] = (out[i] as number) + (buf[p] as number) * vg;
      buf[p] = rho * 0.5 * ((buf[p] as number) + (buf[nxt] as number));
      p = nxt;
    }
  }
  // DC-block (łagodny highpass ~20 Hz)
  let x1 = 0, y1 = 0;
  const R = 1 - (2 * Math.PI * 20) / fs;
  for (let i = 0; i < len; i++) {
    const x = out[i] as number;
    const y = x - x1 + R * y1;
    x1 = x; y1 = y; out[i] = y;
  }
  fadeEdges(out, fs, 2, 60);
  return out;
}

/** AULOS — miękki stroik: sinus+2 harmoniki, wolne vibrato, szum oddechu (BP). */
function renderAulos(fs: number, f0: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const atk = 0.16 + rng() * 0.1, rel = 0.35 + rng() * 0.25;
  const len = Math.floor(fs * (dur + rel + 0.05));
  const out = new Float32Array(len);
  const vibHz = 4.3 + rng() * 1.0;
  const vibMax = (5 + rng() * 4) * 0.000577; // 5..9 centów
  const drift = (rng() - 0.5) * 0.004;       // lekki dryf stroju (żywy dech)
  const cBP = biquadCoef('bandpass', fs, Math.min(0.45 * fs, f0 * 1.9), 1.8);
  const stBP: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  let ph = rng() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    // obwiednia: atak^2 / sustain z falowaniem oddechu / release cos
    let env: number;
    if (t < atk) { const u = t / atk; env = u * u; }
    else if (t > dur) {
      const u = Math.min(1, (t - dur) / rel);
      env = 0.5 * (1 + Math.cos(Math.PI * u));
    } else env = 1;
    env *= 1 + 0.07 * Math.sin(2 * Math.PI * 0.8 * t + 1.3);
    const vib = Math.sin(2 * Math.PI * vibHz * t) * vibMax * Math.min(1, t / 0.8);
    const f = f0 * (1 + vib + drift * Math.sin(2 * Math.PI * 0.13 * t));
    ph += (2 * Math.PI * f) / fs;
    const ton = Math.sin(ph) * 0.72 + Math.sin(2 * ph) * 0.20 + Math.sin(3 * ph) * 0.07;
    const oddech = biquadRun(cBP, stBP, rng() * 2 - 1) * 0.05;
    out[i] = (ton + oddech) * env * 0.55;
  }
  fadeEdges(out, fs, 3, 25);
  return out;
}

/** Bęben ramowy "dum" — membrana: sinus z opadającym pitch + stłumiony szum. */
function renderDum(fs: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * 0.5);
  const out = new Float32Array(len);
  const f1 = 118 + rng() * 14, f0 = 60 + rng() * 8;
  let ph = 0, lp = 0;
  const kLP = 1 - Math.exp(-2 * Math.PI * 330 / fs);
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    const f = f0 + (f1 - f0) * Math.exp(-t / 0.025);
    ph += (2 * Math.PI * f) / fs;
    const ton = Math.sin(ph) * Math.exp(-t / 0.13);
    lp += kLP * ((rng() * 2 - 1) - lp);
    const thump = lp * Math.exp(-t / 0.03) * 1.6;
    out[i] = (ton * 0.95 + thump) * 0.95;
  }
  fadeEdges(out, fs, 1, 30);
  return out;
}

/** "tek" — uderzenie w obręcz: szum przez BP + krótki rezonans. */
function renderTek(fs: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * 0.14);
  const out = new Float32Array(len);
  const cBP = biquadCoef('bandpass', fs, 820 + rng() * 160, 2.0);
  const st: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  let ph = 0;
  const fr = 165 + rng() * 25;
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    const n = biquadRun(cBP, st, rng() * 2 - 1) * Math.exp(-t / 0.02) * 1.5;
    ph += (2 * Math.PI * fr) / fs;
    out[i] = n + Math.sin(ph) * Math.exp(-t / 0.014) * 0.35;
  }
  fadeEdges(out, fs, 1, 15);
  return out;
}

/** Krotale/"claves" — dwa wysokie częściowe tony, łagodny decay. */
function renderKrotal(fs: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * 0.55);
  const out = new Float32Array(len);
  const det = 1 + (rng() - 0.5) * 0.02;
  const f1 = 5150 * det, f2 = 7830 * det, f3 = 9520 * det;
  let p1 = 0, p2 = 0, p3 = 0;
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    p1 += (2 * Math.PI * f1) / fs; p2 += (2 * Math.PI * f2) / fs; p3 += (2 * Math.PI * f3) / fs;
    out[i] = (Math.sin(p1) * Math.exp(-t / 0.20)
      + 0.6 * Math.sin(p2) * Math.exp(-t / 0.13)
      + 0.3 * Math.sin(p3) * Math.exp(-t / 0.08)) * 0.32;
  }
  fadeEdges(out, fs, 1, 40);
  return out;
}

// ------------------------------ KAMIEŃ -------------------------------------

/** WIATR — biały szum przez 2x one-pole LP; podmuchy = LFO 0.03–0.08 Hz na
 *  odcięciu i głośności; cichy "poświst" BP przy szczycie podmuchu.
 *  Krawędzie segmentu: fade sqrt (equal-power dla nieskorelowanego szumu). */
function renderWiatr(fs: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * dur);
  const out = new Float32Array(len);
  const lfoHz = rr(rng, 0.03, 0.08);
  const lfoPh = rng() * Math.PI * 2;
  const fcBaza = rr(rng, 320, 480);
  let lp = 0, lp2 = 0;
  const cBP = biquadCoef('bandpass', fs, rr(rng, 1100, 2100), 2.2);
  const stBP: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * lfoHz * t + lfoPh); // 0..1
    const gust = 0.55 + 0.65 * lfo;
    const fc = fcBaza * (0.7 + 0.9 * lfo);
    const k = 1 - Math.exp(-2 * Math.PI * fc / fs);
    const w = rng() * 2 - 1;
    lp += k * (w - lp);
    lp2 += k * (lp - lp2);
    const swist = biquadRun(cBP, stBP, w) * 0.05 * lfo * lfo;
    out[i] = (lp2 * 1.9 + swist) * gust;
  }
  const nF = Math.min(Math.floor(fs * (WIATR_SEG - WIATR_KROK)), len >> 1);
  for (let i = 0; i < nF; i++) {
    const u = Math.sqrt(i / nF);
    out[i] = (out[i] as number) * u;
    const j = len - 1 - i;
    out[j] = (out[j] as number) * u;
  }
  return out;
}

/** PTAKI — syntetyczne chirpy, 3 gatunki:
 *  0 świergot opadający, 1 fletowy gwizd z portamento/trylem, 2 "ti-ti-tu". */
function renderPtak(fs: number, gatunek: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * (dur + 0.1));
  const out = new Float32Array(len);
  interface Syl { t0: number; d: number; f0: number; f1: number; tryl: number; g: number; }
  const sylaby: Syl[] = [];
  if (gatunek === 0) {
    const k = 3 + Math.floor(rng() * 4);
    let t = 0.02;
    const fBaza = rr(rng, 3400, 4400);
    for (let i = 0; i < k; i++) {
      const d = rr(rng, 0.05, 0.09);
      sylaby.push({ t0: t, d, f0: fBaza * rr(rng, 1.15, 1.3),
        f1: fBaza * rr(rng, 0.78, 0.9), tryl: 0, g: rr(rng, 0.7, 1) });
      t += d + rr(rng, 0.04, 0.1);
    }
  } else if (gatunek === 1) {
    const k = 2 + Math.floor(rng() * 2);
    let t = 0.02;
    for (let i = 0; i < k; i++) {
      const d = rr(rng, 0.16, 0.34);
      const a = rr(rng, 1750, 2600);
      sylaby.push({ t0: t, d, f0: a, f1: a * rr(rng, 0.8, 1.25),
        tryl: rng() < 0.5 ? rr(rng, 18, 30) : 0, g: rr(rng, 0.8, 1) });
      t += d + rr(rng, 0.09, 0.22);
    }
  } else {
    const powt = 2 + Math.floor(rng() * 2);
    let t = 0.02;
    const fHi = rr(rng, 4800, 5600), fLo = fHi * rr(rng, 0.62, 0.72);
    for (let p = 0; p < powt; p++) {
      sylaby.push({ t0: t, d: 0.07, f0: fHi, f1: fHi, tryl: 0, g: 0.9 });
      sylaby.push({ t0: t + 0.1, d: 0.07, f0: fHi, f1: fHi, tryl: 0, g: 0.9 });
      sylaby.push({ t0: t + 0.2, d: 0.13, f0: fLo, f1: fLo * 0.94, tryl: 0, g: 1 });
      t += rr(rng, 0.42, 0.6);
    }
  }
  for (const s of sylaby) {
    const i0 = Math.floor(s.t0 * fs), n = Math.floor(s.d * fs);
    let ph = 0;
    for (let i = 0; i < n && i0 + i < len; i++) {
      const u = i / n;
      const f = s.f0 + (s.f1 - s.f0) * u
        + (s.tryl > 0 ? Math.sin(2 * Math.PI * s.tryl * i / fs) * 90 : 0);
      ph += (2 * Math.PI * f) / fs;
      const env = Math.pow(Math.sin(Math.PI * u), 0.7);
      out[i0 + i] = (out[i0 + i] as number)
        + (Math.sin(ph) + 0.18 * Math.sin(2 * ph)) * env * s.g * 0.5;
    }
  }
  fadeEdges(out, fs, 2, 30);
  return out;
}

/** ŚWIERSZCZE — nośna ~4.5 kHz, AM ~26–40 Hz w seriach ćwierków; daleko. */
function renderSwierszcz(fs: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * dur);
  const out = new Float32Array(len);
  const fc = rr(rng, 4200, 4900);
  const fAM = rr(rng, 26, 40);
  let ph = 0, phAM = 0;
  const okna: Array<readonly [number, number]> = [];
  let t = 0.05 + rng() * 0.3;
  while (t < dur - 0.2) {
    const d = rr(rng, 0.3, 0.6);
    okna.push([t, Math.min(t + d, dur - 0.1)]);
    t += d + rr(rng, 0.25, 0.6);
  }
  let w = 0;
  for (let i = 0; i < len; i++) {
    const ts = i / fs;
    while (w < okna.length && ts > (okna[w] as readonly [number, number])[1]) w++;
    if (w >= okna.length) break;
    const okno = okna[w] as readonly [number, number];
    if (ts < okno[0]) continue;
    const u = (ts - okno[0]) / Math.max(0.01, okno[1] - okno[0]);
    const okEnv = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.5);
    ph += (2 * Math.PI * fc) / fs;
    phAM += (2 * Math.PI * fAM) / fs;
    const am = Math.pow(Math.max(0, Math.sin(phAM)), 1.5);
    out[i] = Math.sin(ph) * am * okEnv * 0.4;
  }
  fadeEdges(out, fs, 50, 200);
  return out;
}

/** Odległe WYCIE wilka (0) / POHUKIWANIE sowy (1) — cicho, na granicy sceny. */
function renderWycie(fs: number, wariant: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  if (wariant === 1) dur = 1.15; // sowa: dwa krótkie "hu"
  const len = Math.floor(fs * dur);
  const out = new Float32Array(len);
  if (wariant === 0) {
    const f0 = rr(rng, 260, 300), fPeak = rr(rng, 400, 470);
    const upEnd = rr(rng, 0.25, 0.4);
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const u = i / len;
      const f = u < upEnd
        ? f0 + (fPeak - f0) * (u / upEnd)
        : fPeak - (fPeak - f0 * 0.92) * Math.pow((u - upEnd) / (1 - upEnd), 1.4);
      const wob = 1 + 0.008 * Math.sin(2 * Math.PI * 5.2 * i / fs) * u;
      ph += (2 * Math.PI * f * wob) / fs;
      const env = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.06)), 1.3);
      out[i] = (Math.sin(ph) * 0.7 + Math.sin(2 * ph) * 0.22
        + Math.sin(3 * ph) * 0.06) * env * 0.5;
    }
  } else {
    const f = rr(rng, 330, 390);
    const hu: ReadonlyArray<readonly [number, number]> = [[0.05, 0.3], [0.55, 0.42]];
    for (const [t0, d] of hu) {
      const i0 = Math.floor(t0 * fs), n = Math.floor(d * fs);
      let ph = 0;
      for (let i = 0; i < n && i0 + i < len; i++) {
        const u = i / n;
        const ff = f * (1 - 0.06 * u);
        ph += (2 * Math.PI * ff) / fs;
        const env = Math.pow(Math.sin(Math.PI * u), 1.6);
        out[i0 + i] = (out[i0 + i] as number)
          + (Math.sin(ph) * 0.8 + Math.sin(2 * ph) * 0.1) * env * 0.55;
      }
    }
  }
  fadeEdges(out, fs, 40, 150);
  return out;
}

/** KOŚCIANA PISZCZAŁKA — prostszy i bardziej "oddechowy" ton niż aulos:
 *  sinus + śladowa 2. harmoniczna, DUŻO szumu zadęcia, chwiejny strój
 *  (random walk ±14 centów), podjazd od dołu na ataku. Bez ciągłego vibrata. */
function renderPiszcz(fs: number, f0: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const atk = 0.05 + rng() * 0.05, rel = 0.12 + rng() * 0.15;
  const len = Math.floor(fs * (dur + rel + 0.05));
  const out = new Float32Array(len);
  const cBP = biquadCoef('bandpass', fs, Math.min(0.45 * fs, f0 * 2.6), 1.1);
  const stBP: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  const oddechHz = 1.1 + rng() * 0.8;
  const startGliss = rr(rng, 0.015, 0.04);
  const krok = Math.floor(fs * 0.035);
  let cel = 0, biez = 0, licznik = 0;
  let ph = rng() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    if (licznik <= 0) { cel = (rng() * 2 - 1) * 0.008; licznik = krok; }
    licznik--;
    biez += (cel - biez) * 0.0015;
    let env: number;
    if (t < atk) env = Math.pow(t / atk, 1.5);
    else if (t > dur) {
      const u = Math.min(1, (t - dur) / rel);
      env = 0.5 * (1 + Math.cos(Math.PI * u));
    } else env = 1;
    env *= 1 + 0.05 * Math.sin(2 * Math.PI * oddechHz * t);
    const gliss = 1 - startGliss * Math.exp(-t / 0.06);
    const f = f0 * gliss
      * (1 + biez + 0.004 * Math.sin(2 * Math.PI * 4.6 * t) * Math.min(1, t / 0.5));
    ph += (2 * Math.PI * f) / fs;
    const ton = Math.sin(ph) * 0.8 + Math.sin(2 * ph) * 0.09;
    const dech = biquadRun(cBP, stBP, rng() * 2 - 1) * 0.16;
    out[i] = (ton + dech) * env * 0.5;
  }
  fadeEdges(out, fs, 3, 20);
  return out;
}

/** BĘBEN-KŁODA — głuchy, niski, drewniany: 0 = duża kłoda, 1 = mniejsza. */
function renderKloda(fs: number, wariant: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * 0.6);
  const out = new Float32Array(len);
  const bazaF = wariant === 1 ? rr(rng, 88, 104) : rr(rng, 56, 68);
  const startF = bazaF * rr(rng, 1.45, 1.7);
  let ph = 0, lp = 0;
  const kLP = 1 - Math.exp(-2 * Math.PI * 240 / fs);
  const cBP = biquadCoef('bandpass', fs, rr(rng, 170, 300), 1.4); // "tok" drewna
  const stBP: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    const f = bazaF + (startF - bazaF) * Math.exp(-t / 0.02);
    ph += (2 * Math.PI * f) / fs;
    const ton = Math.sin(ph) * Math.exp(-t / (wariant === 1 ? 0.16 : 0.24));
    lp += kLP * ((rng() * 2 - 1) - lp);
    const cialo = lp * Math.exp(-t / 0.04) * 1.2;
    const tok = biquadRun(cBP, stBP, rng() * 2 - 1) * Math.exp(-t / 0.012) * 0.8;
    out[i] = ton * 0.9 + cialo + tok;
  }
  fadeEdges(out, fs, 1, 40);
  return out;
}

/** KLEKOT — kamień o kamień (0) / patyk o patyk (1): jedno kliknięcie. */
function renderKlekot(fs: number, rodzaj: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * 0.09);
  const out = new Float32Array(len);
  const f1 = rodzaj === 1 ? rr(rng, 1050, 1500) : rr(rng, 2300, 3100);
  const f2 = Math.min(0.45 * fs, f1 * rr(rng, 1.9, 2.6));
  const c1 = biquadCoef('bandpass', fs, f1, 7);
  const c2 = biquadCoef('bandpass', fs, f2, 6);
  const s1: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  const s2: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  for (let i = 0; i < len; i++) {
    const t = i / fs;
    const x = (rng() * 2 - 1) * Math.exp(-t / 0.004);
    out[i] = (biquadRun(c1, s1, x) * 1.6 + biquadRun(c2, s2, x) * 0.9)
      * Math.exp(-t / (rodzaj === 1 ? 0.02 : 0.03)) * 1.8;
  }
  fadeEdges(out, fs, 0.5, 8);
  return out;
}

/** GRZECHOTKA z nasion — chmura drobin z obwiednią potrząśnięcia. */
function renderGrzechot(fs: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const len = Math.floor(fs * dur);
  const out = new Float32Array(len);
  const cHP = biquadCoef('bandpass', fs, rr(rng, 5200, 6800), 1.2);
  const st: BiquadState = { x1: 0, x2: 0, y1: 0, y2: 0 };
  const nZiaren = 18 + Math.floor(rng() * 22);
  const fale = 1 + Math.floor(rng() * 2);
  for (let z = 0; z < nZiaren; z++) {
    const fala = Math.floor(rng() * fale);
    const c = (fala + rr(rng, 0.15, 0.85)) / fale * dur * 0.85;
    const i0 = Math.floor(c * fs);
    const n = Math.max(8, Math.floor(fs * rr(rng, 0.003, 0.008)));
    const g = rr(rng, 0.4, 1);
    for (let i = 0; i < n && i0 + i < len; i++) {
      out[i0 + i] = (out[i0 + i] as number)
        + (rng() * 2 - 1) * g * Math.exp(-i / (n * 0.5));
    }
  }
  for (let i = 0; i < len; i++) out[i] = biquadRun(cHP, st, out[i] as number) * 1.4;
  fadeEdges(out, fs, 5, 60);
  return out;
}

/** GŁOS "dzikich ludów" — pomruk/zawołanie formantowe. Samogłoski o/a/u,
 *  NIGDY słowa. Naturalność: jitter f0 (random walk), drżenie amplitudy,
 *  czasem powolny morph samogłoski (u->a = "ua"), miękkie źródło (piła
 *  przez one-pole LP) + szmer oddechu. dur < 0.8 s => okrzyk (szybki atak). */
const FORMANTY: Record<'a' | 'o' | 'u', ReadonlyArray<readonly [number, number]>> = {
  a: [[700, 1.0], [1180, 0.55], [2550, 0.14]],
  o: [[420, 1.0], [820, 0.50], [2500, 0.10]],
  u: [[330, 1.0], [700, 0.32], [2400, 0.07]],
};
const FORMANT_Q: readonly number[] = [4.5, 6, 8];

function renderGlos(fs: number, f0: number, dur: number, seed: number): Float32Array {
  const rng = mulberry32(seed);
  const okrzyk = dur < 0.8;
  const atk = okrzyk ? rr(rng, 0.02, 0.05) : rr(rng, 0.1, 0.25);
  const rel = okrzyk ? rr(rng, 0.08, 0.16) : rr(rng, 0.2, 0.45);
  const len = Math.floor(fs * (dur + rel + 0.05));
  const out = new Float32Array(len);
  const samogloski: ReadonlyArray<'a' | 'o' | 'u'> = ['a', 'o', 'u'];
  const v1 = pick(rng, samogloski);
  const v2 = rng() < 0.45 ? pick(rng, samogloski) : v1;
  const Fa = FORMANTY[v1], Fb = FORMANTY[v2];
  const stF: BiquadState[] = [
    { x1: 0, x2: 0, y1: 0, y2: 0 },
    { x1: 0, x2: 0, y1: 0, y2: 0 },
    { x1: 0, x2: 0, y1: 0, y2: 0 },
  ];
  let coefF: Array<ReturnType<typeof biquadCoef>> = [];
  let gF: number[] = [0, 0, 0];
  const BLOK = 128;
  const fShape = okrzyk ? rr(rng, 1.12, 1.25) : rr(rng, 1.04, 1.1);
  const drzHz = rr(rng, 3.6, 4.8);
  const krok = Math.floor(fs * 0.03);
  let ph = 0, drz = 0, cel = 0, lcz = 0, lpSrc = 0;
  const kSrc = 1 - Math.exp(-2 * Math.PI * 2600 / fs);
  for (let i = 0; i < len; i++) {
    if (i % BLOK === 0) {
      const uB = Math.min(1, (i / fs) / Math.max(0.001, dur));
      const morph = v1 === v2 ? 0 : Math.min(1, Math.max(0, (uB - 0.25) / 0.5));
      coefF = []; gF = [];
      for (let k = 0; k < 3; k++) {
        const A = Fa[k] as readonly [number, number];
        const B = Fb[k] as readonly [number, number];
        const fc = A[0] + (B[0] - A[0]) * morph;
        coefF.push(biquadCoef('bandpass', fs, fc, FORMANT_Q[k] as number));
        gF.push((A[1] + (B[1] - A[1]) * morph) / (FORMANT_Q[k] as number));
      }
    }
    const t = i / fs;
    if (lcz <= 0) { cel = (rng() * 2 - 1) * 0.03; lcz = krok; }
    lcz--;
    drz += (cel - drz) * 0.002;
    const uT = Math.min(1, t / Math.max(0.001, dur));
    const kont = okrzyk
      ? fShape - (fShape - 0.94) * Math.pow(uT, 1.3)
      : 1 + (fShape - 1) * Math.sin(Math.PI * Math.min(1, uT * 1.05));
    const f = f0 * kont * (1 + drz);
    ph += f / fs; if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1;
    lpSrc += kSrc * (saw - lpSrc);
    const zrodlo = lpSrc + (rng() * 2 - 1) * 0.02;
    let y = 0;
    for (let k = 0; k < 3; k++) {
      y += biquadRun(coefF[k] as ReturnType<typeof biquadCoef>,
        stF[k] as BiquadState, zrodlo) * (gF[k] as number);
    }
    let env: number;
    if (t < atk) env = Math.pow(t / atk, 1.2);
    else if (t > dur) {
      const u = Math.min(1, (t - dur) / rel);
      env = 0.5 * (1 + Math.cos(Math.PI * u));
    } else env = 1;
    env *= 1 + 0.08 * Math.sin(2 * Math.PI * drzHz * t + 2);
    out[i] = y * env * 1.4;
  }
  fadeEdges(out, fs, 4, 30);
  return out;
}

function renderEvent(fs: number, e: NoteEvent): Float32Array {
  switch (e.typ) {
    case 'lira':      return renderLira(fs, midiHz(e.midi), e.dur, e.seed);
    case 'aulos':     return renderAulos(fs, midiHz(e.midi), e.dur, e.seed);
    case 'dum':       return renderDum(fs, e.seed);
    case 'tek':       return renderTek(fs, e.seed);
    case 'krotal':    return renderKrotal(fs, e.seed);
    case 'wiatr':     return renderWiatr(fs, e.dur, e.seed);
    case 'ptak':      return renderPtak(fs, e.midi, e.dur, e.seed);
    case 'swierszcz': return renderSwierszcz(fs, e.dur, e.seed);
    case 'wycie':     return renderWycie(fs, e.midi, e.dur, e.seed);
    case 'piszcz':    return renderPiszcz(fs, midiHz(e.midi), e.dur, e.seed);
    case 'kloda':     return renderKloda(fs, e.midi, e.seed);
    case 'klekot':    return renderKlekot(fs, e.midi, e.seed);
    case 'grzechot':  return renderGrzechot(fs, e.dur, e.seed);
    case 'glos':      return renderGlos(fs, midiHz(e.midi), e.dur, e.seed);
  }
}

/** Miękki limiter na masterze: tanh(1.6x)/tanh(1.6) — przezroczysty do ~-6 dB. */
function softClip(x: number): number { return Math.tanh(1.6 * x) / Math.tanh(1.6); }

/** Trym głośności busa sceny (era x nastrój). */
function busLevel(era: Era, mood: Mood): number {
  if (era === 1) return mood === 'bitwa' ? LEVELS.busKamienBitwa : LEVELS.busKamienMapa;
  return mood === 'bitwa' ? LEVELS.busBitwa : LEVELS.busMapa;
}

// Eksport rdzenia dla lustrzanego renderu offline (Node) i testów.
export const _silnik = {
  mulberry32, rr, pick, MODUSY, PENTA, midiHz, degToMidi, pentToMidi,
  LEVELS, DRON, REVERB, XFADE, ERA_XFADE,
  newState, composeUntil, renderEvent, softClip, biquadCoef, biquadRun, busLevel,
} as const;

// ===========================================================================
// WARSTWA ODTWARZANIA NA ŻYWO (Web Audio API)
// ===========================================================================

interface Graf {
  sum: GainNode;       // suma dry+wet -> głośność
  shaper: WaveShaperNode;
  mix: GainNode;       // wejście od silników
  revIn: GainNode;
}

let ctx: AudioContext | null = null;
let graf: Graf | null = null;
let engines: EngineAudio[] = [];
let playing = false;
let volume = 0.8;
let moodNow: Mood = 'mapa';
let eraNow: Era = 1; // gra zaczyna w epoce kamienia

function volCurve(v: number): number { return Math.pow(Math.max(0, Math.min(1, v)), 1.6); }

function buildGraf(ac: AudioContext): Graf {
  const sum = ac.createGain();
  sum.gain.value = volCurve(volume);
  const shaper = ac.createWaveShaper();
  const N = 2049;
  const curve = new Float32Array(N);
  for (let i = 0; i < N; i++) curve[i] = softClip((i / (N - 1)) * 2 - 1);
  shaper.curve = curve;
  sum.connect(shaper);
  shaper.connect(ac.destination);

  const mix = ac.createGain();
  mix.gain.value = 1;
  const dry = ac.createGain();
  dry.gain.value = LEVELS.dry;
  mix.connect(dry); dry.connect(sum);

  // FDN reverb: pre-delay -> 3 linie (delay -> LP -> gain) w pętli rotacyjnej
  const revIn = ac.createGain(); revIn.gain.value = 1;
  mix.connect(revIn);
  const pre = ac.createDelay(0.1); pre.delayTime.value = REVERB.pre;
  revIn.connect(pre);
  const merger = ac.createChannelMerger(2);
  const lps: BiquadFilterNode[] = [];
  const dls: DelayNode[] = [];
  for (let i = 0; i < 3; i++) {
    const d = ac.createDelay(0.5); d.delayTime.value = REVERB.delays[i] as number;
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = REVERB.lpHz; lp.Q.value = REVERB.lpQ;
    d.connect(lp);
    pre.connect(d);
    dls.push(d); lps.push(lp);
  }
  for (let i = 0; i < 3; i++) {
    const fb = ac.createGain(); fb.gain.value = REVERB.fb;
    (lps[i] as BiquadFilterNode).connect(fb);
    fb.connect(dls[(i + 1) % 3] as DelayNode);
    const [tl, tr] = REVERB.taps[i] as readonly [number, number];
    if (tl > 0) { const g = ac.createGain(); g.gain.value = tl;
      (lps[i] as BiquadFilterNode).connect(g); g.connect(merger, 0, 0); }
    if (tr > 0) { const g = ac.createGain(); g.gain.value = tr;
      (lps[i] as BiquadFilterNode).connect(g); g.connect(merger, 0, 1); }
  }
  const wet = ac.createGain(); wet.gain.value = LEVELS.wet;
  merger.connect(wet); wet.connect(sum);
  return { sum, shaper, mix, revIn };
}

/** Jedna scena (era x nastrój) = jeden silnik: kompozytor + scheduler
 *  (+ dron w brązie; w kamieniu fundamentem jest wiatr). Crossfade busem. */
class EngineAudio {
  private readonly ac: AudioContext;
  private readonly bus: GainNode;
  private readonly st: CompState;
  private readonly t0: number;
  private timer: number | null = null;
  private horizon = 0;
  private dronOsc: OscillatorNode[] = [];
  private dronOut: GainNode | null = null;
  private disposed = false;
  readonly era: Era;
  readonly mood: Mood;

  constructor(ac: AudioContext, dest: GainNode, era: Era, mood: Mood, fadeIn: number) {
    this.ac = ac; this.era = era; this.mood = mood;
    this.bus = ac.createGain();
    this.bus.gain.value = 0;
    this.bus.connect(dest);
    const now = ac.currentTime;
    this.bus.gain.setValueAtTime(0, now);
    this.bus.gain.linearRampToValueAtTime(busLevel(era, mood), now + fadeIn);
    this.t0 = now + 0.05;
    this.st = newState(era, mood, Math.floor(Math.random() * 2147483647));
    if (era === 2) this.buildDron();
    this.tick();
    this.timer = window.setInterval(() => this.tick(), 350);
  }

  private buildDron(): void {
    const ac = this.ac;
    const base = this.mood === 'bitwa' ? LEVELS.dronBitwa : LEVELS.dronMapa;
    const out = ac.createGain();
    out.gain.value = 0;
    const now = ac.currentTime;
    out.gain.setValueAtTime(0, now);
    out.gain.linearRampToValueAtTime(base, now + DRON.attack);
    out.connect(this.bus);
    const rootHz = midiHz(DRON.rootMidi);
    for (const p of DRON.partials) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = rootHz * p.ratio;
      const g = ac.createGain(); g.gain.value = p.gain;
      const pan = ac.createStereoPanner(); pan.pan.value = p.pan;
      osc.connect(g); g.connect(pan); pan.connect(out);
      osc.start(now);
      this.dronOsc.push(osc);
    }
    const lfo = ac.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = DRON.lfoHz;
    const lg = ac.createGain(); lg.gain.value = base * DRON.lfoDepth;
    lfo.connect(lg); lg.connect(out.gain);
    lfo.start(now);
    this.dronOsc.push(lfo);
    this.dronOut = out;
  }

  private tick(): void {
    if (this.disposed) return;
    const target = this.ac.currentTime - this.t0 + LOOKAHEAD;
    if (target <= this.horizon) return;
    const evs: NoteEvent[] = [];
    composeUntil(this.st, target, evs);
    this.horizon = target;
    for (const e of evs) this.schedule(e);
  }

  private schedule(e: NoteEvent): void {
    const ac = this.ac;
    const mono = renderEvent(ac.sampleRate, e);
    const buf = ac.createBuffer(1, mono.length, ac.sampleRate);
    // Fix typów (gra/ TS lib): renderEvent zwraca Float32Array (backing ArrayBuffer w runtime),
    // ale nowszy lib.dom oczekuje Float32Array<ArrayBuffer> — cast bez zmiany runtime.
    buf.copyToChannel(mono as Float32Array<ArrayBuffer>, 0);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = e.gain * LEVELS[e.typ];
    const pan = ac.createStereoPanner();
    pan.pan.value = e.pan;
    src.connect(g); g.connect(pan); pan.connect(this.bus);
    const when = Math.max(ac.currentTime + 0.02, this.t0 + e.t);
    src.onended = () => { src.disconnect(); g.disconnect(); pan.disconnect(); };
    src.start(when);
  }

  fadeOutAndDispose(sec: number): void {
    const now = this.ac.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setValueAtTime(this.bus.gain.value, now);
    this.bus.gain.linearRampToValueAtTime(0.0001, now + sec);
    window.setTimeout(() => this.dispose(), (sec + 0.3) * 1000);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
    for (const o of this.dronOsc) { try { o.stop(); } catch { /* już zatrzymany */ } }
    if (this.dronOut) this.dronOut.disconnect();
    this.bus.disconnect();
  }
}

function spawnEngine(era: Era, mood: Mood, fadeIn: number): void {
  if (!ctx || !graf) return;
  engines.push(new EngineAudio(ctx, graf.mix, era, mood, fadeIn));
}

// ---------------------------------------------------------------------------
// API PUBLICZNE
// ---------------------------------------------------------------------------

/**
 * Startuje muzykę (w aktualnej epoce; domyślnie 1 = kamień). MUSI być wywołane
 * z gestu użytkownika (klik/klawisz) — wymóg autoplay przeglądarek;
 * AudioContext tworzony jest dopiero tutaj.
 */
export function startMusic(mood: Mood = 'mapa'): void {
  moodNow = mood;
  if (ctx === null) {
    const w = window as unknown as { AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) return; // brak Web Audio — cicho odpuszczamy
    ctx = new AC();
    graf = buildGraf(ctx);
  }
  if (ctx.state === 'suspended') { void ctx.resume(); }
  if (playing) {
    const active = engines.filter((e) => e.mood === mood && e.era === eraNow);
    if (active.length === 0) respawn(XFADE);
    return;
  }
  playing = true;
  spawnEngine(eraNow, mood, 1.5);
}

function respawn(fade: number): void {
  for (const e of engines) e.fadeOutAndDispose(fade);
  engines = [];
  spawnEngine(eraNow, moodNow, fade);
}

/** Płynna zmiana nastroju (crossfade ~4 s). Bez efektu, gdy muzyka nie gra. */
export function setMood(mood: Mood): void {
  if (mood === moodNow && playing) return;
  moodNow = mood;
  if (!playing || !ctx || !graf) return;
  respawn(XFADE);
}

/**
 * Zmiana EPOKI: 1 = kamień, 2 = brąz; era >= 3 (żelazo itd.) gra na razie
 * brązem. Crossfade ~6 s — awans epoki ma być słyszalną nagrodą.
 * Można wołać też przed startem muzyki (ustawia epokę startową).
 */
export function setEra(era: number): void {
  const e: Era = era >= 2 ? 2 : 1;
  if (e === eraNow) return;
  eraNow = e;
  if (!playing || !ctx || !graf) return;
  respawn(ERA_XFADE);
}

/** Aktualna epoka muzyki (1 = kamień, 2 = brąz). */
export function getEra(): Era { return eraNow; }

/** Głośność 0..1 (krzywa percepcyjna ^1.6). */
export function setMusicVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  if (ctx && graf) {
    graf.sum.gain.setTargetAtTime(volCurve(volume), ctx.currentTime, 0.05);
  }
}

/** Zatrzymuje muzykę (fade ~1 s). AudioContext zostaje do ponownego użycia. */
export function stopMusic(): void {
  if (!playing) return;
  playing = false;
  for (const e of engines) e.fadeOutAndDispose(1.0);
  engines = [];
}

export function isMusicPlaying(): boolean { return playing; }

/** Aktualny nastrój (ostatnio żądany). */
export function getMood(): Mood { return moodNow; }
