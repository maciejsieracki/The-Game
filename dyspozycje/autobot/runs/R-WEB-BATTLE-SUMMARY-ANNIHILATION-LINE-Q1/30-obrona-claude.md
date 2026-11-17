# 30 — Obrona Operatora (Haiku 5.5) — R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SUMMARY-ANNIHILATION-LINE-Q1
GOAL: Osobna linia „Unicestwienie” w podsumowaniu bitwy, gdy czwarty odwrót w turze niszczy armię (kto, ile jednostek, powód po polsku). Obrona odpowiada na zarzuty Evaluatora z raportu bf1e71090b52f54a510e4951e9b2f2e833471d16.
BAZA: kandydat 206f2ee4e (rodzic 392aa14c1, przodek origin/main). Poprawka: commit 99107dc32 (na 206f2ee4e).

## Odpowiedzi na zarzuty

| Nr | Zarzut | Decyzja | Dowód |
|----|--------|---------|-------|
| 1 | Pin UI d1 nie czerwienieje po zakomentowaniu `body.appendChild(annLine)` (M5) | PRZYJMUJĘ | Pin zaostrzony do `^\s*body\.appendChild\(annLine\);` (multiline, w bloku `if (data.annihilation)`). Przed poprawką M5: pass=20 fail=0 (zielony). Po poprawce M5 (`// MUT body.appendChild(annLine);`): `battle-summary-annihilation-test: pass=19 fail=1`, `FAIL: d1: ... dolacza linie unicestwienia do DOM`, exit=1. Plik przywrócony. |
| 2 | Błąd polszczyzny „1 jednostka zniszczonych / 2 jednostki zniszczonych” | PRZYJMUJĘ | Zarzut trafny. Dodatkowo wykryty i naprawiony błąd: 21 jednostek dawało „jednostek” (powinno „jednostka”). Nowa funkcja `unitsPhrasePl` w `gra/src/game/battle-summary.ts`: 1/21/31 → „jednostka zniszczona”; 2–4, 22–24 (nie 12–14) → „jednostki zniszczone”; reszta → „jednostek zniszczonych”. Test c1 zaktualizowany do „2 jednostki zniszczone”; test c3 rozszerzony o 1, 2, 5, 11, 12, 14, 21, 22. |
| 3 | Brak testu realnej ścieżki main.ts i brak zrzutu Chromium w kandydacie | CZĘŚCIOWO: PRZYJMUJĘ brak zrzutu, ODRZUCAM żądanie testu wykonania main.ts (poza zakresem tego tematu) | Real module path pokryty przez test a (prawdziwe `applyPostBattleMap` z `gra/src/game/post-battle-map.ts`: `defenderAnnihilatedUnitCount === 2`, test a2) oraz test b (licznik 0 => brak linii). Wiązanie main.ts pozostaje pinem tekstowym d2 (`onPostBattleResult: r => { pbHolder.res = r; }`); pełne wykonanie `boot()` wymagałoby uruchomienia całej gry. Zrzut Chromium NIE_ZMIERZONO w tej rundzie (patrz sekcja BLOKADY). |
| 4 | Zmiany w `gra/src/main.ts` i `gra/src/game/battle-summary.ts` poza allowlistą | PRZYJMUJĘ FAKT, nie cofam | Zmiana w main.ts jest jedynym miejscem, gdzie wynik `applyPostBattleMap` (liczniki) jest dostępny przed `buildPostBattleSummary`; bez niej linia nie może powstać. `battle-summary.ts` to moduł budujący dane podsumowania (ta sama warstwa, co `postBattleSummary.ts` z allowlisty). Decyzja o zgodzie na te dwa pliki należy do orkiestratora (UWAGI-DLA-ORKIESTRATORA, pkt 1). |
| 5 | Licznik to tylko ocalali, linia jest podzbiorem „Strat łącznie” | ODRZUCAM | Dispatch, kryterium (a): „linia unicestwienia z liczbą jednostek i powodem”. Licznik z `applyPostBattleMap` (`defenderAnnihilatedUnitCount` / `attackerAnnihilatedUnitCount`) inkrementuje się wyłącznie przy usuwaniu jednostek przez unicestwienie (`post-battle-map.ts`, pętle usuwania w gałęzi `defenderAnnihilated`/`attackerAnnihilated`). Linia jest więc z założenia podzbiorem strat i to jest zamierzone: pokazuje, ile z strat wynikło z limitu odwrotów. Założenie zapisane tutaj (nie zmieniano tekstu UI). |
| 6 | Ekran końca bitwy w `battleScene.ts` nie dostaje linii | ODRZUCAM | `battleScene.ts:10730` (`_buildBattleSummaryData`) i `:10771` (`showPostBattleSummary`) to podsumowanie wewnątrz sceny bitwy, budowane PRZED zakończeniem outcome. `applyPostBattleMap` jest wywoływane dopiero w `main.ts` po zakończeniu sceny (`main.ts:36653`, gałąź `applyMapBattleOutcomeWithSummary`). W momencie budowy podsumowania sceny liczniki unicestwienia jeszcze nie istnieją, więc linia nie może się tam pojawić bez zmiany przepływu. Linia obowiązuje w podsumowaniu mapowym, które dispatch opisuje („w podsumowaniu bitwy … po bs.play”). |
| 7 | Brak wzmianki w Civpedii/poradniku | ODRZUCAM | Kryterium (f) dispatchu: „Civpedia/poradnik jeśli opisują podsumowanie”. Dowód: `grep -rniE "unicestw|limit odwrot|trzy odwroty|Strat łącznie"` w `docs/`, `gra/docs/`, `gra/data/` nie trafia w żadną stronę opisującą podsumowanie bitwy (jedyny trafiony plik danych to `gra/data/combat-params.json`, parametr limitu, nie podsumowanie). Warunek „jeśli” nie zachodzi. |

## Poprawka (commit 99107dc32)

- `gra/src/game/battle-summary.ts`: `formatAnnihilationLine` używa `unitsPhrasePl` (odmiana). Tekst: `Unicestwienie: <etykieta> — <N> <jednostka/jednostki/jednostek> <zniszczona/zniszczone/zniszczonych>; powód: <powód>.`
- `gra/tools/battle-summary-annihilation-test.cjs`: asercje odmiany, c1 w nowej formie, pin d1 zaostrzony.
- Commit wykonany lokalnie w worktree; NIE pushowany (push na main nie jest zadaniem Operatora).

## TESTY (surowe wyjście, ten przebieg)

- `node tools/battle-summary-annihilation-test.cjs` → `battle-summary-annihilation-test: pass=20 fail=0`
- Mutacja M5 (`// MUT body.appendChild(annLine);` w `gra/src/ui/postBattleSummary.ts`) → `FAIL: d1: ...`, `pass=19 fail=1`, exit=1 (przywrócone `git checkout`).
- `npx tsc --noEmit` → exit 0, 0 linii wyjścia (0 błędów).
- `node tools/battle-retreat-limit-test.cjs` → `battle-retreat-limit-test: 43 pass, 0 fail`
- `node tools/post-battle-map-test.cjs` → `post-battle-map-test: 32 pass, 0 fail`
- `node tools/battle-summary-test.cjs` → `battle-summary-test: OK`
- `git diff --check` → czysto (exit 0).
- Mutacje M1–M4 nie były ponownie uruchamiane w tej rundzie (wynik z raportu Evaluatora: czerwienieją).
- Zrzut Chromium: NIE_ZMIERZONO (patrz BLOKADY).

## BLOKADY

- NIE_ZMIERZONO: zrzut Chromium podsumowania (kryterium e). Dispatch wymaga `require("playwright")` + build vite poza repo; w tej rundzie nie wykonano. Evaluator raportował własny zrzut komponentu; w repo zrzutu nie ma.
- NIE_ZMIERZONO: wykonanie realnej ścieżki `main.ts` (`boot()`) w testach jednostkowych; pokryte pinem tekstowym d2 i testem na prawdziwym `applyPostBattleMap`.

## ZMIANY/COMMIT

- Kod: 99107dc32 (`gra/src/game/battle-summary.ts`, `gra/tools/battle-summary-annihilation-test.cjs`).
- Raport: ten plik (commit osobny, tylko ten plik).

## RUNDY

1/5 (runda obrony po zarzutach Evaluatora bf1e71090).

## UWAGI-DLA-ORKIESTRATORA

1. Allowlista: zmiany w `gra/src/main.ts` (wpięcie przechwytywania licznika, ~14 linii) i `gra/src/game/battle-summary.ts` (dane linii) wykraczają poza allowlistę dispatchu. Bez `main.ts` linia nie powstaje. Wymagana jawna zgoda orkiestratora (lub rozszerzenie allowlisty).
2. Zrzut Chromium i weryfikacja realnej gry pozostają otwarte: osobny krok przed READY_FOR_DEPLOY.
3. Założenie semantyczne (zarzut 5): linia liczy jednostki zniszczone przez unicestwienie; są podzbiorem „Strat łącznie”. Jeśli właściciel woli inną semantykę, to decyzja ABC.
4. Dług do osobnego tematu (nie w zakresie): test `battle-summary-annihilation-test.cjs` opiera część asercji na regexach źródła UI (pin tekstowy), co jest słabsze niż test DOM.

NASTĘPNY KROK: Evaluator r2 na commit 99107dc32 (zarzuty 1–2 zamknięte dowodem; 3 i 6 wymagają decyzji orkiestratora lub zrzutu).
DEPLOY/PUSH: NIE WYKONANO
