# R-WEB-SAVE-STATE-FIX-Q1 — obrona Operatora (runda 2, Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (zmiana wyłącznie w narzędziu testowym; logika gry w gra/src/main.ts bez zmian względem kandydata 1b4293ea2)
TEMAT: R-WEB-SAVE-STATE-FIX-Q1 (tag SAVESTATEFIX)
GOAL: domknięcie zarzutów Evaluatora z raportu 4fa40ed0632d5970bba624f900025ec61c3b6253 bez zmiany kodu gry.
BAZA: 1b4293ea200dc027131680af8e6c999b15c6fe74 (kandydat r1, git checkout --detach). Commit obrony: patrz pole `sha` w odpowiedzi strukturalnej (commit nie może zawierać własnego SHA).

## Odpowiedź na zarzuty

### Zarzut 1 — PRZYJMUJĘ (naprawione, z dowodem)
Zarzut był zasadny: T2 sprawdzało tylko kolejność indeksów (clear, odczyt, set), a nie argumenty `set` ani warunek strażniczy `if (...?.length)`. Cztery mutacje z zarzutu (zamiana argumentów, wyłączenie straży) przechodziły.

Zmiana w gra/tools/save-load-ai-state-fields-test.cjs:
- nowy check T2b: dokładny wzorzec pętli odtworzenia dla każdego pola (straż `if (saved<X>?.length)` + `for (const [oid, V] of saved<X>) <mapa>.set(oid, V)`) — wzorzec `RESTORE_LOOP`;
- nowe mutanty (po 3 na pole): zamiana argumentów `set(t, oid)` / `set(uid, oid)`, straż `if (false)`, `set(oid, oid)`.

Wyniki z surowego wyjścia (node tools/save-load-ai-state-fields-test.cjs):
- 29 PASS / 0 FAIL, exit 0;
- wszystkie 18 mutacji raportuje „test czerwieni się” (9 na pole), w tym 3 nowe na pole:
  - `zamiana argumentow set (wartosc, klucz)` → czerwone przez `T2b petla odtworzenia`,
  - `wylaczona straz if(false)` → czerwone przez `T2b`,
  - `petla bez zapisu wartosci (set(oid, oid))` → czerwone przez `T2b`.

### Zarzut 2 — PRZYJMUJĘ w części dotyczącej testu live i warstwy B (NIE ZMIERZONO)
Zarzut jest zasadny: w rundzie 1 nie podjęto żadnej próby testu live 4c ani warstwy B. Próby w tej rundzie:
- Warstwa B (`save-load-roundtrip-state-drift-test.cjs --dist ...`) wymaga `vite build` do katalogu poza repo oraz ~5 min na ziarno. W worktree nie ma `gra/node_modules` (brak vite, esbuild i three), a nie ma też przeglądarki, więc uruchomienie nie jest możliwe w tej sesji.
- Test live 4c (`save-load-continuity-live.cjs`, rivals 9, civTypes 14, Trudny, licznik cudu > 0) wymaga Chromium i zbudowanego bundla. Brak obu w tej sesji, więc nie podjęto go.
- Uruchomiono to, co da się uruchomić bez zależności: warstwa A (statyczna) `save-load-roundtrip-state-drift-test.cjs --static-only 1` → `SAVE-LOAD ROUNDTRIP OK`, exit 0.

Konsekwencja: skutek w grze (licznik cudu > 0, B==A ≥ 6 tur po wczytaniu) pozostaje NIE ZMIERZONO. Zmiana jest weryfikowana tylko statycznie i jednostkowo (T5: próg 1,667 po odtworzeniu licznika 12 vs 1,000 po zerowaniu).

### Zarzut 3 — PRZYJMUJĘ
Treść raportu nie podawała SHA kandydata. Ten raport podaje bazę 1b4293ea2; SHA obrony jest w polu `sha` odpowiedzi strukturalnej.

## Zmiana techniczna narzędzia (poza zarzutami, konieczna do uruchomienia)
Test T5 wymagał `esbuild` przy imporcie na poziomie modułu, a `esbuild` nie jest zainstalowany w worktree, więc skrypt padał przed wykonaniem jakichkolwiek testów. T5 wyciąga teraz źródło `relaxedWonderCostThreshold` z gra/src/game/ai.ts (funkcja czysta), usuwa adnotacje typów i wykonuje ją przez `new Function`. Nie ma zależności od esbuild ani bundlowania. Kod testowany jest ten sam, który wykonuje gra.

## TESTY (surowe wyniki)
- save-load-ai-state-fields-test.cjs: 29 PASS / 0 FAIL, exit 0 (po poprawce, bez esbuild).
- save-load-ai-cs-absorption-state-test.cjs: 27 PASS / 0 FAIL, exit 0.
- save-load-roundtrip-state-drift-test.cjs --static-only 1: `SAVE-LOAD ROUNDTRIP OK`, exit 0.
- git diff --check: czysto.
- gra/src/main.ts: bez zmian względem 1b4293ea2 (diff pusty).

NIE ZMIERZONO (z powodem):
- save-load-podzial-pracy-representation-test.cjs: wymaga `gra/node_modules/esbuild` (ścieżka wpisana na sztywno), brak w worktree. Nie uruchomiono.
- Bramki tsc, logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, ai-test 297, early-grace-15 33, society-breakdown 56, ai-city-order-need-wiring 267: brak `gra/node_modules`, nie uruchomiono.
- Warstwa B i test live 4c: patrz zarzut 2.

## BLOKADY
- Brak `gra/node_modules` w worktree (blokuje tsc, większość bramek i warstwę B).
- Brak Chromium (blokuje test live 4c).
- Skutek w grze FIX #1 i FIX #2 nie zmierzony na żywo.
- Otwarte z rundy 1 (bez zmian w tej rundzie): DECISION_REQUIRED dla pendingForeignSpawnCities / pendingSameTypeRival* (nie są zapisywane). Decyzja należy do właściciela.

## RUNDY
2/5 (runda 1: SHA 1b4293ea2, werdykt Evaluatora FAIL; runda 2: ta obrona).

## NASTĘPNY KROK
Orkiestrator: ponowna ocena Evaluatora i Final Control dla tej obrony. Przed integracją należy uruchomić bramki w środowisku z node_modules i wykonać test live 4c albo zapisać NIE ZMIERZONO w rejestrze.

DEPLOY/PUSH: NIE WYKONANO
