# 30 — Obrona Operatora (Haiku 5.5), runda 1/5 po raporcie Evaluatora

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1
GOAL: po końcu rozejmu cena 0 = symboliczna opłata (10B); okno propozycji gracza przyjmuje surowce przy braku cedowalnego miasta (11A), bez regresji oferty AI.
BAZA: 107dfb18553a08b4e6c859db0f393fc905ddbd22 (kandydat Operatora); raport Evaluatora d297e4d8a426b083c33a9c13654cfa4737e98e39.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (poprawione). `truceEndWindowFor` w `gra/src/main.ts` liczy `cityAvailable` tylko z miast cedowalnych:
   `aiPeacePaymentAssets(...).some(a => a.kind === 'miasto' && !a.forbidden && a.pn > 0)`.
   Stolica, ostatnie miasto i cesja niemożliwa (`forbidden`) już nie włączają wariantu miastem. Zgodne z `planCityPeacePayment` (diplomacy-ai-forced-peace.ts:181 i :226).

2. PRZYJMUJĘ (test dodany). W `gra/tools/truce-end-peace-price-test.cjs` (Część 3) jest nowe wiązanie `wiring 11A`. Regex wymaga zarówno filtra `!a.forbidden && a.pn > 0` w linii `cityAvailable`, jak i pola `cityAvailable` w `return` z `truceEndWindowFor`.
   Mutacja wykonana: usunięcie `!a.forbidden` z main.ts daje wynik 71 PASS / 1 FAIL (FAIL: `wiring 11A ...`). Mutant jest wykryty.
   Wariant „usunięcie pola cityAvailable z return” nie był uruchomiony osobno. Pokrywa go ten sam regex (wymaga `cityAvailable }` w `return`), ale to nie jest zmierzona mutacja.

3. PRZYJMUJĘ (testy dodane):
   - (d0k) cena 0, gracz płaci opłatę symboliczną, brak środków (port płatności = false) → wojna, bez pokoju. PASS.
   - (d0m) cena 0 AI↔AI, płatność nie przechodzi (bilans PW) → wojna, bez pokoju; płatność wywołana raz. PASS.
   - (10B) `pickTruceEndSettlementPlan` z `requiredPn = truceEndDuePn(0)` i `balanceOk` = false → null (wojna). PASS.
   - Istniejące asercje (d0/d0b/d0c) nie były osłabiane w tej rundzie.

4. PRZYJMUJĘ jako dług częściowo (bez scalenia funkcji). Okno gracza (`truceEndSurowceSubstituteCovers`, poziom ofert, `cityAvailable` z aktywów) i plan AI (`pickTruceEndSettlementPlan`, poziom planu, `planCity.full`) nadal to dwa zapisy tej samej reguły. Scalenie wymagałoby zmiany sygnatury `pickTruceEndSettlementPlan`. Poza zakresem tej rundy.
   Dowód równoważności: test `(11A) wariant zastępczy: okno gracza = plan AI przy braku miasta` sprawdza siatkę cen {1, 50, 300} × pokryć {0, cena−1, cena, cena+1}. Wynik: zgodne we wszystkich 12 przypadkach.
   Znana rozbieżność (NIE ZMIERZONO wpływu w grze): plan AI przechodzi na surowce także przy częściowym mieście (plan miastem niepełny, ale `items > 0`). Okno gracza przechodzi na surowce tylko przy braku miasta cedowalnego (`pn > 0`, `!forbidden`), zgodnie z dispatchem pkt 2.

5. PRZYJMUJĘ jako notę. `gra/src/game/diplomacy-war-peace-profile.ts` jest poza allowlistą. Zmiana to jedno pole interfejsu `WarPeaceParams.pokojPoRozejmie`, konieczne dla tsc; wartość i zachowanie bez zmian.
   Przelicznik 1 Pn vs koszyk surowców: NIE ZMIERZONO. Nie dodano testu żywego koszyka. Decyzję o rozszerzeniu allowlisty zostawiam orkiestratorowi.

## Zmiany w tej rundzie (commit obrony)

- `gra/src/main.ts` — `cityAvailable` z filtrem `!a.forbidden && a.pn > 0` (różnica względem 107dfb185: 1 linia zastąpiona 3 liniami).
- `gra/tools/truce-end-peace-price-test.cjs` — testy (d0k), (d0m), (10B), siatka równoważności (11A), wiring 11A.
- `dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1/30-obrona-claude.md` — ten raport.

Pliki w `gra/tools/` nie zostały zmienione w zakresie `truce-end-window-test.cjs`.

## TESTY (surowe wyniki z tej rundy)

- `npx tsc --noEmit -p gra` → exit 0, brak komunikatów.
- `node gra/tools/truce-end-peace-price-test.cjs` → `Wynik: 72 PASS, 0 FAIL`.
- `node gra/tools/truce-end-window-test.cjs` → `Wynik: PASS=43 FAIL=0` (bez zmian pliku).
- `node gra/tools/truce-end-settle-exec-test.cjs` → `Wynik: 30 PASS, 0 FAIL`.
- `node gra/tools/truce-end-war-notice-test.cjs` → exit 0, `PASS truce-end-war-notice-test`.
- `node gra/tools/diplo-truce-impl-test.cjs` → exit 0 (liczby przypadków nie odczytano: NIE ZMIERZONO).
- `node gra/tools/war-limit-truce-count-test.cjs` → exit 0 (liczby: NIE ZMIERZONO).
- `node gra/tools/diplo-human-peace-no-war-test.cjs` → exit 0.
- `node gra/tools/diplo-war-tribute-once-test.cjs` → exit 0.
- Mutacja M-FORB (usunięcie `!a.forbidden` w main.ts) → 71 PASS / 1 FAIL na `wiring 11A` (przywrócono, potem 72/0).
- NIE URUCHOMIONO w tej rundzie: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0. Zmiana dotyka dyplomacji; te bramki należy uruchomić w Final Control.

## BLOKADY

Brak blokad technicznych. Zarzuty 1–5 są rozstrzygnięte (przyjęte z dowodem lub z jawnym długiem w punkcie 4 i notą w punkcie 5).

## RUNDY

1/5 (obrona po raporcie Evaluatora). Brak decyzji wymaganej od właściciela.

## UWAGI-DLA-ORKIESTRATORA

- Testy `truce-end-peace-price-test.cjs` zostawiają w `gra/tools/` pliki `.truce-end-*.cjs` (mutanty). Są nieśledzone i nie powinny trafić do commita. Operator usunął je przed commitem; warto dodać sprzątanie do testu.
- Plik `gra/tools/truce-end-window-test.cjs` nie był zmieniany w tej rundzie.
- Zależności w worktree zainstalowano przez `npm ci` w `gra/` (dla testów). Usunięcie `gra/node_modules` po bramkach jest po stronie orkiestratora/sprzątania.

NASTĘPNY KROK: Evaluator (weryfikacja rundy 1 obrony), potem Final Control z pełnym zestawem bramek ogólnych.
DEPLOY/PUSH: NIE WYKONANO
