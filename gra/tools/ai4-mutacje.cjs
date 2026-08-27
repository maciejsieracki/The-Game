'use strict';
/**
 * ai4-mutacje.cjs — DOWOD NIE-TAUTOLOGICZNOSCI bramki `ai4-popyt-obywatele-test.cjs`
 * (kryterium 7 dispatchu rundy 4 tematu R-AI-WYRAB-PRZY-RZECE-FARMY-Q1).
 *
 * Dla kazdej mutacji: kopiuje `src` do katalogu tymczasowego, podmienia DOKLADNIE JEDEN
 * fragment zrodla, uruchamia bramke przez `AI4_SRC_DIR` i sprawdza, czy zaczerwienily sie
 * TE asercje, ktore mialy sie zaczerwienic (i tylko dlatego mutacja jest dowodem, a nie
 * przypadkiem). Mutacja, ktora nie zmienia ANI JEDNEJ asercji, jest zgloszona jako
 * PODEJRZANA — to znaczy, ze pilnowany kod nie jest pilnowany.
 *
 * Run z gra/:  node tools/ai4-mutacje.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const GATE = path.resolve(__dirname, 'ai4-popyt-obywatele-test.cjs');

/** plik, szukany fragment, podmiana, oczekiwane czerwone prefiksy asercji */
const MUTACJE = [
  {
    id: 'M1',
    opis: 'ZASADA 1 — zdejmij zawezenie listy do zywnosci przy braku niedoboru',
    plik: 'game/auto-improvements.ts',
    from: '&& (!foodOnly || ULEPSZENIA_ZYWNOSCIOWE.has(k))',
    to: '&& (true || ULEPSZENIA_ZYWNOSCIOWE.has(k))',
    oczekiwane: ['Z1a'],
  },
  {
    id: 'M2',
    opis: 'ZASADA 1 — pozwol FAZIE 0 (posterunek/fort) dzialac mimo braku niedoboru',
    plik: 'game/auto-improvements.ts',
    from: 'const defensePriority = foodOnly\n      ? []',
    to: 'const defensePriority = false\n      ? []',
    oczekiwane: ['Z1a'],
  },
  {
    id: 'M3',
    opis: 'ZASADA 1 — niech niedobor ZYWNOSCI tez otwiera budowe surowcow',
    plik: 'game/auto-improvements.ts',
    from: "return deficitKeys.some(k => k !== 'zywnosc');",
    to: "return deficitKeys.some(k => k !== '___klucz_ktory_nie_istnieje___');",
    oczekiwane: ['Z1d', 'Z1e'],
  },
  {
    id: 'M4',
    opis: 'ZASADA 2 — zdejmij filtr „przy obywatelach" z FAZY 1',
    plik: 'game/auto-improvements.ts',
    from: '        if (!hexAllowsKey(q, r, key)) continue;\n        if (!qualifies(key, q, r)) continue;\n\n        if (surplusReport)',
    to: '        if (!qualifies(key, q, r)) continue;\n\n        if (surplusReport)',
    // Z2j (AI CYWILIZACJI) NIE czerwieni sie od tej mutacji i to jest poprawne: w tej
    // fiksturze nie ma zloz, wiec heksy bez obywateli sa juz odsiane wczesniej, przy
    // budowie `candidateHexes`. Asercje Z2j pilnuje mutacja M7 (odpiecie `getOnlyWorked`
    // w ai.ts) — kazda asercja ma swoja celowana mutacje, nie kazda mutacja kazda asercje.
    oczekiwane: ['Z2c'],
  },
  {
    id: 'M5',
    opis: 'ZASADA 2 — zabierz wyjatek zlozowy (zloza przestaja byc wyjatkiem)',
    plik: 'game/auto-improvements.ts',
    from: '      return hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex);',
    to: '      return false && hexHasDepositReserve(hex) && depositAllowsPlayerImprovement(key, hex);',
    oczekiwane: ['Z2d'],
  },
  {
    id: 'M6',
    opis: 'ZASADA 2 — cofnij wartosc domyslna onlyWorked na false',
    plik: 'game/cities.ts',
    from: 'export const DEFAULT_ULEPSZENIA_ONLY_WORKED = true;',
    to: 'export const DEFAULT_ULEPSZENIA_ONLY_WORKED = false;',
    oczekiwane: ['Z2e', 'Z2f', 'Z2g'],
  },
  {
    id: 'M7',
    opis: 'ZASADA 2 — odepnij filtr obywateli od AI CYWILIZACJI (ai.ts)',
    plik: 'game/ai.ts',
    from: '    getOnlyWorked: () => true,',
    to: '    getOnlyWorked: () => false,',
    oczekiwane: ['Z2j'],
  },
  {
    id: 'M8',
    opis: 'ZASADA 3 — niech raport nigdy nie melduje nadwyzki',
    plik: 'game/auto-improvements.ts',
    from: '    surplusReport.surplus = surplusReport.demandActive',
    to: '    surplusReport.surplus = false && surplusReport.demandActive',
    oczekiwane: ['Z3b'],
  },
  {
    id: 'M9',
    opis: 'ZASADA 3 — rozbramkuj przekierowanie w silniku (main.ts)',
    plik: 'main.ts',
    from: 'if (surplusRep?.surplus) {',
    to: 'if (true) {',
    oczekiwane: ['Z3f'],
  },
  {
    id: 'M10',
    opis: 'ZASADA 3 — niech automat GRACZA sam rusza suwakiem `pracaAutoPercent`',
    plik: 'main.ts',
    from: 'if (playerSurplusReport.surplus && toastLines.length === 0) {',
    to: 'if (playerSurplusReport.surplus && toastLines.length === 0) {\n                  ulepszeniaEmpireForOwner(0).pracaAutoPercent = 0;',
    oczekiwane: ['Z3j'],
  },
  {
    id: 'M11',
    opis: 'R4-Q2 — zmien wartosc domyslna przelacznika wyrebu na WLACZONY',
    plik: 'game/cities.ts',
    from: 'export const DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = false;',
    to: 'export const DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS = true;',
    oczekiwane: ['Q2a', 'Q2b', 'Q2c'],
  },
  {
    id: 'M12',
    opis: 'R4-Q2 — zignoruj `getSkipWyrab` (przelacznik przestaje dzialac per miasto)',
    plik: 'game/auto-improvements.ts',
    from: 'const citySkipWyrab = getSkipWyrab ? getSkipWyrab(city) : skipWyrab;',
    to: 'const citySkipWyrab = skipWyrab;',
    oczekiwane: ['Q2k', 'Q2m'],
  },
  {
    id: 'M13',
    opis: 'R4-Q2 — odepnij przelacznik od wywolania pickera w main.ts',
    plik: 'main.ts',
    from: '                  getSkipWyrab: c => !effectiveUlepszeniaForCity(c as City).wolnoWycinacLas,',
    to: '',
    oczekiwane: ['Q2n'],
  },
  {
    id: 'M14',
    opis: 'R4-Q2 — przestan odtwarzac przelacznik z zapisu (main.ts / load)',
    plik: 'main.ts',
    from: '            wolnoWycinacLas: (pol.wolnoWycinacLas as boolean) ?? DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS,',
    to: '',
    oczekiwane: ['Q2i'],
  },
  {
    id: 'M15',
    opis: 'R4-Q2 — zdejmij domyslke pola miasta w `ensureCitySaveDefaults`',
    plik: 'game/cities.ts',
    from: '    if (city.ulepszeniaWolnoWycinacLas == null) {\n      city.ulepszeniaWolnoWycinacLas = DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS;\n    }',
    to: '',
    oczekiwane: ['Q2g'],
  },
];

function bazowa() {
  const out = execFileSync(process.execPath, [GATE], {
    cwd: GRA_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, AI4_TEST_TAG: 'base' },
  });
  return out;
}

function uruchomZMutacja(m, i) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `ai4-mut-${m.id}-`));
  fs.cpSync(SRC, path.join(dir, 'src'), { recursive: true });
  // `src/**` importuje dane wzglednie (`../../data/*.json`) — bez tej kopii mutacyjne
  // drzewo w /tmp nie zbudowaloby sie z powodu brakujacych danych, a nie z powodu mutacji.
  fs.cpSync(path.resolve(GRA_ROOT, 'data'), path.join(dir, 'data'), { recursive: true });
  const plik = path.join(dir, 'src', m.plik);
  const tekst = fs.readFileSync(plik, 'utf8');
  if (!tekst.includes(m.from)) {
    return { ok: false, powod: `FRAGMENT NIE ZNALEZIONY w ${m.plik}` };
  }
  fs.writeFileSync(plik, tekst.replace(m.from, m.to), 'utf8');
  let out = '';
  try {
    out = execFileSync(process.execPath, [GATE], {
      cwd: GRA_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, AI4_SRC_DIR: path.join(dir, 'src'), AI4_TEST_TAG: `m${i}` },
    });
  } catch (e) {
    out = String(e.stdout || '') + String(e.stderr || '');
  }
  fs.rmSync(dir, { recursive: true, force: true });
  const czerwone = [...out.matchAll(/\[FAIL\]\s+([A-Za-z0-9/]+):/g)].map(x => x[1]);
  return { ok: true, czerwone, out };
}

console.log('# MUTACJE — dowod nie-tautologicznosci bramki rundy 4');
console.log('# baza (zrodlo nietkniete) musi byc ZIELONA\n');
const base = bazowa();
const baseFail = [...base.matchAll(/\[FAIL\]/g)].length;
console.log(`baza: ${/(\d+) passed, (\d+) failed/.exec(base)?.[0] ?? '?'}`);
if (baseFail > 0) {
  console.error('PRZERWANO — baza nie jest zielona, mutacje nie mialyby wartosci dowodowej.');
  process.exitCode = 1;
} else {
  let dobre = 0, zle = 0;
  MUTACJE.forEach((m, i) => {
    const w = uruchomZMutacja(m, i);
    if (!w.ok) { console.error(`  [BLAD] ${m.id} ${m.opis} — ${w.powod}`); zle++; return; }
    const trafione = m.oczekiwane.filter(p => w.czerwone.some(c => c.startsWith(p)));
    const komplet = trafione.length === m.oczekiwane.length;
    if (komplet) {
      dobre++;
      console.log(`  [DOWOD] ${m.id} ${m.opis}`);
      console.log(`          czerwone: ${w.czerwone.join(', ') || '(brak)'}`);
    } else {
      zle++;
      console.error(`  [PODEJRZANA] ${m.id} ${m.opis}`);
      console.error(`          oczekiwano czerwonych: ${m.oczekiwane.join(', ')}`);
      console.error(`          czerwone faktycznie:  ${w.czerwone.join(', ') || '(BRAK — asercja nie pilnuje tego kodu)'}`);
    }
  });
  console.log(`\nai4-mutacje: ${dobre} dowodow, ${zle} podejrzanych (z ${MUTACJE.length})`);
  process.exitCode = zle > 0 ? 1 : 0;
}
