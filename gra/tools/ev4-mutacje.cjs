'use strict';
/**
 * ev4-mutacje.cjs — NIEZALEZNY DOWOD NIE-TAUTOLOGICZNOSCI (Evaluator, runda 4).
 *
 * Mutacje CELOWANE i ROZNE od 15 mutacji Operatora (`ai4-mutacje.cjs`): tam mutowane byly
 * glownie pojedyncze warunki; tu wycinane sa CALE MECHANIZMY Zasad 1/2/3 oraz obie nowe
 * wartosci domyslne. Kazda mutacja MUSI zaczerwienic bramke tematu rundy 4
 * (`ai4-popyt-obywatele-test.cjs`). Mutacja, ktora zostawia bramke zielona = bramka
 * nie pilnuje tego mechanizmu (zglaszane jako PODEJRZANA).
 *
 * Uruchomienie: node tools/ev4-mutacje.cjs
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const GRA = path.resolve(__dirname, '..');
const WORK = '/tmp/ev4-mut-gra';
const BRAMKA = process.env.EV4_BRAMKA || 'ai4-popyt-obywatele-test.cjs';

function swiezaKopia() {
  cp.execSync(`rm -rf ${WORK} && mkdir -p ${WORK}`);
  for (const d of ['src', 'tools', 'data']) {
    cp.execSync(`cp -r ${path.join(GRA, d)} ${WORK}/`);
  }
  cp.execSync(`ln -sfn ${path.join(GRA, 'node_modules')} ${WORK}/node_modules`);
  for (const f of ['package.json', 'tsconfig.json']) {
    const s = path.join(GRA, f);
    if (fs.existsSync(s)) cp.execSync(`cp ${s} ${WORK}/`);
  }
}

const MUTACJE = [
  ['M1 ZASADA 1 wycieta: foodOnly zawsze false (pelna lista mimo braku niedoboru)',
    'src/game/auto-improvements.ts',
    'const foodOnly = demandActive && !deficitActive;',
    'const foodOnly = false && demandActive && !deficitActive;'],
  ['M2 ZASADA 2 wycieta: hexAllowsKey zawsze true (buduj gdziekolwiek)',
    'src/game/auto-improvements.ts',
    '      if (!workedKeys) return true;\n      if (workedKeys.has(`${q},${r}`)) return true;\n      return isDepositHexForKey(q, r, key);',
    '      return true;'],
  ['M3 ZASADA 3 wycieta: surplus zawsze false',
    'src/game/auto-improvements.ts',
    '    surplusReport.surplus = surplusReport.demandActive\n      && !surplusReport.deficitActive\n      && !surplusReport.anyCandidate;',
    '    surplusReport.surplus = false;'],
  ['M4 domyslna Zasada 2 cofnieta: DEFAULT_ULEPSZENIA_ONLY_WORKED = false',
    'src/game/cities.ts',
    'export const DEFAULT_ULEPSZENIA_ONLY_WORKED = true;',
    'export const DEFAULT_ULEPSZENIA_ONLY_WORKED = false;'],
  ['M5 R4-Q2 domyslna odwrocona: DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = true',
    'src/game/cities.ts',
    'export const DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = false;',
    'export const DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = true;'],
  ['M6 test niedoboru odwrocony: hasNonFoodResourceDeficit zawsze true',
    'src/game/auto-improvements.ts',
    "  if (!deficitKeys?.length) return false;\n  return deficitKeys.some(k => k !== 'zywnosc');",
    '  return true;'],
  ['M7 zywnosc liczy sie jako niedobor (kasuje swiadomy wyjatek `zywnosc`)',
    'src/game/auto-improvements.ts',
    "  return deficitKeys.some(k => k !== 'zywnosc');",
    '  return deficitKeys.length > 0;'],
  ['M8 R4-Q2 per miasto wyciete: getSkipWyrab ignorowany',
    'src/game/auto-improvements.ts',
    'const citySkipWyrab = getSkipWyrab ? getSkipWyrab(city) : skipWyrab;',
    'const citySkipWyrab = skipWyrab;'],
  ['M9 wyjatek zlozowy rozlany: kazdy klucz wolno na kazdym zlozu',
    'src/game/auto-improvements.ts',
    'return hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex);',
    'return hexHasDepositReserve(hex);'],
  ['M10 ZASADA 1 przeciekla na trzy pozostale profile (znika warunek `zrownowazone`)',
    'src/game/auto-improvements.ts',
    "const demandActive = demandDriven && focus === 'zrownowazone';",
    'const demandActive = demandDriven;'],
  ['M11 AI CYWILIZACJI przestaje byc demandDriven (ai.ts)',
    'src/game/ai.ts',
    '    demandDriven: true,',
    '    demandDriven: false,'],
  ['M12 AI CYWILIZACJI przestaje liczyc pola z obywatelami (ai.ts)',
    'src/game/ai.ts',
    '    getOnlyWorked: () => true,',
    '    getOnlyWorked: () => false,'],
];

swiezaKopia();
const zielonaBaza = (() => {
  const r = cp.spawnSync('node', [path.join(WORK, 'tools', BRAMKA)], { cwd: WORK, encoding: 'utf8', timeout: 600000 });
  return /(\d+) passed, 0 failed/.test(r.stdout || '');
})();
console.log(`# EV4 MUTACJE (Evaluator) — bramka: ${BRAMKA}`);
console.log(`# kontrola bazy (bez mutacji): ${zielonaBaza ? 'ZIELONA' : 'CZERWONA (!!)'}\n`);

let dowody = 0, podejrzane = 0, nieudane = 0;
for (const [nazwa, plik, przed, po] of MUTACJE) {
  swiezaKopia();
  const p = path.join(WORK, plik);
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(przed)) { console.log(`  [NIEUDANA] ${nazwa} — wzorzec nie znaleziony w ${plik}`); nieudane++; continue; }
  fs.writeFileSync(p, s.replace(przed, po), 'utf8');
  const r = cp.spawnSync('node', [path.join(WORK, 'tools', BRAMKA)], { cwd: WORK, encoding: 'utf8', timeout: 600000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = /(\d+) passed, (\d+) failed/.exec(out);
  const czerwona = r.status !== 0 || (m && Number(m[2]) > 0);
  if (czerwona) { dowody++; console.log(`  [DOWOD]     ${nazwa} -> bramka CZERWONA (${m ? m[0] : 'crash/exit ' + r.status})`); }
  else { podejrzane++; console.log(`  [PODEJRZANA] ${nazwa} -> bramka ZOSTALA ZIELONA (${m ? m[0] : 'brak podsumowania'})`); }
}
console.log(`\n# WYNIK: dowodow ${dowody} · podejrzanych ${podejrzane} · nieudanych podmian ${nieudane}`);
cp.execSync(`rm -rf ${WORK}`);
