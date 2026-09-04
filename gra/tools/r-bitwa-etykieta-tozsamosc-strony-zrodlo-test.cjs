'use strict';
/**
 * r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs
 * R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 -- straznik zrodlowy GOAL 1+2.
 *
 * ZGLOSZENIE (wlasciciel, 2026-09-03, ze zrzutem ekranu): "w wyniku bitwy jest
 * informacja 'wojownik wygrywa', a powinno byc 'gracz wygrywa'. Po lewej stronie
 * powinna byc informacja 'Grecy' zamiast 'wojownik', a po drugiej stronie powinna
 * byc 'Korynt, Grecy, panstwo-miasto' zamiast 'wojownik'."
 *
 * DLACZEGO STATYCZNY TEST OBOK ZYWEGO RENDERU (real-render-test w tym samym
 * katalogu): _sideDisplayLabel()/_buildBattleSummaryData() zyja w battleScene.ts,
 * klasie zaleznej od THREE.js/WebGL (canvas gry) -- odpalenie PRAWDZIWEJ instancji
 * BattleScene w Chromium poza pelna gra jest poza budzetem jednej rundy. Ten test
 * pilnuje WERSJI ZRODLOWEJ dokladnie tych dwoch metod (kolejnosc: civLabel ->
 * custom label -> Sklad(N)/typeId jako OSTATNIA linia obrony), a real-render-test
 * dowodzi zywo w Chromium, ze gdy _sideDisplayLabel zwroci civLabel (co ten test
 * potwierdza na zrodle), postBattleSummary.ts renderuje go poprawnie bold + w
 * werdykcie + z poprawna ikona. Razem pokrywaja cala sciezke end-to-end.
 *
 * RUNDA 3 (2026-09-04, Evaluator zarzut 6): czytanie `_civLabelForSide()` czynilo
 * caly fallback (custom -> Sklad(N) -> typeId) kodem NIEOSIAGALNYM, bo
 * `_attackerCivLabel`/`_defenderCivLabel` maja domyslne 'Gracz'/'Przeciwnik' i nigdy
 * nie sa puste -- komentarz opisywal "ostatnia linie obrony", ktorej kod nie
 * realizowal. Zrodlem etykiety glownej jest teraz `_civLabelForSideExplicit()`
 * (dokladnie to, co podal wolajacy; pusty string gdy nie podal nic), wiec fallback
 * jest realnie osiagalny -- asercja "OSIAGALNOSC FALLBACKU" nizej pilnuje, ze
 * etykieta glowna NIE czyta pary z domyslkami. Efekt uboczny, tez pozadany: bold
 * nigdy nie pokaze literalu 'Gracz'/'Przeciwnik' (skarga wlasciciela).
 *
 * RUNDA OBRONY (2026-09-03, Evaluator FAIL): pierwotna wersja tej metody/tego
 * testu kazala custom (_attackerSideLabel/_defenderSideLabel) miec pierwszenstwo
 * nad civLabel, w zalozeniu ze custom "dzis puste w tym scenariuszu" -- FALSZ.
 * Evaluator wykazal grepem KAZDEGO realnego `new BattleScene(...)`, ze custom jest
 * ZAWSZE ustawiony na preBattleSideFromRoster(...).nazwa = nazwe typu jednostki
 * (main.ts:23704-23705, main.ts:24283-24284, mapFieldBattle.ts:491-492) -- NIGDY
 * civLabel -- wiec stara kolejnosc czynila civLabel martwym kodem w kazdej
 * prawdziwej bitwie. Kolejnosc odwrocona: civLabel PRZED custom; custom zostaje
 * jako fallback wylacznie gdy civLabel jest puste/niedostepne. Zaden wolajacy w
 * repo nie ustawia custom na cos innego niz nazwe typu jednostki, wiec ta zmiana
 * nie odbiera pierwszenstwa zadnemu celowemu, odrebnemu uzyciu custom.
 *
 * Usage (z gra/): node tools/r-bitwa-etykieta-tozsamosc-strony-zrodlo-test.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const battle = read('src/battle/battleScene.ts');
const summary = read('src/game/battle-summary.ts');
const postBattle = read('src/ui/postBattleSummary.ts');

let checks = 0;
function has(source, pattern, label) {
  checks += 1;
  assert.match(source, pattern, label);
}
function lacks(source, pattern, label) {
  checks += 1;
  assert.doesNotMatch(source, pattern, label);
}

// --- GOAL 1: _sideDisplayLabel civLabel ma pierwszenstwo nad typeId/"Sklad (N)" ---
const sideDisplayLabelSrc = battle.match(
  /private _sideDisplayLabel\(side: 'atk' \| 'def'\): string \{[\s\S]*?\n {2}\}/,
)?.[0];
assert.ok(sideDisplayLabelSrc, '_sideDisplayLabel znaleziona w zrodle');
checks += 1;

has(sideDisplayLabelSrc, /const civLabel = this\._civLabelForSideExplicit\(side\);\s*\n\s*if \(civLabel\) return civLabel;/,
  'civLabel ma PIERWSZENSTWO -- sprawdzany jako pierwszy, przed custom');
// OSIAGALNOSC FALLBACKU (Evaluator zarzut 6, runda 2): etykieta glowna MUSI czytac pare
// bez domyslek. Gdyby czytala `_civLabelForSide()` (domyslne 'Gracz'/'Przeciwnik'),
// `if (civLabel) return civLabel` bylby zawsze prawdziwy i caly fallback ponizej --
// martwy, a bold pokazywalby literal 'Gracz'/'Przeciwnik'.
lacks(sideDisplayLabelSrc, /this\._civLabelForSide\(side\)/,
  'etykieta glowna NIE czyta _civLabelForSide (para z domyslkami Gracz/Przeciwnik) -- inaczej fallback jest kodem martwym, a bold pokazuje literal "Gracz"');
has(battle, /private _attackerCivLabelExplicit = '';\s*\n\s*private _defenderCivLabelExplicit = '';/,
  'pola *CivLabelExplicit istnieja (civLabel bez domyslek)');
has(battle, /this\._attackerCivLabelExplicit = opts\.attackerCivLabel\?\.trim\(\) \?\? '';/,
  '*CivLabelExplicit ustawiane z opts BEZ fallbacku na literal -- pusty string gdy wolajacy nie podal civLabel (to czyni fallback _sideDisplayLabel osiagalnym)');
has(sideDisplayLabelSrc, /const custom = side === 'atk' \? this\._attackerSideLabel : this\._defenderSideLabel;\s*\n\s*if \(custom\) return custom;/,
  'custom sideLabel zostaje jako fallback PO civLabel (dla wywolan, ktore nie ustawily civLabel w ogole)');
// civLabel musi wystapic w zrodle PRZED custom ORAZ przed oboma fallbackami ("Sklad (N)" i typeId) --
// to jest DOKLADNIE defekt zgloszony przez Evaluatora (custom = nazwa typu jednostki jest ZAWSZE
// ustawiony przez realnych wolajacych, wiec musi przegrac z civLabel, nie wygrac).
{
  const civIdx = sideDisplayLabelSrc.indexOf('const civLabel = this._civLabelForSide');
  const customIdx = sideDisplayLabelSrc.indexOf('const custom = side ===');
  const skladIdx = sideDisplayLabelSrc.indexOf("'Sklad (");
  const typeIdIdx = sideDisplayLabelSrc.indexOf('snaps[0]!.typeId');
  assert.ok(civIdx >= 0 && customIdx > civIdx && skladIdx > civIdx && typeIdIdx > civIdx,
    'civLabel poprzedza w kodzie custom ORAZ oba fallbacki ("Sklad (N)" i typeId jednostki) -- civLabel wygrywa niezaleznie od tego, ze custom jest zawsze ustawiony na nazwe typu jednostki w realnej grze (KRYTERIUM 1,2,4)');
  checks += 1;
}
has(sideDisplayLabelSrc, /return String\(u\?\.bu\.nazwa \?\? u\?\.bu\.kategoria \?\?/,
  'nazwa typu jednostki zostaje jako OSTATNIA linia obrony (civLabel pusty/niedostepny), nie usunieta calkowicie');

// --- GOAL 1: _buildBattleSummaryData nadal karmi atkLabel/defLabel z _sideDisplayLabel ---
has(battle, /atkLabel: this\._sideDisplayLabel\('atk'\),\s*\n\s*defLabel: this\._sideDisplayLabel\('def'\),/,
  '_buildBattleSummaryData nadal woła _sideDisplayLabel dla atkLabel/defLabel (jedno zrodlo dla bold nazwy I werdyktu, patrz battle-summary.ts winnerLabel = input.atkLabel/defLabel)');

// --- GOAL 2: nowe pola ikony przekazywane z klasy do buildPostBattleSummary ---
has(battle, /atkCivIconId: this\._attackerCivIconId,\s*\n\s*defCivIconId: this\._defenderCivIconId,/,
  '_buildBattleSummaryData przekazuje civIconId (zero nowego liczenia, pola juz istniejace na klasie)');
has(battle, /atkIsCityState: this\._attackerIsCityState,\s*\n\s*defIsCityState: this\._defenderIsCityState,/,
  '_buildBattleSummaryData przekazuje isCityState');
has(battle, /atkIsBarbarian: this\._attackerIsBarbarian,\s*\n\s*defIsBarbarian: this\._defenderIsBarbarian,/,
  '_buildBattleSummaryData przekazuje isBarbarian');
has(battle, /atkEra: this\._attackerEra,\s*\n\s*defEra: this\._defenderEra,/,
  '_buildBattleSummaryData przekazuje era (dobor portretu wg epoki)');

// --- GOAL 2: kontrakt battle-summary.ts niesie nowe pola opcjonalne ---
has(summary, /civIconId\?: string;/, 'BattleSummarySide.civIconId');
has(summary, /isCityState\?: boolean;/, 'BattleSummarySide.isCityState');
has(summary, /isBarbarian\?: boolean;/, 'BattleSummarySide.isBarbarian');
has(summary, /era\?: number;/, 'BattleSummarySide.era');
has(summary, /atkCivIconId\?: string;[\s\S]{0,80}defCivIconId\?: string;/, 'BuildBattleSummaryInput niesie atk/defCivIconId');
has(summary, /civIconId: input\.atkCivIconId,/, 'buildPostBattleSummary mapuje atkCivIconId -> atakujacy.civIconId');
has(summary, /civIconId: input\.defCivIconId,/, 'buildPostBattleSummary mapuje defCivIconId -> obronca.civIconId');

// --- GOAL 2: postBattleSummary.ts -- dobor ikony medalionu wg tozsamosci (kolejnosc jak mkCommanderCard) ---
const cornerSrc = postBattle.match(/function buildCommanderCorner\([\s\S]*?\n\}/)?.[0];
assert.ok(cornerSrc, 'buildCommanderCorner znaleziona w zrodle');
checks += 1;
lacks(cornerSrc.split('const civIconId')[0], /medal\.innerHTML = PB_SVG\.commander;/,
  'medal NIE jest juz bezwarunkowo ustawiany na PB_SVG.commander PRZED logika doboru ikony (stary bug)');
has(cornerSrc, /leaderPortraitUrl\(civIconId, side\.era \?\? 1\)/, 'portret wladcy dobierany przez leaderPortraitUrl (ten sam wzorzec co mkCommanderCard)');
has(cornerSrc, /else if \(side\.isBarbarian\) \{\s*\n\s*medal\.innerHTML = brandIconSvg\('chip-death', 30\);/,
  'barbarzynca -> brandIconSvg("chip-death"), sprawdzane PRZED miasto-panstwo (ten sam priorytet co mkCommanderCard/TEMAT 11)');
has(cornerSrc, /else if \(side\.isCityState && civIconId\) \{\s*\n\s*medal\.innerHTML = civIconSvg\(civIconId, 30\);/,
  'miasto-panstwo -> civIconSvg (symbol kultury), NIE portret wladcy glownej cywilizacji (R-MP-PORTRET)');
has(cornerSrc, /\} else \{\s*\n\s*medal\.innerHTML = PB_SVG\.commander;\s*\n\s*\}/,
  'PB_SVG.commander zostaje jako OSTATECZNY fallback (brak portretu/civIconId), nie usuniety');
// Barbarzynca sprawdzany PRZED miasto-panstwo w warunku portraitUrl (kolejnosc krytyczna, TEMAT 11).
{
  const barbIdx = cornerSrc.indexOf('side.isBarbarian ||');
  const cityIdx = cornerSrc.indexOf('side.isCityState ||');
  assert.ok(barbIdx >= 0 && cityIdx > barbIdx, 'w warunku portraitUrl isBarbarian sprawdzany przed isCityState');
  checks += 1;
}

// mkCommanderCard (battleScene.ts) pozostaje NIETKNIETY -- wzorzec do kopiowania, nie do edycji (allowlista).
has(battle, /const mkCommanderCard = \(side: 'atk' \| 'def'\): void => \{/, 'mkCommanderCard nadal obecna, niezmieniona sygnatura');

// Sanity: kontrakt bitwy nadal zawiera istniejace punkty rozstrzygniecia (regres strukturalny).
has(battle, /private _civLabelForSide\(side: 'atk' \| 'def'\): string \{/, 'algorytm _civLabelForSide pozostaje obecny (podtytul/medaliony -- niezmieniony)');
has(battle, /private _civLabelForSideExplicit\(side: 'atk' \| 'def'\): string \{/, '_civLabelForSideExplicit obecny (zrodlo etykiety glownej)');

// --- Zarzut Evaluatora 4: rog paska nie powtarza tozsamosci dwa razy ---
has(cornerSrc, /const duplicate = norm\(civ\) === norm\(side\.label\) && composition !== '';/,
  'podtytul rogu wykrywa duplikacje tozsamosci (bold === civLabel)');
has(cornerSrc, /sub\.textContent = \(duplicate \? composition : civ\)/,
  'przy duplikacji podtytul pokazuje SKLAD zamiast powtorzonej tozsamosci (informacja odzyskana, nie zdublowana)');

// --- Zarzut Evaluatora 1: literal 'Gracz' znikl ze sciezki civLabel bitwy w main.ts ---
{
  const main = read('src/main.ts');
  has(main, /const atkCivLabel = ownerDiploLabel\(atkOwner\);\s*\n\s*const defCivLabel = ownerDiploLabel\(defLead\.ownerId\);/,
    'openIncomingAttackPreBattle (atak AI/barbarzyncow na gracza): civLabel obu stron z ownerDiploLabel, zero literalu "Gracz"');
  lacks(main, /atkOwner === 0 \? 'Gracz' : ownerDiploLabel/,
    'literal "Gracz" dla atakujacego gracza usuniety (Evaluator zarzut 1)');
  lacks(main, /defLead\.ownerId === 0 \? 'Gracz' : ownerDiploLabel/,
    'literal "Gracz" dla broniacego gracza usuniety (Evaluator zarzut 1)');
  // Zarzut 2: civLabelForOwner(0) zwracalo SUROWE id cywilizacji ("rzymianie"), a dla AI
  // sformatowane ownerDiploLabel ("Grecy") -- ta sama funkcja zasila mapFieldBattle.ts:332/343
  // i szturm oblezniczy, wiec bold lewy/prawy mial DWA rozne formaty w jednej bitwie.
  has(main, /const diplo = ownerDiploLabel\(0\)\.trim\(\);\s*\n\s*if \(diplo\) return diplo;/,
    'civLabelForOwner(0) liczy ownerDiploLabel(0) -- ten sam format co dla AI (Evaluator zarzut 2)');
  lacks(main, /if \(ownerId === 0\) return String\(player\.civType \|\| _menuCivId \|\| 'Gracz'\);/,
    'civLabelForOwner nie zwraca juz SUROWEGO id cywilizacji jako pierwszej odpowiedzi dla gracza');
}
has(battle, /private _checkEnd\(/, 'warunek konca walki pozostaje obecny');

console.log(`R-BITWA-ETYKIETA-TOZSAMOSC-STRONY-Q1 (zrodlo): PASS (${checks} checks)`);
