STATUS: PASS-WITH-NOTES (runda 2/5, CZĘŚCIOWA: pkt 3, 4, 5, 6 (lista), 8, 11 (analiza) zrobione i zmierzone; pkt 9, 10, 12 oraz Chromium NIE ZROBIONE)
DOMAIN: GAME (bitwa / rozstawienie)
TEMAT: R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1
GOAL: bitwa z zasadzki: zastawiający rozstawia się na całym polu (także na polu wroga), zaskoczeni w długiej linii max 3 w szeregu poprzek pola (konnica/rydwany w linii), zwykła bitwa bez zmian. Bez premii liczbowych.
BAZA: kandydat 76f52ba9f (refs/keep/AMBUSH-r1-fc). PIERWSZY KROK wykonany: `git merge origin/main` (f0afe94cd, FALA 787). Merge czysty, bez konfliktów. Sprawdzenie: `git merge-base --is-ancestor f0afe94cd HEAD` = tak; `git merge-base --is-ancestor 76f52ba9f HEAD` = tak. Merge commit: 3ce7854b0.

ZMIANY-COMMIT (kolejne commity, `git add` jawnymi ścieżkami):
- e57f1466e: gra/src/battle/battleScene.ts; gra/tools/ambush-deploy-identity-test.cjs (NOWY); gra/tools/ambush-deploy-line-width-test.cjs (NOWY); gra/tools/ambush-deploy-scene-test.cjs (zaktualizowany: asercja strefy zaskoczonego gracza zgodna z nową regułą linii).
- f2023a24e: docs/encyklopedia/pojecia/zasadzka.md (sekcja „Rozstawienie w bitwie z zasadzki”); gra/src/data/wikiBundle.json (regeneracja: `node tools/bundle-wiki-for-game.cjs`, 22 rozdz. + 185 haseł).
- Ten raport: dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1/10-operator-claude.md (osobny commit).
Zmiany w battleScene.ts (wszystkie za warunkiem `_ambushSurprisedSide != null`; zwykła bitwa nietknięta):
- nowe metody: _isAmbushSurprisedPlayer, _isAmbushLineSide(side), _ambushLineRowBand() (wiersze PLAY_MID_ROW ± AMBUSH_FORMATION_MAX_WIDTH/2 = 3 wiersze), _clampDeployPlayerRow.
- _inDeployPlayerZone: zaskoczony gracz = zwykła strefa kolumn AND wiersz w paśmie linii (pkt 8: przeciąganie/ręczne rozstawianie ograniczone do linii).
- drag (mousemove) używa _clampDeployPlayerRow zamiast klampowania do całego pola.
- _placeUnits (start) i _placeUnitsOneSide (Reset): dla strony zaskoczonej wiersze kandydatów = pasmo linii (lineSide), konnica/rydwan nie dostaje skrzydeł (mountedWing = mounted AND !lineSide) -> pkt 4.
- import AMBUSH_FORMATION_MAX_WIDTH z game/ambush.ts.

TESTY (surowe wyniki, worktree, gra/node_modules z npm ci):
- npx tsc --noEmit (gra/): exit 0, 0 linii wyjścia.
- node gra/tools/ambush-deploy-geometry-test.cjs: WYNIK: 20 OK / 0 FAIL.
- node gra/tools/ambush-deploy-scene-test.cjs: WYNIK: 26 OK / 0 FAIL (po zmianie asercji zaskoczonego gracza: strefa = kolumny zwykłe ∩ pasmo linii; poza linią false; clamp wiersza do linii).
- node gra/tools/ambush-deploy-line-width-test.cjs (NOWY, realne _placeUnits + _placeUnitsOneSide, N=5/12/30/60, mieszanka piechota/konnica/rydwany, tereny plains/scattered, 3 przypadki: AI zaskoczony def, gracz zaskoczony atk, gracz zaskoczony def): PASS, 240 checks (wszystkie jednostki zaskoczonych w wierszach 76..78, max 3 na kolumnę, konnica obecna w linii, brak nakładania). Mutacja A (lineSide=false, czyli wyłączona logika linii): FAIL „linia zaskoczonych w wierszach 76..78 (jest 76..80)” -> test łapie regresję. Mutacja B (samo usunięcie !lineSide z mountedWing): test PASS — to zamierzone: pasmo wierszy (rowLo/rowHi) dominuje nad skrzydłami; mountedWing wpływa tylko na punktację, nie na granice szyku.
- node gra/tools/ambush-deploy-identity-test.cjs (NOWY; AMBUSH_BASE_GRA = katalog gra/ z `git archive 1c452ec35 gra/src gra/tools gra/data` w scratchpadzie): PASS, 1776 porównanych pozycji jednostek (start + Reset; plains + scattered; N=5/12/30/60; control atk i def) -> zwykła bitwa IDENTYCZNA jak na bazie. Mutacja C (_isAmbushLineSide zwraca true dla atk, czyli psuje zwykłą bitwę): FAIL na pierwszym porównaniu (przesunięcie am3 o 1 kolumnę/wiersz) -> test łapie.
- node gra/tools/json-descriptions-sync-test.cjs: 19 pass / 0 fail (po regeneracji wikiBundle).
- node gra/tools/mgla-sciezka-inwariant-test.cjs: 42 pass / 0 fail (bramka referencyjna z zadania).
- Nie uruchomione / NIE ZMIERZONO z powodu harnessu: battle-initial-placement-runtime-test, battle-commander-star-reset-test, battle-cavalry-flank-default-test, battle-deploy-cavalry-flanks-test -> BUILD FAIL: src/ui/brandTokenVars.ts:7 `import ... tokens.css?raw` (esbuild bez loadera). Import pochodzi z origin/main (FALA 787, TEMPO/brandTokenVars), nie z tej rundy; te harnessy nie mają stubu brandTokenVars. Dług harnessów po FALI 787 — do osobnego tematu (dodać stub jak w army-stack-commander-identity-test.cjs). Nie modyfikowałem cudzych testów poza allowlistą.
- NIE ZMIERZONO: 5 bramek referencyjnych (poza tsc), load-game-regression, determinizm, pozostałe battle-*, ambush-live, Chromium (zrzuty 1280×720 obu faz rozstawienia; konsola) — brak środowiska przeglądarkowego w tej rundzie.

PUNKTY Z DISPATCHU — STATUS:
(3) Test identyczności zwykłej bitwy — ZROBIONE (1776 pozycji, mutacja złapana).
(4) Konnica/rydwany zaskoczonych w linii ≤3 — ZROBIONE (test N=5/12/30/60, mutacja A złapana). Uwaga: mountedWing zachowuje punktację; granicę szyku wymusza pasmo wierszy.
(5) Wiki zasadzka.md + wikiBundle — ZROBIONE (f2023a24e); json-descriptions-sync 19/0.
(6) Dług Rust (lista do REPIN) — ZROBIONE jako lista poniżej (bez zmian kodu Rust).
(8) Przeciąganie zaskoczonego ograniczone do linii — ZROBIONE (_inDeployPlayerZone + drag clamp); test w scene-test (sprawdza strefę poza linią = false i clamp wiersza).
(9) _buildDeployZone (strefa graficzna) — NIE ZROBIONE. Wizualizacja nadal pokazuje połowy pola (lewa jasna / prawa mgła); logika już ogranicza (zastawiający = całe pole, zaskoczony = pasmo). Rozjazd UI↔logika do zrobienia (wymaga weryfikacji wizualnej).
(10) AUTO i „pomiń do wyniku” spójne z logiką zasadzki — NIE ZROBIONE. AUTO rozstawienie startowe korzysta z _placeUnits (ma już linię), ale nie zweryfikowano ścieżek doMapAutoResolve/skip; brak testu.
(11) Zapis/wczytanie flagi zasadzki w trakcie rozstawiania — ANALIZA: zapis jest zablokowany, gdy otwarta jest scena bitwy (main.ts isSaveBlockedByBattle = isBattleSceneOpen() || isPostBattleSummaryOpen(); komunikat „Zapis niedostępny w trakcie bitwy”, pkt W27). Więc stan rozstawiania nie trafia do zapisu i nie może zgubić flagi. NIE ZMIERZONO: autozapis (czy też blokowany w bitwie) — brak testu; flaga BattleOpts.ambush nie jest serializowana (i nie musi być, o ile zapis jest zablokowany).
(12) manualControlAllowed bez generała — NIE ZROBIONE. Stan: manualControlAllowed = atkRosterRef.some(isGeneral) (main.ts ~36287/36341/37068/37155/39930); bez generała _manualMode=false (AUTO) w bitwie. Nie sprawdzono, czy ręczne rozstawienie fazy deploy zależy od _manualMode (_deployMode vs _manualMode). Decyzja (fallback vs ręcznie) do FC/właściciela.
(Chromium) NIE ZMIERZONO.

UWAGI-DLA-ORKIESTRATORA (poza zakresem / do decyzji):
- Harnessy battle-* (initial-placement-runtime, commander-star-reset, cavalry-flank-default, deploy-cavalry-flanks) są zepsute na origin/main przez brandTokenVars ?raw (FALA 787). Warto osobny temat „HARNESS-BRANDTOKENS-STUB”.
- Decyzja produktowa z r1 nadal otwarta: czy gracz-zastawiający dostaje bitwę z rozstawieniem przy zasadzce na AI (ścieżka AI->gracz przez komendę attack z ambush:true w main.ts ~45763/45915; w r1 dodano parametr ambushSurprisedSide do launchIncomingMapFieldBattle — nie zweryfikowano w przeglądarce).
- Zgłoszenie do rejestru: po FALI 787 kolory minimapy/TEMPO nie były ruszane w tej rundzie.

ZAŁOŻENIA (luki rozstrzygnięte założeniem):
- „Linia ≤3” = najwyżej 3 jednostki na kolumnę poprzek pola (pasmo 3 wierszy PLAY_MID_ROW±1). Zaskoczony gracz: strefa = zwykła strefa kolumn ∩ pasmo.
- Konnica w linii dostaje te same wiersze co piechota (bez skrzydeł), zachowuje punktację terenu (-4/+6/+3) jak skrzydło.
- Dla zastawiającego-AI bez zmian w tej rundzie (ambushFlankCells z r1).

LISTA DŁUGU RUST (REPIN) — dla rozstawienia z zasadzki (pkt f, nie wykonane w kodzie Rust):
- Pliki/funkcje (web): gra/src/battle/ambushDeploy.ts: ambushLineIdeal, ambushFlankCells, ambushResolveCells; gra/src/battle/battleScene.ts: _isAmbushAmbusherPlayer, _isAmbushSurprisedPlayer, _isAmbushLineSide, _ambushLineRowBand, _applyAmbushDeployIdeal, _inDeployPlayerZone, _clampDeployPlayerCol, _clampDeployPlayerRow, _placeUnits.place (closure), _placeUnitsOneSide; gra/src/main.ts: launchIncomingMapFieldBattle (parametr ambushSurprisedSide), openPlayerMapUnitAttackCore (ambushSurprised), fireAmbushOnHex.
- Stałe: AMBUSH_FORMATION_MAX_WIDTH=3 (gra/src/game/ambush.ts); PLAY_MID_ROW, PLAY_ROW0/1, PLAY_COL0/1, DEPLOY_MIN/MAX_ROW.
- Fixtury/testy do odtworzenia w Rust: ambush-deploy-geometry-test, ambush-deploy-scene-test, ambush-deploy-line-width-test, ambush-deploy-identity-test (wymaga bazy 1c452ec35).
- Reguła do przeniesienia: pasmo wierszy linii zaskoczonych; konnica w linii; zwykła bitwa bez zmian.

RUNDY: 2/5 (Operator, Haiku). Runda 1: FC FAIL (76f52ba9f). Ta runda: częściowo (pkt 3,4,5,6,8,11-analiza zrobione; 9,10,12 + Chromium nie).
NASTĘPNY KROK: Evaluator r2 na 10-operator-claude.md (SHA z commitu raportu) — przegląd diffu e57f1466e + f2023a24e; FC decyduje o pkt 9, 10, 12 (czy wymagane w tej paczce, czy osobny temat) i o Chromium (NIE ZMIERZONO). Równolegle: osobny temat HARNESS-BRANDTOKENS-STUB dla battle-* harnessów.
DEPLOY/PUSH: NIE WYKONANO
