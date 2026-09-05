# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — Operator, runda 2 (R2-1: klamp dolny do progu ucieczki)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort medium
GOAL: R2-1 — `morale_startowe = max(fleeMorale + epsilon, morale_bazowe × (1 − spadek))`.
Prog ucieczki to `morale <= fleeMorale`, więc równość już oznacza rout — epsilon wymusza
OSTRĄ nierówność. Praca rundy 1 (GOAL 1 + reset flagi) utrzymana bez zmian.

Baza: `36f40c7d` (ratyfikacja rundy 2), worktree `/home/user/wt-walka-w2`.

## ZMIANY/COMMIT

Allowlista, 3 pliki. Węzeł W1 (`auto-battle-power.ts`, `auto-battle-params.json`) —
tylko czytany, 0 zmian. `git diff --check` czysto, bez `git add -A`/`git add .`.

1. `gra/src/game/combat.ts` — `applyStartingMoralePenalty` dostaje podłogę:
   `podloga = Math.min(u.morale, fleeMorale + eps)`, `u.morale = max(0, max(podloga, ukarane))`.
   `Math.min(u.morale, …)` gwarantuje, że klamp może tylko obniżyć albo zostawić — nigdy
   PODNIEŚĆ morale jednostki wchodzącej już poniżej progu. `StartingMoralePowerParams`
   zyskuje `epsilonPonadFlee`, `loadStartingMoralePowerParams` czyta je z pliku danych.
   **Zero przypisań do `moraleMax` i `fleeMorale`** — czytane, nie zapisywane.
2. `gra/data/combat-params.json` — `morale_przewaga_mocy.epsilon_ponad_flee: 1`
   (+ pole `_opis`). Jedna liczba do przestrojenia, nie magiczna wartość w wyrażeniu.
   NIE trafiło do `auto-battle-params.json` (bramka to asertuje).
3. `gra/tools/walka-morale-przewaga-mocy-test.cjs` — CZĘŚCI G/H/I, 68→123 asercji.

## TESTY — KRYTERIA KOŃCA RUNDY 2

1. **CZĘŚĆ G — wszystkie 71 rekordów, nie próbka.** Bramka parsuje `gra/data/units.json`,
   filtruje rekordy mające *oba* pola (`Morale bazowe`, `Morale ucieczki`) i asertuje
   `eq(rekordy.length, 71)` — sama liczba jest asercją, więc próbka nie przejdzie.
   Klampy 10..300 / 0..295 odtworzone z `moraleBaseFor`/`fleeMoraleFor`; wariant BEZ
   weterana, bo weteran podnosi morale bazowe i obniża próg — jest łatwiejszy. Kara
   sufitowa 65%. Wynik: 71/71 ostro powyżej progu. ZIELONE.
2. **CZĘŚĆ H — cztery rekordy z ratyfikacji, przed/po w logu bramki:**
   `Wojownik 50/22: 18 → 23`; `Łucznik 40/25: 14 → 26`; `Zwiadowca 30/25: 11 → 26`;
   `Wojownik z mieczem i tarczą 60/22: 21 → 23`. Osobna asercja `przed <= fm` pilnuje,
   że te cztery rekordy NADAL są przypadkiem granicznym (gdyby dane się zmieniły,
   bramka to zgłosi zamiast cicho przejść).
3. **CZĘŚĆ I — tabela GOAL 2 odtworzona bez zmian.** r = 1,5 / 2 / 3 / 5 / 10 → 91 / 85 /
   76 / 65 / 50, przy typowym `fleeMorale`=22, wartość PO klampie identyczna jak przed.
   Klamp nieaktywny wszędzie, gdzie nie jest potrzebny.
4. **`moraleMax` / `fleeMorale` nietknięte** — CZĘŚĆ B (rundy 1) 100% zielona, plus
   asercje strukturalne w CZĘŚCI I, że ciało funkcji CZYTA `fleeMorale` i nie zawiera
   `u.moraleMax =` ani `u.fleeMorale =`.
5. **Praca rundy 1 utrzymana:** `walka-jeden-kontratak-test` 24/24; CZĘŚĆ F (reset
   `_startMoralePenaltyApplied` w `_resetBattleRuntimeState`) zielona. 0 linii cofnięte.
6. `tsc --noEmit` — 0 błędów. `walka-morale-przewaga-mocy` **123/123** (było 76/76),
   `walka-jeden-kontratak` 24/24. Referencyjne: logic 213/213, tech-tree 19/19,
   research 33/33, unit-replace 13/13, combat 6/6. Kryt. 8 rundy 1: battle-roster 7/7,
   battle-summary OK, battle-hp-display 7/7, teren-walki-etapy 33/33,
   army-hunger-combat 13/13. **Żadna istniejąca bramka nie wymagała aktualizacji
   zaszytych wartości** — klamp nie rusza tabeli.
7. **MUTACJA — bramka CZERWIENIEJE po cofnięciu SAMEGO klampu.** Podmiana ciała pętli
   na `u.morale = Math.max(0, ukarane)` (epsilon i `fleeMorale` zbyte przez `void`,
   reszta pliku bez zmian): **113/123, exit=1**, 10 FAIL, w tym dosłownie
   `lamia to: Wojownik (mb=50/fm=22 -> 18); Łucznik (mb=40/fm=25 -> 14);
   Zwiadowca (mb=30/fm=25 -> 11); Wojownik z mieczem i tarczą (mb=60/fm=22 -> 21)`.
   Źródło przywrócone z kopii, po przywróceniu 123/123 exit=0.

Dodatkowo: przestrojenie `epsilonPonadFlee` na 7 przesuwa podłogę na 29 — dowód, że
parametr jest faktycznie czytany, a nie zaszyty.

## BLOKADY

`map-field-battle-test.cjs` — exit 1, `TypeError: import_meta.glob is not a function`.
Znana INFRA, czerwona na czystej bazie, potwierdzona przez trzy role w rundzie 1.
Nie defekt tej pracy, osobny temat.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (Sonnet 5, effort high) → `05-evaluator-runda2.md`
DEPLOY/PUSH: NIE WYKONANO
