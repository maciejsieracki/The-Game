STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1
GOAL: Obrona operatora (r3, Obrona) na zarzuty Evaluatora z 5d826fc9a. Dane P1/P3 i runnera bez zmian. Korygowane wyłącznie sformułowania werdyktów oraz diagnoza defektu UI (bez zmian w gra/src).
BAZA: ff26c2341 (kandydat operatora r3, detached). Zero zmian w gra/src, gra/data, WERSJE.md.
RUNDA: 3/5 (obrona, HAIKU zgodnie z dispatchem).

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 (P4 „NIE_ODTWORZONO” za szeroki) — PRZYJMUJĘ
Potwierdzone: `b2-speed-seed271828-r3.json` ma `warDeclaredAtTurn: 1`, a `turns[2..5].pair` = `"status":"wojna"` (T2–T5, pozostałe tury analogicznie). Przebieg „speed” prowadził więc wojnę AI→gracz, a nie stan neutralny. Wniosek poprawiony:
- P4 wojna AI→gracz, ziarno 271828, tryb nieprzyspieszony T2–T23: NIE_ODTWORZONO (czas tury 15,6–21,7 s, brak tury > 25 s).
- P4 stan NEUTRALNY (bez wojny), wariant z zarzutu: NIE_ZMIERZONO. Powód: w tym temacie nie uruchomiono przebiegu bez wypowiedzenia wojny.
- Poprzednie zdanie „0,3–0,8 s/turę z r2 nieważne” pozostaje.

### Zarzut 2 (P2: „próg 0,8 nieosiągalny” wywiedziony z kodu, nie z pomiaru) — PRZYJMUJĘ w części
- Przyjęte: kryterium „wojna AI↔AI ≥16 tur” NIE jest spełnione (NIE_OSIĄGNIĘTO), a stwierdzenie, że próg 0,8 jest nieosiągalny w parach AI↔AI, jest HIPOTEZĄ z kodu, nie wynikiem pomiaru. Kod: `gra/src/game/war-weariness.ts` l.251 (`turnsAtWar < PEACE_PROPOSAL_MIN_WAR_TURNS` → brak oferty), l.281–283 (`priceZero`, `ownCities <= 1 && !priceZero`), l.315–316 (`cityGiven = priceZero || ...` → pokój bez miasta przy cenie 0). Cztery przebiegi (logi `R-WEB-WEARINESS: pokój ... za cenę (zmęczenie 0.50, 0/0 PW)` i `R-AI-PEACE-2T accept_paid`) potwierdzają zakończenie wojny przy ~0,5 w 9–10 turach, ale nie dowodzą nieosiągalności 0,8 poza nimi.
- Przyjęte: przyczyną zakończenia okna przed T75 w `b2-aiwar-seed271828-r3e.json` (T58, `cities.me=0`, `stoppedBy` = timeout endTurn 120 s) jest utrata jedynego miasta gracza bez obrony w setupie runnera. Jest to problem setupu, nie zachowanie gry.
- NIE podjęto w tej rundzie naprawy runnera (obrona gracza przed T55). Wymagałoby to zmiany setupu i przebiegu > T58 (kilkanaście minut na przebieg). Status: NIE_ZMIERZONO, powód techniczny jak wyżej. Nie jest to „brak czasu”.

### Zarzut 3 (panel AI↔AI pokazuje jeden wiersz; decyzja #364 wymaga obu) — PRZYJMUJĘ jako defekt, klasyfikacja operatora była błędna
Diagnoza z kodu (bez zmian w gra/src):
- Wiersz pary AI↔AI na liście „W stanie wojny z” renderuje `warWearinessPartnerSuffixHtml` (`gra/src/ui/diplomacyAudience.ts` ok. l.1592–1596). Zwraca jedną etykietę.
- Ta etykieta pochodzi z `warWearinessLabelPl` (`gra/src/game/diplomacy-display.ts` ok. l.380–397). Funkcja zwraca desperację, gdy `view.desperacja !== undefined`, a w przeciwnym razie zmęczenie. Nawet gdy widok ma oba pola, do wyświetlenia trafia tylko desperacja.
- Dla wojny gracz↔AI używany jest inny helper (`warWearinessRowsHtml`, dwa wiersze „Ty” / rozmówca), więc gracz↔AI pokazuje oba wiersze, a AI↔AI nie.
- Decyzja #364 (dispatch: „pokaż zmęczenie wojną strony wygrywającej i desperację strony przegrywającej — w wojnach gracz↔AI oraz AI↔AI”) nie jest w tym miejscu spełniona. To nie jest „tylko UI informacyjnie”.
- Poprawka wymaga zmiany w gra/src, a ten temat ma ZAKAZ zmian gra/src. Zgłaszam do orkiestratora jako defekt do osobnego tematu R-WEB-* (UWAGI pkt 1).

### Zarzut 4 (P3 AI↔AI „pomiar możliwy bez zmian w gra/src”) — ODRZUCAM możliwość bez hooka; status NIE_ZMIERZONO pozostaje
Dowód:
- Licznik zmęczenia pary liczy się w zamkniętej funkcji `diploWarWearinessPairView` (`gra/src/main.ts` ok. l.12039) na stanie `warWearinessByPairKey`. Żadna funkcja nie jest wystawiona na `window`.
- Istniejące hooki testowe (`__peaceRulesTestDebug` l.29685, `__truceTestDebug` l.29881, `__truceSaveLoadTestDebug` l.30095) nie zwracają zmęczenia pary AI↔AI. Sprawdzone grepem.
- DOM karty AI pokazuje tylko jedną wartość (zarzut 3), więc odczyt z DOM nie wystarcza.
- Odczyt wymagałby więc nowego hooka w gra/src, czyli zmiany zabronionej w tym temacie. Uczciwy status: NIE_ZMIERZONO. Pomiar wchodzi do osobnego tematu razem z naprawą zarzutu 3.

### Zarzut 5a (22/22 digestów — Evaluator nie porównał digestów) — PRZYJMUJĘ, zweryfikowane
Porównanie pola `turns[].digest` między `b2-war-seed<ziarno>-r3.json` a `b2-war-seed<ziarno>-r3rep.json` (skrypt node, na surowym JSON):
- ziarno 271828: 22 tury porównane, 22 równe.
- ziarno 314159: 22 tury porównane, 22 równe.
Liczba 22/22 dotyczy równości między dwoma przebiegami tego samego ziarna, a nie liczby różnych digestów.

### Zarzut 5b (czas generacji 141–217 s z 3 równoległych przebiegów) — PRZYJMUJĘ
Te czasy nie są miarą wydajności gry. Pochodzą z trzech równoległych przebiegów na tej samej maszynie i służą tylko jako informacja o czasie oczekiwania. Nie jest to pomiar wydajności.

## WERDYKTY PO KOREKCIE (tabela)

| Punkt | Werdykt | Uwaga |
|---|---|---|
| P1 panel gracz↔AI, ziarna 271828 i 314159 | PASS | bez zmian (dane z r3, zrzuty obejrzane wg operatora) |
| P1 zakładka „Dyplomacja” i propozycja pokoju od AI w T17+ | PASS (z uwagą UI) | bez zmian |
| P1 powtarzalność | PASS | digesty 22/22 zweryfikowane (zarzut 5a) |
| P2 wojna AI↔AI ≥16 tur | NIE_OSIĄGNIĘTO | przyczyna: zakończenie pokojem przy zmęczeniu ~0,5 (kod: war-weariness.ts l.251, 281–283, 315–316); okno po T75 niezmierzone (setup runnera) |
| P2 panel pary AI↔AI | CZĘŚCIOWO | pokazuje jeden wiersz (defekt, zarzut 3) |
| P3 +10 pp za zmienione miasto, gracz↔AI | PASS, 2 ziarna | bez zmian |
| P3 w parze AI↔AI | NIE_ZMIERZONO | brak hooka bez zmian w gra/src (zarzut 4) |
| P4 wojna AI→gracz, 271828 | NIE_ODTWORZONO | zakres zawężony (zarzut 1) |
| P4 stan neutralny | NIE_ZMIERZONO | nie uruchomiono przebiegu bez wojny (zarzut 1) |

## TESTY
- Bez nowych przebiegów w Chromium w tej rundzie. Wynik i zrzuty z ff26c2341 nie zostały zmienione.
- Weryfikacja: porównanie digestów (zarzut 5a), odczyt `b2-speed-seed271828-r3.json` (zarzut 1), grep hooków i funkcji (zarzuty 3–4), odczyt `diplomacyAudience.ts`, `diplomacy-display.ts`, `main.ts` (tylko odczyt).
- `git diff --check` do wykonania przed commitem pliku raportu.

## ZMIANY/COMMIT
- Zmieniony tylko plik: `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-689-697-B2-PANEL-AIAI-CITYCHANGE-Q1/30-obrona-claude.md`.
- Brak zmian w gra/src, gra/data, gra/tools, WERSJE.md.

## BLOKADY
- P2 okno po karencji (T75+): NIE_ZMIERZONO. Przyczyna techniczna: utrata jedynego miasta gracza w setupie runnera; naprawa wymaga zmiany setupu i długiego przebiegu.
- P3 AI↔AI: NIE_ZMIERZONO. Przyczyna: brak odczytu zmęczenia pary bez zmiany gra/src (hak potrzebny).

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie naprawiałem)
1. DEFEKT UI (decyzja #364 niespełniona): w wojnie AI↔AI karta AI pokazuje jeden wiersz zamiast dwóch. Przyczyna: `warWearinessPartnerSuffixHtml` (`gra/src/ui/diplomacyAudience.ts` ok. l.1592–1596) używa `warWearinessLabelPl` (`gra/src/game/diplomacy-display.ts` ok. l.380–397), która zwraca tylko jedną etykietę. Proponowany temat: R-WEB-UI-DIPLO-WEARINESS-PAIR-BOTH-ROWS-Q1 (zmiana w gra/src, poza tym tematem).
2. Hak testowy zmęczenia pary AI↔AI: funkcja `diploWarWearinessPairView` (`gra/src/main.ts` ok. l.12039) nie jest wystawiona. Dodanie odczytu pod `?civTest=1` w osobnym temacie umożliwi P3 AI↔AI i pomiar okna po T75.
3. Runner: obrona gracza przed T55 (setup), aby okno po karencji było mierzalne.
4. Uwaga z poprzedniej rundy (nadal aktualna): licznik zakładki „Dyplomacja” = 0 mimo blokującej karty propozycji pokoju (drobne UI).
5. Do decyzji właściciela: zakończenie wojny AI↔AI pokojem bez miasta przy cenie 0 przy zmęczeniu ~0,5 (`priceZero`, war-weariness.ts l.281–283, 315–316) odbiega od opisu „do 0,8”. Powiązane z #359 i #376.

## RUNDY
3/5. Obrona r3. Kolejna runda potrzebna tylko po decyzji o defekcie UI (uwaga 1) i hooku (uwaga 2).

## NASTĘPNY KROK
Evaluator: sprawdzić korekty werdyktów P2/P3/P4 (zarzuty 1, 2, 4) i diagnozę defektu UI (zarzut 3, `diplomacyAudience.ts` ok. l.1592–1596 oraz `diplomacy-display.ts` ok. l.380–397). Orkiestrator: zdecydować o tematach z uwag 1–2.

DEPLOY/PUSH: NIE WYKONANO
