STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PALISADE-BATTLE-WALL-RULES-Q1
GOAL: Palisada = forma muru w bitwie/oblezeniu (R1 zdobycie tylko po wylomie + machiny, R2 melee nie bije muru/palisady, R3 bonus naliczany), jedno pojecie "obwarowanie miasta", gracz i AI. Runda 1 = R1-R3 logika; R4 (wieze) + grafika palisady + zrzuty = runda 2 (rozbicie dopuszczone dispatchem).

## Dowody (stan bazowy origin/main 1247214fd)
- Palisada JUZ dawala maMur: buildings.json palisada.odblokowuje='maMur' (= mury); main.ts:42236 fallback load; getWallKind main.ts:2745. Bonus R3 JUZ naliczany: city-defense.ts cityWallDefenseBonusPercent (palisada 100, mur 200, mur zastepuje palisade), battleScene.ts ~2650 (konstruktor, builtBuildingIds) i _singleBlow ~8270 (`defender.onWallWalkway ? wallDefenseTotalProc`), skip() przez computeInstantResult. Wartosci: palisada +100, mur +200, cytadela +100, baszta +100 (miasto-params.json) - BEZ ZMIAN (decyzja wlasciciela).
- Realna luka byla w REGULACH, wspolna dla muru i palisady (nie tylko palisady): 
  1. R1: battleScene `_checkEnd` konczyl bitwe wygrana atakujacego po zabiciu obroncow bez wylomu; main.ts finishSiegeStormBattle/applyMapBattleOutcome zdobywal miasto; `captureCityWithoutBattle` (szturm gracza/AI przy pustym miescie) i `tryAutoCaptureEmptyCityAt` (wejscie jednostki, takze AI) zdobywaly obwarowane miasto bez machin; Auto (`executeSilentSiegeStorm`/doSiegeAutoResolve) liczyl moc bez wymogu machin.
  2. R2: battleScene `_targetInRange` (melee, dd==1) pozwalal bic obroncow na murze z podstawy muru.
  3. Grafika bitwy: `_placeSiegeWall` zawsze buduje mur wg cywilizacji (buildSiegeWall(civ,...), battleScene ~3946) - NIE wg rodzaju obwarowania (palisada vs mur). Dotyczy FAZY B.

## Zmiany
- NOWY gra/src/game/city-fortification.ts: cityFortificationKind (mur>palisada>none), cityHasFortification, cityIsFortified, canCaptureCity (R1), meleeBlockedByWall (R2), autoStormBreach.
- gra/src/battle/battleScene.ts: `_meleeBlockedByWall` w `_targetInRange`, `_canAttackFrom`, `_canStrikeTargetFrom` (R2; dystansowi i machiny wolni; wspiety wiezą melee walczy mur-na-murze); `wallEverBreached` (ustawiane w _breachWallTile/_breachGate, reset przy restarcie); `BattleResult.wallBreached`; skip(): machina w skladzie = zalozony wylom; pat w oblezeniu bez wylomu = "SZTURM ODPARTY" (zapobiega wiecznemu patowi melee-vs-mur).
- gra/src/main.ts: `fortifiedCityCaptureBlocked` (R1) w tryAutoCaptureEmptyCityAt, szturmie gracza (puste miasto), executeSilentSiegeStorm (AI bez machin nie szturmuje - oblezenie trwa, bez resetu licznika tur); finishSiegeStormBattle: `stormCaptureBlocked` (wylom z BattleResult albo machina w Auto), komunikat "obroncy rozbici, ale mur/palisada stoi"; applyMapBattleOutcome `cityCaptureBlocked` blokuje zdobycie; getWallKind z cityFortificationKind.
- gra/src/game/post-battle-map.ts: `holdPositionAfterWin` (atakujacy zostaje pod murami, brak wipe/wejscia na heks).
- NOWE testy: gra/tools/palisade-battle-wall-rules-test.cjs (52 OK), gra/tools/city-siege-wall-rules-test.cjs (34 OK).

## TESTY
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- RED przed: palisade-battle-wall-rules-test na origin/main (src/data z git archive) = EXIT=1 (brak modulu city-fortification). GREEN po: 52/52, 34/34. Mutacje: usuniecie palisady z cityFortificationKind i canCaptureCity->true (prawdziwe funkcje, re-bundle) oraz usuniecie kazdego okablowania zrodlowego (pinezki, 14 mutacji) gasza asercje.
- Regresja `*battle*|*siege*|*wall*|*mur*|*city-defense*|*combat*|*oblez*|*bitwa*` bez live/browser (62 pliki): PO = 48 EXIT=0 + 14 EXIT!=0; PRZED (ten sam zestaw, origin/main) = te same 14 nie-zero (srodowisko; bitwa-obroncy-mur-kolumny na bazie padl z braku index.html w kopii, PO z limitem 100 s). bitwa-obroncy-mur-kolumny-test (realny Chromium + vite bundle sceny) uruchomiony osobno z 560 s: 9 ok, 0 fail, brak bledow JS - scena z nowym kodem laduje sie i stawia obroncow za murem. Lista: gate-regresja-po.txt. Dla 14 padajacych brak porownania PRZED na poziomie asercji: NIE_ZMIERZONO ponad "ten sam kod wyjscia".
- Zachowanie interaktywne R2 w zywej scenie (melee vs mur w przegladarce): NIE_ZMIERZONO (brak testu live; pokryte pinezkami zrodlowymi + funkcja czysta).

## ZALOZENIA / DECYZJE
- Wieza oblezna liczona jako machina (dispatch). W bitwie taktycznej wylom = brama lub kafel muru/palisady zniszczony; wieza sama (wspinaczka) nie jest wylomem, wiec tactical bez taranu/katapulty nie zdobedzie miasta (Auto/Skip: kazda machina = wylom). DECYZJA_WYMAGANA (domyslnie jak wyzej): czy wspiecie wieza ma liczyc sie jako wylom.
- Szturm odparty (pat bez wylomu) = wygrana obroncy. Wygrana atakujacego bez wylomu: obroncy tracą straty, atakujacy zostaja pod murami, oblezenie trwa.
- Melee wspiety wieza na korone muru moze bic obroncow na murze (mur-na-murze).

## BLOKADY
- FAZA B (model palisady w widoku bitwy: _placeSiegeWall nie zna rodzaju obwarowania; mapa juz ma wallKind 'palisada') oraz R4 (wieze co 4 heksy + ostrzal + log) + zrzuty Chromium PRZED/PO: NIE WYKONANO w tej rundzie (zakres runda 2).
- Brak dowodu wizualnego (runda 1 = logika; zrzuty w rundzie 2).

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator r1 (weryfikacja R1-R3, przegladanie wiringu), potem runda 2 Operatora: R4 + palisada w _placeSiegeWall (przekazac rodzaj obwarowania do buildSiegeWall) + zrzuty.
## ZMIANY/COMMIT: patrz SHA w dopisku ponizej
## DEPLOY/PUSH: NIE WYKONANO
