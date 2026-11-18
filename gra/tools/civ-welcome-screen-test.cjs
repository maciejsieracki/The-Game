// Test logiki ekranu „Odkryłeś nową cywilizację” (R-WEB-UI-CIV-WELCOME-SCREEN-Q1).
// Uruchomienie: node gra/tools/civ-welcome-screen-test.cjs [opcjonalna_sciezka_do_civWelcomeLogic.ts]
// Opcjonalna ścieżka pozwala uruchomić test na KOPII modułu (mutacje bez zmian w repo).
// Moduł jest bundlowany przez esbuild (devDependency gra/) i ładowany w Node.
const fs = require('fs');
const path = require('path');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const root = path.resolve(__dirname, '..');
const modPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'src', 'ui', 'civWelcomeLogic.ts');

let failures = 0;
const fail = (msg) => { failures++; console.error('FAIL: ' + msg); };
const ok = (cond, msg) => { if (!cond) fail(msg); else passes++; };
let passes = 0;

function load(file) {
  const out = esbuild.buildSync({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    loader: { '.json': 'json' },
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const L = load(modPath);
const civs = require(path.join(root, 'data', 'civs.json')).cywilizacje;
const intro = require(path.join(root, 'data', 'civ-intro-texts.json'));

// 1) Wszystkie 15 cywilizacji: treść i mapowanie klucza.
const keys = L.civKeysAll();
ok(keys.length === 15, `civKeysAll: oczekiwano 15 cywilizacji, jest ${keys.length}`);
for (const k of keys) {
  const info = L.civWelcomeInfo(k);
  ok(info !== null, `civWelcomeInfo(${k}) = null`);
  if (!info) continue;
  ok(info.name.length > 0, `${k}: brak nazwy`);
  ok(info.rys.length > 40, `${k}: krótki rys historyczny`);
  ok(info.styl.length > 0, `${k}: brak stylu z civs.json`);
  ok(info.jednostka.length > 0, `${k}: brak jednostki specjalnej`);
  ok(info.religia.length > 0, `${k}: brak religii`);
  ok(info.plusy.length + info.minusy.length > 0, `${k}: brak plusów i minusów z civ-matrix`);
  const visible = [info.name, info.rys, info.styl, info.jednostka, info.religia, ...info.plusy, ...info.minusy].join(' ');
  ok(!/_|[a-z][A-Z]/.test(visible), `${k}: surowe ID / klucz w tekście widocznym`);
  ok(!/walka_|eko_|prod_|lud_|mp_regen|meta_|dip_|ai_/.test(visible), `${k}: nazwa parametru zamiast etykiety`);
  for (const p of [...info.plusy, ...info.minusy]) {
    ok(/[+−][0-9]/.test(p), `${k}: pozycja bez wartości: ${p}`);
  }
  const e = intro[k];
  ok(e && e.powitanie_przyjazne.length === 3 && e.powitanie_nieprzyjazne.length === 3,
    `${k}: powitania w civ-intro-texts.json nie są 3+3`);
}
ok(L.civWelcomeInfo('nieznana-cywilizacja') === null, 'nieznany klucz powinien dać null');

// 2) Powitanie: deterministyczne, z puli 3 wariantów, zależne od nastawienia.
for (const k of keys) {
  const e = intro[k];
  if (!e) continue;
  const g1 = L.pickWelcomeGreeting(k, true, 12345);
  const g2 = L.pickWelcomeGreeting(k, true, 12345);
  ok(g1 === g2, `${k}: wybór powitania niedeterministyczny`);
  ok(e.powitanie_przyjazne.includes(g1), `${k}: przyjazne powitanie spoza puli`);
  const gn = L.pickWelcomeGreeting(k, false, 12345);
  ok(e.powitanie_nieprzyjazne.includes(gn), `${k}: nieprzyjazne powitanie spoza puli`);
}
{
  // Rozrzut po ziarnach: przy wielu ziarnach pojawia się więcej niż jeden wariant.
  const seen = new Set();
  for (let s = 1; s <= 60; s++) seen.add(L.pickWelcomeGreeting('grecy', true, s));
  ok(seen.size === 3, `wybór powitania: oczekiwano 3 wariantów po ziarnach, jest ${seen.size}`);
  ok(L.pickWelcomeGreeting('nieznana', true, 1) === '', 'nieznana cywilizacja: powitanie powinno być puste');
}

// 3) Nastawienie: przyjazne = poza Wrogi/Nieufny.
ok(L.isFriendlyStance('Przyjazny') === true, 'Przyjazny powinien być przyjazny');
ok(L.isFriendlyStance('Życzliwy') === true, 'Życzliwy powinien być przyjazny');
ok(L.isFriendlyStance('Neutralny') === true, 'Neutralny powinien być przyjazny (zaufanie ≥30)');
ok(L.isFriendlyStance('Nieufny') === false, 'Nieufny powinien być nieprzyjazny');
ok(L.isFriendlyStance('Wrogi') === false, 'Wrogi powinien być nieprzyjazny');

// 4) Flaga „raz”: ekran tylko dla cywilizacji, której jeszcze nie pokazano.
{
  const shown = new Set([2]);
  ok(L.firstContactWelcomeDue(shown, 1) === true, 'nowy kontakt powinien dać ekran');
  ok(L.firstContactWelcomeDue(shown, 2) === false, 'pokazany już kontakt NIE może dać ekranu ponownie');
}

// 5) Migracja starego zapisu (bez pola) vs zapis z polem.
{
  const known = [1, 3, 4];
  ok(JSON.stringify(L.legacyShownMigration(undefined, known)) === JSON.stringify(known),
    'stary zapis bez flagi: znane cywilizacje muszą być oznaczone jako pokazane');
  ok(L.legacyShownMigration([], known).length === 0, 'zapis z pustą flagą nie jest migrowany');
  ok(L.legacyShownMigration([[0, [1]]], known).length === 0, 'zapis z flagą nie jest migrowany');
}

// 6) Plusy/minusy: Grecy mają Atak na morzu jako plus (dane civ-matrix), koszt budynków z dodatnią wartością to minus.
{
  const g = L.civPlusMinus('grecy');
  ok(g.plusy.some(t => t.startsWith('Atak na morzu')), 'Grecy: brak plusu Atak na morzu');
  const r = L.civPlusMinus('rzymianie');
  ok(!r.plusy.some(t => t.startsWith('Koszt budynków')), 'Rzymianie: koszt budynków nie powinien być plusem');
  ok(r.minusy.some(t => t.startsWith('Koszt budynków')), 'Rzymianie: koszt budynków +20% powinien być minusem');
}

if (failures > 0) {
  console.error(`civ-welcome-screen-test: ${failures} FAIL (zaliczone asercje: ${passes})`);
  process.exit(1);
}
console.log(`civ-welcome-screen-test: OK (${passes} asercji)`);
