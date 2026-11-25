'use strict';
/**
 * war-end-reason-log-test.cjs — R-WEB-WAR-END-REASON-LOG-Q1.
 * Powód końca / wybuchu wojny między dwiema cywilizacjami AI zapisany w „Wydarzeniach na świecie”
 * oraz log diagnostyczny window.__diploWarEndLog (tylko ?civTest=1).
 *
 * CZĘŚĆ A (behawioralna): moduł czysty src/game/diplo-world-news.ts (esbuild bundle):
 *   - worldDiploReasonLabel: polskie opisy kodów powodu; 'inny' / nieznany → null,
 *   - worldDiploNewsEntry z powodem: podtytuł zawiera opis, pole `powod` = opis,
 *   - brak powodu = wpis JAK DOTĄD (bez pola `powod`, podtytuł bez zmian),
 *   - worldDiploNewsSanitize: zachowuje `powod` (zapis/wczytanie), stare zapisy bez pola → bez powodu.
 * CZĘŚĆ B (źródłowa): main.ts — każda główna ścieżka ustawia kod powodu przed setDiploRelation /
 *   finalizePeaceTreatyBetween (P10, P11, P12, P20, wypowiedzenie AI, wojna epoki), recordAiAiWarPeaceNews
 *   przekazuje powód do wpisu, a log __diploWarEndLog jest pod bramką ?civTest=1.
 *   Cofnięcie któregokolwiek haka → test CZERWONY.
 *
 * Run z gra/:  node tools/war-end-reason-log-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }

// ---- CZĘŚĆ A: moduł czysty (wykonanie) ----
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'war-end-reason-'));
const entry = path.join(temp, 'entry.ts');
const bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry, `export * from ${JSON.stringify(path.join(SRC, 'game', 'diplo-world-news'))};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.ts': 'ts' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

const ALL = new Set([1, 2, 3]);
const base = { a: 1, b: 2, prevStatus: 'wojna', nextStatus: 'pokoj', turn: 50, pairKey: '1_2',
  labelA: 'Alfa', labelB: 'Beta', discovered: ALL, skip: false };

console.log('CZĘŚĆ A — opisy powodu:');
ok(M.worldDiploReasonLabel('pokoj_wymuszony_zmeczenie', 40) === 'Pokój wymuszony po 40 turach wojny',
  'pokoj_wymuszony_zmeczenie z 40 turami → „Pokój wymuszony po 40 turach wojny”');
ok(typeof M.worldDiploReasonLabel('pokoj_wymuszony_zmeczenie') === 'string', 'pokoj_wymuszony_zmeczenie bez tur → tekst ogólny');
ok(M.worldDiploReasonLabel('auto_pokoj_dwa_miasta') === 'Pokój po zdobyciu 2 miast', 'auto_pokoj_dwa_miasta → opis');
ok(M.worldDiploReasonLabel('prosba_o_pokoj_ai') !== null, 'prosba_o_pokoj_ai → opis');
ok(M.worldDiploReasonLabel('oferta_zmeczenia') !== null, 'oferta_zmeczenia → opis');
ok(M.worldDiploReasonLabel('wypowiedzenie_ai') !== null, 'wypowiedzenie_ai → opis');
ok(M.worldDiploReasonLabel('wojna_epoki') !== null, 'wojna_epoki → opis');
ok(M.worldDiploReasonLabel('kod_nieznany') === null, 'nieznany kod → null (wpis bez powodu)');
ok(M.worldDiploReasonLabel('') === null, 'pusty kod → null');
ok(M.worldDiploReasonLabel('pokoj_po_rozejmie') === null, 'kod bez ścieżki w grze (usunięty) → null');

console.log('CZĘŚĆ A — klasyfikacja pokoju zmęczeniem (próg z parametrów):');
ok(M.powodZmeczeniaPokoju(100, 100) === 'pokoj_wymuszony_zmeczenie', 'peak == próg → wymuszony');
ok(M.powodZmeczeniaPokoju(120, 100) === 'pokoj_wymuszony_zmeczenie', 'peak > próg → wymuszony');
ok(M.powodZmeczeniaPokoju(99, 100) === 'oferta_zmeczenia', 'peak tuż pod progiem → oferta przegranego');
ok(M.powodZmeczeniaPokoju(0, 100) === 'oferta_zmeczenia', 'peak 0 → oferta przegranego');
ok(M.worldDiploReasonLabel(M.powodZmeczeniaPokoju(100, 100), 40) === 'Pokój wymuszony po 40 turach wojny',
  'klasyfikacja + opis: wymuszony z 40 turami');

console.log('CZĘŚĆ A — wpis z powodem i bez powodu:');
const withR = M.worldDiploNewsEntry({ ...base, powod: { kod: 'pokoj_wymuszony_zmeczenie', turyWojny: 40 } });
ok(withR !== null, 'wpis powstaje dla zmiany wojna→pokój');
ok(withR.powod === 'Pokój wymuszony po 40 turach wojny', 'pole powod = polski opis powodu');
ok(withR.subtitle.includes('Pokój wymuszony po 40 turach wojny'), 'podtytuł zawiera powód');
ok(withR.subtitle.startsWith('Zawarcie pokoju między innymi cywilizacjami'), 'podtytuł zaczyna się od dotychczasowego tekstu');
const noR = M.worldDiploNewsEntry({ ...base });
ok(noR !== null && !('powod' in noR), 'brak powodu → brak pola powod (wpis jak dotąd)');
ok(noR.subtitle === 'Zawarcie pokoju między innymi cywilizacjami', 'brak powodu → podtytuł bez zmian');
const warR = M.worldDiploNewsEntry({ ...base, prevStatus: 'pokoj', nextStatus: 'wojna', powod: { kod: 'wypowiedzenie_ai' } });
ok(warR !== null && warR.powod === 'Wypowiedzenie wojny przez AI' && warR.subtitle.endsWith('Wypowiedzenie wojny przez AI'),
  'wypowiedzenie AI: wpis wojny z powodem');
const skipR = M.worldDiploNewsEntry({ ...base, skip: true, powod: { kod: 'prosba_o_pokoj_ai' } });
ok(skipR === null, 'para pominięta (skip) → brak wpisu nawet z powodem');
const hidden = M.worldDiploNewsEntry({ ...base, discovered: new Set([1]), powod: { kod: 'prosba_o_pokoj_ai' } });
ok(hidden === null, 'strona nieodkryta → brak wpisu (widoczność bez zmian)');

console.log('CZĘŚĆ A — zapis / wczytanie:');
const saved = JSON.parse(JSON.stringify([withR, noR]));
const back = M.worldDiploNewsSanitize(saved);
ok(back.length === 2 && back[0].powod === 'Pokój wymuszony po 40 turach wojny', 'zapis→wczytanie zachowuje powód');
ok(!('powod' in back[1]), 'wpis bez powodu pozostaje bez powodu po wczytaniu');
const legacy = [{ id: 'x', icon: '☮', title: 'Pokój: A i B', subtitle: 'Zawarcie pokoju między innymi cywilizacjami',
  kind: 'diplo', turnCreated: 10, a: 1, b: 2, newsKind: 'pokoj' }];
const leg = M.worldDiploNewsSanitize(legacy);
ok(leg.length === 1 && !('powod' in leg[0]), 'stary zapis bez pola powod → wczytany bez powodu (migracja)');
ok(M.worldDiploNewsSanitize([{ ...legacy[0], powod: 123 }])[0].powod === undefined, 'niepoprawny typ powod → pominięty');

// ---- CZĘŚĆ B: main.ts — haki kodów powodu i log civTest ----
console.log('CZĘŚĆ B — main.ts (haki źródłowe):');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const has = (re, m) => ok(re.test(main), m);
has(/function withDiploWarReason</, 'withDiploWarReason zdefiniowane');
has(/finally \{ diploWarReasonCtx = prev; \}/, 'kontekst powodu przywracany w finally');
has(/diploWarReasonCtx\.pairKey === key \? diploWarReasonCtx : null/, 'powód przypisany tylko do zmiany statusu tej pary (bez kaskad)');
has(/recordAiAiWarPeaceNews\(a, b, prevStatus, rel\.status, newsOpts\?\.truce === true, powodPary, prevWojnaStartTura\)/,
  'setDiploRelation przekazuje powód pary i start wojny do wpisu');
has(/kod: powodZmeczeniaPokoju\(zm, WAR_WEARINESS_PARAMS\.zmeczenie\.progWymuszonyPokoj\)/, 'P10/P11: kod powodu zmęczenia przez klasyfikator');
has(/WAR_WEARINESS_PARAMS\.zmeczenie\.progWymuszonyPokoj/, 'P10: próg wymuszenia z parametrów wojny zmęczenia');
has(/withDiploWarReason\(loser, winner, \{ kod: 'prosba_o_pokoj_ai' \}/, 'P20: prośba przegrywającej AI');
has(/withDiploWarReason\(ownerA, ownerB, \{ kod: 'auto_pokoj_dwa_miasta', miasta: st\.capturedByA \+ st\.capturedByB \}/, 'P12: auto-pokój po 2 miastach');
has(/withDiploWarReason\(ownerId, targetId, \{ kod: gateForcedTagAny !== null \? 'wojna_epoki' : 'wypowiedzenie_ai'/, 'wypowiedzenie AI / wojna epoki');
has(/__diploWarEndLog/, 'log window.__diploWarEndLog');
has(/diploWarEndLogOn\(\) && !skipPair/, 'log pod bramką diploWarEndLogOn (i pomija pary z graczem)');
has(/const diploWarEndLogOn = \(\): boolean =>[\s\S]{0,120}civTest=1/, 'bramka logu = ?civTest=1');
has(/WAR_WEARINESS_PARAMS,\s*runWarWearinessTick/, 'WAR_WEARINESS_PARAMS zaimportowane');

console.log(`\nWYNIK: PASS=${passed} FAIL=${failed}`);
process.exit(failed === 0 ? 0 : 1);
