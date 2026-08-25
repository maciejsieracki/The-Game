# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-ZELAZO-AUDYT-POZOSTALE-Q1-T10`
GOAL: Audytować dwie jednostki: **Drużynnik (Słowianie), iButho z iklwa (Zulusi)** —
dziś dedykowany dispatch, kod z `jednostki-z3-plemiona.ts`, nigdy rygorystycznie
zmierzony. Uwaga: Drużynnik jest referencją stylu dla już zintegrowanego T4
(Jeździec z oszczepami) — spójność kulturowa musi zostać zachowana, nie zerwana.

## Wyzwalacz

Kontynuacja `R-ZELAZO-AUDYT-POZOSTALE-Q1`, sekwencyjnie po T9. Pełny kontekst:
`docs/decyzje/R-ZELAZO-AUDYT-POZOSTALE-Q1.md`.

## Izolacja

Nowa gałąź `autobot/ZELAZO-AUDYT-T10-Q1`, odgałęziona od `origin/main` (zawiera już
T5-T9, w tym T4 z poprzedniej serii z `zelazo-jezdziec-oszczepami-opus5.ts`, który
CZYTA stałe stylu z `jednostki-z3-plemiona.ts` — patrz niżej), osobny worktree per rola.

## Allowlista

- `gra/src/render/jednostki-z3-plemiona.ts` — WYŁĄCZNIE funkcje `buildDruzynnik()`,
  `buildIButho()`. NIE ruszać Berserker/Wojownik germański (T8), Miecznik galijski (T9).
- `gra/src/render/units.ts` — WYŁĄCZNIE linie dispatchu (ok. `units.ts:1483-1484`),
  jeśli audyt tego wymaga.
- `gra/tools/*` — nowy lub rozszerzony test regresji renderowania.

## KRYTYCZNE — zależność wsteczna

`gra/src/render/zelazo-jezdziec-oszczepami-opus5.ts` (T4, już zintegrowany na main)
**POWTARZA LICZBOWO** (nie importuje) 6 wartości stylu `TR_*` z `Drużynnika` w tym
pliku dla spójności kulturowej (`TR_SKIN/TR_STEEL/TR_LEATHER/TR_LINEN/TR_WOOL_DK/
TR_HAIR_SLAV`) — potwierdzone przez Evaluatora T4 źródłowo. Jeśli audyt tego tematu
zmieni którąkolwiek z tych stałych w `buildDruzynnik()`, T4 rozjedzie się wizualnie z
Drużynnikiem BEZ ostrzeżenia kompilatora (bo to duplikacja liczbowa, nie import).
**Operator MA sprawdzić to jawnie**: jeśli zmienia którąkolwiek z tych 6 wartości,
MUSI zaktualizować odpowiadające stałe `SJ_*` w `zelazo-jezdziec-oszczepami-opus5.ts`
w TYM SAMYM commicie (plik jest w allowliście WYŁĄCZNIE dla tej synchronizacji, nic
więcej) i dowieść testem, że oba pliki nadal się zgadzają.

## Kontekst techniczny

**Dane jednostek** (`units.json`): Drużynnik (Słowianie, Atak 8/Obrona 6/Pancerz 3),
iButho z iklwa (Zulusi, Atak 5/Obrona 7/Pancerz 4 — iklwa to krótki kłujący dzirot
zuluski, sprawdź czy model faktycznie go dzierży jako broń kłującą z bliska, nie
rzutową jak generyczny oszczepnik).

**Metoda — jak T1-T9:** zmierzyć geometrię, sprawdzić kolizje/orientacje, uzupełnić
sekcję historyczną K-style. Zulusi: iklwa to innowacja Szaki Zulu (wczesny XIX w.) —
UWAGA na ramy czasowe, sprawdź czy epoka gry (Żelazo w tym kontekście kulturowym) jest
spójna z tą chronologią, albo udokumentuj świadome uogólnienie.

## Kryteria sukcesu

1. Dwa modele zmierzone (dowód pomiaru w raporcie).
2. Jeśli Drużynnik zmieniony — `zelazo-jezdziec-oszczepami-opus5.ts` (T4) zsynchronizowany
   w tym samym commicie, dowiedzione testem zgodności obu plików.
3. iButho dzierży iklwę jako broń kłującą, nie rzutową.
4. Sekcja historyczna K-style dla obu jednostek, ze źródłami.
5. Real render Playwright/Chromium z dowodem nietautologiczności per-asercja, w tym
   test regresji T4 (Jeździec z oszczepami) potwierdzający brak wizualnego rozjazdu.
6. Zero regresji: testy T1-T9 tej serii + 5 bramek referencyjnych zielone.
7. `tsc --noEmit` i `vite build` (C-001) czyste.
8. Wątpliwości historyczne — Operator rozstrzyga i dokumentuje (§10), nie pyta.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny, `R-PROC-AUTOBOT.md` §5a), Final Control Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–8 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1 (po zamknięciu T5-T9).
DEPLOY/PUSH: NIE WYKONANO.
