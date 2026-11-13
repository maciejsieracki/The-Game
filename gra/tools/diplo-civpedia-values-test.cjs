#!/usr/bin/env node
/**
 * diplo-civpedia-values-test.cjs — R-WEB-DIPLO-CIVPEDIA-Q1.
 *
 * Sprawdza, czy liczby w tabelach „Parametry” haseł dyplomacji (encyklopedia)
 * zgadzają się z plikami gra/data/*.json oraz (dla wartości zakodowanych w TS)
 * z gra/src/game/*.ts.
 *
 * Format wiersza w haśle:  | <liczba> | `<plik.json>:<klucz.z.kropkami>` | ...
 *                          | <liczba> | `kod:<identyfikator>` | ...
 *
 * Test zawiera także samo-test mutacji: zmiana liczby w haśle musi być wykryta.
 * Uruchom: node gra/tools/diplo-civpedia-values-test.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'gra', 'data');
const SRC_GAME = path.join(ROOT, 'gra', 'src', 'game');
const POJECIA = path.join(ROOT, 'docs', 'encyklopedia', 'pojecia');

const HASLA = [
  'zaufanie.md',
  'respekt.md',
  'relacja.md',
  'moc-podzial.md',
  'zmeczenie-wojna.md',
  'wypowiedzenie-wojny.md',
  'rozejm-pokoj.md',
  'wiarygodnosc.md',
];

const WYMAGANE_SEKCJE = ['Plusy i minusy', 'Parametry'];

let fails = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    fails += 1;
    console.log('FAIL: ' + msg);
  }
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function readJson(name) {
  return JSON.parse(readText(path.join(DATA_DIR, name)));
}

function resolveDotted(obj, dotted) {
  let cur = obj;
  for (const part of dotted.split('.')) {
    if (cur === null || cur === undefined || !(part in Object(cur))) return undefined;
    cur = cur[part];
  }
  return cur;
}

/** Wartości zakodowane w kodzie TS: identyfikator -> funkcja zwracająca [wartośćLiczbowa | null, opis]. */
const KOD_CHECKS = {
  'zerwanie-traktatu': () => {
    const src = readText(path.join(SRC_GAME, 'diplomacy.ts'));
    const m = src.match(/case 'zerwanie_traktatu':[\s\S]{0,400}?dZ = (-?\d+(?:\.\d+)?);/);
    return m ? Number(m[1]) : null;
  },
  'respekt-wzor': () => {
    const src = readText(path.join(SRC_GAME, 'diplomacy.ts'));
    return /Math\.round\(100 \* potegaSelf \/ sum\)/.test(src) ? 100 : null;
  },
  'etykieta-wrogi': () => labelThreshold('Wrogi'),
  'etykieta-nieufny': () => labelThreshold('Nieufny'),
  'etykieta-neutralny': () => labelThreshold('Neutralny'),
  'etykieta-zyczliwy': () => labelThreshold('Życzliwy'),
  'relacja-max': () => {
    const src = readText(path.join(SRC_GAME, 'diplomacy-display.ts'));
    const m = src.match(/Math\.max\(0, Math\.min\((\d+), Math\.round\(zaufanie \+ respekt\)/);
    return m ? Number(m[1]) : null;
  },
  'truce-option-min': () => truceOptions()[0],
  'truce-option-max': () => truceOptions()[2],
  'truce-default': () => {
    const m = readText(path.join(SRC_GAME, 'diplomacy-peace-lock.ts')).match(/TRUCE_DEFAULT_TURNS = (\d+)/);
    return m ? Number(m[1]) : null;
  },
  'truce-ai-fatigue': () => constNumber('diplomacy-peace-lock.ts', 'TRUCE_AI_FATIGUE_PEACE_MIN'),
  'truce-ai-willingness': () => constNumber('diplomacy-peace-lock.ts', 'TRUCE_AI_WILLINGNESS_PEACE_MIN'),
  'truce-ai-trust': () => constNumber('diplomacy-peace-lock.ts', 'TRUCE_AI_TRUST_PEACE_MIN'),
  'power-bitwy-coeff': () => {
    const m = readText(path.join(SRC_GAME, 'power-objective.ts')).match(/battleModel === 'enemy_m_sum' \? (\d+) :/);
    return m ? Number(m[1]) : null;
  },
  'ai-prog-wojna-sila': () => tsConst('ai.ts', 'PROG_WOJNA_SILA'),
  'ai-prog-wojna-agresja': () => tsConst('ai.ts', 'PROG_WOJNA_AGRESJA'),
  'ai-early-no-war-turns': () => tsConst('ai.ts', 'AI_MAJOR_EARLY_NO_WAR_TURNS'),
  'power-zdobycze-coeff': () => {
    const m = readText(path.join(SRC_GAME, 'power-objective.ts')).match(/row\('zdobycze'[^\n]*, (\d+), false\)/);
    return m ? Number(m[1]) : null;
  },
};

function labelThreshold(label) {
  const src = readText(path.join(SRC_GAME, 'diplomacy-display.ts'));
  const re = new RegExp("if \\(s < (\\d+)\\) return '" + label + "';");
  const m = src.match(re);
  return m ? Number(m[1]) : null;
}

function truceOptions() {
  const m = readText(path.join(SRC_GAME, 'diplomacy-peace-lock.ts')).match(/TRUCE_DURATION_OPTIONS[^=]*=\s*Object\.freeze\(\[(\d+), (\d+), (\d+)\]\)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [null, null, null];
}

/** Stała `export const NAZWA = liczba;` w gra/src/game (dowolna liczba spacji przed =). */
function tsConst(file, name) {
  const m = readText(path.join(SRC_GAME, file)).match(new RegExp('const ' + name + '\\s*(?::[^=]+)?=\\s*([\\d.]+)'));
  return m ? Number(m[1]) : null;
}

function constNumber(file, name) {
  const m = readText(path.join(SRC_GAME, file)).match(new RegExp(name + ' = ([\\d.]+)'));
  return m ? Number(m[1]) : null;
}

const JSON_CACHE = {};
function jsonByName(name) {
  if (!JSON_CACHE[name]) JSON_CACHE[name] = readJson(name);
  return JSON_CACHE[name];
}

function expectedValue(ref) {
  if (ref.startsWith('kod:')) {
    const id = ref.slice(4);
    const fn = KOD_CHECKS[id];
    if (!fn) return { error: 'nieznany identyfikator kod: ' + id };
    const v = fn();
    if (v === null || v === undefined) return { error: 'nie znaleziono w kodzie: ' + id };
    return { value: v };
  }
  const idx = ref.indexOf(':');
  if (idx < 0) return { error: 'zły format odwołania: ' + ref };
  const file = ref.slice(0, idx);
  const key = ref.slice(idx + 1);
  const data = jsonByName(file);
  const v = resolveDotted(data, key);
  if (typeof v !== 'number') return { error: 'brak wartości liczbowej: ' + ref };
  return { value: v };
}

/** Zwraca listę rozbieżności dla tekstu hasła (bez zapisu na dysk). */
function checkDocText(text, name) {
  const problems = [];
  const rowRe = /^\|\s*(-?[\d.]+)\s*\|\s*`([^`]+)`/gm;
  let m;
  let n = 0;
  while ((m = rowRe.exec(text)) !== null) {
    n += 1;
    const shown = Number(m[1]);
    const ref = m[2];
    const exp = expectedValue(ref);
    if (exp.error) {
      problems.push(name + ': ' + exp.error);
      continue;
    }
    if (Math.abs(exp.value - shown) > 1e-9) {
      problems.push(name + ': ' + ref + ' w haśle=' + shown + ' w kodzie/JSON=' + exp.value);
    }
  }
  return { problems, rows: n };
}

// ---- Sekcja 1: obecność haseł i wymaganych sekcji ----
let totalRows = 0;
for (const f of HASLA) {
  const p = path.join(POJECIA, f);
  ok(fs.existsSync(p), 'brak hasła ' + f);
  if (!fs.existsSync(p)) continue;
  const text = readText(p);
  for (const s of WYMAGANE_SEKCJE) {
    ok(text.includes(s), f + ': brak sekcji „' + s + '”');
  }
}

// ---- Sekcja 2: zgodność liczb ----
for (const f of HASLA) {
  const p = path.join(POJECIA, f);
  if (!fs.existsSync(p)) continue;
  const res = checkDocText(readText(p), f);
  totalRows += res.rows;
  ok(res.rows > 0, f + ': brak wierszy parametrów do sprawdzenia');
  for (const pr of res.problems) ok(false, pr);
}
ok(totalRows >= 60, 'za mało sprawdzonych wierszy parametrów: ' + totalRows);

// ---- Sekcja 3: wartości kluczowe z dodatku (start, kary, progi, Power, zmęczenie) ----
const dip = jsonByName('diplomacy.json').params;
ok(dip.startZaufanie === 20, 'start zaufania ≠ 20');
ok(dip.startRespekt === 30, 'start respektu ≠ 30');
ok(dip.ekspansjaGranica_zaufanie_perTura === -3 && dip.ekspansjaGranicaBraz_zaufanie_perTura === -4 && dip.ekspansjaGranicaZelazo_zaufanie_perTura === -5, 'kary sąsiedztwa ≠ −3/−4/−5');
ok(dip.wspolnaReligia_zaufanie_perTura === 0 && dip.odmiennaReligia_zaufanie_perTura === 0, 'religia wpływa na Zaufanie (oczekiwane 0/0)');
ok(dip.rozejm_zaufanie_ustawienie === 10 && dip.pokoj_zaufanie_ustawienie === 20, 'ustawienie Zaufania po rozejmie/pokoju ≠ 10/20');
ok(readText(path.join(ROOT, 'gra', 'src', 'main.ts')).includes('rozejm_zaufanie_ustawienie'), 'rozejm_zaufanie_ustawienie nie jest czytany w gra/src/main.ts');
ok(expectedValue('kod:etykieta-wrogi').value === 30 && expectedValue('kod:etykieta-nieufny').value === 45 && expectedValue('kod:etykieta-neutralny').value === 60 && expectedValue('kod:etykieta-zyczliwy').value === 120, 'progi etykiet ≠ 30/45/60/120');
const pw = jsonByName('power-params.json').skladniki;
ok(pw.jednostka_wojskowa.pkt === 2.5 && pw.rekrut_ekw_jednostki.pkt === 10 && pw.miasto.pkt === 50 && pw.tech_zbadane.pkt === 80, 'składniki Power ≠ oczekiwane');
const wz = jsonByName('war-weariness-params.json');
ok(wz.zmeczenie.pelneTur === 200 && wz.zmeczenie.wagaStratMiasta === 0.03 && wz.zmeczenie.progChetnosci === 0.5 && wz.zmeczenie.progWzajemnyPokoj === 0.8, 'parametry zmęczenia ≠ oczekiwane');

// ---- Sekcja 3b: martwe parametry (klucz z tabeli Parametry musi być czytany przez kod) ----
function walkTs(dir, acc) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walkTs(p, acc);
    else if (p.endsWith('.ts')) acc.push(p);
  }
  return acc;
}
const SRC_ALL = walkTs(path.join(ROOT, 'gra', 'src'), []).map((f) => readText(f)).join('\n');
for (const f of HASLA) {
  const p = path.join(POJECIA, f);
  if (!fs.existsSync(p)) continue;
  const keys = [...readText(p).matchAll(/`diplomacy\.json:params\.([A-Za-z0-9_]+)`/g)].map((m) => m[1]);
  for (const k of new Set(keys)) {
    const uses = (SRC_ALL.match(new RegExp('\\b' + k + '\\b', 'g')) || []).length;
    ok(uses >= 2, f + ': parametr „' + k + '” nie jest czytany w kodzie gra/src (martwy, uses=' + uses + ')');
  }
}

// ---- Sekcja 3c: liczby w prozie (Start) zgodne z JSON ----
const PROZA_START = [
  ['zaufanie.md', 'startZaufanie'],
  ['respekt.md', 'startRespekt'],
];
function checkProzaStart(text, name, key) {
  const m = text.match(/Start: \*\*(-?\d+)\*\*/);
  if (!m) return 'brak wzorca „Start: **N**” w ' + name;
  return Number(m[1]) === dip[key] ? null : name + ': proza „Start” = ' + m[1] + ', a params.' + key + ' = ' + dip[key];
}
for (const [f, key] of PROZA_START) {
  const p = path.join(POJECIA, f);
  if (!fs.existsSync(p)) continue;
  const prob = checkProzaStart(readText(p), f, key);
  ok(prob === null, prob || (f + ': start OK'));
}

// ---- Sekcja 4: samo-test mutacji (zmiana liczby w haśle MUSI być wykryta) ----
const zaufaniePath = path.join(POJECIA, 'zaufanie.md');
{
  const sp = path.join(POJECIA, 'zaufanie.md');
  if (fs.existsSync(sp)) {
    const orig = readText(sp);
    const mutated = orig.replace('Start: **20**', 'Start: **21**');
    ok(mutated !== orig, 'mutacja prozy: brak wzorca „Start: **20**” w zaufanie.md');
    ok(checkProzaStart(mutated, 'zaufanie.md (mutacja)', 'startZaufanie') !== null, 'mutacja liczby w prozie „Start” NIE została wykryta');
  }
}
if (fs.existsSync(zaufaniePath)) {
  const orig0 = readText(zaufaniePath);
  const needleZ = '| -5 | `diplomacy.json:params.ekspansjaGranicaZelazo_zaufanie_perTura` |';
  ok(orig0.includes(needleZ), 'mutacja: brak wiersza kary Żelazo (−5) w zaufanie.md');
  const mutZ = orig0.replace(needleZ, '| -4 | `diplomacy.json:params.ekspansjaGranicaZelazo_zaufanie_perTura` |');
  ok(checkDocText(mutZ, 'zaufanie.md (mutacja)').problems.some((p) => p.includes('ekspansjaGranicaZelazo')), 'mutacja kary sąsiedztwa Żelazo NIE została wykryta');
}
if (fs.existsSync(zaufaniePath)) {
  const orig = readText(zaufaniePath);
  const needle = '| 20 | `diplomacy.json:params.startZaufanie` |';
  ok(orig.includes(needle), 'mutacja: brak wiersza wzorcowego w zaufanie.md');
  const mutated = orig.replace(needle, '| 21 | `diplomacy.json:params.startZaufanie` |');
  const res = checkDocText(mutated, 'zaufanie.md (mutacja)');
  ok(res.problems.some((p) => p.includes('startZaufanie')), 'mutacja liczby startZaufanie NIE została wykryta');
}

if (fails > 0) {
  console.log('\nWYNIK: CZERWONY — ' + fails + ' z ' + checks + ' sprawdzeń niezgodnych');
  process.exit(1);
}
console.log('PASS: ' + checks + ' sprawdzeń, wierszy parametrów w haśle: ' + totalRows);
