'use strict';
/**
 * node tools/era-cud-main-ts-integracja-test.cjs
 * R-EPOKA-CUD-WARUNEK-AWANSU — bramka STRUKTURALNA (regex) na `gra/src/main.ts`: main.ts nie
 * jest bundlowany osobno w tym repo (za duży/za dużo zależności do izolowanego testu), więc
 * pilnujemy TEKSTU pięciu punktów integracji zamiast zachowania runtime:
 *   1. import computeMainCivEraFromResearch z owner-epoch.ts
 *   2. syncOwnerEraFromResearch i reconcilePlayerEraFromResearch wołają
 *      computeMainCivEraFromResearch z KOMPLETEM argumentów (civTypeForOwner właściwego
 *      ownera + completedWorldWonders) i ZAPISUJĄ wynik (ownerEraByOwner.set(ownerId, next) /
 *      player.era = next), nie tylko wołają funkcję o odpowiedniej nazwie. reconcileEraForOwner()
 *      był martwym kodem (nigdzie nie wołany) — usunięty runda 5, razem z asercją.
 *   3a. chatka (village hut) tech reward woła reconcile PO researchStep
 *   3b. grantTechToOwnerWithSideEffects (handel technologiami, DWA call site'y: koszyk
 *       transferBasketItems + akcja 6 executeTechTradeDeal) woła reconcile zamiast
 *       eraAdvanceTarget/Math.max
 *   3c. koniec tury (auto-research) woła reconcile PO researchStep
 *   4. ukończenie cudu (oba miejsca: completeWonderOnHex + fallback bez wolnego heksa
 *      w completeWonderBuilt) woła reconcile/sync natychmiast
 *
 * Kotwice STRUKTURALNE (nazwy funkcji/wywołań), nie treść komentarzy — zgodnie z wnioskiem
 * Evaluatora R-EPOKA-CUD-WARUNEK-AWANSU rundy 2 (komentarze bywają tłumaczone PL/EN, CLAUDE.md §9).
 */

const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('era-cud-main-ts-integracja-test\n');

// ---------------------------------------------------------------------------
// Blok 1 — import
// ---------------------------------------------------------------------------
const RE_IMPORT = /import\s*\{\s*computeOwnerEraFromResearch\s*,\s*computeMainCivEraFromResearch\s*\}\s*from\s*'\.\/game\/owner-epoch';/;

// ---------------------------------------------------------------------------
// Blok 2 — helpery epoki w main.ts
// ---------------------------------------------------------------------------
// R-EPOKA-CUD-WARUNEK-AWANSU runda 5 (B2): kotwice poniżej sprawdzają nie tylko NAZWĘ funkcji
// wołanej, ale i JEJ ARGUMENTY oraz ZAPIS WYNIKU — wcześniejsza wersja przepuszczała mutacje,
// które podmieniały civType/completedWorldWonders albo wyrzucały przeliczony wynik do kosza.
const RE_SYNC_BRANCH = /function syncOwnerEraFromResearch\(ownerId: number\): boolean \{[\s\S]{0,700}?!isBarbarian\(ownerId\)[\s\S]{0,60}?!isCityStateOwner\(ownerId\)[\s\S]{0,400}?computeMainCivEraFromResearch\([\s\S]{0,200}?civTypeForOwner\(ownerId\)[\s\S]{0,150}?completedWorldWonders/;
const RE_RECONCILE_PLAYER = /function reconcilePlayerEraFromResearch\(\): boolean \{[\s\S]{0,500}?computeMainCivEraFromResearch\([\s\S]{0,300}?player\.zbadane[\s\S]{0,150}?civTypeForOwner\(0\)[\s\S]{0,150}?completedWorldWonders[\s\S]{0,300}?player\.era = next;/;
// B2 punkt 3: zapis WYNIKU przeliczenia AI musi trafić do stanu (ownerEraByOwner.set(ownerId, next)),
// nie zostać wyrzucony do kosza (np. set(ownerId, prev) — degradacja/utknięcie AI niezłapane wcześniej).
const RE_AI_ERA_WRITE = /function syncOwnerEraFromResearch\(ownerId: number\): boolean \{[\s\S]{0,900}?ownerEraByOwner\.set\(ownerId, next\);/;
// B2 punkt 4: era startowa gracza czytana z konfiguracji gry (gameStartEra()), nie zaszyta na sztywno.
const RE_RECONCILE_PLAYER_STARTERA = /function reconcilePlayerEraFromResearch\(\): boolean \{[\s\S]{0,50}?const startEra = gameStartEra\(\);/;

// ---------------------------------------------------------------------------
// Blok 3a — chatka (village hut) tech reward
// ---------------------------------------------------------------------------
const RE_3A_CHATKA = /researchStep\(player, data\.tech, researchGateForOwner\(0\), _menuDifficulty\);[\s\S]{0,600}?reconcilePlayerEraFromResearch\(\);[\s\S]{0,300}?for \(const done of step\.completed\) \{[\s\S]{0,300}?villageEraAdvanced/;
// Runda 5 scalenie: druga kotwica bloku 3a — po reconcile chatka musi realnie odświeżyć
// nakładki złóż/setEra przy awansie epoki (wcześniejsza wersja warunkowała to na
// step.completed.some(d => d.awansEpoki), co gubiło awans wynikający WYŁĄCZNIE z cudu, bez
// żadnej tech ukończonej w tym kroku badań — naprawiony brak odświeżenia nakładek).
const RE_3A_CHATKA_ERAADVANCED = /const (\w+) = shouldNotifyPlayerEraChange\((\w+), player\.era\);\s*\n\s*villageEraAdvanced = \1;\s*\n\s*if \(\1\) \{\s*\n\s*overlayDepositEra = player\.era;\s*\n\s*rebuildResourceOverlays\(\);\s*\n\s*setEra\(player\.era\);/;

// ---------------------------------------------------------------------------
// Blok 3b — handel technologiami (grantTechToOwnerWithSideEffects), kotwica DOSTARCZONA
// przez Evaluatora (zwalidowana w rundzie dispatchu tego zadania), dopasowana do
// faktycznych nazw parametrów (techId: string, toOwnerId: number).
// ---------------------------------------------------------------------------
const RE_3B_TECH_TRADE = /function grantTechToOwnerWithSideEffects\(\s*(\w+)\s*:\s*string\s*,\s*(\w+)\s*:\s*number\s*\)[\s\S]{0,400}?if\s*\(\s*\2\s*===\s*0\s*\)\s*\{[\s\S]{0,900}?const grantedDef = data\.tech\.find\(t => t\.Technologia === \1\);[\s\S]{0,300}?if \(grantedDef\) \{[\s\S]{0,300}?reconcilePlayerEraFromResearch\(\);/;

// Impact-analiza C-026: DWA call site'y grantTechToOwnerWithSideEffects muszą nadal istnieć
// (koszyk transferBasketItems::case 'tech' + akcja 6 executeTechTradeDeal::grantTech).
const RE_CALLSITE_BASKET = /case\s*'tech':\s*\{\s*grantTechToOwnerWithSideEffects\(item\.id, toOwnerId\);/;
const RE_CALLSITE_ACTION6 = /grantTech:\s*\(techId, toOwnerId\)\s*=>\s*grantTechToOwnerWithSideEffects\(techId, toOwnerId\)/;

// ---------------------------------------------------------------------------
// Blok 3c — koniec tury (auto-research)
// ---------------------------------------------------------------------------
const RE_3C_KONIEC_TURY = /Auto-research: spend banked science on the cheapest available tech\.[\s\S]{0,150}?const step = researchStep\(player, data\.tech, researchGateForOwner\(0\), _menuDifficulty\);[\s\S]{0,400}?reconcilePlayerEraFromResearch\(\);[\s\S]{0,300}?const eraAdvanced = shouldNotifyPlayerEraChange\(prevPlayerEra, player\.era\);/;

// ---------------------------------------------------------------------------
// Blok 4 — ukończenie cudu (oba miejsca)
// ---------------------------------------------------------------------------
const RE_4A_WONDER_HEX = /completedWorldWonders\.push\(wonderId\);[\s\S]{0,500}?syncWonderRender\(\);[\s\S]{0,700}?if \(site\.ownerId === 0\) \{[\s\S]{0,300}?reconcilePlayerEraFromResearch\(\)[\s\S]{0,400}?\} else \{[\s\S]{0,200}?syncOwnerEraFromResearch\(site\.ownerId\)/;
const RE_4B_WONDER_FALLBACK = /if \(!hex\) \{[\s\S]{0,100}?completedWorldWonders\.push\(wonderId\);[\s\S]{0,700}?if \(city\.ownerId === 0\) \{[\s\S]{0,300}?reconcilePlayerEraFromResearch\(\)[\s\S]{0,400}?\} else \{[\s\S]{0,200}?syncOwnerEraFromResearch\(city\.ownerId\)/;

assert(RE_IMPORT.test(src), 'Blok 1: import computeMainCivEraFromResearch z owner-epoch.ts');
assert(RE_SYNC_BRANCH.test(src), 'Blok 2: syncOwnerEraFromResearch rozgałęzia się dla main-civ (!isBarbarian && !isCityStateOwner) i woła computeMainCivEraFromResearch z civTypeForOwner(ownerId) + completedWorldWonders');
assert(RE_RECONCILE_PLAYER.test(src), 'Blok 2: reconcilePlayerEraFromResearch() liczy z player.zbadane + civTypeForOwner(0) + completedWorldWonders, ustawia player.era');
assert(RE_AI_ERA_WRITE.test(src), 'Blok 2: syncOwnerEraFromResearch zapisuje PRZELICZONY wynik (ownerEraByOwner.set(ownerId, next)), nie odrzuca go');
assert(RE_RECONCILE_PLAYER_STARTERA.test(src), 'Blok 2: reconcilePlayerEraFromResearch() czyta startEra z gameStartEra(), nie na sztywno');
assert(RE_3A_CHATKA.test(src), 'Blok 3a: chatka (village hut) woła reconcilePlayerEraFromResearch po researchStep');
assert(RE_3A_CHATKA_ERAADVANCED.test(src), 'Blok 3a: chatka odświeża nakładki złóż/setEra gdy eraAdvanced (nie tylko gdy step.completed ma awansEpoki) — naprawa braku odświeżenia przy awansie z cudu');
assert(RE_3B_TECH_TRADE.test(src), 'Blok 3b: grantTechToOwnerWithSideEffects woła reconcilePlayerEraFromResearch (nie Math.max)');
assert(RE_CALLSITE_BASKET.test(src), 'Impact C-026: call-site #1 (koszyk transferBasketItems::case tech) nienaruszony');
assert(RE_CALLSITE_ACTION6.test(src), 'Impact C-026: call-site #2 (akcja 6 executeTechTradeDeal::grantTech) nienaruszony');
assert(RE_3C_KONIEC_TURY.test(src), 'Blok 3c: koniec tury (auto-research) woła reconcilePlayerEraFromResearch po researchStep');
assert(RE_4A_WONDER_HEX.test(src), 'Blok 4a: ukończenie cudu (completeWonderOnHex) przelicza erę natychmiast');
assert(RE_4B_WONDER_FALLBACK.test(src), 'Blok 4b: ukończenie cudu bez wolnego heksa (fallback) przelicza erę natychmiast');

// Stary mechanizm NIE może być wskrzeszony wewnątrz grantTechToOwnerWithSideEffects —
// dokładnie ten jeden fragment kodu gry, który ta runda miała podmienić.
const grantFnMatch = /function grantTechToOwnerWithSideEffects[\s\S]*?\n {4}\}\n\n {4}\/\*\*/.exec(src);
const grantFnBody = grantFnMatch ? grantFnMatch[0] : '';
assert(grantFnBody.length > 0, 'sanity: ciało grantTechToOwnerWithSideEffects wyodrębnione do analizy');
assert(!/player\.era = Math\.max\(player\.era, awansTarget\)/.test(grantFnBody),
  'grantTechToOwnerWithSideEffects: stary Math.max(player.era, awansTarget) NIE występuje już w ciele funkcji');

console.log('\n' + passed + ' passed, ' + failed + ' failed');

// ---------------------------------------------------------------------------
// Weryfikacja mutacyjna (samo-test bramki) — każda z poniższych mutacji na TEKŚCIE
// main.ts musi zaczerwienić odpowiednią asercję. Uruchamiane tylko lokalnie w tym
// procesie (nie zapisuje nic na dysk), żeby bramka sama siebie stale sprawdzała.
// ---------------------------------------------------------------------------
function countPass(text) {
  const checks = [
    RE_IMPORT, RE_SYNC_BRANCH, RE_RECONCILE_PLAYER, RE_AI_ERA_WRITE, RE_RECONCILE_PLAYER_STARTERA,
    RE_3A_CHATKA, RE_3A_CHATKA_ERAADVANCED, RE_3B_TECH_TRADE, RE_CALLSITE_BASKET, RE_CALLSITE_ACTION6,
    RE_3C_KONIEC_TURY, RE_4A_WONDER_HEX, RE_4B_WONDER_FALLBACK,
  ];
  return checks.filter(re => re.test(text)).length;
}

const baselinePassCount = countPass(src);
let mutFailed = 0;
function assertMutationCaught(name, mutated) {
  const p = countPass(mutated);
  if (p < baselinePassCount) {
    console.log('MUT-PASS (złapana):', name, `(${p}/${baselinePassCount})`);
  } else {
    mutFailed++;
    console.error('MUT-FAIL (NIE złapana):', name);
  }
}

console.log('\n-- weryfikacja mutacyjna --\n');

// M1: usunięcie reconcile z bloku 3b (powrót do starego mechanizmu)
assertMutationCaught('M1: usunięcie reconcilePlayerEraFromResearch() z grantTechToOwnerWithSideEffects',
  src.replace(
    /(if \(grantedDef\) \{\s*\n\s*const prevPlayerEra = player\.era;\s*\n\s*)reconcilePlayerEraFromResearch\(\);/,
    '$1player.era = player.era;',
  ));

// M2: przywrócenie player.era = Math.max(player.era, awansTarget) WEWNĄTRZ grantTechToOwnerWithSideEffects
// zamiast reconcile (dokładny "revert" opisany w zadaniu) — celuje w blok 3b, nie inne wystąpienia.
assertMutationCaught('M2: przywrócenie Math.max(player.era, awansTarget) zamiast reconcile w grantTechToOwnerWithSideEffects',
  src.replace(
    /(function grantTechToOwnerWithSideEffects[\s\S]{0,900}?if \(grantedDef\) \{\s*\n\s*const prevPlayerEra = player\.era;\s*\n\s*)reconcilePlayerEraFromResearch\(\);/,
    '$1const awansTarget = eraAdvanceTarget(grantedDef); if (awansTarget !== null) player.era = Math.max(player.era, awansTarget);',
  ));

// M3: usunięcie reconcile z bloku 3a (chatka)
assertMutationCaught('M3: usunięcie reconcile z chatki (village hut)',
  src.replace(
    /(researchStep\(player, data\.tech, researchGateForOwner\(0\), _menuDifficulty\);\s*\n(?:\s*\/\/[^\n]*\n)*\s*)reconcilePlayerEraFromResearch\(\);(\s*\n\s*for \(const done of step\.completed\) \{\s*\n\s*summary)/,
    '$1$2',
  ));

// M4: usunięcie reconcile z bloku 3c (koniec tury) — celuje w DRUGIE wystąpienie (auto-research)
assertMutationCaught('M4: usunięcie reconcile z końca tury (auto-research)',
  (() => {
    const marker = 'const step = researchStep(player, data.tech, researchGateForOwner(0), _menuDifficulty);';
    const first = src.indexOf(marker);
    const second = src.indexOf(marker, first + 1);
    if (second < 0) return src; // brak drugiego wystąpienia -> nie zmienia liczby PASS (sygnał błędu testu, nie mutacji)
    const before = src.slice(0, second);
    let rest = src.slice(second);
    rest = rest.replace(/reconcilePlayerEraFromResearch\(\);\s*\n(\s*const eraAdvanced)/, '$1');
    return before + rest;
  })());

// M5: przeniesienie reconcile z gałęzi gracza do gałęzi AI (completeWonderOnHex)
assertMutationCaught('M5: reconcile w completeWonderOnHex przeniesiony do gałęzi AI zamiast gracza',
  src.replace(
    /if \(site\.ownerId === 0\) \{\s*\n\s*const prevPlayerEra = player\.era;\s*\n\s*if \(reconcilePlayerEraFromResearch\(\)\) \{/,
    'if (site.ownerId === 0) {\n        const prevPlayerEra = player.era;\n        if (false) {',
  ));

// M6: usunięcie rozgałęzienia isCityStateOwner w syncOwnerEraFromResearch (main-civ i city-state
// znowu na tej samej ścieżce — city-state dostałaby ostrzejszą bramkę / main-civ złagodzoną)
assertMutationCaught('M6: syncOwnerEraFromResearch zawsze woła computeOwnerEraFromResearch (usunięta gałąź main-civ)',
  src.replace(
    /const next = \(!isBarbarian\(ownerId\) && !isCityStateOwner\(ownerId\)\)\s*\n\s*\?\s*computeMainCivEraFromResearch\(\s*\n[\s\S]{0,300}?\)\s*\n\s*:\s*computeOwnerEraFromResearch\(startEra, done, data\.tech as import\('\.\/data\/loader'\)\.TechDef\[\]\);/,
    'const next = computeOwnerEraFromResearch(startEra, done, data.tech as import(\'./data/loader\').TechDef[]);',
  ));

// M7 (dawniej: reconcileEraForOwner odwrócony) — funkcja USUNIĘTA runda 5 (martwy kod,
// nigdzie nie wołana). Miejsce zastąpione dwiema nowymi mutacjami B2 (punkty 3-4 zlecenia):

// M12: wynik przeliczenia AI wyrzucony do kosza (set(ownerId, prev) zamiast set(ownerId, next))
// — dokładnie mutacja E15 z werdyktu Evaluatora rundy 4 (cała strona AI martwa).
// Kotwica jest regexem na sam wywołanie .set() (nie parę wierszy set+return) — po scaleniu
// R-EPOKA-BRAZU-WYMUSZONA-WOJNA wstawiła między set() a `return prev !== next;` blok kilku
// linii (flaga bronzeForceWarPendingOwners), więc dosłowny string z dwiema złączonymi liniami
// już nie pasuje do main.ts; regex na samo .set(ownerId, next) przetrwa taki dryf.
assertMutationCaught('M12: syncOwnerEraFromResearch zapisuje prev zamiast next (wynik AI wyrzucony do kosza)',
  src.replace(
    /ownerEraByOwner\.set\(ownerId, next\);/,
    'ownerEraByOwner.set(ownerId, prev);',
  ));

// M13: startEra gracza zaszyta na sztywno (1) zamiast gameStartEra() — łamie start w Brązie/Żelazie.
assertMutationCaught('M13: reconcilePlayerEraFromResearch startEra zaszyta na sztywno (1) zamiast gameStartEra()',
  src.replace(
    'function reconcilePlayerEraFromResearch(): boolean {\n      const startEra = gameStartEra();',
    'function reconcilePlayerEraFromResearch(): boolean {\n      const startEra = 1;',
  ));

// M8: usunięcie call-site koszyka (case 'tech') — B1-klasy exploit, tech znika z transferu
assertMutationCaught('M8: usunięcie wywołania grantTechToOwnerWithSideEffects z koszyka (case tech)',
  src.replace("grantTechToOwnerWithSideEffects(item.id, toOwnerId);", "// removed"));

// M9: usunięcie call-site akcji 6 (grantTech wired do no-op)
assertMutationCaught('M9: usunięcie wywołania grantTechToOwnerWithSideEffects z akcji 6',
  src.replace(
    "grantTech: (techId, toOwnerId) => grantTechToOwnerWithSideEffects(techId, toOwnerId),",
    "grantTech: (techId, toOwnerId) => ({ granted: true }),",
  ));

// M10: usunięcie reconcile z fallbacku bez wolnego heksa (blok 4b)
assertMutationCaught('M10: usunięcie reconcile z fallbacku completeWonderBuilt (brak wolnego heksa)',
  src.replace(
    /(console\.warn\(`\[Cuda\] Brak wolnego heksa[^`]*`\);\s*\n\s*\/\/[^\n]*\n\s*\/\/[^\n]*\n\s*if \(city\.ownerId === 0\) \{\s*\n\s*const prevPlayerEra = player\.era;\s*\n\s*if \()reconcilePlayerEraFromResearch\(\)(\) \{)/,
    '$1false$2',
  ));

// M11: import computeMainCivEraFromResearch usunięty (regres kompilacji + funkcjonalny)
assertMutationCaught('M11: import computeMainCivEraFromResearch usunięty z main.ts',
  src.replace(
    "import { computeOwnerEraFromResearch, computeMainCivEraFromResearch } from './game/owner-epoch';",
    "import { computeOwnerEraFromResearch } from './game/owner-epoch';",
  ));

// M14 (= E3 z werdyktu Evaluatora rundy 4): gracz na sztywno 'grecy' zamiast civTypeForOwner(0).
assertMutationCaught("M14: reconcilePlayerEraFromResearch civTypeForOwner(0) zaszyty na sztywno jako 'grecy' (E3)",
  src.replace(
    'player.zbadane,\n        data.tech as import(\'./data/loader\').TechDef[],\n        civTypeForOwner(0),\n        completedWorldWonders,',
    'player.zbadane,\n        data.tech as import(\'./data/loader\').TechDef[],\n        \'grecy\',\n        completedWorldWonders,',
  ));

// M15 (= E4): gracz dostaje [] zamiast completedWorldWonders — trwałe zakleszczenie.
assertMutationCaught('M15: reconcilePlayerEraFromResearch dostaje [] zamiast completedWorldWonders (E4)',
  src.replace(
    'player.zbadane,\n        data.tech as import(\'./data/loader\').TechDef[],\n        civTypeForOwner(0),\n        completedWorldWonders,',
    'player.zbadane,\n        data.tech as import(\'./data/loader\').TechDef[],\n        civTypeForOwner(0),\n        [],',
  ));

// M16 (= E5): AI dostaje civType GRACZA (civTypeForOwner(0)) zamiast własny — cała
// per-cywilizacyjność ginie (wszystkie AI liczone jakby były cywilizacją gracza).
assertMutationCaught('M16: syncOwnerEraFromResearch AI dostaje civTypeForOwner(0) (gracza) zamiast civTypeForOwner(ownerId) (E5)',
  src.replace(
    'data.tech as import(\'./data/loader\').TechDef[],\n            civTypeForOwner(ownerId),\n            completedWorldWonders,',
    'data.tech as import(\'./data/loader\').TechDef[],\n            civTypeForOwner(0),\n            completedWorldWonders,',
  ));

console.log('\n' + (16 - mutFailed) + '/16 mutacji złapanych, ' + mutFailed + ' NIEZŁAPANYCH');

// 11 sond kruchości (NIESZKODLIWE zmiany — bramka MUSI zostać zielona)
console.log('\n-- sondy kruchości (muszą zostać PASS) --\n');
let probeFailed = 0;
function assertProbeSafe(name, mutated) {
  const p = countPass(mutated);
  if (p === baselinePassCount) {
    console.log('PROBE-OK:', name);
  } else {
    probeFailed++;
    console.error('PROBE-FAIL (kotwica za krucha):', name, `(${p}/${baselinePassCount})`);
  }
}

assertProbeSafe('P1: rename techId->techIdArg w grantTechToOwnerWithSideEffects (razem z użyciami)',
  src.replace(/function grantTechToOwnerWithSideEffects\(techId: string/, 'function grantTechToOwnerWithSideEffects(techIdX: string')
     .replace(/t\.Technologia === techId\)/, 't.Technologia === techIdX)'));
assertProbeSafe('P2: dodatkowy komentarz przed reconcilePlayerEraFromResearch() w bloku 3b',
  src.replace('reconcilePlayerEraFromResearch();\n          if (shouldNotifyPlayerEraChange(prevPlayerEra, player.era)) {\n            overlayDepositEra = player.era;\n            rebuildResourceOverlays();\n            setEra(player.era);\n            notifyPlayerEraChangeIfAdvanced(prevPlayerEra);\n          }\n        }\n      } else {',
    '// nowy komentarz bez znaczenia\n          reconcilePlayerEraFromResearch();\n          if (shouldNotifyPlayerEraChange(prevPlayerEra, player.era)) {\n            overlayDepositEra = player.era;\n            rebuildResourceOverlays();\n            setEra(player.era);\n            notifyPlayerEraChangeIfAdvanced(prevPlayerEra);\n          }\n        }\n      } else {'));
assertProbeSafe('P3: cudzysłów zamiast apostrofu w niepowiązanym miejscu pliku (case "zloto")',
  src.replace("case 'zloto': {", 'case "zloto": {'));
assertProbeSafe('P4: reformat wieloliniowy grantTechToOwnerWithSideEffects (dodatkowe puste linie)',
  src.replace(
    'function grantTechToOwnerWithSideEffects(techId: string, toOwnerId: number): { granted: boolean; reason?: string } {\n      const r = grantTechToOwner(techId, toOwnerId, basketTransferCtx);',
    'function grantTechToOwnerWithSideEffects(techId: string, toOwnerId: number): { granted: boolean; reason?: string } {\n\n      const r = grantTechToOwner(techId, toOwnerId, basketTransferCtx);\n',
  ));
assertProbeSafe('P5: usunięcie/zmiana treści komentarza R-EPOKA-CUD (PL->EN, CLAUDE.md §9)',
  src.replace(
    '// #66 + R-EPOKA-CUD-WARUNEK-AWANSU: awans liczony wyłącznie przez',
    '// EN: era advance is computed exclusively via',
  ));
assertProbeSafe('P6: niepowiązany kod dodany między blokami (nowa funkcja no-op)',
  src.replace(
    'function allAiOwnerIdsOnMap(): number[] {',
    'function unrelatedNoopHelperXYZ(): void { /* no-op */ }\n    function allAiOwnerIdsOnMap(): number[] {',
  ));
assertProbeSafe('P7: dodatkowy whitespace/tabulacja wokół reconcilePlayerEraFromResearch (3c)',
  src.replace(
    'reconcilePlayerEraFromResearch();\n            const eraAdvanced = shouldNotifyPlayerEraChange(prevPlayerEra, player.era);',
    'reconcilePlayerEraFromResearch();\n\n\n            const eraAdvanced = shouldNotifyPlayerEraChange(prevPlayerEra, player.era);',
  ));
assertProbeSafe('P8: rename zmiennej prevPlayerEra->prevEraX w bloku 4a (razem z użyciami)',
  src.replace(
    /if \(site\.ownerId === 0\) \{\s*\n\s*const prevPlayerEra = player\.era;\s*\n\s*if \(reconcilePlayerEraFromResearch\(\)\) \{\s*\n\s*overlayDepositEra = player\.era;\s*\n\s*rebuildResourceOverlays\(\);\s*\n\s*setEra\(player\.era\);\s*\n\s*notifyPlayerEraChangeIfAdvanced\(prevPlayerEra\);/,
    (m) => m.replace(/prevPlayerEra/g, 'prevEraX'),
  ));
assertProbeSafe('P9: dodanie console.log debug niepowiązanego z logiką tuż przed 3a hookiem',
  src.replace(
    "const step = researchStep(player, data.tech, researchGateForOwner(0), _menuDifficulty);\n          // R-EPOKA-CUD-WARUNEK-AWANSU: era gracza",
    "console.log('[debug] chatka tech');\n          const step = researchStep(player, data.tech, researchGateForOwner(0), _menuDifficulty);\n          // R-EPOKA-CUD-WARUNEK-AWANSU: era gracza",
  ));
assertProbeSafe('P10: zamiana kolejności pól w sygnaturze grantTechToOwnerWithSideEffects zwrotu (kosmetyka typu)',
  src.replace(
    'function grantTechToOwnerWithSideEffects(techId: string, toOwnerId: number): { granted: boolean; reason?: string } {',
    'function grantTechToOwnerWithSideEffects(techId: string, toOwnerId: number): { reason?: string; granted: boolean } {',
  ));
assertProbeSafe('P11: dodanie pustej linii między completedWorldWonders.push a syncWonderRender (4a)',
  src.replace(
    'completedWorldWonders.push(wonderId);\n      placedWorldWonders.push({',
    'completedWorldWonders.push(wonderId);\n\n      placedWorldWonders.push({',
  ));

console.log('\n' + (11 - probeFailed) + '/11 sond kruchości bezpiecznych, ' + probeFailed + ' fałszywie czerwonych');

const allOk = failed === 0 && mutFailed === 0 && probeFailed === 0;
console.log('\n=== WYNIK: ' + (allOk ? 'OK' : 'FAIL') + ' ===');
process.exit(allOk ? 0 : 1);
