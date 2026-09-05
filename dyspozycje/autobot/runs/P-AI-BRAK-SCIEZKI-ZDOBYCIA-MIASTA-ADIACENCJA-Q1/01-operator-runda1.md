# P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1 — Operator, runda 1/5

MODEL+EFFORT: Opus 5, effort high · DATA: 2026-09-05 · worktree `/home/user/wt-ai-adiacencja`,
gałąź `autobot/P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1`, baza `022b82aa`, drzewo czyste (guard §2b OK).

> **Wersja skrócona i uzupełniona o kontrakt** w fazie Obrony tej samej rundy (zarzuty 4 i 5).
> Pierwotny, 695-słowny tekst bez pól kontraktu: commit `1e5a850d`, ten sam plik.
> Rozstrzygnięcia zarzutów i poprawki kodu — `03-obrona-runda1.md`.

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-AI-BRAK-SCIEZKI-ZDOBYCIA-MIASTA-ADIACENCJA-Q1
GOAL: rozkaz `move` AI major na sąsiedni, niebroniony obcy heks miasta skutkuje przejęciem; jednostka nie traci tury bez efektu.

## USTALENIE GŁÓWNE — wyzwalacz dispatchu jest NIEAKTUALNY

Ścieżka zdobycia miasta przez adiacencję dla cywilizacji major **już istnieje** na bazie tematu.
Weryfikacja przez `git merge-base --is-ancestor` (C-056), nie z pamięci: `744c4374` „feat: zintegruj
zweryfikowane sciezki zdobycia miast" (2026-08-18) jest przodkiem HEAD. Wniósł
`ai-city-capture-executor.ts` i `canAiEnterEmptyEnemyCity`; `main.ts:31519` wpina egzekutor w pętlę
komend AI, `onCapture` (`main.ts:31540`) woła `tryAutoCaptureEmptyCityAt` — piąte wywołanie, od AI.
Teza „zero wywołań od AI" opisuje stan sprzed `744c4374`. Praca rundy poszła więc w **trwały dowód**,
którego brakowało, a nie w zmianę „na wszelki wypadek" (C-025).

ZMIANY/COMMIT: `gra/tools/ai-zdobycie-miasta-adiacencja-test.cjs` (NOWY, 53 asercje), commit
`1e5a850d`. Zero zmian w plikach śledzonych `gra/src` (`git diff 022b82aa..1e5a850d --name-only -- gra/src` = pusty).
Luka zamknięta: `ai-city-capture-integration-test.cjs` testuje sam egzekutor na ręcznie złożonych
argumentach — nie czyta `ai.ts` ani `main.ts`; wycięcie wpięcia `onCapture` zostawia ją zieloną.

TESTY:
- K1 reprodukcja (mutant „bezwarunkowa blokada"): `ownerId 2 -> 2`, jednostka `5,4 -> 5,4`, 1 komenda (tura stracona).
- K2 po naprawie: `ownerId 2 -> 1`, jednostka `5,4 -> 5,5`, `ruchLeft 0`.
- K3 parytet: `canUnitOccupyCityHex` blokuje obcy heks dla 0/-1/1 — reguła bazowa nie zniesiona; wyjątek AI jest DODANY.
- K4 asercje negatywne: bronione / `mury` / `maMur` / dystans 3 / brak `targetCityId` — `ownerId` zostaje 2.
- K5 bramka tematu 53/53, exit 0. K6 mutacje: egzekutor 44/53 (9 faili), wpięcie `main.ts` 52/53; cofnięte `cp`, `git diff --quiet` OK.
- K7 `tsc --noEmit` 0 błędów. K8 referencyjne: logic 213/213 · tech-tree 19/19 · research 33/33 · unit-replace 13/13 · combat 6/6.
- K9 rodzina AI/przejęć: 92 bramki, 82 zielone; 10 czerwonych preegzystujących (drzewo śledzone = baza), żadna nie dotyczy adiacencji.

BLOKADY: brak technicznych. Noty: (1) wyzwalacz opisuje stan sprzed `744c4374` — nie `DECISION_REQUIRED`
(C-054), bo nie ma sprzeczności zachowań; (2) wpis nowej bramki do tabeli §6 należy do integracji
(`docs/decyzje/**` poza allowlistą); (3) bramka celowo nie importuje `barbarians.ts` (§2b).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high)
DEPLOY/PUSH: NIE WYKONANO
