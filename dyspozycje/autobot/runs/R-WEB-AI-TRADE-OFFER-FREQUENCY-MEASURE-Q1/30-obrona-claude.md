# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — Obrona Operatora (odpowiedź na FC r4, PASS-WITH-NOTES)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zmiany wyłącznie komentarze, nagłówek skryptu i opis relationNote; zero zmian reguł i balansu)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: obrona zarzutów Evaluatora r4 (1–5) z przyjęciem albo odrzuceniem każdego z dowodem; bez nowych pomiarów.
BAZA: 02802c0eb (kandydat r4, detached). Model: Obrona HAIKU.
ZMIANY/COMMIT: patrz sekcja „Zmiany w tej obronie” (commit po zapisie tego raportu).

## Werdykt per zarzut

### Zarzut 1 — powtarzalność (ten sam seed = ten sam wynik) — PRZYJĘTY (nie spełnione, oznaczone)
- Przyjmuję: kryterium „to samo ziarno = ten sam wynik” NIE jest spełnione. Nie powtórzono pełnej komórki macierzy (150 tur) w tej rundzie, więc tabela jest oznaczona jako NIEPOWTARZALNA w sensie ścisłym.
- Dowód (surowe pola `offerLog` z plików JSON, to samo ziarno 2222, relacja 20, prepared, 30 tur):
  - `evidence/r4-z1/normal-prepared-2222-rel20-30t.json`: `turn 25, give sol 10, recv glina 10, przyjmijAktywne true`
  - `evidence/r4-z1/fast-prepared-2222-rel20-30t.json`: `turn 25, sol -> glina` (zgodne z normal)
  - `evidence/r4-z1/fast-freshprofile-prepared-2222-rel20-30t.json`: `turn 26, sol -> glina`
  - `evidence/r4-z1/fast-noprofile-B-prepared-2222-rel20-30t.json`: `turn 26, drewno 20 -> glina 10`
  - `evidence/r4-z1/fast-freshprofile-B-prepared-2222-rel20-30t.json`: `turn 26, drewno 20 -> glina 10`
- Wniosek: przy tym samym ziarnie i relacji wynik zmienia turę i parę surowców. Źródło NIE_ZMIERZONO (nie ustalone, nie wiem, czy to RNG bez ziarna, czas systemowy, czy stan profilu przeglądarki; w tej rundzie nie badano). Jest to zgłoszenie do osobnego tematu.
- Konsekwencja dla tabeli: 1–2 oferty na komórkę; wynik jest jedną realizacją, nie powtarzalnym pomiarem.

### Zarzut 2 — relAtDecision tautologiczne — PRZYJĘTY (opis poprawiony)
- Przyjmuję: `main.ts` zapisuje `civTestRuntime.relAtDecision` zaraz po przypisaniu pinu do `relTicked`, więc pole zawsze równa się pinowi. Nie jest niezależnym dowodem tego, co widzi AI. Opis „to, co widzi AI” z r4 był zawyżony.
- Poprawka (komentarz, bez zmiany działania): `gra/src/main.ts` przy zapisie `relAtDecision` oraz komentarz pola `gra/src/game/civ-test-hooks.ts` (`relAtDecision`) mówią teraz wprost, że to zapis po wymuszeniu pinu. Nagłówek pola w `gra/tools/measure-ai-trade-offer-frequency.cjs` (sekcja „Ograniczenia”) opisuje to samo.
- Realny dowód, który zostaje (nie tautologiczny, ale też nie widoczność w decyzji): `relTotalAi` po `endTurn` równe pinowi w smoke `evidence/r4-z1/smoke-prepared-1111-rel20.json` (20/20 x6) i `…-rel140.json` (140/140 x6); mutacja r3 (bez pinu) dawała 29 po ticku. Dowód „AI widzi pin w decyzji” pozostaje NIE_ZMIERZONO bezpośrednio.

### Zarzut 3 — wniosek o braku zależności od relacji zbyt mocny — PRZYJĘTY (wniosek osłabiony)
- Przyjmuję. Dane: 12 ofert / 1350 tur; po 4 oferty / 450 tur na każdą relację (20, 80, 140). Przy tej liczebności nie widać różnicy, ale to NIE dowodzi braku zależności.
- Sprawdzone w kodzie: `gra/src/main.ts` linia 23634 (`fairnessGate` w `pickAiPlayerCyclicBarter`) i linia 20479 używają stałej `AI_PROPOSER_FAIRNESS_REL_TOTAL`, a nie aktualnej Relacji. Relacja wchodzi do decyzji innymi ścieżkami (`evaluateProposal`, `previewIncomingPlayerAccept`), więc zależność jest ograniczona strukturalnie, ale nie została zmierzona w pełnej grze.
- Ramię prepared (wyciszone inne klasy ofert, kontakt i technologia Wymiany przygotowane) daje rząd wielkości: ok. 0,9 oferty / 100 tur. Ramię natural: NIE_ZMIERZONO jako miara (wojna od t1 w 3 ziarnach, Z2).
- Wniosek poprawiony: „Przy ramieniu prepared i N=4 na relację nie wykryto różnicy; zależność od relacji nie została wykluczona; częstość w pełnej grze NIE_ZMIERZONO.”

### Zarzut 4 — consoleErrors pominięte w raporcie — PRZYJĘTY (dane podane)
- Przyjmuję. Liczby z plików `evidence/r4-matrix-prepared/cell-*.json` (pole `consoleErrors`):

| komórka | 1111 | 2222 | 3333 |
|---|---|---|---|
| relacja 20 | 21 | 57 | 13 |
| relacja 80 | 4 | 57 | 18 |
| relacja 140 | 22 | 57 | 18 |

- Suma: 267 wpisów consoleErrors w 9 komórkach. Próbki (`consoleErrorSample`, łącznie 44 wpisy): wszystkie to komunikat gry `[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary/trójkąta …` (przydział pominięty, ponowna próba w kolejnej turze). Nie są to `pageerror`.
- Wpływ na wynik: NIE_ZMIERZONO (komunikat dotyczy mechanizmu wojny wymuszonej, nie handlu; nie badano, czy blokuje wątki handlowe). Nie zmienia liczby ofert (liczba `cyc` w JSON zgadza się z tabelą w 9/9).

### Zarzut 5 — nieaktualne opisy — PRZYJĘTY (poprawione)
- Nagłówek `gra/tools/measure-ai-trade-offer-frequency.cjs` („Zero zmian w gra/src”, „brak haka relacji/ziarna”) — poprawiony: skrypt używa haków r3/r4 (ziarno `?civSeed`, `setRelationPin`), tylko za `?civTest=1`.
- `relationNote` — poprawiony: opisuje `setRelationPin` (pin w tiku przed decyzjami AI) oraz `setRelationTotal` przed startem i przed każdym endTurn (`relBeforeEnd`).
- Liczniki bitew po wznowieniu (Z6 z r4): zostają jako OGRANICZENIE, na wniosku nie stoją (bez zmian).
- Bramka bez flagi dla r4: NIE powtórzono (NIE_ZMIERZONO). Ostatni dowód: `evidence/gate-noflag-civSeed999-r3.json` (hookPresent=false). Zmiana r4 (setRelationPin) jest w tym samym bloku `if (/[?&]civTest=1/…)` co reszta haków — weryfikacja statyczna.

## Zmiany w tej obronie
- `gra/src/main.ts`: tylko komentarz przy `civTestRuntime.relAtDecision = …` (linia ~41969). Bez zmiany działania.
- `gra/src/game/civ-test-hooks.ts`: tylko komentarz pola `relAtDecision`.
- `gra/tools/measure-ai-trade-offer-frequency.cjs`: nagłówek, sekcja „Ograniczenia” i `relationNote` (sprawdzone: `node --check` OK).
- `dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/30-obrona-claude.md` (ten plik).
- `git diff -U0 -- gra/src` pokazuje wyłącznie linie komentarzy.

## TESTY
- `npx tsc --noEmit`, logic-test, tech-tree-test, research-test, unit-replace-test, combat-test — NIE_ZMIERZONO w tej obronie: brak `gra/node_modules` w worktree, wolne miejsce na dysku 2,6 GB (poniżej progu 4 GB dla web, dispatch nakazuje `npm ci`). Zmiany w `gra/src` są wyłącznie komentarzami (sprawdzone diffem), więc nie zmieniają kompilacji; wynik tsc z r4 (EXIT 0) pozostaje obowiązujący dla kodu wykonywalnego.
- `node --check gra/tools/measure-ai-trade-offer-frequency.cjs` — EXIT 0 (SYNTAX_OK).
- Pomiar nie był powtarzany (brak nowych przebiegów w tej obronie).

## BLOKADY
- Brak wykonania `tsc`/bramek na świeżym `node_modules` (dysk 2,6 GB wolnego). Nie wpływa na zmiany komentarzy.
- Źródło niedeterminizmu (Z1) NIE_ZMIERZONO — osobny temat.

## RUNDY
5/5 (ostatnia runda pomiaru; dispatch r4 był 4/5 z zarzutami FC r3; ta obrona to odpowiedź na FC r4). Wniosek o dalszych rundach zostawiam FC.

## NASTĘPNY KROK
Final Control: ocena przyjęć 1–5 i decyzja, czy tabela ze statusem NIEPOWTARZALNA + wniosek osłabiony jest wystarczający do READY_FOR_DEPLOY pomiaru. Osobny temat: źródło niedeterminizmu tej samej gry przy tym samym ziarnie.

DEPLOY/PUSH: NIE WYKONANO
