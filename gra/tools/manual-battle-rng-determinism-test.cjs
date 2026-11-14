'use strict';
/**
 * R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1 — regresja: walka ręczna i sceniczna
 * (battleScene.ts, manualBattle.ts) nie może losować przez Math.random.
 *
 * Zasada: ta sama fabryka strumienia co walki AUTO (main.ts battleCombatRng ->
 * gameStreamRng z ziarna gry). Test statyczny (bez DOM/Three): sprawdza, że
 * w źródłach ścieżek walki nie ma Math.random poza domyślną wartością parametru,
 * że wywołania resolveCombat dostają `rng`, że rzut trafienia _singleBlow używa
 * strumienia, a main.ts podpina combatRng do każdego tworzenia BattleScene.
 *
 * Źródło można wskazać zmienną MANUAL_RNG_ROOT (katalog gra/), np. do dowodu
 * mutacyjnego na kopii bazy. Domyślnie: katalog nadrzędny tego pliku.
 *
 * Uruchomienie z gra/: node tools/manual-battle-rng-determinism-test.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const root = process.env.MANUAL_RNG_ROOT
  ? path.resolve(process.env.MANUAL_RNG_ROOT)
  : path.resolve(__dirname, '..');

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const failures = [];
const check = (name, ok, detail) => {
  if (!ok) failures.push(name + (detail ? ' -- ' + detail : ''));
  console.log((ok ? 'PASS ' : 'FAIL ') + name);
};

// Usuwa komentarze //... i /* ... */ (proste, wystarczające dla tych plików).
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

// Zwraca blok wywołania resolveCombat(...) od otwarcia do dopasowania nawiasu.
const callBlock = (src, marker) => {
  const i = src.indexOf(marker);
  if (i < 0) return null;
  let depth = 0;
  for (let j = src.indexOf('(', i); j < src.length; j++) {
    if (src[j] === '(') depth++;
    else if (src[j] === ')') { depth--; if (depth === 0) return src.slice(i, j + 1); }
  }
  return null;
};

// 1. manualBattle.ts — jedyne wywołanie resolveCombat dostaje rng, brak Math.random.
const mb = stripComments(read('src/battle/manualBattle.ts'));
// Dozwolone tylko jako domyslna wartosc pola (`= Math.random;`), nigdy jako wywolanie.
check('manualBattle: brak wywolan Math.random (tylko domyslna wartosc pola)', !/Math\.random(?!\s*;)/.test(mb));
const mbCall = callBlock(mb, 'resolveCombat(cuA, cuD');
check('manualBattle: resolveCombat dostaje rng', !!mbCall && /\brng\s*:/.test(mbCall), mbCall ? '' : 'brak wywolania');
check('manualBattle: opts.rng podpiety w konstruktorze', /opts\.rng/.test(mb));

// 2. battleScene.ts — rzut trafienia i skip-resolve używają strumienia walki.
const bs = stripComments(read('src/battle/battleScene.ts'));
const blowRoll = bs.match(/const roll\s*=\s*certainHit \? 0 : ([^;]+);/);
check('battleScene: rzut trafienia _singleBlow bez Math.random', !!blowRoll && !/Math\.random/.test(blowRoll[1]), blowRoll ? blowRoll[1].trim() : 'brak linii rzutu');
check('battleScene: pole _combatRng z domyslnym Math.random', /_combatRng\s*:\s*\(\)\s*=>\s*number\s*=\s*Math\.random/.test(bs));
const bsCall = callBlock(bs, 'resolveCombat(cu_a, cu_d');
check('battleScene: resolveCombat (Pomin) dostaje rng', !!bsCall && /\brng\s*:\s*combatRng\b/.test(bsCall), bsCall ? '' : 'brak wywolania');
check('battleScene: computeInstantResult przekazuje strumien', /this\._combatRng\s*,?\s*\n\s*\);/.test(bs));
check('battleScene: opts.combatRng podpiety', /opts\.combatRng/.test(bs));

// 3. main.ts — każde tworzenie BattleScene dostaje combatRng z fabryki gry.
const main = stripComments(read('src/main.ts'));
const factoryDef = /const battleCombatRng = \(\)[\s\S]*?gameStreamRng\(_gameSeed, turn, 'battle-combat:'/.test(main);
check('main: fabryka battleCombatRng z ziarna gry', factoryDef);
const newBattleScene = (main.match(/new BattleScene\(/g) || []).length;
const wired = (main.match(/combatRng:\s*battleCombatRng\(\)/g) || []).length;
check('main: combatRng przy wszystkich tworzeniach BattleScene (4 miejsca)', wired >= 4, `new BattleScene=${newBattleScene}, combatRng=${wired}`);
check('main: stan licznika w meta zapisu', /battleCombatSeq:\s*_battleCombatSeq/.test(main) && /battleCombatSeqTurn:\s*_battleCombatSeqTurn/.test(main));

if (failures.length) {
  console.log('\nFAILED ' + failures.length + ':\n- ' + failures.join('\n- '));
  process.exit(1);
}
console.log('\nOK manual-battle-rng-determinism (' + root + ')');
