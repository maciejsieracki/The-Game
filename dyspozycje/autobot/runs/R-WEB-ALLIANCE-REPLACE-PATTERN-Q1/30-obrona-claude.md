STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza istniejących danych; zero zmian w gra/)
TEMAT: R-WEB-ALLIANCE-REPLACE-PATTERN-Q1
GOAL: Dla każdej podmiany sojuszu AI-AI wskazać ścieżkę usunięcia, przyczynę, zgodność z regułą; sprawdzić limit 2 sojuszy/cywilizację tura po turze (1-13, 1-19, 10-19, 7-13).
ZMIANY-COMMIT: poprawiony dokument `dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md` i ten raport; baza kandydat 2104bfcd5 (origin/main 8707b063b). Zero zmian w gra/src, gra/data i testach.
TESTY: nie dotyczy (brak zmian kodu). Weryfikacja na danych i kodzie: liczby z surowego wyjścia `grep`/`sed`:
- `[ALLIANCE-PLAN]` w logu ALLY66: 63 wiersze; rozkład wartości licznika: 0 → 642, 1 → 70, 2 → 34, brak 3+ (max = 2).
- `[AA-REMOVE]` w logu ALLY66: 0 wierszy (log ma 130 linii: 67 SYNC, 63 PLAN).
- `seed4242-harder0.alliance-log.txt`: 96 wierszy; `platnosc-broken` 30 wierszy, z tego `sojusz_pelny` 0; `sojusz_aiai` 1 wiersz (linia 77, `odmowa-sojuszu-finalize`, `sojusz_aiai_1_16_t30`, t55).
- `gra/src/main.ts:24708`–`24722` (`syncRelationFromDeals`): brak gałęzi `else` potwierdzony.
- `gra/src/main.ts:26189` (`finalizeAllianceObligationRefusals`), `:24612` (`breakTreatyVoluntarily`) — funkcje potwierdzone.
- `gra/src/game/ai-ai-alliance-tick.ts:19`, `:106`, `:274`: `wygasaTura: null` potwierdzone.
- `seed4242-harder0.summary.json`: `"harder": 0`.
- `git diff --check`: wykonano przed commitem (wynik poniżej w BLOKADY/NASTĘPNY KROK).
BLOKADY: brak blokad formalnych. Kryterium binarne dispatchu (ścieżka usunięcia dla każdej podmiany, plik:linia) NIE JEST SPEŁNIONE: dla podmian 1-13 i 1-19 ścieżka pozostaje NIE ZMIERZONO (brak `[AA-REMOVE]` w danych, ALLYPATH nie odtworzył obu par). Klasyfikacja ZGODNE/ŁAMIE dla podmian: NIE ZMIERZONO.
RUNDY: 2/5 (obrona rundy 1 po FAIL Evaluatora r1, commit e8a5a0bbb).
NASTĘPNY KROK: Evaluator r2 z tym samym ID. Dalszy pomiar (hak `[AA-REMOVE]` + licznik civ przy każdym SYNC, seed 4242, t30–t70) jest kandydatem na osobny temat; nie wykonywany w tej rundzie (zakaz biegów dłuższych niż 10 min i brak nowych biegów w dispatchu).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora r1

1. (limit tura po turze) PRZYJMUJĘ. Potwierdzono dane PLAN: max licznika 2; okna bez umowy trwają jedną turę: 1-13 t39→t40→t41 (civ 1: 2→1→2, civ 13: 1→0→1); 1-19 t57→t58→t59 (civ 1: 2→1→2, civ 19: 1→0→1); 1-13 t65→t66→t67 (civ 13: 1→0→1). Zaktualizowano tabelę w dokumencie (sekcja 2), ograniczenie snapshotu PLAN (przed podpisaniem w turze) jako jawne.
2. (t66 civ 13) PRZYJMUJĘ. PLAN t66 `[13,0]`, t65 `[13,1]`: utrata 1-13 `_t40` w t66 jest w logu. Poprzedni zapis „civ 13 ma 1-13 + 7-13” był błędny. Dla 10-19 (t64): PLAN t59–t65 `[19,1]` → `[19,2]` w t65 po podpisaniu 10-19 w t64: limit zachowany, dane rozstrzygają.
3. (brak cytatu reguły) PRZYJMUJĘ z uzupełnieniem. Źródło reguły limitu 2: `gra/src/game/ai-ai-alliance-limit.ts:36`, `:57`–`:62` (kod) oraz `dyspozycje/WERSJE.md:223` (FALA 865: „wspólny limit 2 sojuszy na cywilizację we wszystkich ścieżkach zawierania sojuszu”). Nie czytano rejestru reguł w sensie dokumentu przewodnika, więc klasyfikacja ZGODNE/ŁAMIE dla podmian pozostaje NIE ZMIERZONO.
4. (hipoteza platnosc-broken) PRZYJMUJĘ. Potwierdzone: 30 wpisów `platnosc-broken`, 0 `sojusz_pelny`. Hipoteza odrzucona jako nieuzasadniona; w dokumencie zapisana jako odrzucona.
5. (pominięty sojusz_aiai_1_16_t30) PRZYJMUJĘ. Dodano jako jedyny zaobserwowany przypadek usunięcia `sojusz_aiai_*` (`odmowa-sojuszu-finalize`, linia 77, t55, `main.ts:26189`/`:26224`). Zaznaczono: to nie jest dowód dla 1-13 ani 1-19.
6. (pominięty #103 / syncRelationFromDeals) PRZYJMUJĘ. Dodano: `main.ts:24708`–`24722` bez gałęzi `else`; SYNC t40 13-1 i t58 19-1 z `statusPrzed=sojusz` i bez starej umowy w deals. Oznaczono jako obserwację zgodną z kodem, nie jako zmierzoną przyczynę podmiany; pytanie #103 pozostaje dla właściciela (mechanika).
7. (drobne) PRZYJMUJĘ path i rozbieżność: ścieżka pełna `gra/src/game/ai-ai-alliance-tick.ts:19`; `wygasaTura: null` także `:106` i `:274`. Rozbieżność harder wyjaśniona: log `[AA-REMOVE]` to `harder: 0` wg `seed4242-harder0.summary.json`; wpis „--harder 1” w 10-operator ALLYPATH dotyczy innego biegu (66 wierszy jsonl, bez `aa.log`).
8. (binarne kryterium) PRZYJMUJĘ część. Limit 2 tura po turze: sprawdzony z danych PLAN, wynik ZGODNE w danych (max 2, okna 1-turowe). Ścieżka i przyczyna podmian: pozostają NIE ZMIERZONO, bo dane nie zawierają `[AA-REMOVE]` dla tych par. Ranking kandydatów ścieżek dodano w dokumencie (sekcja 1).

## UWAGI-DLA-ORKIESTRATORA

- Dla pełnej odpowiedzi na kryterium binarne potrzebny jest osobny pomiar (kandydat w sekcji 5 dokumentu): seed 4242, harder 0, hak `[AA-REMOVE]` + licznik civ przy każdym SYNC, t30–t70. Nie uruchamiano (zakaz w dispatchu).
- Pytanie #103 (czy relacja `sojusz` ma być czyszczona po zniknięciu umowy) to decyzja mechaniki gry, dla właściciela wg zasad ABC; nie zadawano.
- W ALLYPATH `sojusz_siostry_40_41` usunięty dwa razy (t55 i t56, różne `zawarta`): wymaga wyjaśnienia poza tym tematem.
