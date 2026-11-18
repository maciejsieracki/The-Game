STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzie pomiarowe gra/tools + raporty; gra/src nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1
GOAL: żywy, wznowialny test ścieżek pokoju wymuszonego z oczekującą akceptacją (scenariusze 1–5), raport zmierzone / NIE ZMIERZONO, defekty jako zgłoszenia (bez zmian w src).
ZMIANY/COMMIT: kandydat 57f4741f36d899b4a1ea436375c876cf58add8ff (potomek bazy 1dd3958be, `merge-base --is-ancestor` = OK). Diff vs baza: wyłącznie gra/tools/diplo-forced-peace-pending-live-paths-test.cjs + dyspozycje/autobot/runs/<ID>/** (allowlista zachowana, gra/src i gra/data bez zmian, `git diff --check` czysty). origin/main poszedł dalej (2b950566 = FALA 825), kandydat dodaje tylko nowe pliki, więc merge bez konfliktu. INTEGROWAĆ: 57f4741f3 (commit raportu FC jest dodatkowy, tylko dokumentacja).

TESTY (własne uruchomienia, surowe wyjścia, worktree FC, build vite poza repo):
- tsc --noEmit: EXIT 0.
- logic-test 213/213; tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6 (wszystkie EXIT 0; src nie zmieniane, więc baza = kandydat).
- diplo-forced-peace-pending-test: PASS=40 FAIL=0.
- Test żywy kandydata (Chromium, realny bundle): EXIT 1, asercje FAIL: 4 — dokładnie jak w dowodach Operatora: S4 FAIL (okno nie pojawia się samo), S3 PASS (tylko gałąź cena=0), S2 FAIL (okno samo + kolejka), S1 i S5 NIE ZMIERZONO. Zero pageerror/console.error.
- Mutacja (log-mutacja-bez-bramki-r2.txt): bez warunku pending test czerwienieje dodatkowo na Enter (5 FAIL zamiast 4) — scenariusz (4) wykrywa usunięcie bramki.

NIEZALEŻNA SONDA FC (scratchpad, nie w repo; MutationObserver na .civ-diplo-modal-overlay + obsługa bitew):
- D1 potwierdzony i NIE jest artefaktem bitwy: po końcu tury z wojną 40 tur i domkniętej bitwie AI nie powstaje żadne okno (zero zdarzeń „add”), a po jednym Esc okno pojawia się („Pokój wymuszony…”, status pary nadal wojna, tura 2 zablokowana). Pending istnieje, okno nie wyskakuje samo (wbrew komentarzowi main.ts ~41664 „wraca na wierzch na początku tury gracza”). Przyczyna nieustalona.
- D2 odtworzony na ŚWIEŻEJ grze z AI 1 i 2 (bez wcześniejszego S4, więc to nie karencja po pokoju z S4): po akceptacji pierwszego pokoju para 2 zostaje „wojna”, okna brak, bramka otwarta, i przez kolejne 3 tury nie pojawia się drugi pokój. Czy to defekt, czy artefakt setWarAge (poziom zmęczenia pary 2 < 100%), NIE rozstrzygnięte bez haka odczytu kolejki/poziomu.

WERDYKT PER ZARZUT:
1. Test czerwony na kandydacie: ODDAL. Dispatch pkt (c) wprost dopuszcza zgłoszenie defektu zamiast naprawy; każdy FAIL ma teraz odrębną, zmierzoną przyczynę (D1/D2), a mutacja dowodzi, że asercja bramki jest czuła. Test pozostaje czerwony do czasu osobnych tematów R-WEB-* (to znane, udokumentowane FAIL-e, nie dług harnessu).
2. D1 nieważny (okno bitwy): ODDAL (naprawione w r2: clearBattles przed asercjami, Esc dopiero przy widocznym oknie). Moja sonda potwierdza D1 niezależnie od bitwy.
3. S3 niezmierzony / tautologia: ODDAL. Tautologia usunięta, wariant „Oddajesz” jawnie NIE ZMIERZONO. Dodatkowa uwaga dokładności: war-weariness.ts (komentarz ~l.270) mówi, że przy progu wymuszenia 1,0 cena = 0, więc gałąź „Oddajesz” jest NIEOSIĄGALNA z założenia do osobnej decyzji ABC o progu/cenie; sformułowanie testu „w tej mapie plan nie zawiera miast” jest nieprecyzyjne. S3 = PASS tylko dla gałęzi cena=0. Opis w 10-operator-claude.md („tekst okna bez wierszy Oddajesz”) jest błędny i zastąpiony przez 30-obrona.
4. D2 niepotwierdzony: ODDAL z notą. Test i obrona wprost deklarują „NIE ROZSTRZYGNIĘTE” (nota w teście); mój pomiar dodaje, że to nie karencja z S4. Poprawka językowa: zdanie obrony „4 FAIL = zmierzone defekty produktu D1/D2” jest nadmiarowe dla D2; D2 = anomalia zmierzona, przyczyna otwarta.
5. Brak bramek referencyjnych: ODDAL (wykonane w r2 i powtórzone przeze mnie, wyniki wyżej).
6. D3 / gałąź autobot / zakres mutacji: ODDAL (asercja D3 usunięta z notą; HEAD detached nie wpływa na integrację; wymóg mutacji to co najmniej scenariusz 4 — spełniony).
Żaden zarzut nie wymaga NAPRAW; zero DO DECYZJI CZŁOWIEKA.

BLOKADY: S1 (zapis/wczytanie z pending) NIE ZMIERZONO — brak haka odczytu meta.pendingForcedPeaceTreaties i helpera zapis+wczytaj. S5 (AI↔AI bez okna) NIE ZMIERZONO — brak haka wieku wojny dla pary AI↔AI. Wariant „Oddajesz” S3 NIE ZMIERZONO (nieosiągalny przy progu 1,0). D3 (wpis „Nie można zakończyć tury” w Ważne) NIE ZMIERZONO.

UWAGI-DLA-ORKIESTRATORA:
- Zgłoszenie D1 (do tematu R-WEB-*, bez ABC): okno pokoju wymuszonego nie pojawia się samo po końcu tury z pending, tylko po akcji gracza (Esc/klik „Zakończ turę” → hintEndTurnBlocked → showNextPendingForcedPeace). Pliki: gra/src/main.ts showNextPendingForcedPeace ~26038, wywołania ~39213 (po ticku) i ~41665 (po turn++), prune ~26019.
- Zgłoszenie D2 (diagnoza, nie naprawa): druga wojna o 40 tur z drugą cywilizacją nie daje drugiego pokoju (3 tury obserwacji). Najpierw hak test-only __truceTestDebug.pendingForcedPeaceForTest() (+ odczyt poziomu zmęczenia pary), potem decyzja, czy to defekt. Kod: war-weariness.ts runWarWearinessTick (gałęzie battlePending / cashPn>0 && !full), main.ts ~39199.
- Hooki test-only do osobnego tematu (nie w src tego tematu): pendingForcedPeaceForTest, endFullTurnSaveLoadForTest (S1), setWarAgeForPair (S5).
- Pusty katalog /home/user/tmp/x utworzony przez Operatora poza worktree — usunięcie wymaga zgody właściciela (zakaz rm w dispatchu).
- Uwaga procesowa: baza kandydata (1dd3958be) jest starsza niż origin/main (2b950566); przed deployem zrobić merge i ponownie uruchomić test żywy na scalonym bundlu (poza src nic się nie zmienia, ale FALA 825 dotyka cen pokoju i okna).

RUNDY: 3/5 (r1 Operator, r2 Obrona, r3 Final Control). Ostatni werdykt: PASS-WITH-NOTES.
NASTĘPNY KROK: integracja 57f4741f3 do main (merge-tree/FF, bez zmian w src), rejestry; osobne tematy R-WEB-* dla D1 i diagnozy D2 oraz haków test-only.
DEPLOY/PUSH: NIE WYKONANO
