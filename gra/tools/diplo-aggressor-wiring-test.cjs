'use strict';
/**
 * diplo-aggressor-wiring-test.cjs — R-WEB-WAR-AGGRESSOR-FLAG-Q1 (dowód wpięcia w silnik).
 * Run: node tools/diplo-aggressor-wiring-test.cjs
 *
 * Statyczny dowód, że każde produkcyjne miejsce wypowiedzenia wojny (`'wojna_wypowiedziana'`
 * w main.ts) ma rejestrację przyczyny, że odmowa trybutu/ultimatum rejestruje casus belli,
 * że stan jest zapisywany i wczytywany, oraz że AI i UI czytają flagę.
 * Wynik liczbowy jest częścią raportu (plik:linia).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.resolve(ROOT, rel), 'utf8');
const count = (src, needle) => src.split(needle).length - 1;

const main = read('src/main.ts');
const ai = read('src/game/ai.ts');
const dip = read('src/game/diplomacy.ts');
const prop = read('src/game/diplomacy-proposals.ts');
const panel = read('src/ui/diplomacyPanel.ts');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' | ' + detail : ''}`);
}

// Produkcyjne wypowiedzenia: hamulec, gracz, ownerDeclareWarOn, sojusznik, klaster CS, AI wypowiedz_wojne.
// Testowe hooki __*TestDebug (3 wystąpienia) są poza zakresem gry i nie są liczone.
const decl = count(main, "'wojna_wypowiedziana'");
const testDebugDecl = count(main, "setDiploRelation(a, b, applyDiploEventTracked(a, b, getDiploRelation(a, b), 'wojna_wypowiedziana'))")
  + count(main, "setDiploRelation(ME(), aiId, applyDiploEventTracked(ME(), aiId, getDiploRelation(ME(), aiId), 'wojna_wypowiedziana'))")
  + count(main, "setDiploRelation(attackerId, targetId, applyDiploEventTracked(attackerId, targetId, cur, 'wojna_wypowiedziana'))");
// R-WEB-TRUCE-Q1 r3: wygaśnięcie rozejmu (tickTruceExpiries) przywraca wojnę przez to samo zdarzenie,
// ale NIE jest wypowiedzeniem (bez kary, bez flagi agresora) — odejmowane z liczby produkcyjnych.
const truceExpiryRevert = count(main, "applyDiploEventTracked(a, b, cur, 'wojna_wypowiedziana')");
const reg = count(main, 'zarejestrujWypowiedzenie(');
check('main: wszystkie produkcyjne wypowiedzenia maja rejestracje', reg === decl - testDebugDecl - truceExpiryRevert,
  `wojna_wypowiedziana=${decl} (testowe=${testDebugDecl}, wygasniecie rozejmu=${truceExpiryRevert}), zarejestrujWypowiedzenie=${reg}`);
check('main: rejestracja gracza (bez powodu lub casus belli)',
  main.includes('zarejestrujWypowiedzenie(ME(), turn, przyczynaWypowiedzenia({ zlamanieRozejmu: truceBreachPlayer, casusBelliAktywny: maCasusBelliAktywne(ME(), ownerId, turn) }))'));
check('main: ownerDeclareWarOn rejestruje (przyczyna jawna lub z casus belli)',
  main.includes('cause ?? przyczynaWypowiedzenia({') && main.includes('zlamanieRozejmu: truceBreachNow')
  && main.includes('casusBelliAktywny: maCasusBelliAktywne(attackerId, defenderId, turn)'));
check('main: hamulec nie nadaje flagi', main.includes("zarejestrujWypowiedzenie(declarer, turn, 'hamulec');"));
check('main: wymuszona inna (sojusz/rebelia) nie nadaje flagi',
  main.includes("zarejestrujWypowiedzenie(allyId, turn, 'wymuszona_inna');")
  && main.includes("ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna');"));
check('main: AI wypowiedz_wojne — wymuszona epoka z powodu R-EPOKA-*',
  main.includes('wymuszonaEpoka: forcedEraTagFromPowod(cmd.powod) !== null'));
check('main: odmowa trybutu/ultimatum rejestruje casus belli (oba kierunki)',
  count(main, 'zarejestrujCasusBelli(') === 3 // 2 produkcyjne + 1 hak live __aggressorTestDebug
  && main.includes('zarejestrujCasusBelli(entry.proposerOwnerId, awaitingId, turn);')
  && main.includes('zarejestrujCasusBelli(entry.proposerOwnerId, ME(), turn);'));
check('main: save zapisuje flage i casus belli',
  main.includes('aggressorFlagUntilByOwner: pobierzStanAgresorow(),') && main.includes('casusBelliUntilByPair: pobierzStanCasusBelli(),'));
check('main: load odtwarza flage i casus belli (brak pola = pusty stan)',
  main.includes('ustawStanAgresorow(wczytajMape(saved.meta?.aggressorFlagUntilByOwner));')
  && main.includes('ustawStanCasusBelli(wczytajMape(saved.meta?.casusBelliUntilByPair));'));
check('main: nowa gra czysci stan agresora', count(main, 'resetStanAgresora();') === 1);
check('main: relacje gracza i AI niosa flage (celAgresorAktywny)',
  count(main, 'celAgresorAktywny: czyAgresorAktywny(') === 2 && main.includes('agresorDoTury: doTuryFlagiAgresora(otherId, turn),'));
check('ai.ts: prog sojuszu/paktu i kontekst stance',
  ai.includes('+ deltaRelacjiSojusz(rel.celAgresorAktywny === true, undefined)')
  && count(ai, 'deltaRelacjiSojusz(rel.celAgresorAktywny === true, undefined)') === 2
  && ai.includes('celAgresorAktywny: rel.celAgresorAktywny === true,'));
check('diplomacy.ts: prog i mnoznik willingnessAlly w aiDiplomacyStance',
  dip.includes('+ agresorDeltaSojusz,') && dip.includes('mnoznikWillingnessAlly(context.celAgresorAktywny === true)'));
check('diplomacy-proposals.ts: prog sojuszu, paktu i stance proponenta',
  prop.includes('deltaRelacjiSojusz(proponentAgresor)') && count(prop, 'deltaRelacjiSojusz(proponentAgresor)') === 2
  && prop.includes('const proponentAgresor = czyAgresorAktywny(proposerOwnerId, ctx.turn);'));
check('UI panel: znacznik Agresor z tooltipem „do tury N"',
  panel.includes('Wypowiedział wojnę bez powodu (do tury ') && panel.includes('agresorBadgeHtml(rel.agresorDoTury)'));

console.log(`diplo-aggressor-wiring-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
