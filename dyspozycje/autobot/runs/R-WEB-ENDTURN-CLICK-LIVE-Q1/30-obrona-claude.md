# R-WEB-ENDTURN-CLICK-LIVE-Q1 (ENDCLICK) — obrona Operatora, runda 2

STATUS: BLOCK
DOMAIN: GAME (pomiar; brak zmiany w gra/src)
TEMAT: R-WEB-ENDTURN-CLICK-LIVE-Q1
GOAL: klik „Zakończ turę” t2–t8 na żywo (maksimum, ziarna 4242 i 7) + konsola PRZED/PO; rozstrzygnięcie artefakt (i) / błąd gry (ii).
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu (SHA zwrócony w polu sha).
  Zmienione: gra/tools/endturn-click-live.cjs (protokół r2), dyspozycje/analizy/KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md,
  dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/{readback-ustawien-maksimum.txt, 30-obrona-claude.md, dane-ENDCLICK-*.json}.
  Brak zmian w gra/src, gra/data, WERSJE.md, manifeście.

## Odpowiedzi na zarzuty Evaluatora (commit 80efc5a7)

1. **Brak pkt 2(c) NNS** — PRZYJMUJĘ. NIE POPRAWIONE w tej rundzie. Stan (c) (podatek 100% na Pieniądze, zakup
   obrońcy klikiem w t5, blokada t6–7) wymaga ścieżki suwaka i panelu miasta, której nie ma w `endturn-click-live.cjs`
   (istnieje w `tools/realdef-max-gaps.cjs`, p3/p4). Nie dodano jej, bo ryzyko przekroczenia zakresu rundy było wysokie
   przy 2 biegach na komórkę. Tabela 3 stany × 2 buildy jest niekompletna, co trzeba jawnie zapisać. Propozycja: osobny
   temat R-WEB-ENDTURN-NNS-CONSOLE (decyzja orkiestratora).
   Dowód: `KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md` §4, wiersz (c) „NIE ZMIERZONO”.

2. **Brak biegu PRE dla ziarna 7** — PRZYJMUJĘ, POPRAWIONE. Wykonano PRE s7 (6afdec814, bundle z `git archive`
   + `tools/test-hook-setcitylimit-live-bundle.cjs`) w dwóch trybach: bez okien konsoli i z oknami 30 s.
   Pliki: `dane-ENDCLICK-pre-s7-bez-konsoli.json`, `dane-ENDCLICK-pre-s7-konsola-30s.json`.
   Teraz tabela (a)/(b) ma komplet: PRE i CUR dla obu ziaren.

3. **Wniosek „artefakt harnessu” dla dwóch przypadków z dwoma klikami** — PRZYJMUJĘ, POPRAWIONE na poziomie protokołu.
   Rozstrzygnięcie oparte na próbkach: w rundzie 2 harness klika tylko, gdy `aria-disabled=false` i `endTurnInProgress=false`,
   próbkując co ~500 ms. Pokazano, że przycisk jest nieaktywny w czasie tury AI (np. CUR s7 t2, czekanie przed kliknięciem:
   próbki `a=true eot=true` od 0,0 do 6,2 s, `a=false eot=false` od 7,0 s; klik po 7,0 s, zmiana tury w 11,7 s). W rundzie 2 nie wystąpił żaden drugi klik (każda tura: `attempts=1`).
   Zastrzeżenie: dwa przypadki z rundy 1 nie zostały odtworzone w starym protokole. Ich interpretacja („klik na nieaktywny
   przycisk, odrzucony przez bramkę”) opiera się na sekwencji logów rundy 1 i na próbkach rundy 2, nie na bezpośrednim
   pomiarze stanu w ich oknie. Oznaczam to jako wniosek, nie pomiar.
   Dowód: `dane-ENDCLICK-cur-s7-bez-konsoli.json` (wiersze t2–t8, `phases[].samples`).

4. **Hak `gateInfo()` z efektami ubocznymi; kolumny aria/canEnd niezależne?** — PRZYJMUJĘ, POPRAWIONE. W pętli pomiaru
   nie ma już `gateInfo()`. Odczyt: DOM + `isEndTurnInProgress()` (flaga) + `snapshot().turn`. `canEnd` nie jest
   odczytywane (NIE ZMIERZONO bez efektów ubocznych). Kolumny `aria/canEnd` z rundy 1 wycofane.
   Dowód: `grep -n gateInfo gra/tools/endturn-click-live.cjs` — jedyne wywołanie `gateInfo()` jest w gałęzi `gateDiag`
   (diagnoza po nieudanym pomiarze „brak zmiany tury”); ta gałąź nie wystąpiła w żadnym przebiegu rundy 2.

5. **Anomalia ENDPERF zamknięta jako artefakt zbyt mocno** — PRZYJMUJĘ. Zmieniono status na „NIE ODTWORZONO (n=2 na ziarno),
   przyczyna NIE ZMIERZONO”. Hipoteza „odpytywanie gateInfo co 500 ms” NIE jest przetestowana A/B. Nie zamykam tego jako
   artefakt. Dowód: `KONIEC-TURY-KLIK-NA-ZYWO-2026-11-27.md` §5.

6. **Ustawienia „maksimum” niejednoznaczne** — PRZYJMUJĘ częściowo.
   - POPRAWIONE: `buildingCostPace` z Niski na **Wysoki (x4)** i `ruchSwiataPace` z Krótki na **Długi (x6)**. Dowód:
     etykiety w `gra/src/ui/newGameFlow.ts` (opcje: `['Niski','Normalny','Wysoki']`, `['Krótki','Normalny','Długi']`, hint:
     „Bazowy = Krótki (×1)”).
   - NIE POPRAWIONE, NIE ZMIERZONO: rozmiar mapy (`Maly`), liczba rywali (`2`), prędkość (`Normalna`) oraz limit miast (10).
     Nie sprawdzono pełnej listy opcji. Zapisane w `readback-ustawien-maksimum.txt` i w dokumencie §1/§6.
     Zmiana na najwyższą mapę zmienia koszt generacji i ryzyko Chromium. Decyzja dla orkiestratora.
   - „Wzrost ludności”: `wysoki` zostawione jako w dispatchu. Etykieta gry to „Wysoki ×1 próg”. Drugi wariant NIE ZMIERZONO.
   - Readback nadal jest wejściem skryptu, nie odczytem z UI (NIE ZMIERZONO).
   - Efekt zmiany: na ziarnie 4242 pasywny gracz ginie w t7 (oba buildy). Na ziarnie 7 przeżywa do t8.

7. **n=1 na komórkę** — PRZYJMUJĘ częściowo.
   - Kliknięcia: n=2 na komórkę (ziarno × build): przebieg bez okien konsoli + przebieg z oknami 30 s (ten sam protokół
     kliknięć; drugi tylko dodaje czekanie 30 s po turze).
   - Konsola (a)/(b): n=1 na komórkę. Liczba `[EndTurn] blocked` w oknach z przebiegów bez okien (PRE 9–17 na turę, CUR 0)
     replikuje wynik (b) i jest drugą obserwacją.
   - Nie osiągnięto n≥3, ponieważ każdy przebieg to ok. 2–3 min, a rozstrzygnięcie stanu (c) i porażki gracza wymagają
     dodatkowego kodu. NIE ZMIERZONO n≥3.

## Wyniki (krótko)

- Kliknięcia t2–t8 (CUR i PRE, 2 ziarna): każda tura zmieniona po 1 kliku na aktywny przycisk; czas 4,3–20,0 s.
  Porażka gracza w t7 (ziarno 4242, oba buildy) to stan gry, nie błąd kliku. t8 na 4242 NIE ZMIERZONO.
- Przypadek (ii) „klik nie działa mimo aktywnego przycisku”: NIE STWIERDZONO.
- Konsola (a) start przed miastem (30 s): PRE warn 50 / 43 (EndTurn blocked 49 / 43), CUR warn 2 / 1 (bez EndTurn blocked).
- Konsola (b) po kliku (tury 2–4, 30 s): PRE 13–23 warn (blocked 11–20), CUR 2–3 warn (blocked 0; START/DONE od gestu gracza).
- Stan (c): NIE ZMIERZONO.

## Co pozostaje do decyzji orkiestratora

- Dodanie stanu (c) (NNS) do harnessu lub osobny temat R-WEB-ENDTURN-NNS-CONSOLE — bez tego kryterium binarne
  z dispatchu nie jest spełnione.
- Maksimum dla mapy, rywali, prędkości i limitu miast (decyzja, bo zmiana ma koszt Chromium i czasu).
- Anomalia ENDPERF (t2→t3 120–240 s): pozostaje otwarta; test A/B gateInfo co 500 ms.

## Kontrola jakości

- `node --check gra/tools/endturn-click-live.cjs`: OK.
- `node tools/endturn-quiet-test.cjs` (gra/): 10 pass, 0 fail.
- Przebiegi: 8 przebiegów, wszystkie kod 0, `errors 0` (brak pageerror); brak SIGSEGV w tej rundzie.
- Bramek gra/src (tsc, logic, ai-test itd.) NIE uruchamiano: brak zmiany w gra/src.

## Commit

Commit i SHA: w polu `sha` odpowiedzi StructuredOutput. Podpis commitu: standardowy (bez --no-gpg-sign).

DECYZJA_DLA_ORKIESTRATORA: wejść w rundę 3 (dodanie stanu (c) i ewentualnie maksimum mapy) albo zaakceptować stan
„(c) NIE ZMIERZONO” jako odrzucony w tej rundzie.

## Formalnie

RUNDY: 2/5 (obrona). Ostatni werdykt Evaluatora: zarzuty 1–7 (commit 80efc5a7).
NASTĘPNY KROK: orkiestrator decyduje: runda 3 (stan (c) + maksimum mapy) albo osobny temat NNS.
UWAGI-DLA-ORKIESTRATORA: (1) przy maksimum pasywny gracz ginie w t7 na ziarnie 4242 — to zmienia założenie „pasywnego gracza”
w dispatchach ENDCLICK/REALDEF; (2) PRE bundle powstał z `git archive 6afdec814 gra` w katalogu roboczym poza repo i został usunięty po pracy.
DEPLOY/PUSH: NIE WYKONANO
