# KONIEC-TURY-PRZYCISK-ARIA-2026-11-27 — przycisk „Zakończ turę” przy canEnd=true (R-WEB-ENDTURN-BUTTON-ARIA-Q1, tag ENDARIA)

Baza: origin/main 32b3f1718 (REALDEF5). Pomiar na żywo w Chromium, poziom MAKSYMALNY
(Trudny, barbarzyńcy Trudny, dyplomacja i wojna Trudna, kultura i religia Trudna, koszty jednostek Wysoki ×4, mapa Mała, Kontynenty, 2 rywali).

## 1. Wynik pomiaru przed poprawką (baza 32b3f1718)

Narzędzie: `gra/tools/endturn-aria-probe.cjs` (tylko odczyt haków + fizyczny klik myszą `page.mouse` w `button[data-end]`; bez fallbacku na hak).

Zacommitowany bieg: `dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/endaria-s4242-run3.jsonl` (seed 4242, 8 tur, jeden bieg). Biegów 1–2 wspomnianych w poprzedniej wersji tego dokumentu NIE MA w repo i NIE są tu przytaczane jako dowód.

| tura | pre: canEnd | pre: aria-disabled | klasa | klik myszą | skutek (tura po kliknięciu) | aria po kliknięciu (odczyt natychmiast) |
|---|---|---|---|---|---|---|
| 1 | true | false | end-turn et-signal | skuteczny | 1 → 2 | **true** |
| 2 | true | **true** | end-turn is-disabled | skuteczny | 2 → 3 | true |
| 3 | true | **true** | end-turn is-disabled | skuteczny | 3 → 4 | true |
| 4 | true | **true** | end-turn is-disabled | skuteczny | 4 → 5 | true |
| 5 | true | **true** | end-turn is-disabled | skuteczny | 5 → 6 | true |
| 6 | true | **true** | end-turn is-disabled | skuteczny | 6 → 7 | true |
| 7 | true | **true** | end-turn is-disabled | skuteczny | 7 → 8 | true |
| 8 | true | **true** | end-turn is-disabled | skuteczny | 8 → 9 | true |

Odczyt `poll` (co 500 ms po kliknięciu; C/c = canEnd true/false, A/a = aria-disabled true/false): w każdej turze po kliknięciu przez ok. 3 s `cA`, potem `CA` — canEnd jest już true, a aria-disabled nadal true. Atrybut nie wraca do false w żadnej z tur 2–8.

Wniosek z tego biegu: od tury 2 przycisk wizualnie zablokowany (`is-disabled`, opacity .38) przy canEnd=true, a klik kończy turę.

Nie zmierzono w tym biegu: ziarno 7 przed poprawką (zob. §5 — ziarno 7 zmierzono dopiero po poprawce); odwrotny przypadek (aria=false przy canEnd=false); skutek ręcznego zamknięcia modali przez gracza (harness zamyka je sam, §4).

## 2. Przyczyna (linie kodu, origin/main 32b3f1718)

- `gra/src/ui/bottomBarHud.ts:204` — `canEnd = !hideEnd && config.canEndTurn()`; `:218` — `endVisuallyDisabled = hideEnd || !canEnd`.
- `gra/src/ui/bottomBarHud.ts:257-259` — atrybut `aria-disabled` i klasa `is-disabled` są zapisywane WYŁĄCZNIE w `render()`.
- `gra/src/ui/bottomBarHud.ts:194-195` — `render()` nie rysuje, gdy trwa wciśnięcie przycisku (`activeEndTurnPointers`); odroczenie przez `schedulePendingRender`.
- `gra/src/ui/hud.ts:2132-2133` — `refreshD1BModules()` wywołuje `bottomBarApi.update()`; jedyne wywołanie `refreshD1BModules` w `hud.ts` to `updateHud()` (`hud.ts:2276`). Nie ma timera ani pętli odświeżającej ten przycisk (sprawdzono grep po `refreshD1BModules`, `bottomBarApi`, `canEndTurn` w `gra/src/ui/hud.ts`).
- `gra/src/main.ts` — `canPlayerInitiateEndTurn()` (`:43607`) wywołuje `healStaleEndTurnBlockers()` (`:43375`), który może zmienić stan bez odświeżenia HUD. Komentarze w `main.ts` (`:14929`, `:39265`, `:43378`) potwierdzają, że canEndTurn jest wołane z pętli HUD.
- `gra/src/ui/bottomBarHud.ts:290-292` — klik sprawdza tylko `hideEndTurn()`; prawdziwą bramką jest `advanceSeat()` (`main.ts:49918`), która odrzuca klik przy canEnd=false.

Mechanizm (potwierdzony testem i pomiarem po poprawce, §3): atrybut jest zapisywany tylko przy ostatnim `render()`. Gdy canEnd zmienia się później (koniec pipeline'u tury, healStale), nie następuje kolejny `render()`, więc przycisk pozostaje wizualnie zablokowany, a klik przechodzi przez bramkę `advanceSeat`.

Rozstrzygnięcie: **BŁĄD UI (rozjazd synchronizacji), nie zamierzony stan.** Komentarz w `bottomBarHud.ts` deklaruje, że klikalność ma być zgodna z `onEndTurn`, a atrybut ma odzwierciedlać canEnd.

Nie wykluczono: zawieszonego `activeEndTurnPointers` (`bottomBarHud.ts:194-195`) jako drugiej przyczyny stale-aria. Nie zmierzono (§5).

## 3. Poprawka (ten temat, runda 2)

Zmiana: `gra/src/ui/bottomBarHud.ts` — cykl `syncEndTurnState` co 500 ms porównuje stan przycisku (`hidden` / `off` / `on`) z ostatnio wyrenderowanym (`renderedEndKey`, ustawiany w `render()`) i wywołuje `render()` TYLKO przy zmianie. Klikalność (`data-end`), bramka `advanceSeat` i logika blokady nietknięte. Cykl jest zatrzymywany w `destroy()`.

Test: `gra/tools/endturn-aria-sync-test.cjs` (esbuild + jsdom, bundluje realny `bottomBarHud.ts`).
- Czerwone na pierwotnym kodzie (`2515e501a`, skopiowanym tymczasowo obok modułu): `3 PASS / 2 FAIL` — FAIL [2] aria-disabled nie przechodzi na false po canEndTurn=true bez update(); FAIL [3] klasa is-disabled pozostaje.
- Zielone po poprawce: `5 PASS / 0 FAIL`.

Live po poprawce (seed 7, 8 tur, ten sam harness, `gra/tools/endturn-aria-probe.cjs`, plik `endaria-s7-postfix-run1.jsonl`): w każdej turze po kliknięciu poll przechodzi `cA` → `Ca` w ciągu jednego kroku (≤500 ms); `ariaDisabled` odczytany natychmiast po kliknięciu = "false" przy canEnd=true; klik skuteczny w 8/8 turach.

Bramki (po poprawce, `gra/`): `npm run typecheck` = 0 błędów; `logic-test` 213 PASS / 0 FAIL; `tech-tree-test` 20 pass / 0 fail; `research-test` PASSED 33 / FAILED 0; `unit-replace-test` 21/21; `combat-test` All sanity checks passed; `society-breakdown-test` 56 OK / 0 FAIL; `ai-test` 297 passed / 0 failed; `ai-city-order-need-wiring-test` 267 passed / 0 failed (of 267).

## 4. Ograniczenia pomiaru

- Harness `endturn-aria-probe.cjs` wywołuje przed pomiarem haki SETUP: `closeModals`, `clearBattles`, `rejectAwaitingAiOffers`, `acceptForcedPeace`. Ostatni akceptuje wymuszony pokój blokujący turę — to ingerencja w stan gry, nie akcja gracza w turze. Pomiar dotyczy synchronizacji przycisku, a nie zachowania przy ręcznym zamykaniu modali przez gracza.
- Nagłówek i komunikat użycia w `endturn-aria-probe.cjs` poprawione w tej rundzie (wcześniej skopiowane z innego runnera; p4 nie ma fallbacku na hak).

## 5. Zakres NIE ZMIERZONO

- Pre-poprawki seed 7: w tym temacie nie wykonano biegu przed poprawką. Potwierdzenie objawu na seed 7 pochodzi z pomiaru Evaluatora (4 tury, aria=true przy canEnd=true), nie z tego repo.
- Stuck pointer (`activeEndTurnPointers` bez pointerup): nie zbadano; poprawka nie zmienia tego zachowania.
- Odwrotny przypadek (aria=false przy canEnd=false, klik odrzucany): nie zaobserwowany ani nie zmierzony.
- Zewnętrzna aktywność gracza (otwarcie paneli) jako wyzwalacz odświeżenia: nie zmierzona.
- Koszt poprawki: cykl co 500 ms wywołuje `canEndTurn()` (w tym `healStaleEndTurnBlockers`) poza `updateHud()`. Komentarze w `main.ts` wskazują, że jest to ta sama ścieżka co pętla HUD; nie zmierzono wpływu na wydajność ani liczby ostrzeżeń `console.warn` w `canPlayerInitiateEndTurn` przy zablokowanym stanie (cykl może je powtarzać co 500 ms, gdy tura jest zablokowana).

## 6. Dane

- `dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/endaria-s4242-run3.jsonl` — przed poprawką, seed 4242, 8 tur.
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-BUTTON-ARIA-Q1/endaria-s7-postfix-run1.jsonl` — po poprawce, seed 7, 8 tur.
