'use strict';
/**
 * hotseat-peace-protection-test.cjs — R-WEB-HOTSEAT-PEACE-PROTECTION-Q1 (P21b, odp. właściciela 4A).
 *
 * Pokój między dwoma fotelami ludzkimi (hotseat) ma tę samą regułę czasu co pokój z AI:
 *  (a) PRZED pokojem: propozycja i akceptacja wymagają PEACE_PROPOSAL_MIN_WAR_TURNS (10) pełnych tur
 *      wojny (bramka `peaceProposalIsTooEarly`, ta sama co dla AI). Bramka jest w `humanPeaceRejectReason`,
 *      które wołają `proposeToHuman` i `respondToHumanProposal` (accept).
 *  (b) PO pokoju: 10 tur ochrony przed wypowiedzeniem wojny — realizuje to już `finalizePeaceTreatyBetween`
 *      (`startPeaceTreatyLock` z domyślnym PEACE_TREATY_LOCK_TURNS), a wypowiedzenie blokuje
 *      `isPeaceLockedBetween` w `playerDeclareWarOnOwner` i `ownerDeclareWarOn`. Ta część jest sprawdzana
 *      źródłowo (stałe i wywołania), bez nowej logiki.
 *
 * Test BEHAWIORALNY (a): wyciąga PRODUKCYJNE ciało `humanPeaceRejectReason` z gra/src/main.ts i wykonuje je
 * z atrapami stanu relacji i tur wojny; stałe czytane są z plików src (nie wpisane na sztywno).
 * MUTACJA: ten sam test uruchomiony na kopii źródła bez bramki czasu MUSI wykryć brak (czerwono).
 *
 * Użycie (z katalogu gra/): node tools/hotseat-peace-protection-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.join(__dirname, '..');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const timingSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'diplomacy-peace-proposal-timing.ts'), 'utf8');
const lockSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'diplomacy-peace-lock.ts'), 'utf8');

const GATE_LINE = "if (peaceProposalIsTooEarly(fromOwnerId, toOwnerId, 'pokoj')) {";

/** Stała z modułu timingu (bez wpisywania 10 na sztywno w teście). */
const MIN_WAR_TURNS = Number((timingSrc.match(/export const PEACE_PROPOSAL_MIN_WAR_TURNS = (\d+);/) || [])[1]);
const LOCK_TURNS = Number((lockSrc.match(/export const PEACE_TREATY_LOCK_TURNS = (\d+);/) || [])[1]);

/** Ciało funkcji `name` z podanego tekstu źródła (zrównoważone klamry). */
function extractBody(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error('brak funkcji ' + name);
  const paramOpen = src.indexOf('(', start);
  const paramClose = src.indexOf(')', paramOpen);
  const open = src.indexOf('{', paramClose);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        const params = src.slice(paramOpen + 1, paramClose)
          .split(',').map(s => s.split(':')[0].trim()).filter(Boolean);
        return { params, body: src.slice(open + 1, i) };
      }
    }
  }
  throw new Error('niedomknięte ciało ' + name);
}

/**
 * Uruchamia humanPeaceRejectReason z podanego źródła. Atrapy: status relacji (`status`) i tury wojny
 * (`turnsAtWar`); bramka czasu liczona tą samą regułą co produkcyjna `peaceProposalBlocked`.
 */
function runHumanPeaceReject(src, state) {
  const { params, body } = extractBody(src, 'humanPeaceRejectReason');
  const deps = {
    getDiploRelation: () => ({ status: state.status }),
    peaceProposalIsTooEarly: (a, b, actionId) => {
      const atWar = state.status === 'wojna';
      const turns = atWar ? state.turnsAtWar : 0;
      return atWar && actionId === 'pokoj' && turns < MIN_WAR_TURNS;
    },
    PEACE_PROPOSAL_MIN_WAR_TURNS: MIN_WAR_TURNS,
  };
  const depNames = Object.keys(deps);
  const fn = new Function(...depNames, ...params, body);
  return fn(...depNames.map(k => deps[k]), 0, 1, { type: 'zaproponuj_pokoj' });
}

const POKOJ_BRAK_WOJNY = 'Pokój — brak trwającej wojny';

/** Zestaw sprawdzeń zachowania; zwraca listę niespełnionych (pusta = wszystko zgodne). */
function behaviourFailures(src) {
  const fails = [];
  const expectReason = (label, state, expected) => {
    let got;
    try { got = runHumanPeaceReject(src, state); } catch (e) { got = 'WYJĄTEK: ' + e.message; }
    if (got !== expected) fails.push(`${label}: oczekiwano ${JSON.stringify(expected)}, otrzymano ${JSON.stringify(got)}`);
  };
  // Pokój poza wojną — bez zmian (powód zgodny z AI).
  expectReason('pokój bez wojny', { status: 'pokoj', turnsAtWar: 0 }, POKOJ_BRAK_WOJNY);
  // Wojna krótsza niż 10 pełnych tur — odrzucone (to jest nowa bramka hotseat).
  expectReason('pokój w wojnie 0 tur', { status: 'wojna', turnsAtWar: 0 }, `Pokój i rozejm będą dostępne po ${MIN_WAR_TURNS} pełnych turach wojny`);
  expectReason('pokój w wojnie tura przed progiem', { status: 'wojna', turnsAtWar: MIN_WAR_TURNS - 1 },
    `Pokój i rozejm będą dostępne po ${MIN_WAR_TURNS} pełnych turach wojny`);
  // Wojna co najmniej 10 pełnych tur — dopuszczone.
  expectReason('pokój w wojnie na progu', { status: 'wojna', turnsAtWar: MIN_WAR_TURNS }, null);
  expectReason('pokój w wojnie po progu', { status: 'wojna', turnsAtWar: MIN_WAR_TURNS + 5 }, null);
  return fails;
}

/** Sprawdzenia źródłowe: kontrakt połączeń i brak trwałej stałej dla hotseat. */
function sourceFailures(src) {
  const fails = [];
  const body = extractBody(src, 'humanPeaceRejectReason').body;
  if (!body.includes(GATE_LINE)) fails.push('humanPeaceRejectReason nie zawiera bramki peaceProposalIsTooEarly(…, \'pokoj\')');
  const respond = extractBody(src, 'respondToHumanProposal').body;
  if (!(respond.indexOf('humanPeaceRejectReason(p.fromOwnerId') >= 0
    && respond.indexOf('humanPeaceRejectReason(p.fromOwnerId') < respond.indexOf('finalizePeaceTreatyBetween(p.fromOwnerId')))
    fails.push('respondToHumanProposal: strażnik pokoju nie jest przed finalizePeaceTreatyBetween');
  const fin = extractBody(src, 'finalizePeaceTreatyBetween').body;
  if (!/startPeaceTreatyLock\(\s*\{[\s\S]*?\},\s*turn,\s*lockTurnsOverride,?\s*\)/.test(fin))
    fails.push('finalizePeaceTreatyBetween: blokada DOW po pokoju (startPeaceTreatyLock) nie jest ustawiana dla każdej pary');
  if (!/export const PEACE_TREATY_LOCK_TURNS = 10;/.test(lockSrc)) fails.push('PEACE_TREATY_LOCK_TURNS nie równa się 10');
  const declare = extractBody(src, 'playerDeclareWarOnOwner').body;
  if (!declare.includes('isPeaceLockedBetween(ME(), ownerId)')) fails.push('playerDeclareWarOnOwner: brak strażnika isPeaceLockedBetween');
  const ownerDecl = extractBody(src, 'ownerDeclareWarOn').body;
  if (!ownerDecl.includes('isPeaceLockedBetween(attackerId, defenderId)')) fails.push('ownerDeclareWarOn: brak strażnika isPeaceLockedBetween');
  if (/PEACE_HUMAN_MIN_TURNS/.test(src)) fails.push('pojawiła się osobna stała hotseat (ma być ta sama bramka)');
  return fails;
}

/** Mutant: bramka czasu usunięta z humanPeaceRejectReason (zostaje tylko strażnik „brak wojny”). */
function mutantWithoutGate(src) {
  const i = src.indexOf(GATE_LINE);
  if (i < 0) throw new Error('mutacja: brak bramki w źródle');
  const end = src.indexOf('}', src.indexOf('return ', i));
  // Usuwamy blok if (...) { return ...; } — podmiana na pusty if z fałszem.
  return src.slice(0, i) + 'if (false) {' + src.slice(i + GATE_LINE.length, end + 1) + src.slice(end + 1);
}

let pass = 0;
let fail = 0;
function check(label, ok) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
}

const realBehav = behaviourFailures(mainSrc);
check(`zachowanie produkcyjne zgodne z bramką ${MIN_WAR_TURNS} tur wojny (${realBehav.length} odchyleń)`, realBehav.length === 0);
realBehav.forEach(f => console.log('   ' + f));
const realSrc = sourceFailures(mainSrc);
check(`kontrakt źródłowy (połączenia, blokada po pokoju ${LOCK_TURNS} tur) (${realSrc.length} odchyleń)`, realSrc.length === 0);
realSrc.forEach(f => console.log('   ' + f));

const mutant = mutantWithoutGate(mainSrc);
const mutBehav = behaviourFailures(mutant);
check(`mutacja (bez bramki czasu) jest wykrywana: czerwono w zachowaniu (${mutBehav.length} odchyleń)`, mutBehav.length > 0);
const mutSrc = sourceFailures(mutant);
check(`mutacja (bez bramki czasu) jest wykrywana: czerwono w kontrakcie źródłowym (${mutSrc.length} odchyleń)`, mutSrc.length > 0);

console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
