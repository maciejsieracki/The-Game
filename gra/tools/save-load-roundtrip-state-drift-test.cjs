#!/usr/bin/env node
/**
 * R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1 (r3) -- test regresji: zapis -> wczytanie (NOWA sesja przegladarki)
 * -> kolejne tury daje TEN SAM skrot stanu co przebieg ciagly.
 *
 * Zrodlo rozjazdu (zmierzone w r3): stan liczony w KONCOWCE tury N i CZYTANY przez tick tury N+1 byl w pamieci
 * modulu main.ts i nie trafial do zapisu:
 *   (1) nnsAiOverrides -- nadpisania suwakow AI z rownowazenia NNS (racje 0/0 na miastach + oryginaly),
 *   (2) orderMultMap / growthMultMap / orderValueMap -- mnozniki Porzadku z pasa Porzadku poprzedniej tury.
 * Po wczytaniu pierwszy tick liczyl z mnoznikami 1.0 i bez przywrocenia racji -> inny Pieniadz/Luksus/Zamoznosc/racje
 * w miastach AI, trajektoria rozjezdzala sie juz od t+1.
 *
 * Dwie warstwy:
 *   A) STATYCZNA (ułamek sekundy): main.ts musi zapisywac i odtwarzac wszystkie 4 struktury (meta.nnsAiOverrides,
 *      orderMultByCity, orderGrowthMultByCity, orderValueByCity). Mutacja = usuniecie pola z kopii => czerwone.
 *   B) DYNAMICZNA (~5 min / ziarno): runner `ai-economy-measure-run.cjs --resume-test 1` (realny quickSave/loadSlot,
 *      41 AI, 10 tur po wczytaniu skraca sie do --turns - --save-at). allEqual musi byc true; lista pol pomijanych w
 *      haszu musi byc DOKLADNIE znana (nic nie znika po cichu).
 *
 * Uzycie (z gra/):
 *   node tools/save-load-roundtrip-state-drift-test.cjs --static-only 1 [--main <sciezka do main.ts>]   (A)
 *   node tools/save-load-roundtrip-state-drift-test.cjs --dist <abs-dist> --work <abs-katalog> [--seeds 4242,777] [--save-at 6] [--turns 16]   (A+B)
 * Bundle buduje sie POZA repo: vite build --outDir <abs-dist>.  Exit 1 przy kazdym niepowodzeniu.
 */
'use strict';
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(arg('main', path.join(GRA, 'src', 'main.ts')));
const STATIC_ONLY = arg('static-only', '0') === '1';
const SEEDS = arg('seeds', '4242,777').split(',').map(x => parseInt(x, 10)).filter(Number.isFinite);
const SAVE_AT = parseInt(arg('save-at', '6'), 10);
const TURNS = parseInt(arg('turns', '16'), 10);
const DIST = arg('dist', '');
const WORK = path.resolve(arg('work', path.join(os.tmpdir(), `save-load-drift-work-${TMPDIR_RUN_ID}`)));

// Znana, jawna lista roznic pomijanych w haszu runnera (musi sie zgadzac z HASH_IGNORED w runnerze).
const EXPECTED_HASH_IGNORED = [
  'units[].stackGroupId(null)',
  'cities[].budowaLista(gdy [])',
  'cities[].magazynZywnosci(gdy 0)',
  'cities[].postepBudynkowUsuniete(gdy {})',
  'resourceLedgerHistory(#432)',
];

let failures = 0;
function check(ok, msg) {
  console.log((ok ? 'OK    ' : 'FAIL  ') + msg);
  if (!ok) failures++;
}

// ---------------------------------------------------------------- A) STATYCZNA
function staticChecks() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  // zapis (buildSaveGameSnapshot -> meta) -- pole musi sie pojawic jako klucz obiektu z mapa jako zrodlem
  const saveRules = [
    ['zapis nnsAiOverrides', /nnsAiOverrides:\s*Array\.from\(nnsAiOverrides\.entries\(\)\)/],
    ['zapis orderMultByCity', /orderMultByCity:\s*Array\.from\(orderMultMap\.entries\(\)\)/],
    ['zapis orderGrowthMultByCity', /orderGrowthMultByCity:\s*Array\.from\(growthMultMap\.entries\(\)\)/],
    ['zapis orderValueByCity', /orderValueByCity:\s*Array\.from\(orderValueMap\.entries\(\)\)/],
  ];
  for (const [name, re] of saveRules) check(re.test(src), name);
  // odczyt (restoreGameFromSave) -- clear() + odczyt pola meta
  const restoreRules = [
    ['odczyt nnsAiOverrides', /nnsAiOverrides\.clear\(\);[\s\S]{0,400}saved\.meta\?\.nnsAiOverrides(?![\w])[\s\S]{0,700}nnsAiOverrides\.set\(/],
    ['odczyt orderMultByCity', /orderMultMap\.clear\(\);[\s\S]{0,300}saved\.meta\?\.orderMultByCity(?![\w])[\s\S]{0,200}orderMultMap\.set\(/],
    ['odczyt orderGrowthMultByCity', /saved\.meta\?\.orderGrowthMultByCity(?![\w])[\s\S]{0,200}growthMultMap\.set\(/],
    ['odczyt orderValueByCity', /saved\.meta\?\.orderValueByCity(?![\w])[\s\S]{0,200}orderValueMap\.set\(/],
  ];
  for (const [name, re] of restoreRules) check(re.test(src), name);
  // zgodnosc wsteczna: stary zapis bez pol => pusta mapa, brak wyjatku (odczyt jest chroniony Array.isArray)
  check(/Array\.isArray\(savedOrderMult\)/.test(src) && /Array\.isArray\(savedGrowthMult\)/.test(src)
    && /Array\.isArray\(savedOrderValue\)/.test(src) && /Array\.isArray\(savedNnsOverrides\)/.test(src),
  'stary zapis bez pol: odczyt chroniony Array.isArray (pusta mapa, bez wyjatku)');
  // pola dopisywane tylko gdy mapy niepuste (zapis bez nadpisan = bajty jak baza)
  check(/\.\.\.\(orderMultMap\.size > 0 \?/.test(src) && /\.\.\.\(nnsAiOverrides\.size > 0 \?/.test(src),
    'pola zapisu dopisywane warunkowo (bajty jak baza przy pustych mapach)');
}

// ---------------------------------------------------------------- B) DYNAMICZNA
function runOne(seed) {
  return new Promise(resolve => {
    const out = path.join(WORK, `out-${seed}`);
    const prof = path.join(WORK, `prof-${seed}`);
    fs.rmSync(out, { recursive: true, force: true });
    fs.rmSync(prof, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    fs.mkdirSync(prof, { recursive: true });
    const args = [
      path.join(__dirname, 'ai-economy-measure-run.cjs'),
      '--resume-test', '1', '--seed', String(seed), '--save-at', String(SAVE_AT), '--turns', String(TURNS),
      '--every', '3', '--hash', '1', '--dist', DIST, '--profile', prof, '--out', out,
    ];
    const child = spawn(process.execPath, args, { cwd: GRA, stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    child.stdout.on('data', d => { log += d; });
    child.stderr.on('data', d => { log += d; });
    child.on('close', code => {
      let summary = null;
      try { summary = JSON.parse(fs.readFileSync(path.join(out, `seed${seed}.summary.json`), 'utf8')); } catch (_) {}
      resolve({ seed, code, summary, log, out });
    });
  });
}

async function dynamicChecks() {
  if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) {
    check(false, `--dist <abs-dist> z index.html jest wymagany dla warstwy dynamicznej (podano: "${DIST}")`);
    return;
  }
  fs.mkdirSync(WORK, { recursive: true });
  const results = await Promise.all(SEEDS.map(runOne));
  for (const r of results) {
    const rt = r.summary && r.summary.resumeTest;
    check(!!rt, `seed ${r.seed}: runner zwrocil podsumowanie wznowienia (exit ${r.code})`);
    if (!rt) { console.log(r.log.split('\n').slice(-15).join('\n')); continue; }
    const expected = TURNS - SAVE_AT;
    check(rt.compared === expected, `seed ${r.seed}: porownano ${rt.compared}/${expected} tur po wczytaniu`);
    const same = (rt.pairs || []).filter(p => p.same).length;
    check(rt.allEqual === true, `seed ${r.seed}: zapis->wczytanie->t+1..t+${expected} zgodne ze stanem ciaglym (${same}/${rt.compared} skrotow rowne)`);
    const ign = JSON.stringify(r.summary.hashIgnored || null);
    check(ign === JSON.stringify(EXPECTED_HASH_IGNORED), `seed ${r.seed}: lista pol pomijanych w haszu = znana (${ign})`);
  }
}

(async () => {
  console.log('== A) warstwa statyczna: ' + MAIN_TS);
  staticChecks();
  if (!STATIC_ONLY) {
    console.log('== B) warstwa dynamiczna: seeds=' + SEEDS.join(',') + ' save-at=' + SAVE_AT + ' turns=' + TURNS);
    await dynamicChecks();
  }
  console.log(failures === 0 ? '\nSAVE-LOAD ROUNDTRIP OK' : `\nSAVE-LOAD ROUNDTRIP FAIL (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
})();
