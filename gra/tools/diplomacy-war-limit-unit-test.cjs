'use strict';
/**
 * diplomacy-war-limit-unit-test.cjs — R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1.
 * Czyste testy na prawdziwym module src/game/diplomacy-war-limit.ts (esbuild, bez DOM).
 * Pokrycie: limit epoki i naturalnej niezależnie, atakujący i obrońca, flaga OFF = parytet,
 * stare zapisy bez typWojny = 'naturalna', parser wartości JSON.
 * Barbarzyńcy, pomijany i nie-wojna wykluczani przez collectWarTypes (czysta funkcja używana przez
 * warTypesForOwner w main.ts). Wpięcie bramki klastra państw-miast -> gracz w main.ts sprawdzane źródłowo
 * (sekcja R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1 na końcu). Poza zakresem (bez przeglądarki, NIE_ZMIERZONO):
 * zachowanie w biegu gry, kaskada sojusznicza i bramka wypowiedzenia gracza/AI jako deklarującego.
 * Run: node tools/diplomacy-war-limit-unit-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(ROOT, 'src', 'game', 'diplomacy-war-limit.ts');
const BUNDLE = path.resolve(__dirname, '.dip-warlimit-bundle.cjs');

esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
const M = require(BUNDLE);
try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

const ON = { limitWojenAktywny: true, maxWojenEpoki: 1, maxWojenNaturalnych: 1 };
const OFF = { limitWojenAktywny: false, maxWojenEpoki: 1, maxWojenNaturalnych: 1 };

// --- flaga i parametry ---
M.setWarLimitEnabledForTest(null);
// R-WEB-DIPLO-ENABLE-ALL-FLAGS-Q1 (decyzja właściciela 2026-11-19): limit wojen domyślnie ON w danych.
eq('flaga domyslnie ON (JSON)', M.isWarLimitEnabled(M.WAR_LIMIT_PARAMS), true);
eq('parametr maxWojenEpoki = 1', M.WAR_LIMIT_PARAMS.maxWojenEpoki, 1);
eq('parametr maxWojenNaturalnych = 1', M.WAR_LIMIT_PARAMS.maxWojenNaturalnych, 1);
eq('loader: wartosc z obiektu', M.loadWarLimitParams({ limitWojenAktywny: { wartosc: true }, maxWojenEpoki: { wartosc: 2 } }).limitWojenAktywny, true);
eq('loader: smieci -> bezpieczne', M.loadWarLimitParams({ maxWojenEpoki: 'x', maxWojenNaturalnych: -3 }), { limitWojenAktywny: false, maxWojenEpoki: 1, maxWojenNaturalnych: 1 });
eq('loader: brak danych -> domyslne', M.loadWarLimitParams(undefined), OFF);

// --- typ wojny (kompatybilnosc wsteczna) ---
eq('stary zapis (brak pola) = naturalna', M.parseTypWojny(undefined), 'naturalna');
eq('null = naturalna', M.parseTypWojny(null), 'naturalna');
eq('epoki = epoki', M.parseTypWojny('epoki'), 'epoki');
eq('nieznana wartosc = naturalna', M.parseTypWojny('cokolwiek'), 'naturalna');

// --- flaga OFF = parytet (zawsze wolno) ---
eq('OFF: 1 epoki + nowa epoka wolno', M.warLimitAllows('epoki', ['epoki'], ['epoki'], OFF), true);
eq('OFF: 3 naturalne + nowa naturalna wolno', M.warLimitAllows('naturalna', ['naturalna', 'naturalna', 'naturalna'], [], OFF), true);
M.setWarLimitEnabledForTest(true);
eq('hak ON nadpisuje JSON', M.isWarLimitEnabled(OFF), true);
M.setWarLimitEnabledForTest(false);
eq('hak OFF nadpisuje JSON ON', M.isWarLimitEnabled(ON), false);
M.setWarLimitEnabledForTest(null);

// --- limit epoki i naturalnej niezaleznie ---
eq('ON: 0 wojen -> epoki wolno', M.warLimitAllows('epoki', [], [], ON), true);
eq('ON: atakujacy ma epoke -> 2. epoka zabroniona', M.warLimitAllows('epoki', ['epoki'], [], ON), false);
eq('ON: atakujacy ma naturalna -> nowa epoka wolno (niezaleznie)', M.warLimitAllows('epoki', ['naturalna'], [], ON), true);
eq('ON: atakujacy ma epoke -> nowa naturalna wolno (niezaleznie)', M.warLimitAllows('naturalna', ['epoki'], [], ON), true);
eq('ON: atakujacy ma naturalna -> 2. naturalna zabroniona', M.warLimitAllows('naturalna', ['naturalna'], [], ON), false);
eq('ON: 1 epoki + 1 naturalna u atakujacego -> nowa epoka zabroniona', M.warLimitAllows('epoki', ['epoki', 'naturalna'], [], ON), false);
eq('ON: 1 epoki + 1 naturalna u atakujacego -> nowa naturalna zabroniona', M.warLimitAllows('naturalna', ['epoki', 'naturalna'], [], ON), false);

// --- obronca ogranicza tak samo jak atakujacy ---
eq('ON: obronca ma epoke -> nowa epoka zabroniona', M.warLimitAllows('epoki', [], ['epoki'], ON), false);
eq('ON: obronca ma naturalna -> nowa naturalna zabroniona', M.warLimitAllows('naturalna', [], ['naturalna'], ON), false);
eq('ON: obronca ma naturalna -> nowa epoka wolno', M.warLimitAllows('epoki', [], ['naturalna'], ON), true);
eq('ON: obronca ma epoke -> nowa naturalna wolno', M.warLimitAllows('naturalna', [], ['epoki'], ON), true);

// --- limit wiekszy niz 1 (parametr) ---
const TWO = { limitWojenAktywny: true, maxWojenEpoki: 2, maxWojenNaturalnych: 1 };
eq('max 2 epoki: 1 aktywna -> wolno', M.warLimitAllows('epoki', ['epoki'], [], TWO), true);
eq('max 2 epoki: 2 aktywne -> zabronione', M.warLimitAllows('epoki', ['epoki', 'epoki'], [], TWO), false);

// --- countWarsOfType ---
eq('countWarsOfType', M.countWarsOfType(['epoki', 'naturalna', 'epoki'], 'epoki'), 2);

// --- brzegowy: limit 0 blokuje kazda wojne danego typu ---
const ZERO = { limitWojenAktywny: true, maxWojenEpoki: 0, maxWojenNaturalnych: 1 };
eq('max 0 epoki: blokuje nawet pierwsza', M.warLimitAllows('epoki', [], [], ZERO), false);

// --- obrońca z wojną epoki nie blokuje nowej wojny naturalnej atakującego (niezależne typy) ---
eq('obrona epoki, atak naturalnej: wolno', M.warLimitAllows('naturalna', [], ['epoki'], ON), true);
eq('obrona epoki, atak epoki: wolno (1 wojna epoki obrońcy = max 1 -> zabronione)', M.warLimitAllows('epoki', [], ['epoki'], ON), false);
// --- barbarzyncy: modul nie widzi ich wojen (wywolujacy podaje tylko cywilizacje), wiec pusta lista = wolno ---
eq('pusta lista wojen (barbarzyncy pominiete) -> wolno', M.warLimitAllows('epoki', [], [], ON), true);
// --- flaga OFF: parytet nawet przy pelnym limicie ---
eq('flaga OFF: zabronione-wg-limitu -> wolno (parytet)', M.warLimitAllows('epoki', ['epoki'], ['epoki'], { ...ON, limitWojenAktywny: false }), true);
// --- parser: null / liczba / inny tekst = naturalna ---
eq('parseTypWojny null', M.parseTypWojny(null), 'naturalna');
eq('parseTypWojny 42', M.parseTypWojny(42), 'naturalna');
eq('parseTypWojny epoki', M.parseTypWojny('epoki'), 'epoki');

// --- typ wojny z meta (withWarTyp / getWarTypFromMeta) ---
eq('meta bez pola = naturalna', M.getWarTypFromMeta({}), 'naturalna');
eq('meta undefined = naturalna', M.getWarTypFromMeta(undefined), 'naturalna');
eq('withWarTyp epoki -> getWarTypFromMeta epoki', M.getWarTypFromMeta(M.withWarTyp({ wojnaOdTury: 5 }, 'epoki')), 'epoki');
eq('withWarTyp nie zmienia reszty meta', M.withWarTyp({ wojnaOdTury: 5 }, 'epoki').wojnaOdTury, 5);
eq('withWarTyp przez JSON (zapis/odczyt) zachowuje typ', M.getWarTypFromMeta(JSON.parse(JSON.stringify(M.withWarTyp({}, 'epoki')))), 'epoki');

// --- collectWarTypes: barbarzyńcy, pomijany, pokój nie liczą się; państwo-miasto (nie barbarzyńca) liczy się ---
const row = (o) => ({ otherId: 1, atWar: true, isBarbarian: false, excluded: false, meta: undefined, ...o });
eq('barbarzynca w wojnie nie liczy sie', M.collectWarTypes([row({ isBarbarian: true, meta: { typWojny: 'epoki' } })]), []);
eq('pomijany (cel) nie liczy sie', M.collectWarTypes([row({ excluded: true })]), []);
eq('pokoj nie liczy sie', M.collectWarTypes([row({ atWar: false })]), []);
eq('panstwo-miasto w wojnie liczy sie jako naturalna', M.collectWarTypes([row({})]), ['naturalna']);
eq('mieszany zestaw: epoki + naturalna + barbarzynca', M.collectWarTypes([
  row({ meta: M.withWarTyp({}, 'epoki') }),
  row({ otherId: 2 }),
  row({ otherId: 3, isBarbarian: true, meta: M.withWarTyp({}, 'epoki') }),
]), ['epoki', 'naturalna']);
// barbarzynca z wojna epoki nie blokuje wojny epoki cywilizacji (pusta lista wojen = wolno)
eq('barbarzynca nie blokuje wojny epoki', M.warLimitAllows('epoki', M.collectWarTypes([row({ isBarbarian: true, meta: M.withWarTyp({}, 'epoki') })]), [], ON), true);
// kontrola: gdyby barbarzynca liczyl sie, limit epoki zablokowalby wojne
eq('kontrola: bez filtra barbarzyncy limit by blokowal', M.warLimitAllows('epoki', ['epoki'], [], ON), false);

// --- R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1: wojna z graczem (owner 0) liczy sie do limitu AI ---
const PLAYER_ERA = row({ otherId: 0, meta: M.withWarTyp({}, 'epoki') });
eq('wojna z graczem epoki liczy sie u AI', M.collectWarTypes([PLAYER_ERA]), ['epoki']);
eq('ON: AI w wojnie epoki z graczem -> nowa epoka zabroniona', M.warLimitAllows('epoki', M.collectWarTypes([PLAYER_ERA]), [], ON), false);
eq('ON: AI w wojnie epoki z graczem + inna epoka -> trzecia epoka zablokowana (lista 2 epok)', M.warLimitAllows('epoki', M.collectWarTypes([PLAYER_ERA, row({ otherId: 2, meta: M.withWarTyp({}, 'epoki') })]), [], ON), false);
eq('OFF: AI w wojnie epoki z graczem -> nowa epoka wolno (parytet)', M.warLimitAllows('epoki', M.collectWarTypes([PLAYER_ERA]), [], { ...ON, limitWojenAktywny: false }), true);
// panstwo-miasto w wojnie naturalnej z graczem blokuje 2. naturalna (klaster panstw-miast -> gracz)
const CS_PLAYER_NAT = row({ otherId: 0 });
eq('ON: panstwo-miasto w wojnie naturalnej z graczem -> nowa naturalna zabroniona', M.warLimitAllows('naturalna', M.collectWarTypes([CS_PLAYER_NAT]), [], ON), false);
eq('OFF: panstwo-miasto w wojnie naturalnej z graczem -> wolno', M.warLimitAllows('naturalna', M.collectWarTypes([CS_PLAYER_NAT]), [], { ...ON, limitWojenAktywny: false }), true);

// --- R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1 (obrona r1): WPIECIE bramki w src/main.ts ---
// Testy powyzej dotykaja tylko czystego modulu. Ta czesc sprawdza zrodlo main.ts: bramka limitu
// dla klastra panstw-miast -> gracz musi stac w petli klastra, dokladnie raz, PRZED wypowiedzeniem
// wojny (chargeWarDeclarationCredibility). Usuniecie linii z main.ts -> FAIL (test na kopii).
const MAIN_TS = process.env.WAR_LIMIT_MAIN_TS || path.resolve(ROOT, 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const CLUSTER_LOOP = 'for (const csOwnerId of clusterDowOwners) {';
const CLUSTER_GATE = "if (!warLimitAllowsDeclaration(csOwnerId, ME(), 'naturalna')) continue;";
const CLUSTER_DECL = 'chargeWarDeclarationCredibility(csOwnerId, ME())';
const loopAt = mainSrc.indexOf(CLUSTER_LOOP);
const gateAt = mainSrc.indexOf(CLUSTER_GATE);
const declAt = mainSrc.indexOf(CLUSTER_DECL);
eq('main.ts: petla klastra PM->gracz istnieje', loopAt >= 0, true);
eq('main.ts: bramka limitu w klastrze PM->gracz wystepuje dokladnie raz', mainSrc.split(CLUSTER_GATE).length - 1, 1);
eq('main.ts: bramka limitu stoi w petli klastra przed wypowiedzeniem wojny', loopAt >= 0 && gateAt > loopAt && declAt > gateAt, true);

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`diplomacy-war-limit-unit-test: pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
