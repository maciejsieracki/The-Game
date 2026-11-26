// Model R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1 (2026-11-26).
// Wejście dla bundla esbuild: wywołuje PRAWDZIWE funkcje silnika gry (nie reimplementację).
// Budowa i uruchomienie (cwd = korzeń repo, poza repo tylko bundle):
//   npx -y esbuild@0.24.0 dyspozycje/analizy/model-kultura-religia-entry.ts --bundle --platform=node --format=cjs --outfile=$SCRATCH/model.cjs --log-level=warning
//   node $SCRATCH/model.cjs
// Zero zmian w gra/**: plik tylko importuje moduły gry.

import { readFileSync } from 'fs';
import {
  computeHappinessBreakdown,
  computeLawBreakdown,
  computePorPct,
  loadRevoltParams,
  porPctBand,
  tierFromPorPct,
  updateRevoltGrace,
  type RevoltGraceState,
} from '../../gra/src/game/society-breakdown';
import { loadOrderParams } from '../../gra/src/game/order';
import { szMaxForCity, prawMaxForCity } from '../../gra/src/game/society-breakdown';

type Diff = 'easy' | 'normal' | 'hard';
const DIFFS: Diff[] = ['easy', 'normal', 'hard'];
const SOC0: any = JSON.parse(readFileSync('gra/data/society-params.json', 'utf8'));
const clone = (o: any): any => JSON.parse(JSON.stringify(o));

const POP = 5;
const SZ_CAP = 120;

interface Variant { nazwa: string; x: number[] | null; clamp: boolean; floor?: number; }
const VARIANTS: Variant[] = [
  { nazwa: 'MALY (obecne x=10/16/23, obciecie od dolu)', x: null, clamp: true },
  { nazwa: 'NEUTRALNY x=7/11/16, obciecie od dolu', x: [7, 11, 16], clamp: true },
  { nazwa: 'NEUTRALNY x=7/11/16, BEZ obciecia od dolu', x: [7, 11, 16], clamp: false },
  { nazwa: 'DUZY x=16/23/33, obciecie od dolu', x: [16, 23, 33], clamp: true },
  { nazwa: 'DUZY x=16/23/33, BEZ obciecia od dolu', x: [16, 23, 33], clamp: false },
  { nazwa: 'DUZY x=16/23/33, dolny prog Sz% = -50', x: [16, 23, 33], clamp: false, floor: -50 },
  { nazwa: 'DUZY x=16/23/33, dolny prog Sz% = -100', x: [16, 23, 33], clamp: false, floor: -100 },
];

function socFor(v: Variant): any {
  const s = clone(SOC0);
  if (v.x) for (const d of DIFFS) s.szczescie.szczescie_skala_kultura_religia[d] = v.x;
  return s;
}

interface Bld { nazwa: string; temple: boolean; garn: boolean; pret: boolean; }
const B_NONE: Bld = { nazwa: 'bez budynkow', temple: false, garn: false, pret: false };
const B_GARN: Bld = { nazwa: 'Garnizon(bud.)', temple: false, garn: true, pret: false };
const B_TGARN: Bld = { nazwa: 'Swiatynia+Garnizon(bud.)', temple: true, garn: true, pret: false };
const B_TGARNPRET: Bld = { nazwa: 'Swiatynia+Garnizon+Pretorium', temple: true, garn: true, pret: true };
// Era 1: Swiatynia wymaga epoki 2 i Kamiennych kregow (buildings.json), wiec tylko dwa zestawy.
function bldSets(era: number): Bld[] {
  if (era <= 1) return [B_NONE, B_GARN];
  if (era === 2) return [B_NONE, B_GARN, B_TGARN];
  return [B_NONE, B_GARN, B_TGARN, B_TGARNPRET];
}

const SCEN = [
  { nazwa: 'a) wlasna kult. + wlasna relig.', c: 1, r: 1 },
  { nazwa: 'b) obca kultura, wlasna relig.', c: 0, r: 1 },
  { nazwa: 'c) wlasna kultura, obca relig.', c: 1, r: 0 },
  { nazwa: 'd) obca kultura + obca relig.', c: 0, r: 0 },
];

interface Res { sz: number; szNoClamp: number; netto: number; pr: number; por: number; band: string; tier: string; revoltTurn: number | null; }

function evalCase(soc: any, diff: Diff, era: number, v: Variant, c: number, r: number, b: Bld, n: number, postCapture: boolean): Res {
  const hb = computeHappinessBreakdown({
    difficulty: diff, era, population: POP,
    buildingZadowolenie: b.temple ? 2 : 0,
    ownCultureShare: c, ownReligionShare: r,
  }, soc);
  const lb = computeLawBreakdown({
    difficulty: diff, era, population: POP, garnizonCount: n,
    hasGarnizonBudynek: b.garn, hasPretorium: b.pret,
  }, soc);
  const szNoClamp = Math.min(SZ_CAP, Math.round(100 * hb.netto / hb.szMax * 10) / 10);
  const sz = v.floor !== undefined ? Math.min(SZ_CAP, Math.max(v.floor, Math.round(100 * hb.netto / hb.szMax * 10) / 10)) : (v.clamp ? hb.szPct : szNoClamp);
  const pr = postCapture ? 100 : lb.prawPct;
  const op = loadOrderParams(soc, diff);
  const rv = loadRevoltParams(soc, diff);
  const por = computePorPct(sz, pr, op);
  let g: RevoltGraceState | null = null;
  let revoltTurn: number | null = null;
  for (let t = 1; t <= 10; t++) {
    g = updateRevoltGrace(g?.revoltGraceRemaining ?? null, por, rv);
    if (g.shouldTriggerRebellion) { revoltTurn = t; break; }
  }
  return { sz, szNoClamp, netto: hb.netto, pr, por, band: porPctBand(por, rv.criticalPorPct), tier: tierFromPorPct(por), revoltTurn };
}

function minUnits(soc: any, diff: Diff, era: number, v: Variant, c: number, r: number, b: Bld, target: number, postCapture = false): string {
  for (let n = 0; n <= 6; n++) {
    if (evalCase(soc, diff, era, v, c, r, b, n, postCapture).por >= target) return String(n);
  }
  return '>6';
}

const out: string[] = [];
const p = (s = '') => out.push(s);

p('# MODEL KULTURA/RELIGIA — silnik gry (bundle), miasto pop 5');
p('# Kolumny: Sz% = szczescie, Pr% = prawo, Por% = porzadek, pasmo, tier, tura buntu (grace z updateRevoltGrace; "-" = brak)');
p('');

p('== A. Tabela pelna: NORMAL, epoka 1, wariant MALY (obecne wartosci)');
p('scenariusz | budynki | garn | Sz% | Pr% | Por% | pasmo | tier | tura buntu');
for (const s of SCEN) for (const b of bldSets(1)) for (let n = 0; n <= 6; n++) {
  const x = evalCase(SOC0, 'normal', 1, VARIANTS[0], s.c, s.r, b, n, false);
  p(`${s.nazwa} | ${b.nazwa} | ${n} | ${x.sz} | ${x.pr} | ${x.por} | ${x.band} | ${x.tier} | ${x.revoltTurn ?? '-'}`);
}
p('');
p('== A2. Ten sam zestaw z wymuszonym Prawem 100% (5 tur po podboju, post-capture): NORMAL epoka 1, MALY');
for (const s of SCEN) {
  const x0 = evalCase(SOC0, 'normal', 1, VARIANTS[0], s.c, s.r, B_NONE, 0, true);
  p(`${s.nazwa} | garn 0 | Por% ${x0.por} | ${x0.band} | ${x0.tier} | tura buntu ${x0.revoltTurn ?? '-'}`);
}
p('');

p('== B. Minimalna liczba jednostek garnizonu (wszystkie trudnosci, epoki 1-3, wszystkie warianty)');
p('prog Por% >= 30 = tier neutral; prog Por% >= 12 (krytyczny, normal) = poza buntem skrajnym; wartosc progu z porzadek_prog_bunt_skrajny_pct per trudnosc');
p('trudnosc | epoka | wariant | scenariusz | budynki | min do neutral (30) | min do poza buntem skrajnym (prog krytyczny)');
for (const diff of DIFFS) {
  for (const era of [1, 2, 3]) {
    for (const v of VARIANTS) {
      const soc = socFor(v);
      const rvCrit = loadRevoltParams(soc, diff).criticalPorPct;
      for (const s of SCEN) for (const b of bldSets(era)) {
        p(`${diff} | ${era} | ${v.nazwa} | ${s.nazwa} | ${b.nazwa} | ${minUnits(soc, diff, era, v, s.c, s.r, b, 30)} | ${minUnits(soc, diff, era, v, s.c, s.r, b, rvCrit)}`);
      }
    }
  }
}
p('');

p('== C. Wariant MALY, NORMAL, epoka 1, scenariusz d, garn 0-6 — porownanie z wariantami przy tym samym n');
for (const v of VARIANTS) {
  const row: string[] = [];
  for (let n = 0; n <= 6; n++) {
    const x = evalCase(socFor(v), 'normal', 1, v, 0, 0, B_NONE, n, false);
    row.push(`n${n}:${x.por}(${x.band})`);
  }
  p(`${v.nazwa} | ${row.join(' ')}`);
}
p('');

p('== D. Roznica a-d (pusty pop 5, NORMAL, epoka 1, MALY): Sz% i Por%');
{
  const a = evalCase(SOC0, 'normal', 1, VARIANTS[0], 1, 1, B_NONE, 0, false);
  const d = evalCase(SOC0, 'normal', 1, VARIANTS[0], 0, 0, B_NONE, 0, false);
  p(`Sz% a=${a.sz} d=${d.sz} roznica=${Math.round((a.sz - d.sz) * 10) / 10} | Por% a=${a.por} d=${d.por} roznica=${Math.round((a.por - d.por) * 10) / 10}`);
}
p('');

p('== E. Trudnosc: garnizon budynek/jednostka i cap — dla d, MALY, epoka 1 i 3 (bez budynkow)');
for (const diff of DIFFS) {
  for (const era of [1, 3]) {
    const soc = socFor(VARIANTS[0]);
    const row: string[] = [];
    for (let n = 0; n <= 6; n++) {
      const x = evalCase(soc, diff, era, VARIANTS[0], 0, 0, B_NONE, n, false);
      row.push(`n${n}:${x.por}(${x.band})`);
    }
    p(`${diff} epoka ${era} | ${row.join(' ')}`);
  }
}

p('');
p('== F. Kontrola skladowych (diff, epoka 1, pop 5): mianowniki i linie netto dla scenariusza a i d');
for (const diff of DIFFS) {
  const hbA = computeHappinessBreakdown({ difficulty: diff, era: 1, population: POP, buildingZadowolenie: 0, ownCultureShare: 1, ownReligionShare: 1 }, SOC0);
  const hbD = computeHappinessBreakdown({ difficulty: diff, era: 1, population: POP, buildingZadowolenie: 0, ownCultureShare: 0, ownReligionShare: 0 }, SOC0);
  const linesA = hbA.lines.map((l: any) => `${l.id}=${l.value}`).join(', ');
  const linesD = hbD.lines.map((l: any) => `${l.id}=${l.value}`).join(', ');
  p(`${diff}: szMaxForCity=${szMaxForCity(1, POP)} prawMaxForCity=${prawMaxForCity(1, POP)} | a: netto=${hbA.netto} szPct=${hbA.szPct} linie[${linesA}] | d: netto=${hbD.netto} szPct=${hbD.szPct} linie[${linesD}]`);
}

console.log(out.join('\n'));
