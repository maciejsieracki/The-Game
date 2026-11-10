'use strict';
/**
 * unit-replace-promotion-table-test.cjs -- R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1
 * Walidacja tabeli awansów piechoty w units.json (pole "Zastąp specjalnie").
 * Run from gra/:
 *   node tools/unit-replace-promotion-table-test.cjs
 *
 * Czysta logika na danych (bez esbuild, bez DOM). Sprawdza każdy wpis tabeli:
 *   1. cel istnieje w units.json (dokładna nazwa Jednostka, bez fuzzy matchingu);
 *   2. cel != źródło;
 *   3. cel jest wyżej: wyższa epoka LUB ta sama epoka i wyższa klasa
 *      (Standardowa < Specjalna < Super);
 *   4. nacja: jeśli źródło i cel mają nację, muszą być równe (cel bez nacji
 *      jest dostępny dla każdej nacji; cel narodowy bez nacji źródła -- gating
 *      nacji robi availableReplacementsFor);
 *   5. typ źródła i celu należy do piechoty (Swordsman/Spearman/Falangite/Offensive);
 *   6. brak cykli w grafie (przy punkcie 3 cykl jest niemożliwy, sprawdzane dodatkowo);
 *   7. wpisy spoza piechoty (Zwiadowca, Galera, Procarz, konnica, łucznicy, machiny)
 *      pozostają "—" (decyzja właściciela: luki zamienników bez zmian);
 *   8. dwa istniejące wpisy sprzed tematu (Wojownik mykeński, Wojownik tyrreński) zachowane;
 *   9. pełna zawartość tabeli przypięta do EXPECTED_TABLE (dokładna równość, zarzut 2 r1).
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '..', 'data', 'units.json');
const units = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const INFANTRY_TYPES = new Set(['Swordsman', 'Spearman', 'Falangite', 'Offensive']);
const EPOCH_RANK = { 'Kamień': 1, 'Brąz': 2, 'Żelazo': 3 };
const CLASS_RANK = { 'Standardowa': 1, 'Specjalna': 2, 'Super': 3 };
const BLANK = new Set(['', '-', '—']);

const byName = new Map(units.map(u => [String(u.Jednostka).trim(), u]));
const failures = [];
const fail = msg => failures.push(msg);

function rank(u) {
  const e = EPOCH_RANK[String(u.Epoka).trim()];
  const c = CLASS_RANK[String(u.Klasa).trim()];
  if (!e) fail(`${u.Jednostka}: nieznana Epoka "${u.Epoka}"`);
  if (!c) fail(`${u.Jednostka}: nieznana Klasa "${u.Klasa}"`);
  return { epoch: e || 0, cls: c || 0 };
}

const edges = new Map(); // source -> [target]
let entries = 0;

for (const src of units) {
  const srcName = String(src.Jednostka).trim();
  const raw = String(src['Zastąp specjalnie'] ?? '').trim();
  if (BLANK.has(raw)) continue;
  entries++;
  const targets = raw.split('/').map(s => s.trim()).filter(Boolean);
  const seen = new Set();
  edges.set(srcName, []);

  if (!INFANTRY_TYPES.has(String(src.Typ).trim())) fail(`${srcName}: źródło spoza piechoty (Typ=${src.Typ})`);

  for (const tName of targets) {
    if (seen.has(tName)) fail(`${srcName}: duplikat celu "${tName}"`);
    seen.add(tName);
    if (tName === srcName) { fail(`${srcName}: cel wskazuje samą siebie`); continue; }
    const tgt = byName.get(tName);
    if (!tgt) { fail(`${srcName} -> "${tName}": cel nie istnieje w units.json`); continue; }
    if (!INFANTRY_TYPES.has(String(tgt.Typ).trim())) fail(`${srcName} -> ${tName}: cel spoza piechoty (Typ=${tgt.Typ})`);

    const rs = rank(src), rt = rank(tgt);
    const higher = rt.epoch > rs.epoch || (rt.epoch === rs.epoch && rt.cls > rs.cls);
    if (!higher) fail(`${srcName} -> ${tName}: cel nie jest wyższy (epoka/klasa ${rs.epoch}/${rs.cls} -> ${rt.epoch}/${rt.cls})`);

    const sn = String(src.Nacja ?? '').trim(), tn = String(tgt.Nacja ?? '').trim();
    if (sn && tn && sn !== tn) fail(`${srcName} (${sn}) -> ${tName} (${tn}): różne nacje`);

    edges.get(srcName).push(tName);
  }
}

// cykle (DFS)
const state = new Map();
function dfs(n, stack) {
  if (state.get(n) === 1) { fail(`cykl: ${[...stack, n].join(' -> ')}`); return; }
  if (state.get(n) === 2) return;
  state.set(n, 1);
  for (const m of edges.get(n) || []) dfs(m, [...stack, n]);
  state.set(n, 2);
}
for (const n of edges.keys()) dfs(n, []);

// punkt 7: wpisy poza piechotą bez zmian
for (const u of units) {
  const typ = String(u.Typ).trim();
  const raw = String(u['Zastąp specjalnie'] ?? '').trim();
  if (!INFANTRY_TYPES.has(typ) && !BLANK.has(raw)) fail(`${u.Jednostka}: wpis tabeli poza piechotą (Typ=${typ})`);
}
for (const n of ['Zwiadowca', 'Galera', 'Procarz']) {
  const u = byName.get(n);
  if (u && !BLANK.has(String(u['Zastąp specjalnie'] ?? '').trim())) fail(`${n}: luka zamiennika miała zostać bez zmian`);
}

// punkt 8: istniejące wpisy zachowane
const expectFixed = {
  'Wojownik mykeński': 'Hieros Lochos (Święty Zastęp)',
  'Wojownik tyrreński': 'Evocati',
};
for (const [k, v] of Object.entries(expectFixed)) {
  const got = String(byName.get(k)?.['Zastąp specjalnie'] ?? '').trim();
  if (got !== v) fail(`${k}: oczekiwano "${v}", jest "${got}"`);
}

// kontrole smoke: przykłady z dispatchu
const expectPairs = [
  ['Wojownik', 'Włócznik'],
  ['Włócznik', 'Falanga'],
  ['Włócznik', 'Triari'],
  ['Hastati', 'Evocati'],
  ['Falanga', 'Hieros Lochos (Święty Zastęp)'],
];
for (const [s, t] of expectPairs) {
  const list = edges.get(s) || [];
  if (!list.includes(t)) fail(`brak oczekiwanego wpisu ${s} -> ${t}`);
}

// punkt 9 (R-WEB-UNIT-REPLACE-PROMOTION-TABLE-INFANTRY-Q1 r1 zarzut 2): przypięta pełna zawartość
// tabeli. Każda zmiana pola "Zastąp specjalnie" wymaga świadomej aktualizacji tego słownika
// (oraz akceptacji właściciela) -- sama walidacja integralności nie wystarcza.
const EXPECTED_TABLE = {
    "Wojownik": "Włócznik",
    "Włócznik": "Falanga/Triari/Thorakites/iButho z iklwa/Mur tarcz (Sargonid)/Hu Ben Wei (Gwardia Tygrysa)/uThulwana (Białe Tarcze)/Królewska Gwardia/Medżaj (Gwardia Faraona)/Gwardia Królewska Sumeru",
    "Wojownik z mieczem i tarczą": "Hastati/Gaesatae/Soldurii/Miecznik galijski/Berserker germański/Drużynnik/Garnizon Harappy/Gwardia hetycka/Piechota neobabilońska/Tyrski miecznik/Gwardia Tyreńska/Wojownik z żelaznym khopesh/Hu Ben Wei (Gwardia Tygrysa)/uThulwana (Białe Tarcze)/Królewska Gwardia/Medżaj (Gwardia Faraona)/Gwardia Królewska Sumeru",
    "Falanga": "Hieros Lochos (Święty Zastęp)",
    "Hastati": "Evocati",
    "Triari": "Evocati",
    "Impi": "iButho z iklwa/uThulwana (Białe Tarcze)",
    "Wojownik z maczugą (Chaska)": "Wojownik z toporem/Gwardzista z champi",
    "Wojownik z toporem": "Królewska Gwardia",
    "Wojownik z khopesh": "Wojownik z żelaznym khopesh/Medżaj (Gwardia Faraona)",
    "Włócznik sumeryjski": "Mur tarcz (Sargonid)/Gwardia Królewska Sumeru",
    "Wojownik mykeński": "Hieros Lochos (Święty Zastęp)",
    "Halabardnik Shang": "Hu Ben Wei (Gwardia Tygrysa)",
    "Berserker germański": "Wojownik germański",
    "Wojownik tyrreński": "Evocati",
    "Strażnik bram Harappy": "Garnizon Harappy",
    "Piechota induska": "Garnizon Harappy",
    "Piechota hetycka": "Gwardia hetycka",
    "Gwardia Ishtar": "Piechota neobabilońska",
    "Wojownik babiloński": "Piechota neobabilońska",
    "Wojownik fenicki": "Tyrski miecznik/Gwardia Tyreńska",
    "Thorakites": "Hieros Lochos (Święty Zastęp)",
    "Gwardzista z champi": "Królewska Gwardia"
  };
{
  const actual = {};
  for (const [s, list] of edges) if (list.length) actual[s] = list.join("/");
  const srcAll = new Set([...Object.keys(EXPECTED_TABLE), ...Object.keys(actual)]);
  for (const s of srcAll) {
    if (EXPECTED_TABLE[s] !== actual[s]) fail(`tabela: ${s}: oczekiwano "${EXPECTED_TABLE[s] ?? "—"}", jest "${actual[s] ?? "—"}"`);
  }
}

if (failures.length) {
  console.error(`[unit-replace-promotion-table-test] FAIL (${failures.length})`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`[unit-replace-promotion-table-test] PASS: ${entries} wpisów źródłowych, ${[...edges.values()].reduce((a, l) => a + l.length, 0)} krawędzi, brak cykli`);
