STATUS: BLOCK
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C (obrona, runda 3; Operator HAIKU 5.5)
GOAL: odpowiedzieć na zarzuty Evaluatora (4 pozycje) i domknąć trzy testy: ai-wojny (zielony z mutacją), hotseat-drugi-fotel (zielony), hotseat-etap4-noop (zielony albo sklasyfikowany B/C z dowodem); zero zmian gra/src.
BAZA: f3bf0cee12b7bbfdf2a3f38f89cfaed2705ac835 (checkout --detach; zmiany w tej rundzie tylko w gra/tools/hotseat-etap4-noop-test.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, runs/R-WEB-TEST-DEBT-Q16C/30-obrona-claude.md, runs/…/55–59)
SHA (czubek pracy): patrz pole sha w StructuredOutput (commit obrony)

## Odpowiedzi na zarzuty

1. hotseat-etap4-noop: PRZYJMUJĘ (zarzut zasadny). Test NIE jest zielony i NIE jest sklasyfikowany jako B lub C z dowodem. Dodatkowe 6 prób (r2 + r3) kończy się na tej samej turze 23. Dowody: runs/…/45–49 (r2), runs/…/58 (sonda DOM r3, dwa przebiegi). Hipoteza „nakładki bitwy” NIE została potwierdzona: sonda DOM nie wykazała ani welcome, ani widocznego dialogu, ani widocznej nakładki bitwy (`civ-wiki-hub` jest ukryty, bez klasy `open`). Sonda tekstu „Zapis niedostępny w trakcie bitwy” nie rozstrzyga (komunikat nie widać w innerText także przy udanych zapisach). Status: NIE ZAMKNIĘTE, klasa nieustalona (nie A, nie C, nie B). Pozostaje otwarte.

2. Pytanie B (Spichlerz −11 → −108): PRZYJMUJĘ (zarzut zasadny). Nie odtworzono live (NIE ZMIERZONO). Wynik analizy z kodu (bez zmian w grze): racja 0 nie może obniżyć `spichlerzStolicy` (`empire-food.ts`, bilans ≥ 0 dla każdego miasta, brak deficytów); `spichlerzPo = spichlerzStolicy − kosztArmii` (`no-negative-stocks.ts`, `projectEmpireFoodAfterTick`). Spadek o 97 wymaga więc skoku `kosztArmii` (zmiana zestawu jednostek lub ich tempa) między t17 a t18, nie samej racji. Łaska 15 tur (`paceUtrzymaniaWlasciciela`) nie obejmuje t17–18. Hipoteza (a) z r2 (produkcja → 0 przy racji 0) jest sprzeczna z kodem. Czy to defekt: NIE ROZSTRZYGNIĘTE. Do wyjaśnienia: zrzut `units` i `kosztArmii` w t16–18. Szczegóły w DLUG-TESTOWY-Q16C, sekcja „Pytanie B”.

3. Mutacja regexu F: PRZYJMUJĘ, uzupełnione dowodem na poziomie testu. Mutant (kopia main.ts, linia 47967 `peaceLocked: isPeaceLockedBetween(...)` → `peaceLocked: false`) uruchomiony w CAŁYM teście: `21 PASS, 1 FAIL`, jedyny FAIL to asercja F (runs/…/57, RC 1, 205 s). Zastrzeżenie: F pozostaje pinem tekstowym źródła; mutacja czerwona dowodzi reakcji pinu na zmianę warunku, nie zachowania gry. Tę bramkę zachowania nie testuje F.

4a. Wstawka modalDiag: PRZYJMUJĘ. Usunięta z hotseat-etap4-noop-test.cjs wraz z przywróceniem oryginalnego komunikatu błędu. Zostaje tylko import i wywołanie `closeCivWelcome` (zamknięcie ekranu powitalnego przed zapisem; legalna procedura z _live-ready.cjs).

4b. Ustawienia na poziomie maksymalnym: PRZYJMUJĘ (brak dowodu). Test etap4 startuje z `kosztJednostekPace = niski`, `buildingCostPace = niski`, `wzrostLudnosciPace = wysoki` (runs/…/49). Nie zmieniano ich: zmiana zmienia hashe snapshotów, a test nie został jeszcze rozstrzygnięty. Uznany poziom maksymalny dla kosztów jednostek: „Wysoki ×4” (wg wpisu o UPKEEPPACE w rejestrze). NIE ZMIERZONO na maksimum.

## Mutacja czerwona→zielona dla ai-wojny (dispatch pkt 3)
- Baza (bez zmian): 22 PASS / 0 FAIL, 203 s (runs/…/55).
- A1 (usunięte wywołanie prepareEndTurnGate w kopii testu, reszta bez zmian): RC 1, 148 s, `bramka Zakończ turę zamknięta po prepareEndTurnGate: {"canEnd":false}` (runs/…/56). Czerwony. Kopia usunięta z repo.
- Przywrócenie: 22/0 (runs/…/55).
- A2 (regex F, mutacja warunku w kopii main.ts): 21 PASS / 1 FAIL (runs/…/57).

## Hotseat-drugi-fotel (bez zmian w tej rundzie)
- Zielony w r2 (runs/…/43, 44; 5/5). Nie uruchomiony ponownie w r3 (poza zakresem zarzutów; wynik r2 stoi).

## Bramki (r3, zmierzone)
- `npx tsc --noEmit`: exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/ai-test.cjs`: 297 passed, 0 failed.
(runs/…/59)

## Zakazy
- zero zmian gra/src i gra/data: potwierdzone (git diff tylko w gra/tools/hotseat-etap4-noop-test.cjs i plikach dokumentacji/runs).
- brak spawn_task/create_session/create_trigger/send_later, brak run_in_background, brak nohup/&, brak --no-gpg-sign, bez zmian konfiguracji podpisu.
- Tymczasowe kopie testów (tdq16c-mutA/mutF/etap4-diag) usunięte z gra/tools przed commitem.

## Pliki zacommitowane
- gra/tools/hotseat-etap4-noop-test.cjs (usunięty modalDiag i komunikat; zostaje closeCivWelcome)
- dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md (aktualizacja r3)
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/30-obrona-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16C/55–59 (logi: baza 22/0, mutA, mutF, sonda etap4 r3, bramki)

TESTY: ai-wojny 22/0 (baza), A1 RC 1, A2 21/1; etap4 0/6 prób zielone (zawsze t23); tsc 0; logic 213/213; ai-test 297/0.

BLOKADY: (1) hotseat-etap4-noop: zapis tury 23 nie działa; przyczyna nieustalona (nie A, nie C, nie B). Potrzebny pomiar isBattleSceneOpen()/isPostBattleSummaryOpen() w t23 przez hak testowy. (2) Pytanie B: wymaga live zrzutu units i kosztArmii w t16–18. (3) Maksimum ustawień dla etap4 i pytania B: nie zmierzono.

RUNDY: 3/5 (runda 3 = obrona; r1 FC FAIL, r2 FC FAIL → r3 obrona na zarzuty Evaluatora)

NASTĘPNY KROK: (a) w hotseat-etap4 zmierzyć w t23 przez hak testowy, czy `isBattleSceneOpen()` lub `isPostBattleSummaryOpen()` jest prawdą, i decyzja A/B; (b) zrzut `units` i `kosztArmii` w t16–18 dla pytania B. Oba wymagają osobnej rundy z live Chromium.

DEPLOY/PUSH: NIE WYKONANO
