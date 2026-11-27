'use strict';
/**
 * ai-city-rebellion-gate-test.cjs — R-WEB-AI-CULT-REL-REBEL-IMPL-Q1 (AIREBEL, decyzja 39B).
 *
 * Miasto CYWILIZACJI AI w buncie skrajnym po wyczerpaniu łaski wchodzi w tę samą ścieżkę buntu
 * co miasto gracza, ale TYLKO gdy ustawienie „Kultura i religia” ma poziom (nowe gry). Tryb
 * zgodności (poziom null, stare zapisy) — AI nadal się nie buntuje (dziś, bit-w-bit).
 *
 * Sprawdzane:
 *   A. czysta bramka `aiCityRebellionEnabled` (society-breakdown.ts): AI + poziom łatwy/normalny/trudny
 *      = true; AI + null (zgodność) = false; nie-AI (człowiek/barbarzyńca/rebeliant) = false.
 *   B. łaska i bunt: na poziomie trudnym (maksymalnym) przy porPct poniżej progu bunt skrajny
 *      `updateRevoltGrace` po wyczerpaniu łaski zwraca shouldTriggerRebellion = true (funkcja nie zna
 *      właściciela — ta sama logika dla gracza i AI).
 *   C. immunitet osiedla: małe miasto (pop 1–4) nadal immunitetowe także na poziomie trudnym.
 *   D. okablowanie w main.ts: bramka rebelii używa `aiCityRebellionEnabled(getCulturaReligiaLevel(),
 *      isAiOwner(humanSeats, ...))`; stary warunek `shouldTriggerRebellion && isHuman(city.ownerId)`
 *      NIE występuje; wpis o buncie AI idzie przez recordAiCityRebellionNews (bez modala).
 *
 * Mutacje czerwone (wykonane ręcznie, patrz raport): (1) przywrócenie bramki `isHuman` w main.ts
 * → D czerwone; (2) helper zwraca `isAiOwnerCity` (ignoruje poziom) → A czerwone.
 *
 * Run: cd gra && node tools/ai-city-rebellion-gate-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.ai-city-rebellion-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-city-rebellion-gate-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  aiCityRebellionEnabled,
  isOsiedleRevoltImmune,
  updateRevoltGrace,
  loadRevoltParams,
} from '../src/game/society-breakdown';
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  M = require(BUNDLE);
} catch (e) {
  console.error('[ai-city-rebellion-gate-test] bundle failed:', e.message || e);
  process.exit(2);
}

let pass = 0;
let fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + label); }
  else { fail++; console.log('  FAIL  ' + label + (detail !== undefined ? ' -- ' + detail : '')); }
}

console.log('A. bramka aiCityRebellionEnabled');
for (const lvl of ['latwy', 'normalny', 'trudny']) {
  check(`AI + poziom ${lvl} => buntuje sie`, M.aiCityRebellionEnabled(lvl, true) === true);
  check(`nie-AI + poziom ${lvl} => bramka zamknieta (decyduje czlowiek/inny)`, M.aiCityRebellionEnabled(lvl, false) === false);
}
check('AI + null (tryb zgodnosci) => BRAK buntu AI', M.aiCityRebellionEnabled(null, true) === false);
check('nie-AI + null => false', M.aiCityRebellionEnabled(null, false) === false);

console.log('B. laska i bunt skrajny (poziom trudny = maksimum)');
const revolt = M.loadRevoltParams(null, 'trudny');
const crit = revolt.criticalPorPct;
let grace = null;
let triggered = -1;
for (let t = 1; t <= 10; t++) {
  const u = M.updateRevoltGrace(grace, crit - 1, revolt);
  grace = u.revoltGraceRemaining;
  if (u.shouldTriggerRebellion) { triggered = t; break; }
}
check('bunt skrajny po wyczerpaniu laski wyzwala rebelie', triggered > 0, 'brak wyzwolenia w 10 turach');
check('laska trwa co najmniej 1 ture przed buntem', triggered > 1, 'wyzwolenie w turze ' + triggered);
const okAbove = M.updateRevoltGrace(null, crit + 5, revolt);
check('powyzej progu bunt nie startuje', okAbove.shouldTriggerRebellion === false);

console.log('C. immunitet osiedla (pop 1-4) nadal chroni na trudnym');
check('pop 1 immunitet', M.isOsiedleRevoltImmune(1, null, 'trudny') === true);
check('pop 4 immunitet', M.isOsiedleRevoltImmune(4, null, 'trudny') === true);
check('pop 5 bez immunitetu', M.isOsiedleRevoltImmune(5, null, 'trudny') === false);

console.log('D. okablowanie main.ts');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
check('bramka wola aiCityRebellionEnabled(getCulturaReligiaLevel(), isAiOwner(humanSeats, rebelOwnerPrev))',
  mainSrc.includes('aiCityRebellionEnabled(getCulturaReligiaLevel(), isAiOwner(humanSeats, rebelOwnerPrev))'));
check('stary warunek tylko-czlowiek nie wystepuje',
  !mainSrc.includes('graceUpd.shouldTriggerRebellion && isHuman(city.ownerId) && !city.rebelState'));
check('bunt AI: wpis w dzienniku bez modala (recordAiCityRebellionNews)',
  mainSrc.includes('recordAiCityRebellionNews(city.name, rebelOwnerPrev, city.id)'));
check('wspolna sciezka: transferCityToRebelFactionWithLedger po bramce AI',
  /aiCityRebellionEnabled\(getCulturaReligiaLevel\(\)[\s\S]{0,900}transferCityToRebelFactionWithLedger\(city\)/.test(mainSrc));

try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
