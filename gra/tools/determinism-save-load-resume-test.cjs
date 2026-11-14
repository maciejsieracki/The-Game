'use strict';
/**
 * R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1: test, że liczniki generatora ID i strumieni walk
 * automatycznych są zapisywane w zapisie i odtwarzane przy wczytaniu.
 *
 * Uzycie: node tools/determinism-save-load-resume-test.cjs   (z gra/; exit 0 = PASS, 1 = FAIL)
 *
 * Problem: `_detIdSeq`, `_autoBattleSeqTurn`, `_autoBattleSeq` (main.ts, closure boot()) nie byly
 * w zapisie. Wznowiona gra startowala je od zera, wiec ID jednostek (a przez salt auto-walki
 * takze strumienie RNG) rozjezdzaly sie z gra nieprzerwana.
 *
 * Test zrodlowy (bez przegladarki): sprawdza, ze buildSaveGameSnapshot zapisuje pola w meta,
 * restoreGameFromSave je odtwarza z domyslnymi wartosciami dla starych zapisow, a
 * deserializeGame przepuszcza meta bez utraty tych pol.
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const SAVE_TS = path.join(GRA, 'src', 'game', 'save.ts');

let failed = 0;
function check(name, ok, detail) {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) failed++;
}

const main = fs.readFileSync(MAIN_TS, 'utf8');
const save = fs.readFileSync(SAVE_TS, 'utf8');

/** Wycina fragment od sygnatury funkcji do nawiasu zamykajacego (liczenie klamer, bez komentarzy). */
function bodyOf(src, signature) {
  const start = src.indexOf(signature);
  if (start < 0) return null;
  const open = src.indexOf('{', start + signature.length - 1);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open, i + 1);
    }
  }
  return null;
}

// ---- A. zapis: buildSaveGameSnapshot zapisuje liczniki w meta -------------------------------
const build = bodyOf(main, 'function buildSaveGameSnapshot(label?: string): SaveGame');
check('A0 buildSaveGameSnapshot istnieje', !!build);
const writeOk = !!build
  && /\bdetIdSeq\s*:\s*_detIdSeq\b/.test(build)
  && /\bautoBattleSeqTurn\s*:\s*_autoBattleSeqTurn\b/.test(build)
  && /\bautoBattleSeq\s*:\s*_autoBattleSeq\b/.test(build);
check('A1 zapis zawiera detIdSeq, autoBattleSeqTurn, autoBattleSeq w meta', writeOk);

// ---- B. odczyt: restoreGameFromSave przywraca liczniki z walidacja --------------------------
const restore = bodyOf(main, 'function restoreGameFromSave(saved: SaveGame): void');
check('B0 restoreGameFromSave istnieje', !!restore);
const readOk = !!restore
  && /_detIdSeq\s*=\s*typeof m\?\.detIdSeq === 'number'[^;]*\?\s*m\.detIdSeq\s*:\s*0\s*;/.test(restore)
  && /_autoBattleSeqTurn\s*=\s*typeof m\?\.autoBattleSeqTurn === 'number'[^;]*\?\s*m\.autoBattleSeqTurn\s*:\s*-1\s*;/.test(restore)
  && /_autoBattleSeq\s*=\s*typeof m\?\.autoBattleSeq === 'number'[^;]*\?\s*m\.autoBattleSeq\s*:\s*0\s*;/.test(restore);
check('B1 odczyt przywraca liczniki; brak pola = 0 / -1 (stary zapis, dotychczasowe zachowanie)', readOk);
const restoreAfterTura = !!restore && restore.indexOf('turn = saved.tura;') >= 0
  && restore.indexOf('_detIdSeq = typeof') > restore.indexOf('turn = saved.tura;');
check('B2 przywrócenie liczników następuje po turn = saved.tura', restoreAfterTura);

// ---- C. serializacja: meta przechodzi przez deserializeGame bez obcinania -----------------
const deser = bodyOf(save, 'export function deserializeGame(json: string): SaveGame');
check('C0 deserializeGame istnieje', !!deser);
check('C1 deserializeGame przepuszcza meta', !!deser && /meta:\s*obj\.meta\s*,?/.test(deser));

console.log(failed === 0 ? 'WYNIK: PASS' : 'WYNIK: FAIL (' + failed + ')');
process.exit(failed === 0 ? 0 : 1);
