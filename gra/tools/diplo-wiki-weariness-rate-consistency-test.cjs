'use strict';
/**
 * diplo-wiki-weariness-rate-consistency-test.cjs
 *
 * TEMAT: R-WEB-DOC-CIVPEDIA-ROZEJM-POKOJ-WEARINESS-RATE-2-5PCT-Q1.
 *
 * Strażnik spójności dokumentacji z parametrami zmęczenia wojną.
 * Hasła Civpedii „Rozejm i pokój” i „Zmęczenie wojną” (w wikiBundle.json oraz
 * w plikach .md, z których bundle jest generowany) muszą podawać wartości
 * wyliczone z gra/data/war-weariness-params.json:
 *   - tempo na turę = 100 / pelneTur            (pelneTur = 40 → „2,5%”)
 *   - przyrost za zmienione miasto = wagaStratMiasta × 100 (0,1 → „10%”)
 * oraz NIE mogą zawierać błędnego tempa „5% na turę” / „5% za turę”.
 *
 * Wartość 10% w haśle „Zmęczenie wojną” bywa zapisana dziesiętnie („0,10”);
 * test akceptuje obie formy.
 *
 * Mutacja: w tekście każdego hasła podmieniamy „2,5% na turę” na „5% na turę”
 * i sprawdzamy, że strażnik to wykrywa (inaczej test nic nie pilnuje).
 *
 * Uruchomienie (z katalogu gra/ lub z dowolnego miejsca):
 *   node gra/tools/diplo-wiki-weariness-rate-consistency-test.cjs
 *   exit 0 = zgodne i mutacja wykryta; exit 1 = błąd.
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_ROOT, '..');
const PARAMS_PATH = path.join(GRA_ROOT, 'data', 'war-weariness-params.json');
const BUNDLE_PATH = path.join(GRA_ROOT, 'src', 'data', 'wikiBundle.json');
const MD_DIR = path.join(REPO_ROOT, 'docs', 'encyklopedia', 'pojecia');

const HASLA = [
  { title: 'Rozejm i pokój', id: 'pojecia/rozejm-pokoj', md: 'rozejm-pokoj.md' },
  { title: 'Zmęczenie wojną', id: 'pojecia/zmeczenie-wojna', md: 'zmeczenie-wojna.md' },
];

// „5% na turę” / „5% za turę” jako błędne tempo; nie łapie „2,5% na turę” (przed 5 jest cyfra lub przecinek).
const BLEDNE_TEMPO = /(^|[^0-9,.])5 ?% (na|za) tur/;

let failures = 0;
let passes = 0;
function ok(cond, msg) {
  if (cond) {
    passes++;
  } else {
    failures++;
    console.error('FAIL: ' + msg);
  }
}

function plNumber(x) {
  // 2.5 → "2,5"; 10 → "10"; 0.1*100 → "10"
  const r = Math.round(x * 100) / 100;
  return String(r).replace('.', ',');
}

function readParams() {
  const raw = JSON.parse(fs.readFileSync(PARAMS_PATH, 'utf8'));
  const z = raw.zmeczenie;
  const pelneTur = Number(z.pelneTur);
  const waga = Number(z.wagaStratMiasta);
  if (!(pelneTur > 0)) throw new Error('pelneTur musi być > 0 w war-weariness-params.json');
  if (!(waga > 0)) throw new Error('wagaStratMiasta musi być > 0 w war-weariness-params.json');
  return {
    tempoProc: 100 / pelneTur,
    tempoTxt: plNumber(100 / pelneTur) + '%',
    miastoTxt: plNumber(waga * 100) + '%',
    miastoDziesietnie: waga.toFixed(2).replace('.', ','),
    pelneTur,
  };
}

// Sprawdza jedno hasło (tekst) względem wartości z parametrów.
function sprawdzTekst(etykieta, tekst, p) {
  ok(tekst.includes(p.tempoTxt), `${etykieta}: brak tempa „${p.tempoTxt} na turę” (100/pelneTur)`);
  const maMiasto = tekst.includes(p.miastoTxt) || tekst.includes(p.miastoDziesietnie);
  ok(maMiasto, `${etykieta}: brak przyrostu za miasto „${p.miastoTxt}” (wagaStratMiasta×100)`);
  ok(!BLEDNE_TEMPO.test(tekst), `${etykieta}: zawiera błędne tempo „5% na turę/za turę”`);
  return { tempoOk: tekst.includes(p.tempoTxt), bledne: BLEDNE_TEMPO.test(tekst) };
}

function readBundleEntry(id) {
  const b = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const e = (b.encyklopedia || []).find((x) => x.id === id);
  if (!e) throw new Error(`brak hasła ${id} w wikiBundle.json`);
  return e.full || '';
}

function main() {
  const p = readParams();
  ok(Math.abs(p.tempoProc - 2.5) < 1e-9, `oczekiwano pelneTur=40 (tempo 2,5%), jest ${p.tempoTxt}`);

  for (const h of HASLA) {
    const mdPath = path.join(MD_DIR, h.md);
    const md = fs.readFileSync(mdPath, 'utf8');
    sprawdzTekst(`md ${h.md}`, md, p);
    const bundleTxt = readBundleEntry(h.id);
    sprawdzTekst(`wikiBundle ${h.title}`, bundleTxt, p);
  }

  // Mutacja: pliki z błędnym tempem muszą być odrzucone.
  const rozejmMd = fs.readFileSync(path.join(MD_DIR, 'rozejm-pokoj.md'), 'utf8');
  const mutantMd = rozejmMd.replace('2,5% na turę', '5% na turę');
  ok(mutantMd !== rozejmMd, 'mutacja md: wzorzec „2,5% na turę” nie występuje w rozejm-pokoj.md');
  const wykrytaMd = BLEDNE_TEMPO.test(mutantMd);
  ok(wykrytaMd, 'mutacja md „5% na turę” NIE została wykryta przez strażnika');

  const bundleRozejm = readBundleEntry('pojecia/rozejm-pokoj');
  const mutantBundle = bundleRozejm.replace('2,5% na turę', '5% na turę');
  ok(mutantBundle !== bundleRozejm, 'mutacja bundle: wzorzec „2,5% na turę” nie występuje w haśle');
  const wykrytaBundle = BLEDNE_TEMPO.test(mutantBundle);
  ok(wykrytaBundle, 'mutacja bundle „5% na turę” NIE została wykryta przez strażnika');

  // Sanity: wzorzec nie może łapać poprawnego „2,5% na turę”.
  ok(!BLEDNE_TEMPO.test('2,5% na turę od startu wojny'), 'wzorzec błędnego tempa łapie poprawne „2,5% na turę”');

  console.log(`parametry: pelneTur=${p.pelneTur}, tempo=${p.tempoTxt} na turę, miasto=${p.miastoTxt}`);
  console.log(`mutanty wykryte: md=${wykrytaMd}, bundle=${wykrytaBundle}`);
  console.log(`asercje OK: ${passes}, FAIL: ${failures}`);
  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log('PASS: diplo-wiki-weariness-rate-consistency');
  }
}

main();
