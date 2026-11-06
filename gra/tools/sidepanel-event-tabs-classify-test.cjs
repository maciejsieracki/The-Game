'use strict';
/**
 * sidepanel-event-tabs-classify-test.cjs
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 (runda 2) — klasyfikacja eventTabOf na REALNYCH tekstach
 * komunikatow z main.ts + negatywy + MUTACJE (kazda mutacja klasyfikatora musi zapalic testy).
 *
 * Teksty pochodza z wywolan showHintMessage / kolekcji zdarzen w src/main.ts (numery linii w
 * komentarzach przy grupach). Wpis z hintu EOT ma title '' (patrz eot-event-defer.ts), a tekst
 * w subtitle; dyplomacja gracz<->AI dostaje title 'Dyplomacja' + kind 'diplo'.
 *
 * Usage (z gra/): node tools/sidepanel-event-tabs-classify-test.cjs
 *   EVENT_TABS_SRC=<plik.ts> — zmierz inna wersje modulu (np. R1 do dowodu RED).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const SRC = process.env.EVENT_TABS_SRC
  ? path.resolve(process.env.EVENT_TABS_SRC)
  : path.join(GRA, 'src', 'ui', 'sidePanelEventTabs.ts');
const OUT_DIR = path.join(__dirname, '.classify-test-tmp');

const hint = (subtitle, extra) => Object.assign({ title: '', subtitle, kind: 'info', blocking: false, origin: undefined }, extra || {});

// [opis, wpis, oczekiwana zakladka]
const POSITIVE = [
  // --- Ważne: brak surowców / magazyn / oblężenie / armia / głód / deficyt (main.ts 16422, 16175, 36299-36313, 36439, 36800-36813)
  ['kapitulacja Harappa (z zrzutu wlasciciela)', hint('Harappa: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!'), 'wazne'],
  ['kapitulacja Ur (z zrzutu wlasciciela)', hint('Ur: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!'), 'wazne'],
  ['głód spadek populacji', hint('Głód: spadek populacji w 2 miastach'), 'wazne'],
  ['GŁÓD wielkimi literami', hint('GŁÓD W MIEŚCIE'), 'wazne'],
  ['glod bez diakrytykow', hint('glod w Rzymie'), 'wazne'],
  ['głód wojska', hint('Głód wojska za 2 tury — brak żywności na armię!'), 'wazne'],
  ['głód utracono jednostek', hint('Głód: utracono 3 jednostek'), 'wazne'],
  ['deficyt złota', hint('Deficyt Złota za 1 turę - pusty Skarbiec!'), 'wazne'],
  ['deficyt złota -% HP', hint('Deficyt Złota: -10% max HP u 2 jednostek'), 'wazne'],
  ['magazyn ujemny a wojsko', hint('Masz wojsko, a magazyn centralny jest ujemny — wojsko może głodować. Zwiększ produkcję żywności lub zmniejsz rekrutację.'), 'wazne'],
  ['brak pokrycia (Zaufanie)', hint('Zaufanie nie naliczone — brak pokrycia w zasobach'), 'wazne'],
  ['brak środków w skarbcu (trybut)', hint('Trybut zerwany — brak środków w skarbcu'), 'wazne'],
  ['wróg atakuje', hint('Wróg atakuje twoje wojsko!'), 'wazne'],
  ['wrog bez diakrytykow', hint('Rzym: wrog w polu widzenia'), 'wazne'],
  ['Utracono fort', hint('Utracono fort (3,4) wraz z terytorium — zdobyty przez wroga.'), 'wazne'],
  ['rajd Ludów Morza', hint('Rajd Ludów Morza — zniszczone ulepszenie: Farma!'), 'wazne'],
  ['bunt miasta', hint('⚡ Rzym zbuntowało się i ogłosiło niepodległość! Miasto nie jest już Twoje.'), 'wazne'],
  ['oblężenie zniesione', hint('Rzym: oblężenie zniesione — brak wojsk przy murach.'), 'wazne'],
  ['szturm odparty', hint('Szturm odparty — oblężenie trwa.'), 'wazne'],
  ['dostęp do złoża — wojna', hint('Dostęp do złoża wygasł — wojna'), 'wazne'],
  ['armia (słowo)', hint('Armia nie może się rozwinąć'), 'wazne'],
  ['karta blokująca', { title: 'Bunt: Ur', subtitle: 'Migracja mieszkańców', kind: 'city', blocking: true }, 'wazne'],
  ['kind enemy', { title: 'Wróg', subtitle: 'Obcy oddział', kind: 'enemy', blocking: false }, 'wazne'],
  // --- Dyplomacja bez prefiksu (main.ts 12142, 12196, 22224-22319, 23005-23051, 21253, 22645, 10743, 21868, 19065)
  ['Pokój zawarty', hint('\u{1F54A} Pokój zawarty'), 'dyplomacja'],
  ['Rozejm zawarty', hint('\u{1F54A} Rozejm zawarty na 10 tur'), 'dyplomacja'],
  ['Pokój z:', hint('Pokój z: Egipt'), 'dyplomacja'],
  ['Pokój nie zawarty', hint('Pokój nie zawarty — miasto w oblężeniu'), 'dyplomacja'],
  ['Zerwano traktat', hint('Zerwano traktat: Handel — Egipt'), 'dyplomacja'],
  ['Wypowiedziałeś wojnę', hint('⚔ Wypowiedziałeś wojnę: Egipt'), 'dyplomacja'],
  ['wypowiada wojnę (ultimatum)', hint('⚔ Egipt wypowiada wojnę (ultimatum)'), 'dyplomacja'],
  ['wypowiada wojnę (era)', hint('⚔ Egipt wypowiada wojnę'), 'dyplomacja'],
  ['sojusznik dołącza do wojny', hint('⚔ Sojusznik Egipt dołącza do wojny z tobą!'), 'dyplomacja'],
  ['sojusz zerwany', hint('Sojusz zerwany — Egipt nie wszedł do wojny'), 'dyplomacja'],
  ['wypełniasz sojusz', hint('Wypełniasz sojusz — wojna z: Egipt'), 'dyplomacja'],
  ['trybut — casus belli', hint('Trybut zerwany — casus belli przeciw Egipt'), 'dyplomacja'],
  ['ryzyko wojny', hint('Ryzyko wojny z Egipt: 3 tur do wypowiedzenia (łączna Relacja ≤ -50)'), 'dyplomacja'],
  ['wojna z (zaufanie)', hint('Wojna z Egipt: utrzymane Zaufanie spadło do progu krytycznego.'), 'dyplomacja'],
  ['audiencja', hint('Egipt prosi o audiencję — handel'), 'dyplomacja'],
  ['odrzuca propozycję — brak zasobów (dyplomacja, nie Ważne)', hint('Egipt odrzuca propozycję — brak zasobów na kontrofertę'), 'dyplomacja'],
  ['składa kontrofertę', hint('Egipt składa kontrofertę: +10 złota'), 'dyplomacja'],
  ['handel AI-AI bez origin (marker)', hint('Rzym handluje z Egiptem'), 'dyplomacja'],
  ['kind diplo', { title: 'Dyplomacja: Egipt', subtitle: 'propozycja wygasła', kind: 'diplo', blocking: true }, 'dyplomacja'],
  ['origin other-civs', { title: 'Dyplomacja', subtitle: 'Rzym handluje z Egiptem', kind: 'diplo', blocking: false, origin: 'other-civs' }, 'dyplomacja'],
  ['tytuł Dyplomacja (info)', { title: 'Dyplomacja', subtitle: 'cokolwiek', kind: 'info', blocking: false }, 'dyplomacja'],
];

const NEGATIVE = [
  // granice słów: "armi" nie może pasować do "farmie"
  ['farmie nie jest armią', hint('Postawiono farmie nowy sad przy rzece'), 'inne'],
  ['pułapka / zatoka nie atak', hint('Odkryto zatokę z perłami'), 'inne'],
  ['"Wrogie" weterani (edukacyjny)', { title: 'Doświadczeni wojownicy', subtitle: 'Wrogie jednostki weteranów', kind: 'info', blocking: false }, 'inne'],
  ['chatka', { title: 'Odkryto chatkę', subtitle: '+20 złota', kind: 'city', blocking: false }, 'inne'],
  ['szlak zerwany (pozostaje, Inne)', { title: 'Szlak handlowy zerwany', subtitle: 'Rzym ↔ Egipt (CYW1) — brak połączenia', kind: 'city', blocking: false }, 'inne'],
  ['miasto-państwo wchłonięte', hint('Miasto-państwo wchłonięte do imperium'), 'inne'],
  ['awans epoki', hint('Nowa epoka: Brąz'), 'inne'],
  // R2-obrona (zarzut Evaluatora): nazwy wlasne budynkow/technologii/zysk gracza nie sa "zlymi" slowami kluczowymi
  ['Budowa ukonczona: Magazyn (nazwa budynku)', hint('Budowa ukończona: Magazyn'), 'inne'],
  ['Technologia odkryta: Atak z flanki (nazwa techu)', hint('Technologia odkryta: Atak z flanki'), 'inne'],
  ['zysk gracza: fort zdobyty razem z terytorium', hint('Fort zdobyty razem z terytorium (3,4).'), 'inne'],
  ['spichlerz zbudowany', hint('Rzym: Spichlerz zbudowany'), 'inne'],
];

function runCases(mod) {
  const failures = [];
  for (const [name, ev, want] of POSITIVE.concat(NEGATIVE)) {
    const got = mod.eventTabOf(ev);
    if (got !== want) failures.push(`${name}: oczekiwano ${want}, jest ${got}`);
  }
  // diakrytyki: te same wpisy w 3 zapisach dają tę samą zakładkę
  for (const v of ['Głód w Rzymie', 'głód w Rzymie', 'GŁÓD W RZYMIE', 'Glod w Rzymie']) {
    if (mod.eventTabOf(hint(v)) !== 'wazne') failures.push('diakrytyki/wielkość liter: ' + v);
  }
  // domyślna zakładka
  const d = mod.defaultSidePanelTab;
  if (d({ dyplomacja: 3, wazne: 1, inne: 5 }) !== 'wazne') failures.push('default: Ważne gdy są wpisy');
  if (d({ dyplomacja: 2, wazne: 0, inne: 5 }) !== 'dyplomacja') failures.push('default: Dyplomacja gdy brak Ważnych');
  if (d({ dyplomacja: 0, wazne: 0, inne: 5 }) !== 'inne') failures.push('default: Inne gdy tylko Inne');
  return failures;
}

async function load(srcText, tag) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outfile = path.join(OUT_DIR, tag + '.cjs');
  await esbuild.build({
    entryPoints: [SRC],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    absWorkingDir: GRA,
    logLevel: 'silent',
    plugins: [{
      name: 'override-src',
      setup(b) {
        b.onLoad({ filter: /sidePanelEventTabs\.ts$|EVENT_TABS_ALT/ }, () => ({ contents: srcText, loader: 'ts', resolveDir: path.dirname(SRC) }));
      },
    }],
  });
  return require(outfile);
}

// Mutacje: [nazwa, funkcja(src) -> zmieniony src]. Kazda MUSI zmienic zrodlo i MUSI zapalic >=1 przypadek.
const MUTATIONS = [
  ['M1 bez normalizacji diakrytykow', (s) => s.replace(".normalize('NFD')", '').replace(".replace(/[\\u0300-\\u036f]/g, '')", '').replace(".replace(/\\u0142/g, 'l')", '')],
  ['M2 brak granicy poczatku wyrazu (armi w farmie)', (s) => s.replace("const W = '(?<![a-z0-9])';", "const W = '';")],
  ['M3 brak reguly brakow (brak srodkow/pokrycia)', (s) => s.replace("  'brak (?:srodk|pokryci|zasob|wystarcz|surow|zywn|drewn|zlota|zloz|kamien|zelaz|zboz|rekrut|mocy)',\n  'brakuj', 'niedobor', 'deficyt', 'wyczerp', 'nie stac', 'za malo',", "  'zzzzneverzzzz',")],
  ['M4 brak fraz dyplomatycznych (pokoj/rozejm/wojna)', (s) => s.replace("'wypowiada wojn', ", "'zzzz1', ").replace("'pokoj z[: ]', 'pokoj zawarty', 'pokoj nie zawarty', 'rozejm', 'zerwano traktat', 'traktat',", "'zzzz2',")],
  ['M5 kolejnosc: braki przed propozycjami dyplomacji', (s) => s.replace('  if (DIPLO_PROPOSAL_RE.test(text)) return \'dyplomacja\';\n  if (SHORTAGE_RE.test(text)) return \'wazne\';', '  if (SHORTAGE_RE.test(text)) return \'wazne\';\n  if (DIPLO_PROPOSAL_RE.test(text)) return \'dyplomacja\';')],
  ['M6 brak slow zagrozen (magazyn/oblezenie/armia)', (s) => s.replace("'magazyn (?:centraln|ujemn|pust|wyczerp)', 'kapitulac', 'oblez', 'glod',", "'zzzz3',").replace("'armi[aeiy]', 'wojsk', 'wrog(?![a-z])',", "'zzzz4',")],
  ['M7 wrog bez ograniczenia (Wrogie weterani -> Wazne)', (s) => s.replace("'wrog(?![a-z])'", "'wrog'")],
  ['M8 brak reguly kind/origin/tytul Dyplomacja', (s) => s.replace("if (ev.kind === 'diplo' || ev.origin === 'other-civs' || ev.title.startsWith('Dyplomacja')) {", 'if (false) {')],
  ['M9 default zawsze Inne', (s) => s.replace("if (counts.wazne > 0) return 'wazne';", "if (counts.wazne > 0) return 'inne';")],
];

(async () => {
  const origSrc = fs.readFileSync(SRC, 'utf8');
  let failed = 0;
  console.log('sidepanel-event-tabs-classify-test (R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 r2)');
  console.log('  zrodlo: ' + path.relative(GRA, SRC));
  const base = await load(origSrc, 'base');
  const f0 = runCases(base);
  if (f0.length === 0) console.log(`  [OK] ${POSITIVE.length + NEGATIVE.length} przypadkow + diakrytyki + default`);
  else { failed += f0.length; f0.forEach((m) => console.error('  [FAIL]', m)); }

  if (!process.env.SKIP_MUTATIONS) {
    let i = 0;
    for (const [name, fn] of MUTATIONS) {
      const mutated = fn(origSrc);
      if (mutated === origSrc) { failed++; console.error('  [FAIL] mutacja nie zmienila zrodla (nieaktualny wzorzec):', name); continue; }
      const mod = await load(mutated, 'mut' + (i++));
      const f = runCases(mod);
      if (f.length > 0) console.log(`  [OK] mutacja wykryta (${f.length} przypadkow czerwonych): ${name}`);
      else { failed++; console.error('  [FAIL] mutacja NIEWYKRYTA:', name); }
    }
  }
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  console.log(failed === 0 ? '\nPASS' : '\nFAIL (' + failed + ')');
  process.exit(failed === 0 ? 0 : 1);
})();
