# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-PRACA-JEDEN-PODZIAL-Q1`
GOAL: **Jeden** podział Pracy budynki/ulepszenia, sumujący się do 100%, stosowany
**dokładnie raz**, z capem ulepszeń ≤50%. Identyczny mechanizm globalnie (menu Pracy)
i w mieście. Usunięcie drugiego, zdublowanego dzielenia tej samej puli. Nazwy w kodzie
i UI muszą opisywać to, czym rzeczy naprawdę są.

## Wyzwalacz — ECHO właściciela (2026-08-25, główny czat orkiestratora)

Właściciel po ośmiu falach nawrotów w tym obszarze (292, 293, 301, 302, 310, 317, 318, 319):

> „to jest podział pracy pomiędzy budynki i ulepszenia i on ma być dla ulepszeń
> zablokowany na maks 50% dla ulepszeń a reszta dla budynków czyli np 50/50 albo
> 30 ulepszenia to 70% budynki ale nigdy w drugą stronę"

> „to są jakieś nielogiczne bzdury, zawsze musi się sumować do 100% nie może być 100 i 50"

> „idziemy w b / nazwy określamy tak jak powinny wyglądać żeby nie były mylące na
> przyszłość oraz usuwamy duplikaty tego co się liczy niepotrzebnie dwa razy"

## DOWÓD POMIAROWY — dlaczego to nie jest kosmetyka (zmierzone przez orkiestratora)

Ślad na prawdziwych funkcjach (`splitPraca` + `splitEmpirePracaBudget`), 10 Pracy w mieście:

| miasto % budynki / imperium % ulepszenia | warstwa 1 | warstwa 2 | **ulepszenia realnie** |
|---|---|---|---|
| **70 / 33 (DOMYŚLNE W GRZE)** | 7 bud., 3 do puli | z 3 → **0** ulep., 3 bud. | **0,0%** |
| 50 / 50 (maksimum suwaków) | 5 bud., 5 do puli | z 5 → 2 ulep., 3 bud. | 20,0% |
| 50 / 33 | 5 bud., 5 do puli | z 5 → 1 ulep., 4 bud. | 10,0% |
| 100 / 50 | 10 bud., 0 do puli | 0 | 0,0% |

**Na domyślnych ustawieniach ulepszenia terenu dostają ZERO Pracy** (`floor(3 × 33%) = 0`).
Przy maksymalnych suwakach nie da się przekroczyć ~20–25%, mimo że UI obiecuje 50%.

## ROZJAZD NAZW — root cause (zmierzony, `P-PRACA-WARSTWY-NAZWY-ROZJAZD-Q1`)

`gra/src/ui/cityPanel.ts:1314-1319` zwraca `doUlepszen: Math.round(doPuli)` — zmienna
nazwana „doUlepszen" niesie `doPuli`, czyli udział trafiający do OGÓLNEJ puli imperium
(finansującej też cuda, zakładanie miast, budżet budynków imperium, leczenie HP), a nie
budżet ulepszeń. Ta sama liczba ma w jednym pliku cztery nazwy: „Ulepszenia" (`:4783`),
„→ Pula Pracy imperium" (`:4723`), „→ Pula imperium — zapas cywilizacji" (`:5539`),
„`doUlepszen` (pula imperium)" (`:9948`). Kolizja z `production.ts`, gdzie
`splitEmpirePracaBudget().doUlepszen` NAPRAWDĘ oznacza ulepszenia. Każdy kolejny
wykonawca czytał nazwę i powtarzał ten sam błąd — stąd osiem nawrotów.

## KONTRAKT DOCELOWY (literalne wymagania właściciela — nie interpretować twórczo)

1. **Jeden podział**, sumujący się do 100%: `ulepszenia% + budynki% = 100`. Nie wolno
   zostawić dwóch niezależnych suwaków, które można ustawić na „100 i 50".
2. **Cap: ulepszenia ≤ 50%**, budynki ≥ 50%. Dozwolone 50/50, 30/70, 0/100.
   **Nigdy odwrotnie** (60/40 na korzyść ulepszeń jest niedozwolone).
3. **Stosowany dokładnie RAZ.** Ustawienie X% na ulepszenia → do ulepszeń trafia X%
   Pracy. Bez mnożenia warstw, bez drugiego odcinania na budynki.
4. **Identyczny mechanizm globalnie i w mieście** (ten sam kontrakt, ten sam cap,
   ta sama jednostka miary).
5. **Zasada override w mieście** (nowe wymaganie właściciela): miasto domyślnie
   dziedziczy podział globalny. Wybrany wariant: **suwak miasta NIE jest zablokowany,
   ale w chwili gdy lokalna wartość różni się od globalnej, przycisk „Indywidualne"
   włącza się SAM** (bez osobnego kliknięcia). Powrót do wartości globalnej = override
   gaśnie. Operator MA to zaimplementować w tym wariancie; jeśli pomiar wykaże, że
   koliduje to z istniejącym `podzialPracyOverride`, zgłosić jawnie, nie improwizować.
6. **Nazwy — obowiązkowo.** Żadna nazwa nie może opisywać czegoś innego niż niesie.
   W szczególności zlikwidować `doUlepszen` = `doPuli` w `cityPanel.ts`. Nazwy mają
   być jednoznaczne również dla przyszłego czytelnika (to jest jawne wymaganie
   właściciela, nie kosmetyka).
7. **Usunąć duplikat obliczeń** — to, co dziś liczy się dwa razy (`splitPraca`
   + `splitEmpirePracaBudget` na tej samej Pracy), ma się liczyć raz.
8. **Pozostali konsumenci puli imperium** (cuda `wonder-map-build.ts`, zakładanie
   miast, `applyEmpireBuildingBudget`, leczenie HP `manpower.ts`) NIE mogą po cichu
   zjadać budżetu ulepszeń ani przestać działać. Operator ma je zinwentaryzować
   PRZED zmianą i jawnie opisać, skąd biorą Pracę po przebudowie. To jest najbardziej
   ryzykowna część tematu — tu jest miejsce na `BLOCK`, jeśli kontrakt właściciela
   okaże się sprzeczny z którymś z nich.

## Izolacja

Gałąź `autobot/R-PRACA-JEDEN-PODZIAL-Q1` od `origin/main`, osobny worktree per rola.

## Allowlista

- `gra/src/game/production.ts` — `splitPraca`, `splitEmpirePracaBudget`, `applyEmpireBuildingBudget`.
- `gra/src/game/cities.ts` — stałe i clampy podziału Pracy.
- `gra/src/game/empire-city-defaults.ts` — resolver/migracja podziału.
- `gra/src/game/turn-economy.ts` — miejsca konsumujące split (2092, 2656).
- `gra/src/main.ts` — WYŁĄCZNIE miejsca wołające powyższe (ok. 26981, 27003) + wiring UI.
- `gra/src/ui/cityPanel.ts`, `gra/src/ui/empireDetailPanel.ts`, `gra/src/ui/buildModeHud.ts` — UI podziału.
- `gra/src/game/ai.ts` — WYŁĄCZNIE jeśli parytet AI tego wymaga (ai-praca-split-parity-test musi zostać zielony).
- `gra/tools/*` — nowy test kontraktu + aktualizacja istniejących bramek Pracy.

NIE ruszać: `gra/data/**` (w tym `units.json`), `dyspozycje/WERSJE.md`, budżetu automatu
ulepszeń (`pracaAutoPercent`/`ulepszeniaPracaPercent`, zakres 0–100%, warstwa 3) —
to ODRĘBNE pole, którego ten temat NIE dotyczy (patrz `P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1`,
gdzie mylne złączenie go z capem 50% było właśnie regresem).

## Kryteria sukcesu

1. **Test kontraktu (bramka tematu):** dla SIATKI wartości (0, 10, 20, 30, 40, 50%
   ulepszeń) i kilku wielkości Pracy miasta: ustawienie X% → do ulepszeń trafia
   dokładnie X% Pracy (z jawnie udokumentowaną regułą zaokrąglenia). Suma
   ulepszenia+budynki = 100% Pracy, zawsze, bez gubienia reszty.
2. Ustawienie >50% na ulepszenia jest nieosiągalne — ani suwakiem, ani przez zapis,
   ani przez override miasta.
3. Zasada override z pkt. 5 działa i jest pokryta testem.
4. Zero podwójnego liczenia — udowodnione (nie zadeklarowane).
5. Konsumenci puli z pkt. 8 działają dalej — potwierdzone testem/pomiarem.
6. Zero regresji: 8 bramek Pracy (`praca-limit-50`, `praca-miasto-limit-50`,
   `praca-miasto-limit-50-cap`, `ulepszenia-praca-percent`, `praca-split-ui`,
   `praca-pula-rate-parity`, `praca-global-default-live`, `ai-praca-split-parity`),
   `praca-cap-migracja-luka` oraz 5 bramek referencyjnych — zielone. Testy, które
   przypinały STARY, zdublowany kontrakt, wolno zaktualizować, ale KAŻDĄ taką zmianę
   trzeba jawnie uzasadnić w raporcie (co pilnowała, dlaczego stary warunek przestał
   być prawdą, co pilnuje teraz) — bez cichego rozluźniania asercji.
7. `tsc --noEmit` i `vite build` (C-001) czyste.
8. Real render Playwright/Chromium dla zmienionego UI + dowód nietautologiczności
   (mutacja pojedyncza per asercja).

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna gałąź.
Limit 5 rund. Model/effort: Opus 5 High dla Operatora i Evaluatora (temat dotyka
ekonomii i UI naraz), Final Control Sonnet 5 High. `opts.model` jawnie na KAŻDYM
wywołaniu `agent()` (C-062).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–8 wyżej.
BLOKADY: brak (pkt. 8 jest jawnym miejscem na BLOCK, jeśli kontrakt koliduje z konsumentami puli).
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
