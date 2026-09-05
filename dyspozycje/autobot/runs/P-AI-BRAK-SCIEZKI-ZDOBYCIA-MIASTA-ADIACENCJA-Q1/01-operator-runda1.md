# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Operator, runda 1/5

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · worktree `/home/user/wt-ai-adiacencja`,
gałąź `autobot/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`, baza `022b82aa`, drzewo czyste (guard §2b OK).

## USTALENIE GŁÓWNE — wyzwalacz dispatchu jest NIEAKTUALNY

Ścieżka zdobycia miasta przez adiacencję dla cywilizacji major **już istnieje i działa** na bazie tego
tematu. Weryfikacja przez `git merge-base --is-ancestor` (C-056), nie z pamięci:

- `744c4374` „feat: zintegruj zweryfikowane sciezki zdobycia miast" (2026-08-18) **jest przodkiem HEAD**.
- Wniósł `gra/src/game/ai-city-capture-executor.ts` (`executeAiCityMove`) i `canAiEnterEmptyEnemyCity`
  w `city-hex-movement.ts`.
- `main.ts:31519` wpina egzekutor w pętlę komend AI, a `onCapture` (`main.ts:31540`) woła
  `tryAutoCaptureEmptyCityAt(city.q, city.r, [u])` — **piąte wywołanie, od cywilizacji AI**.
  Teza „zero wywołań od AI" opisuje stan sprzed `744c4374`.
- `ai.ts:2795` (nie `:2517`) emituje `move` z `targetCityId`; egzekutor już go nie odrzuca.

Nie zmieniałem `ai.ts`, `main.ts` ani `city-hex-movement.ts` — nie było czego naprawiać, a zmiana
„na wszelki wypadek" łamałaby C-025. Praca rundy poszła w **trwały dowód**, którego brakowało.

## ZMIANY/COMMIT

Jeden nowy plik, w allowliście: `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` (bramka, 53 asercje).
Zero zmian w plikach śledzonych (`git diff HEAD --quiet` — czyste). Commit rundy = HEAD gałęzi tematu, wiadomość „P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 R1: bramka adiacencji AI" (SHA odczytaj z `git -C /home/user/wt-ai-adiacencja log -1`).

Luka, którą bramka zamyka: istniejąca `ai-city-capture-integration-test.cjs` testuje sam egzekutor na
ręcznie złożonych argumentach — **nie czyta ani `ai.ts`, ani `main.ts`**. Wycięcie wpięcia `onCapture`
w `main.ts` zostawia ją zieloną, a AI znowu bez przejęć. Dowód: pod mutacją `onCapture: () => false`
w `main.ts` nowa bramka czerwienieje (A5c), tamta nie ma jak.

## TESTY

- **K1 (reprodukcja PRZED naprawą)** — wykonywana w bramce, nie opisana: mutant egzekutora z
  bezwarunkową blokadą obcego heksu. Ślad: `ownerId 2 -> 2`, jednostka `5,4 -> 5,4`,
  komend jednostki = 1 (`unitActed`, tura stracona). Rozkaz z **realnego `decideAITurn`**.
- **K2 (po naprawie)** — ten sam rozkaz, realny egzekutor: `cities[wrog-c1].ownerId 2 -> 1`,
  jednostka `5,4 -> 5,5`, `ruchLeft = 0`, przejęcie przez realną `canCaptureCityWithoutBattle`.
- **K3 (parytet)** — `canCaptureCityWithoutBattle` i `canUnitOccupyCityHex` dają identyczny wynik dla
  ownera 0 / -1 / 1; reguła bazowa **nie została zniesiona dla nikogo**. Asymetrie znalezione i ocenione:
  AI ma TRZY bramki, których nie ma gracz (obowiązkowa adiacencja, blokada fortyfikacji `maMur`/
  `palisada|mury|fort|baszta`, wymóg `targetCityId` + widoczność `aiCityCaptureAllowed`), barbarzyńcy mają
  własną (`shouldAllowBarbCityCapture` = tylko `hard`). Wszystkie są **węższe** — AI nie może nic, czego
  nie może gracz, i żadna nie blokuje GOAL (miasto niebronione, nieufortyfikowane, sąsiednie).
  Zamierzone (komentarz w `city-hex-movement.ts:35`). Zrównanie AI z graczem na miastach ufortyfikowanych
  byłoby rozszerzeniem zakresu — **nie zrobione**, do decyzji właściciela jeśli miałoby wejść.
- **K4 (negatywne)** — 10 asercji: bronione, `mury`, `maMur`, dystans 3 (brak ataku dystansowego),
  `move` bez `targetCityId` — w każdym `ownerId` zostaje 2.
- **K5** — bramka: `AI-ZDOBYCIE-MIASTA-ADIACENCJA OK (53/53)`, exit 0.
- **K6 (mutacja przez KOPIĘ pliku)** — cofnięcie naprawy w `ai-city-capture-executor.ts`: **9 faili
  (44/53)**. Cofnięcie wpięcia w `main.ts`: **1 fail (52/53, A5c)**. Oba przywrócone z kopii
  (`cp`, nigdy `git checkout`), po każdym `git diff --quiet` zielone.
- **K7** — `node ./node_modules/typescript/bin/tsc --noEmit`: 0 błędów.
- **K8** — logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
- **K9** — rodzina (grep `ai-|capture|miast|podboj|city|siege|barb` po `gra/tools/*-test.cjs`,
  bez `*live*`/`*real-render*`/`*perf*`/`ai-buduje-budynki`): **92 bramki, 82 zielone**.
  Kluczowe dla tematu zielone: `ai-city-capture-integration` 14/14, `city-hex-movement` 13/13,
  `barb-city-behavior`, `barb-city-owner-contract`, `capital-capture`, `post-capture-law`,
  `map-attack-city`, `siege-defenders`, `siege-ai`, `city-limit-conquered`, `ai-fog`.
  10 czerwonych jest **preegzystujących** — drzewo śledzone jest bit-w-bit bazą `022b82aa`
  (`git diff HEAD --quiet`), więc nie mogą pochodzić z tej rundy; żadna nie dotyczy adiacencji:
  `ai-balans-step3` 7/1, `ai-praca-split-parity` 21/1, `ai-slider` 33/5, `ai-test` 287/8 (wybór budynku
  ekonomicznego + `zaproponuj_handel`), `barb-camp-destruction` 82/2, `barb-city-capture-cluster` 92/1
  (snapshot-lock `2h-static` na `applyCityCaptureToMap`), `city-state-offensive-normal-easy`,
  `empire-panel-miasto-obywatele-content` 113/2, `miasta-panstwa-wylaczone` 52/3,
  `miasta-panstwa-wylaczone-ui-render` 11/1. Pełna lista wyników: log przebiegu, nie odtwarzam z pamięci (C-058).

## BLOKADY

Brak blokad technicznych. Trzy noty dla Evaluatora/orkiestratora:

1. **Wyzwalacz dispatchu opisuje stan sprzed `744c4374`.** Nie `DECISION_REQUIRED` (C-054): nie ma
   sprzeczności zachowań — stan docelowy GOAL po prostu już obowiązuje, a kryteria 5-9 dały się wykonać.
2. **§6 R-PROC:** ani nowa bramka, ani `ai-city-capture-integration-test.cjs` nie są w tabeli bramek.
   „Nowa bramka istnieje dopiero wtedy, gdy jest w tej tabeli" — wpis należy do integracji, a
   `docs/decyzje/**` jest poza moją allowlistą. Do wykonania ręką orkiestratora.
3. Bramka celowo **nie importuje `barbarians.ts`** (§2b — plik trzyma temat równoległy); parytet
   barbarzyńców liczony przez wspólną `canCaptureCityWithoutBattle`.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator (Opus 5, effort high) — weryfikacja niezależna, w szczególności: czy `744c4374` faktycznie
jest przodkiem bazy, czy K2 dowodzi przejęcia (a nie braku odrzucenia) i czy bramka czerwienieje pod
obiema mutacjami.

DEPLOY/PUSH: NIE WYKONANO
