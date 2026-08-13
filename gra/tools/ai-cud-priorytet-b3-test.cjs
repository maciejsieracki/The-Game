'use strict';
/**
 * node tools/ai-cud-priorytet-b3-test.cjs
 * R-EPOKA-CUD-WARUNEK-AWANSU B3 (ECHO Maciej 2026-08-10) — dwa mechanizmy przeciw utykaniu AI:
 *   1. Rozluźnianie progu opłacalności cudu z czasem (relaxedWonderCostThreshold, ai.ts).
 *   2. Twardy wymuszacz: komplet technologii epoki + brak WYŁĄCZNIE cudu → decideAiWonderBuild
 *      z forcePriority=true dostaje twarde pierwszeństwo (throttle/próg/kolejka-pusta pomijane).
 * Regresja: bez kompletu technologii epoki, normalny priorytet (bez wymuszenia przedwczesnego).
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-cud-priorytet-b3-entry.ts');
const bundle = path.join(__dirname, '.ai-cud-priorytet-b3-bundle.cjs');

fs.writeFileSync(entry, `
export {
  decideAiWonderBuild,
  loadAiWonderParams,
  relaxedWonderCostThreshold,
  loadAiWonderStuckRelaxTurMax,
} from '../src/game/ai';
export {
  allEraTechsResearched,
  eraOwnWonderIds,
  eraOwnWonderSatisfied,
} from '../src/game/owner-epoch';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const {
  decideAiWonderBuild,
  loadAiWonderParams,
  relaxedWonderCostThreshold,
  loadAiWonderStuckRelaxTurMax,
  allEraTechsResearched,
  eraOwnWonderIds,
  eraOwnWonderSatisfied,
} = require(bundle);

const aiParamsJson = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'ai-params.json'), 'utf8'));
const tech = require('../data/tech.json').technologie;
const wonders = require('../data/wonders.json').cuda;
const data = { aiParams: aiParamsJson, tech };

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('ai-cud-priorytet-b3-test\n');

// ---------------------------------------------------------------------------
// 1. relaxedWonderCostThreshold — rozluźnianie progu z czasem
// ---------------------------------------------------------------------------
console.log('--- 1. relaxedWonderCostThreshold ---');
{
  const base = 45;
  const max = 30;
  eq(relaxedWonderCostThreshold(base, 0, max), base, '1a: stuckTurns=0 → próg bez zmian');
  eq(relaxedWonderCostThreshold(base, -5, max), base, '1b: stuckTurns ujemne → próg bez zmian (clamp)');
  eq(relaxedWonderCostThreshold(base, max, max), Number.POSITIVE_INFINITY,
    '1c: stuckTurns==max → próg w pełni zniesiony (Infinity)');
  eq(relaxedWonderCostThreshold(base, max + 50, max), Number.POSITIVE_INFINITY,
    '1d: stuckTurns > max → nadal Infinity (nie rośnie w nieskończoność liczbowo, brak NaN)');
  eq(relaxedWonderCostThreshold(base, 10, 0), base, '1e: stuckRelaxTurMax<=0 → mechanizm wyłączony, próg bez zmian');

  const seq = [0, 5, 10, 15, 20, 25, 29].map(t => relaxedWonderCostThreshold(base, t, max));
  let monotonic = true;
  for (let i = 1; i < seq.length; i++) if (!(seq[i] > seq[i - 1])) monotonic = false;
  assert(monotonic, '1f: sekwencja progów ŚCIŚLE rosnąca (bariera coraz niższa/łatwiejsza) w miarę stuckTurns');
  assert(Number.isFinite(seq[seq.length - 1]) && seq[seq.length - 1] > base,
    '1g: tuż przed max — próg bardzo złagodzony, ale jeszcze skończony');
}

// ---------------------------------------------------------------------------
// 2. Symulacja N tur bez budowy mimo dostępności -- w końcu AI decyduje się budować
// ---------------------------------------------------------------------------
console.log('\n--- 2. symulacja stuck-turns → w końcu decyzja niepusta (ścieżka BEZ forcePriority) ---');
{
  const stuckRelaxTurMax = loadAiWonderStuckRelaxTurMax(data);
  assert(stuckRelaxTurMax > 0, '2a: cuda_stuck_relax_tur_max wczytany z ai-params.json (>0)');

  const cityCandidates = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
  // Koszt celowo bardzo wysoki względem progu bazowego (45x10=450 budżet bazowy) —
  // 5000 Pracy nigdy nie przejdzie bez rozluźnienia.
  const buildableWonders = [{ id: 'w1', kosztBudowy: 5000, dostep: 'E' }];
  const baseDiff = { progKosztX: 45, throttleTur: 1 }; // throttleTur=1 -> throttle nigdy nie blokuje, izolujemy efekt progu

  let stuckTurns = 0;
  let firstBuildTurn = null;
  for (let turn = 1; turn <= stuckRelaxTurMax + 2 && firstBuildTurn === null; turn++) {
    const effectiveProgKosztX = relaxedWonderCostThreshold(baseDiff.progKosztX, stuckTurns, stuckRelaxTurMax);
    const diff = { ...baseDiff, progKosztX: effectiveProgKosztX };
    const decision = decideAiWonderBuild(turn, 0, false, cityCandidates, buildableWonders, diff);
    if (decision) { firstBuildTurn = turn; break; }
    stuckTurns += 1;
  }
  assert(firstBuildTurn !== null, '2b: po wystarczającej liczbie tur AI w końcu decyduje się budować (nie utyka na zawsze)');
  assert(firstBuildTurn !== null && firstBuildTurn <= stuckRelaxTurMax + 1,
    '2c: budowa zapada najpóźniej tuż po pełnym rozluźnieniu progu (stuckRelaxTurMax), nie później');

  // Kontrola: BEZ rozluźniania (stały bazowy próg) ten sam kandydat NIGDY nie przejdzie.
  const staticDecision = decideAiWonderBuild(1, 0, false, cityCandidates, buildableWonders, baseDiff);
  eq(staticDecision, null, '2d: kontrola — bez rozluźnienia (stuckTurns=0) ten sam kandydat jest odrzucony (próg za wysoki)');
}

// ---------------------------------------------------------------------------
// 3. forcePriority — twarde pierwszeństwo w kolejce produkcji
// ---------------------------------------------------------------------------
console.log('\n--- 3. decideAiWonderBuild forcePriority=true — twarde pierwszeństwo ---');
{
  const expensiveWonder = [{ id: 'w1', kosztBudowy: 999999, dostep: 'E' }];
  const cheapDiff = { progKosztX: 45, throttleTur: 5 };
  const requiredW1 = ['w1'];

  // 3a: bez forcePriority, turn NIE jest wielokrotnością throttle I koszt astronomiczny -> null (baseline)
  const baseline = decideAiWonderBuild(3, 0, false, [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }], expensiveWonder, cheapDiff);
  eq(baseline, null, '3a: baseline (bez forcePriority) — throttle+koszt blokują normalnie');

  // 3b: TE SAME warunki + forcePriority=true + requiredWonderIds=['w1'] -> decyzja mimo wszystko
  // (throttle + koszt pominięte)
  const forced = decideAiWonderBuild(3, 0, false, [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }], expensiveWonder, cheapDiff, true, requiredW1);
  assert(forced !== null, '3b: forcePriority=true — cud kolejkowany mimo turn poza throttle i astronomicznego kosztu');
  eq(forced && forced.wonderId, 'w1', '3b2: forcePriority — właściwy (wymagany) cud wybrany');

  // 3b3 (FIX Evaluator runda 1, pkt 2): forcePriority=true, ALE wonderId spoza requiredWonderIds
  // → null, ZERO fallbacku na inny budowalny cud (to jest dokładnie defekt zgłoszony przez
  // Evaluatora: przed naprawą funkcja brała ordered[0] niezależnie od requiredWonderIds).
  const otherWonder = [{ id: 'inny-cud', kosztBudowy: 999999, dostep: 'E' }];
  const noFallback = decideAiWonderBuild(3, 0, false, [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }], otherWonder, cheapDiff, true, requiredW1);
  eq(noFallback, null, '3b3: forcePriority=true + wymagany cud NIEOBECNY w buildableWonders → null, BEZ fallbacku na "inny-cud"');

  // 3c: forcePriority=true + hasWonderInProgress=true (inny cud w budowie) -> NADAL decyzja
  // (twarde pierwszeństwo przebija limit "max 1 cud naraz" -- inaczej AI zostaje trwale
  // zablokowana budową jakiegoś innego cudu i NIGDY nie odblokuje awansu epoki).
  const forcedOverBusy = decideAiWonderBuild(3, 0, true, [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }], expensiveWonder, cheapDiff, true, requiredW1);
  assert(forcedOverBusy !== null, '3c: forcePriority=true przebija hasWonderInProgress=true (max-1-cud nie blokuje wymuszacza)');

  // 3d: forcePriority=true + kolejka miasta NIEPUSTA -> queueJump=true (wskakuje przed budowany element)
  const busyCity = [{ cityId: 'c1', queueEmpty: false, pracaPerTurn: 10 }];
  const jump = decideAiWonderBuild(3, 0, false, busyCity, expensiveWonder, cheapDiff, true, requiredW1);
  assert(jump !== null && jump.queueJump === true, '3d: forcePriority + kolejka niepusta → queueJump=true (wskoczenie przed budynki/jednostki/inne projekty)');

  // 3e: forcePriority=true + kolejka PUSTA -> queueJump falsy (zwykłe dopisanie, nic do przerywania)
  const idleCity = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
  const noJump = decideAiWonderBuild(3, 0, false, idleCity, expensiveWonder, cheapDiff, true, requiredW1);
  assert(noJump !== null && !noJump.queueJump, '3e: forcePriority + kolejka pusta → queueJump nieustawiony (brak potrzeby przeskoku)');

  // 3f: forcePriority=true, ale WSZYSTKIE miasta pracaPerTurn<=0 -> null (martwa pętla poza zasięgiem priorytetu, zastrzeżenie zadania)
  const zeroProdCity = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 0 }];
  const deadEnd = decideAiWonderBuild(3, 0, false, zeroProdCity, expensiveWonder, cheapDiff, true, requiredW1);
  eq(deadEnd, null, '3f: forcePriority + pracaPerTurn=0 wszędzie → null (dosłowny brak produkcji, priorytet nie pomaga)');

  // 3g: forcePriority=true, buildableWonders puste -> null (brak crashu, nic do zrobienia)
  const noWonders = decideAiWonderBuild(3, 0, false, idleCity, [], cheapDiff, true, requiredW1);
  eq(noWonders, null, '3g: forcePriority + brak buildableWonders → null, bez wyjątku');

  // 3h: forcePriority=true, ale requiredWonderIds PUSTE (domyślne, jak przy pominięciu 8. argumentu)
  // -> null, obrona w głąb w ai.ts nawet gdyby main.ts błędnie wywołał forcePriority bez listy.
  const noRequiredIds = decideAiWonderBuild(3, 0, false, idleCity, expensiveWonder, cheapDiff, true);
  eq(noRequiredIds, null, '3h: forcePriority=true bez requiredWonderIds (domyślnie []) → null, obrona w głąb');
}

// ---------------------------------------------------------------------------
// 4. Regresja: forcePriority pominięty (domyślnie false) — zachowanie IDENTYCZNE jak dawniej
// ---------------------------------------------------------------------------
console.log('\n--- 4. regresja — wywołanie 6-argumentowe (bez forcePriority) zachowuje się jak explicit false ---');
{
  const cand = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
  const wonders = [{ id: 'w1', kosztBudowy: 100, dostep: 'E' }];
  const diff = { progKosztX: 45, throttleTur: 5 };
  for (const turn of [0, 1, 2, 5, 10, 15]) {
    const a = decideAiWonderBuild(turn, 0, false, cand, wonders, diff);
    const b = decideAiWonderBuild(turn, 0, false, cand, wonders, diff, false);
    eq(JSON.stringify(a), JSON.stringify(b), `4a: tura ${turn} — 6-arg === explicit forcePriority=false`);
  }
}

// ---------------------------------------------------------------------------
// 5. Wymuszacz — formuła bramki (allEraTechsResearched + eraOwnWonderSatisfied), plus
//    (FIX Evaluator runda 1, M8/M9) bramka STRUKTURALNA na main.ts (fs.readFileSync + regex,
//    wzorzec era-cud-main-ts-integracja-test.cjs) -- sekcja 5a-5e woła funkcje z ai.ts/
//    owner-epoch.ts wprost, więc pokrywa LOGIKĘ; sekcja 5-STRUKTURA niżej czyta ŹRÓDŁO main.ts
//    wprost, więc łapie DRYF (np. gdyby ktoś usunął koniunkcję `wonderRequiredBuildable`
//    wprowadzoną w tej naprawie, nie dotykając samej logiki w ai.ts) -- to był brak (M8/M9)
//    wskazany przez Evaluatora rundy 1: poprzednia wersja tej sekcji re-implementowała
//    formułę we własnej funkcji zamiast czytać main.ts, więc z definicji nie mogła złapać
//    dryfu W TYM PLIKU.
// ---------------------------------------------------------------------------
console.log('\n--- 5. formuła bramki wymuszacza (logika ai.ts/owner-epoch.ts + STRUKTURA main.ts) ---');
{
  const era1Techs = tech.filter(t => t.Epoka === 'Kamień').map(t => t.Technologia).filter(Boolean);

  function computeForced(era, done, civType, completedWonderIds, alreadyBuildingRequired) {
    const gate = allEraTechsResearched(era, tech, done) && !eraOwnWonderSatisfied(civType, era, completedWonderIds);
    return gate && !alreadyBuildingRequired;
  }

  // 5a: REGRESJA — komplet technologii NIEOSIĄGNIĘTY → wymuszacz NIGDY nie aktywuje się przedwcześnie
  const incomplete = new Set(era1Techs.slice(1));
  eq(computeForced(1, incomplete, 'egipt', [], false), false,
    '5a: brak kompletu technologii epoki → forcePriority=false (bez przedwczesnego wymuszenia)');

  // 5b: komplet technologii + cud Egiptu (Piramidy) NIE zbudowany + nic w budowie → forced=true
  const complete = new Set(era1Techs);
  eq(computeForced(1, complete, 'egipt', [], false), true,
    '5b: komplet technologii + brak WYŁĄCZNIE cudu (nic w budowie) → forcePriority=true');

  // 5c: komplet technologii + cud JUŻ zbudowany (globalnie) → warunek spełniony, forced=false
  eq(computeForced(1, complete, 'egipt', ['piramidy'], false), false,
    '5c: komplet technologii + cud już zbudowany → forcePriority=false (nic do wymuszania)');

  // 5d: komplet technologii + cud NIE zbudowany, ALE już w budowie (main.ts wykrywa to osobno) → forced=false
  eq(computeForced(1, complete, 'egipt', [], true), false,
    '5d: cud wymagany JUŻ w budowie → forcePriority=false (priorytet zbędny, już postępuje)');

  // 5e: cywilizacja BEZ cudu przypisanego tej epoce (np. Grecja epoka 1) → warunek naturalnie spełniony, forced=false
  eq(computeForced(1, complete, 'grecy', [], false), false,
    '5e: cywilizacja bez cudu wyłącznego tej epoki → eraOwnWonderSatisfied=true z definicji → forcePriority=false');

  assert(eraOwnWonderIds('egipt', 1).includes('piramidy'), '5f: sanity — Egipt ma Piramidy jako cud epoki 1 (fixture zgodny z danymi)');
}

console.log('\n--- 5-STRUKTURA. dryf main.ts (fs.readFileSync + regex, jak era-cud-main-ts-integracja-test.cjs) ---');
{
  const RE_REQUIRED_ALREADY_BUILDING_FULL_QUEUE =
    /wonderRequiredAlreadyBuilding = wonderRequiredIds\.length > 0[\s\S]{0,200}?kolejka\.some\(it => \{/;
  assert(RE_REQUIRED_ALREADY_BUILDING_FULL_QUEUE.test(mainSrc),
    '5g-STRUKTURA: wonderRequiredAlreadyBuilding sprawdza CAŁĄ kolejkę (kolejka.some), nie tylko front (FIX Evaluator pkt 3)');

  const RE_REQUIRED_BUILDABLE =
    /const wonderRequiredBuildable = wonderRequiredIds\.some\(\s*\n?\s*id => buildableForAi\.some\(w => w\.id === id\),?\s*\n?\s*\);/;
  assert(RE_REQUIRED_BUILDABLE.test(mainSrc),
    '5h-STRUKTURA: wonderRequiredBuildable = wonderRequiredIds ∩ buildableForAi istnieje w main.ts (FIX Evaluator pkt 1)');

  const RE_FORCE_PRIORITY_CONJUNCTION =
    /const wonderForcePriority = wonderEraGateForced\s*\n\s*&& !wonderRequiredAlreadyBuilding\s*\n\s*&& wonderRequiredBuildable;/;
  assert(RE_FORCE_PRIORITY_CONJUNCTION.test(mainSrc),
    '5i-STRUKTURA: wonderForcePriority = wonderEraGateForced && !wonderRequiredAlreadyBuilding && wonderRequiredBuildable (KONIUNKCJA WSZYSTKICH TRZECH — złapie dryf, gdyby ktoś usunął jeden z warunków)');

  const RE_CALL_PASSES_REQUIRED_IDS =
    /decideAiWonderBuild\(\s*\n\s*turn, ownerId, hasWonderInProgress, wonderCandidates, buildableForAi, wonderDiffParams,\s*\n\s*wonderForcePriority, wonderRequiredIds,\s*\n\s*\);/;
  assert(RE_CALL_PASSES_REQUIRED_IDS.test(mainSrc),
    '5j-STRUKTURA: wywołanie decideAiWonderBuild przekazuje wonderRequiredIds jako 8. argument (FIX Evaluator pkt 2 -- bez tego ai.ts nie może odróżnić wymaganego cudu od pierwszego budowalnego)');
}

// ---------------------------------------------------------------------------
// 6. Reprodukcja DOKŁADNEGO defektu Evaluatora rundy 1 -- Fenicjanie, awans Brąz→Żelazo,
//    Petra (epokaWejscia=2) wymaga techUnlock="Inżynieria" (epoka Żelazo) -- niebudowalna
//    mimo kompletu technologii Brązu. Symulacja 12 tur pętli main.ts (kolejka lokalnie;
//    queueJump = unshift na front, enqueue = push na koniec). Ta lokalna symulacja NIE
//    reprodukuje bankowania postępu przez insertAtFront (naprawa RUNDY 4, B3) -- w tym
//    konkretnym scenariuszu (Fenicjanie/Petra) queueJump nigdy faktycznie nie zapada
//    (patrz asercja 6g: queueJumpCount===0), więc gałąź `if (decision.queueJump)` niżej
//    jest tu martwa i wartość jej `postep: 0` nie wpływa na wynik testu ani nie jest
//    asercjonowana -- realne zachowanie main.ts (bankowanie, nie zerowanie) pokrywa
//    promote-to-front-test.cjs (sekcja 16) i bramka strukturalna promote-to-front-test.cjs
//    (sekcja 19).
// ---------------------------------------------------------------------------
console.log('\n--- 6. reprodukcja defektu — Fenicjanie/Petra, 12 tur (przed naprawą: kolejka rosła bez ograniczenia) ---');
{
  const era1Techs = tech.filter(t => t.Epoka === 'Kamień').map(t => t.Technologia).filter(Boolean);
  const era2Techs = tech.filter(t => t.Epoka === 'Brąz').map(t => t.Technologia).filter(Boolean);
  const doneBrazComplete = new Set([...era1Techs, ...era2Techs]); // komplet Kamień+Brąz, BRAK Inżynierii (Żelazo)

  // Sanity na danych realnych (nie fixture) — dokładnie zgodne ze zgłoszeniem Evaluatora.
  const petraDef = wonders.find(w => w.id === 'petra');
  const inzynieria = tech.find(t => t.Technologia === 'Inżynieria');
  assert(petraDef && petraDef.epokaWejscia === 2, '6a: sanity danych — petra.epokaWejscia=2 (Brąz)');
  assert(petraDef && petraDef.techUnlock.includes('Inżynieria'), '6b: sanity danych — petra wymaga techUnlock Inżynieria');
  assert(inzynieria && inzynieria.Epoka === 'Żelazo', '6c: sanity danych — Inżynieria jest epoki Żelazo (rozjazd B2 potwierdzony w danych, NIE naprawiany tu)');
  assert(eraOwnWonderIds('fenicjanie', 2).includes('petra'), '6d: sanity — Petra to cud wyłączny Fenicjan epoki 2 (bramkuje awans Brąz→Żelazo)');

  // buildableForAi minimalne wg REALNEJ bramki techUnlock (nie pełny listBuildableWondersForOwner
  // z main.ts, który wymaga całego stanu gry -- ale kryterium techUnlock⊆done jest identyczne
  // i to WŁAŚNIE ono jest źródłem defektu, patrz zgłoszenie Evaluatora).
  function buildableWithDoneTechs(done) {
    return wonders
      .filter(w => w.cywilizacje.includes('fenicjanie'))
      .filter(w => w.techUnlock.every(t => done.has(t)))
      .map(w => ({ id: w.id, kosztBudowy: w.kosztBudowy, dostep: w.dostep }));
  }

  const requiredIds = eraOwnWonderIds('fenicjanie', 2); // ['petra']
  const wonderDiffParams = loadAiWonderParams(data, 2);

  // Stan lokalny miasta -- semantyka identyczna z production.ts (kolejka/postep).
  let cityProd = { kolejka: [], postep: 0 };
  let maxKolejkaLen = 0;
  let queueJumpCount = 0;
  let done = doneBrazComplete; // Fenicjanie NIE badają nic nowego przez te 12 tur (utknięcie)

  for (let turn = 1; turn <= 12; turn++) {
    const buildableForAi = buildableWithDoneTechs(done);
    const wonderEraGateForced = allEraTechsResearched(2, tech, done) && !eraOwnWonderSatisfied('fenicjanie', 2, []);
    const alreadyBuilding = cityProd.kolejka.some(it => requiredIds.includes(it.id));
    const requiredBuildable = requiredIds.some(id => buildableForAi.some(w => w.id === id));
    const forcePriority = wonderEraGateForced && !alreadyBuilding && requiredBuildable; // == main.ts po naprawie

    const cand = [{ cityId: 'c1', queueEmpty: cityProd.kolejka.length === 0, pracaPerTurn: 10 }];
    const decision = decideAiWonderBuild(turn, 7, false, cand, buildableForAi, wonderDiffParams, forcePriority, requiredIds);

    if (decision) {
      if (decision.queueJump) {
        // Uproszczona symulacja lokalna -- NIE odtwarza bankowania insertAtFront (main.ts
        // realnie woła insertAtFront(wProd0, wItem, 0), patrz RUNDA 4/B3). Nieszkodliwe tu:
        // w tym scenariuszu (Fenicjanie/Petra) ta gałąź nigdy się nie wykonuje (6g:
        // queueJumpCount===0), a test i tak nie asercjonuje postep. / EN: simplified local
        // simulation -- does NOT replicate insertAtFront's banking (main.ts really calls
        // insertAtFront(wProd0, wItem, 0), see round 4/B3). Harmless here: in this scenario
        // (Phoenicians/Petra) this branch never actually runs (6g: queueJumpCount===0), and
        // the test doesn't assert postep anyway.
        queueJumpCount++;
        cityProd = { kolejka: [{ id: decision.wonderId }, ...cityProd.kolejka], postep: 0 };
      } else {
        cityProd = { kolejka: [...cityProd.kolejka, { id: decision.wonderId }], postep: cityProd.postep };
      }
    }
    maxKolejkaLen = Math.max(maxKolejkaLen, cityProd.kolejka.length);
  }

  assert(!wonders.filter(w => w.cywilizacje.includes('fenicjanie')).some(w => requiredIds.includes(w.id))
    || buildableWithDoneTechs(doneBrazComplete).every(w => !requiredIds.includes(w.id)),
    '6e: sanity — z tylko-Brąz technologiami petra NIE jest w buildableForAi (potwierdza przesłankę defektu)');

  assert(maxKolejkaLen <= 1,
    `6f: PO NAPRAWIE — kolejka miasta NIE rośnie bez ograniczenia przez 12 tur (max długość ${maxKolejkaLen}, przed naprawą rosłaby o 1/turę → 12)`);
  assert(queueJumpCount === 0,
    `6g: PO NAPRAWIE — zero queueJump w te 12 tur, bo wymagany cud (petra) niebudowalny → forcePriority zawsze false (queueJumpCount=${queueJumpCount}, przed naprawą byłoby 12× na 'wyrocznia')`);

  // 6h: kontrola pozytywna — gdy Inżynieria zostaje zbadana (petra staje się budowalna),
  // wymuszacz aktywuje się i wybiera WŁAŚCIWY cud (petra), nie 'wyrocznia'/inny.
  const doneWithInzynieria = new Set([...doneBrazComplete, 'Inżynieria']);
  const buildableAfter = buildableWithDoneTechs(doneWithInzynieria);
  const requiredBuildableAfter = requiredIds.some(id => buildableAfter.some(w => w.id === id));
  assert(requiredBuildableAfter, '6h1: sanity — po zbadaniu Inżynierii petra staje się budowalna');
  const forcePriorityAfter = allEraTechsResearched(2, tech, doneWithInzynieria)
    && !eraOwnWonderSatisfied('fenicjanie', 2, [])
    && requiredBuildableAfter;
  const decisionAfter = decideAiWonderBuild(
    13, 7, false, [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }],
    buildableAfter, wonderDiffParams, forcePriorityAfter, requiredIds,
  );
  eq(decisionAfter && decisionAfter.wonderId, 'petra',
    '6h2: PO odblokowaniu Inżynierii — wymuszacz wybiera PETRA (wymagany cud), nie inny budowalny cud');
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
