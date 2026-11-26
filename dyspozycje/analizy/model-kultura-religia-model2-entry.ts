// Model R-WEB-CULT-REL-MODEL2-Q1 (2026-11-26), tag CULTRELMODEL2 (#176).
// Wejście dla bundla esbuild: wywołuje PRAWDZIWE funkcje silnika gry (nie reimplementację).
// Zero zmian w gra/**: plik tylko importuje moduły gry i liczy dodatkowe linie poza silnikiem.
//
// Budowa i uruchomienie (cwd = korzeń repo; bundle poza repo):
//   npx -y esbuild@0.24.0 dyspozycje/analizy/model-kultura-religia-model2-entry.ts --bundle --platform=node --format=cjs --outfile=$SCR/model2.cjs --log-level=warning
//   node $SCR/model2.cjs > $SCR/model2-out.md
//
// Propozycja właściciela (korekta z 2026-11-26, obowiązująca):
//   dla KAŻDEJ z dwóch linii (kultura, religia), epoka 1:
//     łatwy:   D=−10, G=+10
//     normalny: D=−15, G=+5
//     trudny:  D=−20, G=0
//   wartość linii = D + (G − D) · udział_własnej  (D = miasto w całości obce, G = w całości własne)
//   linie działają na SZCZĘŚCIE i na PRAWO (ta sama para granic, punkty Prawa).
//   skala epok: mnożnik x(e)/x(1) z gra/data/society-params.json (1 / 1,6 / 2,3) dla D i G.
//
// Tryby:
//   OBECNE        — dzisiejsza gra (silnik bez zmian: kultura i religia ±x, tylko Szczęście)
//   PROP          — propozycja: linie kultury/religii z granic D/G na Szczęściu i Prawie,
//                   Szczęście obcięte do 0% (jak dziś, clampPct)
//   PROP_BEZ_OBC  — jak PROP, ale Szczęście bez dolnego obcięcia (tylko do góry, cap 120);
//                   służy wyłącznie do odpowiedzi na pytanie „czy obcięcie od 0% zostaje”
//
// Technika: kultReligScaleForEra w silniku przy szczescie_skala_kultura_religia = [0,0,0]
// nie dokłada żadnej linii kultury/religii (proporcjonalneSzczescie(0, s) = 0), więc reszta
// silnika (podatki, osiedle, budynki, mianowniki, cap, wagi Porządku, bunt) zostaje prawdziwa.
// Dodatkowe linie są dodawane do netto Szczęścia i netto Prawa przez tę samą ścieżkę
// (pctFromNetto, computePorPct, updateRevoltGrace) co w grze.

import { readFileSync } from 'fs';
import {
  computeHappinessBreakdown,
  computeLawBreakdown,
  computePorPct,
  loadRevoltParams,
  loadSocietyScaleParams,
  pctFromNetto,
  porPctBand,
  tierFromPorPct,
  updateRevoltGrace,
  type RevoltGraceState,
} from '../../gra/src/game/society-breakdown';
import { loadOrderParams } from '../../gra/src/game/order';

type Diff = 'easy' | 'normal' | 'hard';
const DIFFS: Diff[] = ['easy', 'normal', 'hard'];
const SOC0: any = JSON.parse(readFileSync('gra/data/society-params.json', 'utf8'));
const clone = (o: any): any => JSON.parse(JSON.stringify(o));

const X_BASE: number[] = (SOC0.szczescie.szczescie_skala_kultura_religia.normal as number[]).slice(0, 3);
const ERA_MULT: number[] = X_BASE.map((v) => v / X_BASE[0]); // [1, 1.6, 2.3]

const SOC_ZERO: any = clone(SOC0);
for (const d of DIFFS) SOC_ZERO.szczescie.szczescie_skala_kultura_religia[d] = [0, 0, 0];

interface B2 { D: number; G: number; }
const PROP: Record<Diff, B2> = {
  easy: { D: -10, G: 10 },
  normal: { D: -15, G: 5 },
  hard: { D: -20, G: 0 },
};

type Mode = 'OBECNE' | 'PROP' | 'PROP_BEZ_OBC';
interface Opt { mode: Mode; bounds?: B2; postCapture?: boolean; luks?: number; }

interface Bld { nazwa: string; temple: boolean; garn: boolean; pret: boolean; }
const B_NONE: Bld = { nazwa: 'bez', temple: false, garn: false, pret: false };
const B_GARN: Bld = { nazwa: 'Garn', temple: false, garn: true, pret: false };
const B_TGARN: Bld = { nazwa: 'Swi+Garn', temple: true, garn: true, pret: false };
const B_TGARNPRET: Bld = { nazwa: 'Swi+Garn+Pret', temple: true, garn: true, pret: true };
function bldSets(era: number): Bld[] {
  if (era <= 1) return [B_NONE, B_GARN];
  if (era === 2) return [B_NONE, B_GARN, B_TGARN];
  return [B_NONE, B_GARN, B_TGARN, B_TGARNPRET];
}

const SCEN = [
  { nazwa: 'a', opis: 'wlasna kult. + wlasna relig.', c: 1, r: 1 },
  { nazwa: 'b', opis: 'obca kult., wlasna relig.', c: 0, r: 1 },
  { nazwa: 'c', opis: 'wlasna kult., obca relig.', c: 1, r: 0 },
  { nazwa: 'd', opis: 'obca kult. + obca relig.', c: 0, r: 0 },
];

interface R {
  sz: number; pr: number; por: number; band: string; tier: string;
  revolt: number | null; netSz: number; lawNet: number; extra: number; szMax: number; prawMax: number;
}

function ev(diff: Diff, era: number, pop: number, c: number, r: number, b: Bld, n: number, o: Opt): R {
  const soc = o.mode === 'OBECNE' ? SOC0 : SOC_ZERO;
  const hb = computeHappinessBreakdown({
    difficulty: diff, era, population: pop,
    buildingZadowolenie: b.temple ? 2 : 0,
    ownCultureShare: c, ownReligionShare: r,
    ...(o.luks !== undefined ? { podzialHandlu: { procentLuksus: o.luks } as any } : {}),
  }, soc);
  const lb = computeLawBreakdown({
    difficulty: diff, era, population: pop, garnizonCount: n,
    hasGarnizonBudynek: b.garn, hasPretorium: b.pret,
  }, soc);
  const sc = loadSocietyScaleParams(soc, diff);
  let extra = 0;
  if (o.mode !== 'OBECNE') {
    const B = o.bounds ?? PROP[diff];
    const m = ERA_MULT[era - 1];
    const lo = B.D * m;
    const hi = B.G * m;
    const line = (s: number): number => lo + (hi - lo) * s;
    extra = line(c) + line(r);
  }
  const netSz = hb.netto + extra;
  const sz = o.mode === 'PROP_BEZ_OBC'
    ? Math.min(sc.szPctCap, Math.round(1000 * netSz / hb.szMax) / 10)
    : pctFromNetto(netSz, hb.szMax, sc.szPctCap);
  const lawNet = lb.netto + extra;
  const pr = o.postCapture ? 100 : pctFromNetto(Math.max(0, lawNet), lb.prawMax, sc.prawPctCap);
  const op = loadOrderParams(soc, diff);
  const rv = loadRevoltParams(soc, diff);
  const por = computePorPct(sz, pr, op);
  let g: RevoltGraceState | null = null;
  let revolt: number | null = null;
  for (let t = 1; t <= 10; t++) {
    g = updateRevoltGrace(g?.revoltGraceRemaining ?? null, por, rv);
    if (g.shouldTriggerRebellion) { revolt = t; break; }
  }
  return {
    sz, pr, por, band: porPctBand(por, rv.criticalPorPct), tier: tierFromPorPct(por),
    revolt, netSz, lawNet, extra, szMax: hb.szMax, prawMax: lb.prawMax,
  };
}

const NEUTRAL = 30;
const crit = (diff: Diff): number => loadRevoltParams(SOC0, diff).criticalPorPct;

// Najmniejsza liczba jednostek garnizonu (0..6) z Porządkiem >= target; silnik sam ucina do capu
// (normal/easy 5, hard 4), więc wynik „brak” oznacza: nieosiągalne nawet przy pełnym capie.
function minU(diff: Diff, era: number, pop: number, c: number, r: number, b: Bld, target: number, o: Opt): string {
  for (let n = 0; n <= 6; n++) {
    if (ev(diff, era, pop, c, r, b, n, o).por >= target) return String(n);
  }
  return 'brak';
}

const out: string[] = [];
const p = (s = ''): void => { out.push(s); };
const r1 = (x: number): number => Math.round(x * 10) / 10;

// ---------------------------------------------------------------------------
p('# MODEL 2 — silnik gry (bundle), propozycja właściciela 2026-11-26 (korekta)');
p('');
p('## 0. Granice linii (D = miasto w całości obce, G = w całości własne), skala epok');
p('');
p('| poziom | epoka | mnożnik | D na linię | G na linię | 2 linie: min (obca+obca) | 2 linie: max (własna+własna) |');
p('|---|---|---|---|---|---|---|');
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) {
  const B = PROP[diff]; const m = ERA_MULT[era - 1];
  p(`| ${diff} | ${era} | ×${r1(m)} | ${r1(B.D * m)} | ${r1(B.G * m)} | ${r1(2 * B.D * m)} | ${r1(2 * B.G * m)} |`);
}
p('');
p(`Mnożniki z society-params.json (szczescie_skala_kultura_religia normal = ${X_BASE.join('/')}): ${ERA_MULT.map(r1).join(' / ')}`);
p('');

// ---------------------------------------------------------------------------
p('## 1. Pełna tabela (PROP, obcięcie Szczęścia od 0% jak dziś): min jednostek garnizonu');
p('kolumny: neutral = Porządek ≥ 30 (tier neutralny); wyjście = Porządek ≥ próg buntu skrajnego (per poziom: easy 6, normal 12, hard 14)');
p('');
p('poziom | epoka | pop | scen. | budynki | neutral | wyjście z buntu skrajnego');
p('---|---|---|---|---|---|---');
const FULL: string[] = [];
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) for (const pop of [3, 5, 8])
  for (const s of SCEN) for (const b of bldSets(era)) {
    const o: Opt = { mode: 'PROP' };
    const row = `${diff} | ${era} | ${pop} | ${s.nazwa} (${s.opis}) | ${b.nazwa} | ${minU(diff, era, pop, s.c, s.r, b, NEUTRAL, o)} | ${minU(diff, era, pop, s.c, s.r, b, crit(diff), o)}`;
    FULL.push(row);
  }
for (const l of FULL) p(l);
p('');

// ---------------------------------------------------------------------------
p('## 2. Porównanie: dziś (OBECNE) vs propozycja (PROP), pop 5, neutral / wyjście, wiersz = poziom×epoka×budynki');
p('');
p('| poziom | epoka | budynki | a dziś | a propozycja | b dziś | b propozycja | c dziś | c propozycja | d dziś | d propozycja |');
p('|---|---|---|---|---|---|---|---|---|---|---|');
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) for (const b of bldSets(era)) {
  const cells: string[] = [];
  for (const s of SCEN) {
    const oo: Opt = { mode: 'OBECNE' }; const op: Opt = { mode: 'PROP' };
    cells.push(`${minU(diff, era, 5, s.c, s.r, b, NEUTRAL, oo)}/${minU(diff, era, 5, s.c, s.r, b, crit(diff), oo)}`);
    cells.push(`${minU(diff, era, 5, s.c, s.r, b, NEUTRAL, op)}/${minU(diff, era, 5, s.c, s.r, b, crit(diff), op)}`);
  }
  p(`| ${diff} | ${era} | ${b.nazwa} | ${cells.join(' | ')} |`);
}
p('');

// ---------------------------------------------------------------------------
p('## 3. Wariant bez dolnego obcięcia Szczęścia (PROP_BEZ_OBC), pop 5 — tylko do pytania o 0%');
p('');
p('poziom | epoka | budynki | d neutral | d wyjście | b neutral | b wyjście');
p('---|---|---|---|---|---|---');
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) for (const b of bldSets(era)) {
  const o: Opt = { mode: 'PROP_BEZ_OBC' };
  p(`${diff} | ${era} | ${b.nazwa} | ${minU(diff, era, 5, 0, 0, b, NEUTRAL, o)} | ${minU(diff, era, 5, 0, 0, b, crit(diff), o)} | ${minU(diff, era, 5, 0, 1, b, NEUTRAL, o)} | ${minU(diff, era, 5, 0, 1, b, crit(diff), o)}`);
}
p('');

// ---------------------------------------------------------------------------
p('## 4. Efekt na WŁASNE miasta (scenariusz a = własna kultura + własna religia), bez budynków');
p('');
p('poziom | epoka | pop | garn | PROP: Sz% / Pr% / Por% / tier / tura buntu | OBECNE: Sz% / Pr% / Por% / tier / tura buntu');
p('---|---|---|---|---|---');
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) for (const pop of [1, 2, 5]) for (const n of [0, 1, 2]) {
  const x = ev(diff, era, pop, 1, 1, B_NONE, n, { mode: 'PROP' });
  const y = ev(diff, era, pop, 1, 1, B_NONE, n, { mode: 'OBECNE' });
  const f = (q: R): string => `${q.sz} / ${q.pr} / ${q.por} / ${q.tier} / ${q.revolt ?? '-'}`;
  p(`${diff} | ${era} | ${pop} | ${n} | ${f(x)} | ${f(y)}`);
}
p('');

// ---------------------------------------------------------------------------
p('## 5. Własne miasto bez garnizonu (a) — Szczęście/Prawo składowe, pop 5, epoka 1');
p('');
for (const diff of DIFFS) {
  const x = ev(diff, 1, 5, 1, 1, B_NONE, 0, { mode: 'PROP' });
  const y = ev(diff, 1, 5, 1, 1, B_NONE, 0, { mode: 'PROP_BEZ_OBC' });
  p(`${diff}: PROP netto Sz=${r1(x.netSz)} (szMax ${r1(x.szMax)}), netto Pr=${r1(x.lawNet)} (prawMax ${r1(x.prawMax)}), linie kult+relig=${r1(x.extra)} | PROP_BEZ_OBC Sz%=${y.sz} (netto ${r1(y.netSz)})`);
}
p('');

// ---------------------------------------------------------------------------
p('## 6. Szukanie D lub G dających dokładnie 2 / 3 / 4 (scenariusz d, bez budynków, epoka 1, pop 5)');
p('');
for (const diff of DIFFS) {
  const base = PROP[diff];
  const hitsD: Record<string, number[]> = { '2': [], '3': [], '4': [] };
  const hitsDx: Record<string, number[]> = { '2': [], '3': [], '4': [] };
  for (let D = -60; D <= -1; D++) {
    const v = minU(diff, 1, 5, 0, 0, B_NONE, NEUTRAL, { mode: 'PROP', bounds: { D, G: base.G } });
    if (v in hitsD) hitsD[v].push(D);
  }
  for (let G = -20; G <= 40; G++) {
    const v = minU(diff, 1, 5, 0, 0, B_NONE, NEUTRAL, { mode: 'PROP', bounds: { D: base.D, G } });
    if (v in hitsDx) hitsDx[v].push(G);
  }
  const fmt = (a: number[]): string => (a.length ? `${a[0]}..${a[a.length - 1]} (${a.length} wart.)` : 'brak');
  p(`${diff} (aktualne D=${base.D}, G=${base.G}): D przy G=${base.G} → 2: ${fmt(hitsD['2'])}, 3: ${fmt(hitsD['3'])}, 4: ${fmt(hitsD['4'])} | G przy D=${base.D} → 2: ${fmt(hitsDx['2'])}, 3: ${fmt(hitsDx['3'])}, 4: ${fmt(hitsDx['4'])}`);
}
p('');

// ---------------------------------------------------------------------------
p('## 7. Kontrola skali pojedynczej linii (bez budynków, epoka 1, pop 5, neutral): obca kultura, własna religia (scen. b)');
for (const diff of DIFFS) {
  p(`${diff}: ` + [0, 1, 2, 3, 4].map((n) => {
    const q = ev(diff, 1, 5, 0, 1, B_NONE, n, { mode: 'PROP' });
    return `n${n}:Por ${q.por} (${q.tier})`;
  }).join(' ; '));
}
p('');

p('## 8. Zamożność miasta (podatki, suwak handlu): domyślna 20% (dziś) vs maksymalna 100%, PROP, pop 5, bez budynków');
p('Podatki: −10 przy 0%, +10 przy ≥90% (szczescie_podatki_*); domyślnie −5,6. Scenariusze a (własne) i d (obce).');
p('');
p('poziom | epoka | scen. | garn | Sz% dom. / Por% dom. / tier dom. / tura buntu dom. | Sz% 100% / Por% 100% / tier 100% / tura buntu 100%');
p('---|---|---|---|---|---');
for (const diff of DIFFS) for (let era = 1; era <= 3; era++) for (const s of [SCEN[0], SCEN[3]]) for (const n of [0, 1]) {
  const q1 = ev(diff, era, 5, s.c, s.r, B_NONE, n, { mode: 'PROP' });
  const q2 = ev(diff, era, 5, s.c, s.r, B_NONE, n, { mode: 'PROP', luks: 100 });
  const f = (q: R): string => `${q.sz} / ${q.por} / ${q.tier} / ${q.revolt ?? '-'}`;
  p(`${diff} | ${era} | ${s.nazwa} | ${n} | ${f(q1)} | ${f(q2)}`);
}
p('');

// ---------------------------------------------------------------------------
// Korekta R-WEB-CULT-REL-MODEL2-Q1 r2 (obrona): mutacja D=-12 na trudnym, Świątynia bez Garnizonu,
// liczba tur po zdobyciu (5 tur Prawa 100%, potem zwykłe Prawo) — wszystko przez te same funkcje.
p('');
p('## 9. Mutacja m1: trudny D=−12 (G=0), pop 5, epoka 1, neutral / wyjście — porównanie z propozycją (D=−20)');
p('scen. | budynki | PROP (D−20) | m1 (D−12)');
p('---|---|---|---');
for (const s of SCEN) for (const b of bldSets(1)) {
  const pr: Opt = { mode: 'PROP' };
  const m1: Opt = { mode: 'PROP', bounds: { D: -12, G: 0 } };
  p(`${s.nazwa} | ${b.nazwa} | ${minU('hard', 1, 5, s.c, s.r, b, NEUTRAL, pr)}/${minU('hard', 1, 5, s.c, s.r, b, crit('hard'), pr)} | ${minU('hard', 1, 5, s.c, s.r, b, NEUTRAL, m1)}/${minU('hard', 1, 5, s.c, s.r, b, crit('hard'), m1)}`);
}
p('');
p('## 10. Świątynia BEZ Garnizonu (pakiet „Swi” = sama Świątynia, bez budynku Garnizon), pop 5, neutral / wyjście');
p('Świątynia: epokaWejscia 2, wymaga Kamiennych kręgów w mieście (gra/data/buildings.json); model: zadowolenie 2 (poziom 1), jak w silniku.');
p('poziom | epoka | a | b | c | d');
p('---|---|---|---|---|---');
const B_TEMPLE: Bld = { nazwa: 'Swi', temple: true, garn: false, pret: false };
for (const diff of DIFFS) for (let era = 2; era <= 3; era++) {
  const pr: Opt = { mode: 'PROP' };
  const cells = SCEN.map((s) => `${minU(diff, era, 5, s.c, s.r, B_TEMPLE, NEUTRAL, pr)}/${minU(diff, era, 5, s.c, s.r, B_TEMPLE, crit(diff), pr)}`);
  p(`${diff} | ${era} | ${cells.join(' | ')}`);
}
p('');
p('## 11. Tury do buntu skrajnego po zdobyciu: 5 tur Prawa 100% (postCapture), potem zwykłe Prawo; hard, epoka 1, pop 5, bez garnizonu');
for (const s of [SCEN[0], SCEN[3]]) {
  const pPost = ev('hard', 1, 5, s.c, s.r, B_NONE, 0, { mode: 'PROP', postCapture: true });
  const pNorm = ev('hard', 1, 5, s.c, s.r, B_NONE, 0, { mode: 'PROP' });
  let g: RevoltGraceState | null = null;
  let rev: number | null = null;
  for (let t = 1; t <= 15; t++) {
    const por = t <= 5 ? pPost.por : pNorm.por;
    g = updateRevoltGrace(g?.revoltGraceRemaining ?? null, por, loadRevoltParams(SOC0, 'hard'));
    if (g.shouldTriggerRebellion && rev === null) rev = t;
  }
  p(`${s.nazwa}: Porządek przy postCapture ${pPost.por}%, bez ${pNorm.por}%; rebelia w turze ${rev ?? 'brak do 15'} (bez postCapture: ${ev('hard', 1, 5, s.c, s.r, B_NONE, 0, { mode: 'PROP' }).revolt ?? 'brak'})`);
}
p('');

console.log(out.join('\n'));
