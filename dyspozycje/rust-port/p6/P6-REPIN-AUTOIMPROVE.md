# P6-REPIN-AUTOIMPROVE — repin auto-ulepszeń terenu (Rust) do weba

TEMAT: R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1
STATUS dokumentu: runda 1/5 po obronie Operatora (poprawka pinu, ponowny pomiar, tabela hunk po hunku, mapowanie terenu). Kodu portu jeszcze NIE zmieniono. Poprzednia wersja (`bda98c616`) miała błędny pin Rust i pomiar względem złej bazy; korekty opisane w sekcji 7.

## 1. Piny i bazy

| Rola | Pin / SHA | Uwagi |
|---|---|---|
| Pin Rust (OPERATYWNY) | `23dd158e9` | Ustalony przez REPIN-DELTA-4 (cel tamtego tematu: `4bbef081d -> 23dd158e9`, `git show 783c6b766:dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/01-operator-r1.md`, linia 4). Dowody w kodzie: `rust-port/engine/src/domain/auto_improvements/city_phases.rs:113` (`REPIN-DELTA-4 hunk auto-improvements.ts:1671`), `auto_improvements/single_pass.rs:46` (freshwater), `dyspozycje/.../gen-m09-vectors.mjs:56` (pin 23dd158e9). Final Control DELTA-4: `403afade1` (PASS-WITH-NOTES). |
| Pin historyczny | `4bbef081d` | Baza DELTA-4 (przed repinem). NIE jest pinem operatywnym Rust. Nagłówki `auto_improvements/pick.rs:1` (4bbef081d) i `relief_preserving.rs:1` (91dc998a) są nieaktualne. |
| Pin weba (cel repinu) | `16c0509f6` (`origin/main` w chwili startu) | ZAŁOŻENIE zgodne z dispatch: pin = `origin/main` w chwili startu. |
| Baza Rust | `783c6b766` (`origin/rust-port/parity-v2`) | warunek `>= 783c6b766` spełniony |
| Baza weba | `origin/main` >= `bd5386c8b` | warunek spełniony |

Historia zmian webu w zakresie tematu (zmierzone `git log`, dotyczy 5 plików `gra/src/game/{auto-improvements,terrain-improvements,relief-preserving-improvements,road-network-plan,auto-build-gate}.ts`):
- `23dd158e9..16c0509f6`: 29 commitów (zakres portu, Z-1).
- `4bbef081d..16c0509f6`: 38 commitów (zakres, który był błędnie mierzony w r1).

Worktree tematu: `/home/user/The-Game/.claude/worktrees/wf_f60b9ec2-194-1`. Gałąź obrony: `op-repin-autoimpr-r1-obrona` (od `bda98c616`).

## 2. Hunki webu: pin Rust `23dd158e9` -> `origin/main` `16c0509f6` (zmierzone ponownie, `git diff -U0`)

| Plik | Hunki | Linie nowe (zakres) | Uwagi |
|---|---|---|---|
| `gra/src/game/auto-improvements.ts` | **83** | 13–2228 | szczegóły w tabeli 2c (hunki 1–83) |
| `gra/src/game/terrain-improvements.ts` | **15** | 125–425 | mapowanie na Rust w tabeli 2c (hunki 86–100) |
| `gra/src/game/relief-preserving-improvements.ts` | **2** | 9–27 | hunki 84–85 |
| `gra/src/game/road-network-plan.ts` | plik NOWY (+284) | 1–284 | `planRoadNetwork`, `MinHeap`, `COST_*`, `NEAREST_K=5` |
| `gra/src/game/auto-build-gate.ts` | plik NOWY (+48) | 1–48 | `AUTO_BUILD_ENABLED_DEFAULT=false`, `isAutoBuildAllowedForOwner`, `autoBuildFromSaveMeta`, `autoBuildFromNewGameParam` |

Suma: **100 hunków** w 3 zmienionych plikach + 2 pliki nowe. `git diff --stat 23dd158e9 16c0509f6` dla 5 plików: **+771 / −192**.

Pomiar na błędnej bazie `4bbef081d` (r1, zachowany dla porównania; arytmetycznie poprawny dla tej bazy): 109 hunków `auto-improvements.ts`, 15 `terrain`, 2 `relief`, +1022/−210. Różnica to zmiany już zaportowane w DELTA-4 (np. `onRiverHex`, freshwater, stadnina/konie), więc nie są zakresem r2.

### 2a. Symbole `auto-improvements.ts` (nowa wersja, zakres linii -> zmiana)

- L13–14: komentarz nagłówka (#10, 2026-11-03).
- L188: `ZERO_YIELD_IMPROVEMENTS` (komentarz; usunięty pułap `defenseCap`).
- L200–219: nowe stałe `RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=2`, `RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR=60`, `AI_RIVER_CLEAR_NO_CITIZEN_MAX_PER_CITY=1`, `AI_RIVER_CLEAR_NO_CITIZEN_POOL_FLOOR=60`.
- L261–266: `AutoImprovementSurplusReport.filterWaitingKeys` (nowe pole).
- L271–293: `freshSurplusReport()` oraz nowa funkcja `unspentBudgetWarning()` (wskaźnik UI; poza zakresem portu, patrz 6.4).
- L339–520: `PickAutoImprovementsOpts` — usunięte `maxItemsPerCity`, `getOnlyWorked`, `getResourcePassOnlyWorked`, `farmPriorityOnlyWorked`, `getSkipWyrab`, `skipWyrab` (produkcja); dodane `roadPlanMemo`, `riverClearNoCitizenPass`, `riverClearNoCitizenMaxPerCity`, `riverClearNoCitizenPoolFloor`.
- L540: usunięte `FOOD_STAGE_MAX_ITEMS_PER_CITY` (była `Infinity`).
- L603–616: nowy zbiór `FOOD_IMPROVEMENT_KEYS` = farma, irygacja, tarasy, bydlo, owce, lama, lodzie_rybackie, warzelnia_soli, wyrab (obok `IMPROVEMENT_FOR_DEFICIT`, którego ciało nie zmieniono).
- L671: `FortClaimArgs` bez `maxItemsPerCity`.
- L842–896: `pickAutoImprovements` (wrapper z `roadPlanMemo`), `roadPlanHexes()`, `ROAD_PLAN_CACHE`.
- L902–1182: `pickAutoImprovementsStaged` — nowy KROK 0 (wycinka rzeczna przed E1–E6, L951–972), `riverClearSpent`, nowy KROK 7 (wycinka rzeczna bez obywatela, L1151–1182).
- L1215–2228: `pickAutoImprovementsSinglePass` — `isRiverNoCitizenClearHex`, `fortHorseExtra`, `foodWorkedKeys` (zamiast `workedKeys`), `hexAllowsKey` z nową regułą, usunięty licznik `placedThisCity`/`defenseCap`, `wyrabTylkoPodFarme = true`, sekcja raportu `filterWaitingKeys` (L2210–2228).

### 2b. Pliki nowe (poza tabelą hunków)

- `road-network-plan.ts` (284 linie): plan sieci dróg MIĘDZY miastami (MST po długości ścieżki). Rust: brak `plan_road_network` (`git grep` pusty) — DO PORTU.
- `auto-build-gate.ts` (48 linii): bramka „Automatyzacja budowy” (domyślnie WYŁĄCZONA, tylko gracz). Rust: brak odpowiednika w `auto_improvements*`. ZAŁOŻENIE r1: bramka AUTOBUILD leży POZA allowlistą tematu (`auto_improvements/**`, `roads.rs`, `data/**`); jej port wymaga decyzji orkiestratora (osobny temat albo rozszerzenie allowlisty). Nie jest liczona w r2 bez tej decyzji.

### 2c. Tabela hunk po hunku (plik:linia nowa; zmierzone `git diff -U0 23dd158e9 16c0509f6`)

Legenda kodów: **K** komentarz/dokumentacja (BEZ PORTU); **I** import wiążący z hunkiem innego kodu; **LIM** zdjęty limit sztuk/miasto i `defenseCap`; **PRZ** usunięte przełączniki `onlyWorked`/`skipWyrab`; **REG** reguła żywności tylko przy obywatelach (bez wyjątków); **RZ** wycinka rzeczna bez obywatela (limit 2/1, podłoga Pracy 60) i krok 0 przed E1–E6; **DRG** plan dróg MST; **FW** złoże konia (`zloze==='konie'`) i stadnina z koła fortu; **RIV** wspólna definicja `isHexNearRiver`; **SUR** raport nadwyżki + `filterWaitingKeys`; **ERA** +1 plonu za epokę ponad Kamień; **SUR5** ×1,5 za epokę dla każdego surowca terytorium; **REL** relief obozu łowieckiego; **PERF** optymalizacja JS bez zmiany semantyki.

Dowody po stronie Rust (grep na `783c6b766`): `auto_improvements/pick.rs:88,102-103,127-128`; `auto_improvements/opts.rs:37,90,95,114-118`; `auto_improvements/city_phases.rs:105,113,189,242,247-251,335`; `auto_improvements/hex_phases.rs:107,134,172,293,305,319,423`; `auto_improvements.rs:72-84` (lista żywności z `oboz_lowiecki`); `relief_preserving.rs:9-26`; `domain/improvements.rs:830,844,859`; `domain/resource_production.rs:102,147`; `domain/improvement_build.rs:673,791`; `resource_access/active_access.rs:353`.

Uwaga: kolumna „status” w tej tabeli jest KLASYFIKACJĄ KODU WEBA (co zmieniono i czy Rust ma to zachowanie). Weryfikacja wektorami/testami jest w r2.

| # | plik | linia (nowa; "usuniecie N" = N linii usunietych) | kontekst (symbol) | kod | status | zakres / dowod Rust |
|---|---|---|---|---|---|---|
| 1 | auto-improvements.ts | 13-14 | - | K | BEZ PORTU | komentarz/dokumentacja |
| 2 | auto-improvements.ts | 27 (usuniecie 1) | import { | I | PORT (import) | import wiazany z hunkiem innego kodu |
| 3 | auto-improvements.ts | 31 | import { | RIV | ZGODNY wg komentarza weba (test r2) | wspolna definicja isHexNearRiver = dawne hasRiverAccess||sasiad (komentarz webu, bez zmiany semantyki); Rust: onRiverHex city_phases.rs:113 (DELTA-4); brak symbolu is_hex_near_river (grep pusty) |
| 4 | auto-improvements.ts | 34 | import { hexKeysWithinRadius } from './okolica'; | DRG | DO PORTU | plan drog MST (planRoadNetwork, road-network-plan.ts NOWY); Rust: brak plan_road_network (grep pusty) |
| 5 | auto-improvements.ts | 36 | import { getImprovementMeta, isImprovementTechUnlocked  | I | PORT (import) | import wiazany z hunkiem innego kodu |
| 6 | auto-improvements.ts | 48 (usuniecie 1) | export interface AutoImprovementCity { | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 7 | auto-improvements.ts | 188-189 | export const ZERO_YIELD_IMPROVEMENTS: ReadonlySet<Impro | K | BEZ PORTU | komentarz/dokumentacja |
| 8 | auto-improvements.ts | 200-219 | export const WYRAB_MIN_FOREST_IN_RADIUS = 3; | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 9 | auto-improvements.ts | 261-266 | export interface AutoImprovementSurplusReport { | SUR | DO PORTU | raport nadwyzki + filterWaitingKeys (wskaznik UI poza zakresem); Rust: hex_phases.rs:172,305,423 bez filterWaitingKeys |
| 10 | auto-improvements.ts | 271-293 | export function freshSurplusReport(): AutoImprovementSu | SUR | DO PORTU | raport nadwyzki + filterWaitingKeys (wskaznik UI poza zakresem); Rust: hex_phases.rs:172,305,423 bez filterWaitingKeys |
| 11 | auto-improvements.ts | 339-342 | export interface PickAutoImprovementsOpts { | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 12 | auto-improvements.ts | 354 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 13 | auto-improvements.ts | 360 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 14 | auto-improvements.ts | 369-370 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 15 | auto-improvements.ts | 374-375 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 16 | auto-improvements.ts | 430 (usuniecie 16) | export interface PickAutoImprovementsOpts { | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 17 | auto-improvements.ts | 431 (usuniecie 1) | export interface PickAutoImprovementsOpts { | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 18 | auto-improvements.ts | 433-435 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 19 | auto-improvements.ts | 437 | export interface PickAutoImprovementsOpts { | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 20 | auto-improvements.ts | 474-479 | export interface PickAutoImprovementsOpts { | DRG | DO PORTU | plan drog MST (planRoadNetwork, road-network-plan.ts NOWY); Rust: brak plan_road_network (grep pusty) |
| 21 | auto-improvements.ts | 490-498 | export interface PickAutoImprovementsOpts { | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 22 | auto-improvements.ts | 504 (usuniecie 10) | export interface PickAutoImprovementsOpts { | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 23 | auto-improvements.ts | 519-520 | export interface PickAutoImprovementsOpts { | K | BEZ PORTU | komentarz/dokumentacja |
| 24 | auto-improvements.ts | 540 (usuniecie 12) | const FOOD_LIVESTOCK_STAGE_KEYS: readonly ImprovementKe | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 25 | auto-improvements.ts | 603-616 | export const IMPROVEMENT_FOR_DEFICIT: Readonly<Record<s | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 26 | auto-improvements.ts | 671 (usuniecie 1) | interface FortClaimArgs { | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 27 | auto-improvements.ts | 842-896 | export function pickAutoImprovements(opts: PickAutoImpr | DRG | DO PORTU | plan drog MST (planRoadNetwork, road-network-plan.ts NOWY); Rust: brak plan_road_network (grep pusty) |
| 28 | auto-improvements.ts | 902 (usuniecie 2) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 29 | auto-improvements.ts | 943 (usuniecie 2) | export function pickAutoImprovements(opts: PickAutoImpr | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 30 | auto-improvements.ts | 951-972 | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 31 | auto-improvements.ts | 978 | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 32 | auto-improvements.ts | 984 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 33 | auto-improvements.ts | 1002 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 34 | auto-improvements.ts | 1012 | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 35 | auto-improvements.ts | 1032 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 36 | auto-improvements.ts | 1051 | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 37 | auto-improvements.ts | 1059 (usuniecie 2) | export function pickAutoImprovements(opts: PickAutoImpr | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 38 | auto-improvements.ts | 1066 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 39 | auto-improvements.ts | 1100 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 40 | auto-improvements.ts | 1142 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 41 | auto-improvements.ts | 1148 (usuniecie 1) | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 42 | auto-improvements.ts | 1151-1182 | export function pickAutoImprovements(opts: PickAutoImpr | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 43 | auto-improvements.ts | 1215 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 44 | auto-improvements.ts | 1218 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 45 | auto-improvements.ts | 1220 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 46 | auto-improvements.ts | 1235 | function pickAutoImprovementsSinglePass(opts: PickAutoI | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 47 | auto-improvements.ts | 1392-1402 | function pickAutoImprovementsSinglePass(opts: PickAutoI | RIV | ZGODNY wg komentarza weba (test r2) | wspolna definicja isHexNearRiver = dawne hasRiverAccess||sasiad (komentarz webu, bez zmiany semantyki); Rust: onRiverHex city_phases.rs:113 (DELTA-4); brak symbolu is_hex_near_river (grep pusty) |
| 48 | auto-improvements.ts | 1421 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 49 | auto-improvements.ts | 1457-1461 | function pickAutoImprovementsSinglePass(opts: PickAutoI | PRZ | DO PORTU | usuniete przelaczniki onlyWorked/skipWyrab/getSkipWyrab; Rust: opts.rs:37,90,115-118; pick.rs:102-103; city_phases.rs:247-251 |
| 50 | auto-improvements.ts | 1476-1483 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 51 | auto-improvements.ts | 1534-1537 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 52 | auto-improvements.ts | 1539-1570 | function pickAutoImprovementsSinglePass(opts: PickAutoI | FW | DO PORTU | zloze konia: zloze==="konie" (stare zapisy) i stadnina z kola fortu; Rust: improvement_build.rs:673,791 tylko Overlay::ZlozeKonia |
| 53 | auto-improvements.ts | 1572-1580 | function pickAutoImprovementsSinglePass(opts: PickAutoI | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 54 | auto-improvements.ts | 1582-1593 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 55 | auto-improvements.ts | 1605-1607 | function pickAutoImprovementsSinglePass(opts: PickAutoI | FW | DO PORTU | zloze konia: zloze==="konie" (stare zapisy) i stadnina z kola fortu; Rust: improvement_build.rs:673,791 tylko Overlay::ZlozeKonia |
| 56 | auto-improvements.ts | 1609 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 57 | auto-improvements.ts | 1613 (usuniecie 2) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 58 | auto-improvements.ts | 1627 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 59 | auto-improvements.ts | 1681-1685 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 60 | auto-improvements.ts | 1691 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 61 | auto-improvements.ts | 1700 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 62 | auto-improvements.ts | 1704 | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 63 | auto-improvements.ts | 1709 (usuniecie 6) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 64 | auto-improvements.ts | 1710 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 65 | auto-improvements.ts | 1735 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 66 | auto-improvements.ts | 1736 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 67 | auto-improvements.ts | 1750 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 68 | auto-improvements.ts | 1764 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 69 | auto-improvements.ts | 1813-1815 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 70 | auto-improvements.ts | 1819-1823 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 71 | auto-improvements.ts | 1949-1956 | function pickAutoImprovementsSinglePass(opts: PickAutoI | DRG | DO PORTU | plan drog MST (planRoadNetwork, road-network-plan.ts NOWY); Rust: brak plan_road_network (grep pusty) |
| 72 | auto-improvements.ts | 1998 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 73 | auto-improvements.ts | 2017-2018 | function pickAutoImprovementsSinglePass(opts: PickAutoI | REG | DO PORTU | regula zywnosci tylko przy obywatelach (FOOD_IMPROVEMENT_KEYS, bez wyjatkow); Rust: auto_improvements.rs:72-84 (lista z oboz_lowiecki), city_phases.rs:242, :335 |
| 74 | auto-improvements.ts | 2036 | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 75 | auto-improvements.ts | 2071 | function pickAutoImprovementsSinglePass(opts: PickAutoI | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 76 | auto-improvements.ts | 2073 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 77 | auto-improvements.ts | 2081 | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 78 | auto-improvements.ts | 2124 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 79 | auto-improvements.ts | 2155 | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 80 | auto-improvements.ts | 2167 | function pickAutoImprovementsSinglePass(opts: PickAutoI | K | BEZ PORTU | komentarz/dokumentacja |
| 81 | auto-improvements.ts | 2172 | function pickAutoImprovementsSinglePass(opts: PickAutoI | RZ | DO PORTU | wycinka rzeczna bez obywatela (limit 2/1, podloga 60) + krok 0 przed E1-E6; Rust: brak riverClearNoCitizen; krok 0 tylko czesciowo hex_phases.rs:293 |
| 82 | auto-improvements.ts | 2174 (usuniecie 1) | function pickAutoImprovementsSinglePass(opts: PickAutoI | LIM | DO PORTU | zdjety limit sztuk/miasto i pulap defenseCap; Rust: pick.rs:88,127-128; opts.rs:95; hex_phases.rs:107,134 |
| 83 | auto-improvements.ts | 2210-2228 | function pickAutoImprovementsSinglePass(opts: PickAutoI | SUR | DO PORTU | raport nadwyzki + filterWaitingKeys (wskaznik UI poza zakresem); Rust: hex_phases.rs:172,305,423 bez filterWaitingKeys |
| 84 | relief-preserving.ts | 9-13 | - | K | BEZ PORTU | komentarz/dokumentacja |
| 85 | relief-preserving.ts | 27 | - | REL | DO PORTU | obóz łowiecki zachowuje relief wzgorza (PRESERVES_HILL_RELIEF_EXPLICIT_KEYS); Rust: relief_preserving.rs:9 (5 kluczy, brak oboz_lowiecki) |
| 86 | terrain-improvements.ts | 125-149 | export function normalizeImprovementKey(raw: string / u | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 87 | terrain-improvements.ts | 152-157 | export function improvementBonusForKey(key: string): Im | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 88 | terrain-improvements.ts | 161 | export function improvementBonusForKey(key: string): Im | K | BEZ PORTU | komentarz/dokumentacja |
| 89 | terrain-improvements.ts | 164-168 | export function improvementBonusForKey(key: string): Im | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 90 | terrain-improvements.ts | 170-177 | export function applyImprovementBonus(yld: TileYield, i | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 91 | terrain-improvements.ts | 219-223 | export function oreYieldFromImprovements( | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 92 | terrain-improvements.ts | 225 | export function applyImprovementBonuses(yld: TileYield, | ERA | DO PORTU | +1 plon za epoke ponad Kamien (dla Zyw/Pra/Han/Pien, baza > 0); Rust: improvements.rs:830,844,859 bez parametru era |
| 93 | terrain-improvements.ts | 270-275 | const TERRITORY_YIELD_IMPROVEMENTS: ReadonlySet<string> | SUR5 | DO PORTU | x1,5 za epoke dla KAZDEGO surowca terytorium (w tym zloto, konie, sol); Rust: resource_production.rs:102 skaluje tylko tartak/kamieniolom |
| 94 | terrain-improvements.ts | 323-325 | export function territoryResourceYieldForImprovement( | SUR5 | DO PORTU | x1,5 za epoke dla KAZDEGO surowca terytorium (w tym zloto, konie, sol); Rust: resource_production.rs:102 skaluje tylko tartak/kamieniolom |
| 95 | terrain-improvements.ts | 327-328 | export function territoryResourceYieldForImprovement( | SUR5 | DO PORTU | x1,5 za epoke dla KAZDEGO surowca terytorium (w tym zloto, konie, sol); Rust: resource_production.rs:102 skaluje tylko tartak/kamieniolom |
| 96 | terrain-improvements.ts | 334 | export function territoryResourceYieldForImprovement( | SUR5 | DO PORTU | x1,5 za epoke dla KAZDEGO surowca terytorium (w tym zloto, konie, sol); Rust: resource_production.rs:102 skaluje tylko tartak/kamieniolom |
| 97 | terrain-improvements.ts | 343 | export function territoryResourceYieldForImprovement( | SUR5 | DO PORTU | x1,5 za epoke dla KAZDEGO surowca terytorium (w tym zloto, konie, sol); Rust: resource_production.rs:102 skaluje tylko tartak/kamieniolom |
| 98 | terrain-improvements.ts | 365-370 | export function improvementKeysForHex( | PERF | BEZ PORTU | szybka sciezka JS (R6), bez zmiany semantyki; Rust bez potrzeby |
| 99 | terrain-improvements.ts | 394-403 | export function hexHasCoveringTerrainImprovement( | FW | DO PORTU | zloze konia: zloze==="konie" (stare zapisy) i stadnina z kola fortu; Rust: improvement_build.rs:673,791 tylko Overlay::ZlozeKonia |
| 100 | terrain-improvements.ts | 425 | export function improvementHidesDepositOnHex( | FW | DO PORTU | zloze konia: zloze==="konie" (stare zapisy) i stadnina z kola fortu; Rust: improvement_build.rs:673,791 tylko Overlay::ZlozeKonia |

## 3. Tabela symboli: web ↔ Rust (pin `23dd158e9`, status po obronie r1)

Status: ZGODNY (zachowanie zgodne wg kodu/komentarza, bez hunka), ZMIANA (web zmienił zachowanie, Rust nie), PORT (brak odpowiednika w Rust), NIE_ZMIERZONO (nie porównano w r1).

| Web (TS) | Rust (`rust-port/engine/src/domain/`) | Status | Dowód |
|---|---|---|---|
| `ULEPSZENIA_FOOD_ONLY_ZROWNOWAZONE` / `ULEPSZENIA_ZYWNOSCIOWE` -> `FOOD_IMPROVEMENT_KEYS` | `auto_improvements.rs:72-84`, użycie `auto_improvements/city_phases.rs:242` | ZMIANA | Zbiór różny: web 9 kluczy (z `wyrab`, bez `oboz_lowiecki`), Rust 8 kluczy (z `oboz_lowiecki`, `auto_improvements.rs:80`). Plus web usunął przełącznik (`city_phases.rs:247-251`). |
| `FOOD_STAGE_MAX_ITEMS_PER_CITY` (= Infinity) | `auto_improvements.rs:114-115`, `pick.rs:127-128` | ZMIANA (usunięcie API) | Rust ma tę samą wartość `f64::INFINITY`; semantycznie równoważne, ale API i ścieżki kodu różne. |
| `pickAutoImprovements` | `auto_improvements/pick.rs:111` | ZMIANA | Nowe: `roadPlanMemo`, KROK 0, KROK 7; usunięty `maxItems`. Produkcyjny wywołujący — poza zakresem (dług P7). |
| `pickAutoImprovementsStaged` | `auto_improvements/hex_phases.rs:319` (`step0_applies`), `city_phases.rs:105` (`river_krok0_ok`) | ZMIANA | Web: KROK 0 wycinki rzecznej przed E1–E6 z `riverClearSpent`; Rust ma krok 0 tylko częściowo. |
| `pickAutoImprovementsSinglePass` | `auto_improvements/single_pass.rs:152` | ZMIANA | LIM, PRZ, REG, RZ, RIV, FW (tabela 2c). |
| `freshSurplusReport` + pole `filterWaitingKeys` | `auto_improvements.rs:237` `fresh_surplus_report`; użycie `hex_phases.rs:172,305,423` | ZMIANA | Brak `filterWaitingKeys` w Rust. |
| `unspentBudgetWarning` | brak | POZA ZAKRESEM | Wskaźnik UI (renderer); allowlista nie obejmuje rendererów. |
| `pickFortClaims` / `FortClaimArgs` | `auto_improvements/fort_claim.rs:37`, `:49` | ZMIANA | `maxItemsPerCity` usunięte z `FortClaimArgs` (hunk 26). |
| `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` (relief-preserving) | `auto_improvements/relief_preserving.rs:9`, `:17`, `:25` | ZMIANA | Rust: 5 kluczy, brak `oboz_lowiecki`. Nagłówek pliku (pin 91dc998a) nieaktualny. |
| `improvementBonusForKey`, `applyImprovementBonus(es)` | `domain/improvements.rs:830`, `:844`, `:859` | ZMIANA | Web: parametr `era` (+1 za epokę ponad Kamień); Rust bez `era`. |
| `territoryResourceYieldForImprovement` (`ERA_SCALED_RESOURCE_IMPROVEMENTS` = wszystkie) | `domain/resource_production.rs:102` (`resource_production_amount_for_era`), `:147` | ZMIANA | Web: ×1,5 za epokę dla każdego surowca terytorium (w tym złoto, konie, sól); Rust: tylko `tartak`/`kamieniolom`. Zaokrąglenie: NIE_ZMIERZONO. |
| `hexHasHorseDeposit` / `improvementHidesDepositOnHex` | `domain/improvement_build.rs:673`, `:791`; `resource_access/active_access.rs:353` | ZMIANA | Rust: tylko `Overlay::ZlozeKonia`; brak legacy `zloze==='konie'`. |
| `isHexNearRiver` / `onRiverHex` | `auto_improvements/city_phases.rs:113` (DELTA-4) | ZGODNY (wg komentarza weba) | Web: semantyka identyczna z dawnym `hasRiverAccess || sąsiad`. Test równoważności w r2. |
| Reguła irygacji (nie po farmach/trzodzie) | `auto_improvements/opts.rs:114` (`irrigation_needs_farm`), `city_phases.rs:189` | ZGODNY w intencji | Brak hunka w tej części; test w r2. |
| `hasNonFoodResourceDeficit`, `actionableDeficitKeys`, `isCityLimitExhausted`, `prioritiesForUlepszeniaFocus`, `IMPROVEMENT_FOR_DEFICIT` (ciało) | `auto_improvements.rs:229`, `:276`, `:287`, `:242`, `:255` | NIE_ZMIERZONO (ciało bez hunka; tylko `IMPROVEMENT_FOR_DEFICIT` dostał obok `FOOD_IMPROVEMENT_KEYS`) | Potwierdzenie w r2. |
| `planRoadNetwork` (`road-network-plan.ts`, NOWY) | BRAK (`git grep plan_road_network` pusty) | PORT | Brak odpowiednika. |
| `auto-build-gate.ts` (NOWY) | BRAK w `auto_improvements*` | PORT (poza allowlistą) | Decyzja orkiestratora, patrz 2b. |
| `terrain-improvements.ts` (15 hunków) | patrz tabela 2c, hunki 86–100 | ZMIANA (mapowanie wykonane w r1) | Symbole Rust wskazane; zachowanie do portu w r2. |

## 4. Baseline bramek na `783c6b766` (przed zmianami)

Bez zmian względem r1 (kod Rust nie był zmieniany; commit obrony zmienia wyłącznie dokumenty `.md`).

Uruchomione w `rust-port/engine` z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`:

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --no-fail-fast`: pierwsze uruchomienie przerwane limitem 580 s (EXIT=124); reszta per binarka: 97 binarek (681 passed, 0 failed) plus `p6_m07a_cap` (1 passed). Łącznie 1440 + 681 + 1 = **2122 passed, 0 failed**, zgodnie z LEDGER 2026-11-03.

Surowe logi (poza repo): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/` (`fmt.log`, `clippy.log`, `test.log`, `rest.log`, `m07a.log`).

## 5. Zakres i zobowiązania (pozostałe rundy)

Wykonane w r1 (po obronie): pin (sekcja 1), ponowny pomiar hunków (sekcja 2), tabela hunk po hunku (2c), mapowanie terenu (2c, hunki 86–100), tabela symboli ze statusami (sekcja 3), baseline (sekcja 4).

Nie wykonane w r1 (przechodzi na r2–r3):
- port hunków `auto-improvements.ts` do `auto_improvements*` wg tabeli 2c (LIM, PRZ, REG, RZ, FW, SUR, ERA, SUR5, REL, DRG);
- weryfikacja statusów NIE_ZMIERZONO z sekcji 3 oraz równoważności RIV i irygacji testami;
- regeneracja wektorów z pinu `16c0509f6` (generator jak w 8I, `git archive 16c0509f6 gra/src gra/data` do `mktemp -d` poza repo);
- mutacje (cel ≥85% zabitych, reszta z dowodem równoważności) i testy `p6_repin_autoimpr_*`;
- port `road-network-plan.ts` (`planRoadNetwork`) — allowlista pozwala na `roads.rs` tylko jeśli hunk tego wymaga;
- decyzja orkiestratora o bramce AUTOBUILD (`auto-build-gate.ts`, poza allowlistą).

Jawnie poza zakresem (wg dispatch): produkcyjny wywołujący `pick_auto_improvements` (dług P7); wskaźnik UI `unspentBudgetWarning` (renderer).

## 6. Założenia po obronie r1

- 6.1 Pin Rust operatywny = `23dd158e9` (Z-1 przyjęte). Założenie `4bbef081d` odrzucone.
- 6.2 Pomiar względem `23dd158e9` (Z-2 przyjęte). Liczby 109 / 1022 / 210 dotyczą bazy historycznej.
- 6.3 Tabela hunków z kodami (Z-3 przyjęte, sekcja 2c). Kody to klasyfikacja zmiany webu; zachowanie Rust sprawdzane w r2.
- 6.4 Wskaźnik `unspentBudgetWarning` — POZA zakresem portu (renderer, nie `auto_improvements*`).
- 6.5 Bramka AUTOBUILD (`auto-build-gate.ts`) — poza allowlistą; decyzja orkiestratora.
- 6.6 `terrain-improvements.ts` zmapowany w r1 (Z-4 przyjęte).
- 6.7 Status rundy: patrz sekcja 7 (Z-5).

## 7. Odpowiedzi na zarzuty obrony (runda 1, werdykt zewnętrzny FAIL)

**Z-1 (pin Rust, `4bbef081d` błędny). PRZYJMUJĘ.** Dowody: `git log 783c6b766 --grep=DELTA-4` daje `039b91bc9` („port delty 23dd158e9”); `783c6b766:dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/01-operator-r1.md:4` (cel: `4bbef081d -> 23dd158e9`); `auto_improvements/city_phases.rs:113` i `single_pass.rs:46` (markery DELTA-4 w kodzie). Poprawka: sekcja 1 (pin operatywny `23dd158e9`). Z1 („nagłówek jest nieaktualny”) potwierdzone po `git log`: nagłówek `pick.rs:1` (4bbef081d) i `relief_preserving.rs:1` (91dc998a) są nieaktualne.

**Z-2 (pomiar zawyżony, baza 4bbef081d). PRZYJMUJĘ.** Dowody: `git diff -U0 23dd158e9 16c0509f6 -- gra/src/game/auto-improvements.ts | grep -c '^@@'` = 83; terrain = 15; relief = 2; `git diff --stat 23dd158e9 16c0509f6` (5 plików) = 771 insertions, 192 deletions. Poprawka: sekcja 2. Pomiar 4bbef081d zachowany jako historyczny.

**Z-3 (brak tabeli hunków plik:linia; brak mapowania na GOAL). PRZYJMUJĘ.** Poprawka: tabela 2c (100 wierszy, plik:linia nowa, kontekst, kod, status, dowód Rust). Mapowanie na GOAL: FOOD-ONLY-WORKED-HEXES i SIMPLE-FOOD-RULE -> REG (hunki 11, 25, 50, 54, 56, 69, 70, 72, 73; usunięcie przełączników -> PRZ, hunki 6, 17, 19, 22, 29, 37, 43, 45, 49); wycinka rzeczna z limitem 2/1, podłogą 60 i krokiem 0 -> RZ (8, 21, 30, 31, 34, 36, 41, 42, 46, 53, 75, 81); HILLS-CLEAR-REVERT -> REG (70: `wyrabTylkoPodFarme`/`isFarmBaseTerrain`; Rust już ma `is_farm_base_terrain` w `city_phases.rs:102`); obóz łowiecki a relief -> REL (85); AUTOBUILD -> `auto-build-gate.ts` (poza allowlistą, 6.5); drogi AI MST -> DRG (4, 20, 27, 71). Irygacja po farmach: `irrigation_needs_farm` w Rust (`opts.rs:114`), zgodność w r2. FOOD-ONLY-ZBIÓR: Rust i web różnią się (sekcja 3).

**Z-4 (terrain-improvements nie zmierzony; NIE_ZMIERZONO). PRZYJMUJĘ.** Poprawka: hunki 86–100 w tabeli 2c; statusy i symbole Rust w sekcji 3 (`improvements.rs:830,844,859`; `resource_production.rs:102,147`; `improvement_build.rs:673,791`). Pozostają NIE_ZMIERZONO tylko: zaokrąglenie ×1,5 i dokładne równoważności (r2).

**Z-5 (werdykt PASS-WITH-NOTES niezgodny z wynikiem). PRZYJMUJĘ.** Poprawka statusu: poprzedni werdykt opierał się na błędnym pinie i pomiarze. Po poprawkach etap pomiarowy r1 jest kompletny (pin, hunki, tabela 2c, mapowanie terenu, tabela symboli). Status rundy: **PASS-WITH-NOTES** dla etapu pomiarowego; NOTES: port kodu i wektory są w r2–r3, statusy NIE_ZMIERZONO z sekcji 3 wymagają potwierdzenia w r2. To nie jest PASS portu.

**Z-6 (zgodność raportu, bez zarzutu). PRZYJMUJĘ do wiadomości, bez zmian.** Potwierdzono: `git diff --name-only 783c6b766 bda98c616` = dwa pliki `.md`; commit obrony także tylko `.md`; `git diff --check` czysty (patrz run `02-operator-obrona-r1.md`). Bramki testów nie powtarzane (kod Rust nie zmieniony, baseline z sekcji 4).

## 8. Runda 2/5 — PORT KODU (Operator, commity 2588284fe, 1116d68f5, 776a07f88, 22942b49a)

Pin web: `origin/main` = `180c0830504ad4fee99c7ccc1bd1337f8d6e4eb5` (>= 180c08305). Pin Rust: `23dd158e9` -> web 180c08305. Wektory z URUCHOMIONEGO weba (`git archive origin/main gra/src gra/data` do katalogu poza repo, usunięty po użyciu), generatory w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1/tools/`.

### 8.1 Status hunków (tabela 2c) po r2

| Kod | Hunki | Status | Gdzie w Rust |
|---|---|---|---|
| K (komentarze), PERF | 1, 7, 12-15, 18, 23, 51, 58-60, 68, 80, 84(k), 88, 98 | BEZ PORTU (jak w tabeli) | — |
| I (importy), RIV | 2, 3, 5, 47 | ZGODNE: `isHexNearRiver` = `on_river_hex` (test równoważności: 5117 scenariuszy); w kwalifikatorze irygacji dodany sąsiad z `rzeka.obecna` | `improvement_build.rs::is_river_adjacent` |
| PRZ | 6, 17, 19, 22, 29, 37, 43, 45, 49 | PORTOWANE: usunięte `get_only_worked`, `get_resource_pass_only_worked`, `farm_priority_only_worked`, `get_skip_wyrab`, pole miasta `ulepszenia_only_worked` | `opts.rs`, `city_phases.rs`, `pick.rs` |
| LIM | 16, 24, 26, 28, 32, 33, 35, 38-40, 44, 48, 57, 61-67, 74, 76-79, 82 | PORTOWANE: brak `max_items_per_city`, `placed_this_city`, `defenseCap`, `FOOD_STAGE_MAX_ITEMS_PER_CITY` | `hex_phases.rs`, `pick.rs`, `single_pass.rs`, `auto_improvements.rs` |
| REG | 11, 25, 50, 54, 56, 69, 70, 72, 73 | PORTOWANE: `FOOD_IMPROVEMENT_KEYS` (9 kluczy, bez `oboz_lowiecki`), `food_worked_keys` (+ centrum, każdy profil), `hex_allows_key`; HILLS-CLEAR-REVERT (`wyrab_ma_sens` tylko Łąka/Równina) | `city_phases.rs`, `auto_improvements.rs` |
| RZ | 8, 21, 30, 31, 34, 36, 41, 42, 46, 53, 75, 81 | PORTOWANE: KROK 0 (przed E1-E6), KROK 7 (ostatni, podłoga puli 60, limit 2 gracz / 1 AI jako stałe + nadpisania `river_clear_no_citizen_*`), licznik per miasto | `pick.rs`, `city_phases.rs`, `hex_phases.rs`, `auto_improvements.rs` |
| FW | 52, 55, 99, 100 | PORTOWANE: `hex_has_horse_deposit` (`zloze` 'konie' po trim/lowercase JS), `fortHorseExtra` (stadnina z koła własnego fortu/posterunku, remis: mniejsze id UTF-16), `is_livestock_unlocked_for_placement_hex`, wiersz `ukrywanie_zloza` stadniny | `city_phases.rs`, `improvement_build.rs`, `improvements.rs`, `data/derived/ulepszenia-reguly.json` |
| DRG | 4, 20, 27, 71 + plik `road-network-plan.ts` | PORTOWANE: `plan_road_network` (MST, Dijkstra, wygładzanie), pamięć planu na wywołanie, bramka drogi w `key_blocked_on_hex` | `road_network_plan.rs`, `single_pass.rs`, `city_phases.rs` |
| SUR | 9, 10, 83 | PORTOWANE: `filter_waiting_keys` w raporcie; `unspentBudgetWarning` POZA ZAKRESEM (renderer) | `opts.rs`, `hex_phases.rs` |
| REL | 85 | PORTOWANE: `oboz_lowiecki` w `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` | `relief_preserving.rs` |
| ERA | 86, 87, 89-92 | PORTOWANE: `improvement_yield_for_era`, `improvement_bonus_for_key_era`, `apply_improvement_bonus(es)_era` (stare sygnatury = era domyślna, bez zmiany zachowania) | `improvements.rs` |
| SUR5 | 93-97 | PORTOWANE jako ROZŁĄCZNE funkcje `resource_production_amount_for_era_all_producers` / `territory_resource_yield_for_improvement_all_producers` (patrz założenie Z-7) | `improvements.rs` |
| AUTOBUILD | `auto-build-gate.ts` | PORTOWANE (decyzja orkiestratora a): `AUTO_BUILD_ENABLED_DEFAULT=false`, bramka tylko dla gracza | `auto_improvements/auto_build_gate.rs` |

Zaokrąglenie ×1,5: `js_round(base * 1.5^(era-1))` = `Math.round` (pół w górę, także dla ujemnych: -7,5 -> -7); zmierzone na 5712 przypadkach (klucze × bazy × epoki 0..5, NaN, ±Inf). Ciała symboli bez hunka (`hasNonFoodResourceDeficit`, `actionableDeficitKeys`, `isCityLimitExhausted`, `prioritiesForUlepszeniaFocus`, `IMPROVEMENT_FOR_DEFICIT`): potwierdzone wektorami `helpers.json` (regenerowane z 180c08305, 0 niezgodności).

### 8.2 Zależności webu spoza 5 plików, które zmieniły wynik pickera (znalezione przez wektory)

W `improvement-build.ts` (poza tabelą 2c, ale konieczne dla parytetu pickera): (a) `isOutpostPlacementAllowed` dla posterunku (R-WEB-FORT-OUTPOST-PLACEMENT-RULES-Q1, `game/fort-territory.ts`) — posterunek tylko na własnym terytorium przy granicy; (b) `isHexNearRiver` w kwalifikatorze irygacji (sąsiad z `rzeka.obecna`); (c) `hexHasHorseDeposit` w `depositAllowsPlayerImprovement`/`isLivestockUnlockedForPlacement`; (d) `buildCandidateHexKeys` (pierścienie węzłów terytorium gracza — API budowy). Wszystkie w `improvement_build.rs` (allowlista: „tylko jeśli hunk tego wymaga”); wektory M16 `qualifier.json` regenerowane z 180c08305 (`rules.json`, `gallery.json` identyczne bajt w bajt).

### 8.3 Założenia r2 (do akceptacji właściciela)

- Z-7 (SUR5, rozłączne nazwy): `resource_production_amount_for_era` i `territory_resource_yield_for_improvement` zostają MIGAWKĄ starego weba (skalują tylko tartak/kamieniołom), bo czyta je `turn_economy_territory` (zakazane w tym temacie) i 6 potoków wektorów (`p6_adv_q2a/q4/q4_preview/q5/q6`, `p6_empirefood_e2e`) wygenerowanych ze starego weba — zmiana funkcji o tej nazwie dała 8 FAIL w tych testach (zmierzone w trakcie r2, cofnięte). Webowo wierne warianty: `*_all_producers`. Przełączenie wołających = repin ekonomii. `resource_production.rs` (osobny, stary moduł `order_effects_lane`) NIE zmieniony (poza allowlistą).
- Z-8: `economy_yield.rs` wywołuje `apply_improvement_bonuses` bez epoki (era domyślna) — web przekazuje epokę właściciela; przełączenie = repin ekonomii (poza zakresem).
- Z-9: cache planu dróg MIĘDZY turami (`ROAD_PLAN_CACHE` w webie) NIE portowany (sama wydajność); plan liczony raz na wywołanie `pick_auto_improvements`. Generator wektorów używa świeżej mapy weba na scenariusz (omija cache po referencji mapy).
- Z-10: `lowered_trimmed` (improvements.rs) używa teraz `js_trim` (JS `trim`, m.in. BOM U+FEFF) zamiast `str::trim` — zgodnie z webem; dotyczy też bramki cywilizacji (`isImprovementAllowedForCiv`), 22+ wektorów p6_23 bez zmian.
- Z-11: moduł bramki w `auto_improvements/auto_build_gate.rs` (zamiast `domain/auto_build_gate.rs`) — bez zmian w `domain/mod.rs` (poza allowlistą).
- Z-12: `humanOwnerIds.includes(ownerId)` = równość `f64` z `NaN == NaN` (SameValueZero).

### 8.4 Dług / poza zakresem (jawnie)

- Produkcyjny wywołujący `pick_auto_improvements` (dług P7); bramka AUTOBUILD jest tylko czystą funkcją.
- `unspentBudgetWarning` (renderer).
- `get_stadnina_build_block_reason` (komunikat UI w API budowy) — nie portowany.
- Przełączenie `turn_economy*`/`economy_yield.rs` na warianty epokowe (ERA/SUR5) — repin ekonomii.

### 8.5 Mutacje (skrypt `tools/mutate-repin.py`, wyniki `logs/mut-result.txt`)

119 mutantów zdefiniowanych, 93 uruchomione, 3 NOOP (tekst po rustfmt — nie liczone), **90 zastosowanych: 77 zabitych (85,6%)**, 13 ocalałych. Ocalałe z dowodem równoważności (7): N07 (klucz inny niż `wyrab` nie kwalifikuje się na heksie z `Overlay::Las`), N29 (węzeł obcego fortu: kwalifikator odrzuca heks poza terytorium gracza), N40 (zewnętrzny `break` na `global_spent >= cap` zbędny wobec wewnętrznego `global_spent + koszt > cap` przy koszcie > 0), N42 (heks rzeczny bez obywatela zawsze zajmuje KROK 0 przed FAZĄ 2, licznik ten sam), N81 (`n < 2` vs `n < 1`: jedno miasto daje pusty plan), N89 (`left <= 0` vs `< 0`: dodatkowe zdjęcie z kopca po rozliczeniu celów nie zmienia `dist`), N93 (pusta lista węzłów -> `territory_owner_at` = None -> false tak samo). Ocalałe NIEROZSTRZYGNIĘTE (6, dług na r3): N56, N57, N58 (warunki KROKU 7: `fallback_is_pending`, `fort_is_pending`, niedobór czeka — wymagają dedykowanych wektorów z oczekującym celem i jednocześnie wolnym heksem rzecznym), N85 (wygładzanie trójkątów: wektor „Y-junction”), N88 (remis składowych w uzupełnieniu MST), N90 (`nd > cap` vs `>=` na dokładnej granicy). Niezałatwione (nieuruchomione): N15, N17, N20, N23, N26, N28, N31, N35, N45, N46, N47, N49, N59-N66, N70-N73, N78, N100, N106 (lista w skrypcie).

### 8.6 Bramki r2

`cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `git diff --check` EXIT=0; `cargo test` w przebiegach po jednej binarce: 2103 (integracyjne, bez p6_8i_pick) + 22 (lib) + 5 (p6_8i_pick, 5117 scenariuszy) = **2130 passed, 0 failed, 0 nowych `#[ignore]`** (1 istniejący `ignored` w `p6_order_lane`). Szczegóły: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1/logs/gates-r2.txt`.

## 9. Runda 3/5 — odpowiedzi na zarzuty FAIL (Operator r3)

Baza: `6f797faef` (r2). Kod Rust NIE zmieniony (puste `git diff` na `rust-port/engine/src`). Zmiany r3: skrypt mutacji (kotwice),
generator wektorów (rodzina F8 `kz-`, dopiski na końcu listy, bez zmiany poprzednich scenariuszy), wektor `pick.json` (5125 scenariuszy,
+8 `kz-`), logi, ta sekcja. Wektory z `origin/main` 180c08305 (`git archive` do katalogu poza repo). Regeneracja PRZED zmianą generatora
dała bajt-identyczny `pick.json` i `helpers.json` z commitowanym stanem (powtarzalność potwierdzona).
Generator wymaga `node --experimental-transform-types` (enumy TS); sam `--import` loadera nie wystarcza.

### 9.1 Z1 — mianownik i wynik mutacji: PRZYJMUJĘ (poprawka + pomiar), próg 85% NIE DOMKNIĘTY

- Mianownik: **119** zdefiniowanych mutantów (`tools/mut-denominator.py`). Każdy uruchomiony co najmniej raz; log łączny `logs/mut-result-all-r3.txt` (= `mut-result.txt` + `mut-result-r3.txt` + `mut-result-r3b.txt` + `mut-result-r3c.txt`). Wpis N106 w §8.5 był błędny: w logu N106 = KILLED.
- Nieuruchomione w r2 (N15, N17, N20, N23, N26, N28, N31, N35, N44-N47, N49, N61-N66, N70-N73, N78, N96, N100) — uruchomione w r3.
- Kotwice niedopasowane po rustfmt (NOOP): N35, N48, N49, N59, N60, N63, N66 — poprawione; `tools/mut-precheck.py` potwierdza 119/119 trafień.
- Wynik: **101 zabitych / 119 = 84,9%**. Próg 85% wymaga 102 zabójstw (brak 1).
- N71 = TIMEOUT (420 s na mutant). Klasyfikacja: równoważność wydajnościowa (§9.2), nie zabójstwo.
- N35: wynik r3b = INVALID(compile) był artefaktem uruchomienia; ręczne zastosowanie mutanta kompiluje się, testy przechodzą; r3c = SURVIVED.

### 9.2 Z2 — ocalałe mutanty: PRZYJMUJĘ (częściowo), 10 pozycji OTWARTYCH

Równoważność udowodniona (argument z kodu):
- **N71** (`road_plan_has`, usunięty cache `road_memo.plan`): plan jest funkcją niezmiennych wejść (`state` przez `&`, `memo.cities`) w obrębie jednego wywołania; mutant zmienia wyłącznie czas (`single_pass.rs:67-70`).
- **N81** (`n < 2` -> `n < 1`): dla n=1 brak krawędzi, `comps.len() <= 1`, `disconnected = 0`, pusty plan = `RoadNetworkPlan::default()` (`road_network_plan.rs:207-209`, `:263-270`, `:307-308`).
- **N89** (`left <= 0` -> `< 0`): `left` zlicza tylko cele; po zdjęciu ostatniego celu nie ma aktualizacji `dist`/`parent` ani celów, ani węzłów ich ścieżek (węzeł po `done` nie jest relaksowany, `road_network_plan.rs:145-157`).
- **N93** (usunięty `if all_nodes.is_empty() return false`): `territory_owner_at` z pustą listą = `None` (`territory.rs:235-275`), `None != Some(owner)` -> `false`, jak w oryginale.

Przeniesione z r2 (§8.5), NIE_PONOWNIE_ZWERYFIKOWANE w r3: N07, N29, N40, N42.

OTWARTE (ocalały, brak zabójstwa i brak dowodu):
- **N20** (zdjęty `is_farm_base_terrain` z `is_river_no_citizen_clear_hex`): dodana rodzina `kz-gory-*` (las na rzece, teren Gory, bez obywatela) — Rust = web, mutant nie zabity. Do wyjaśnienia (prawdopodobnie równoważne przez kwalifikator `wyrab`). Dług r4.
- **N35** (remis właściciela konia, `tie = false`): rodzina `kz-tie-*` (dwa miasta w tej samej odległości, kolejność id zgodna i odwrotna) — nie zabija. Dług r4.
- **N47** (pominięty `continue` w probe): nowe ocalenie r3; brak dowodu idempotencji. Dług r4.
- **N56, N57, N58** (warunki KROKU 7): wymagają wektora z oczekującym celem (fallback/fort/niedobór) i jednocześnie wolnym heksem rzecznym; nie wygenerowane w r3.
- **N85** (wygładzanie trójkątów): wymaga planu z cyklem bez trójkąta; nie wygenerowane.
- **N88** (remis składowych MST): wymaga dwóch par o równym koszcie; nie wygenerowane.
- **N90** (`nd > cap` vs `>=`): wymaga kosztu ścieżki dokładnie równego `cap`; nie wygenerowane.
- **N100** (`hex_has_horse_deposit` bez gałęzi `zloze=='konie'`): generator M16 nie tworzy heksu z `zloze='konie'` bez nakładki `ZlozeKonia` na ścieżce odblokowania (`improvement_build.rs`). Wymaga rozszerzenia M16.

Projekcja: domknięcie N20/N35/N100 dałoby 104/119 = 87,4%; N47, N56-N58, N85, N88, N90 wymagają osobnych wektorów.

### 9.3 Z3 — podłoga Pracy 60 (N59/N60): PRZYJMUJĘ, ZABITE

Po poprawce kotwic: **N59 KILLED, N60 KILLED** (podłoga puli `praca - normal - floor` oraz `budget_cap`); także N48, N49, N61-N66 KILLED.
Progi: N62 (domyślna podłoga +1) KILLED; N119 (podłoga 30 zamiast 60) KILLED; N118 (limit 3 zamiast 2) KILLED.

### 9.4 Z4 — zmiana danych nie jest addytywna: PRZYJMUJĘ JAKO ODSTĘPSTWO (ZAŁOŻENIE Z-13)

- Zmiana istniejącej wartości: `stadnina.zloza` `[]` -> `["konie"]` w `rust-port/engine/data/derived/ulepszenia-reguly.json`. NIE jest addytywna; deklaruję odstępstwo od „addytywnie”.
- Uzasadnienie: parytet z webem. Web `improvementHidesDepositOnHex('stadnina')` = `hexHasHorseDeposit` (`gra/src/game/terrain-improvements.ts:425`), a `hexHasHorseDeposit` obejmuje `zloze === 'konie'` po trim/lowercase (`:399-401`). Wcześniejsza wartość `[]` była rozbieżnością z webem.
- Czytelnik pola: `rust-port/engine/src/domain/improvements.rs:1123` (`row.zloza.iter()`); w `src` brak innych odczytów `zloza` tego wiersza.
- Zmiana `zrodlo_web` w `produkcja_epoka` to tekst opisu (UWAGA o migawce), nie wartość liczbowa.
- ZAŁOŻENIE Z-13 do akceptacji właściciela: zmiana wartości danych (nie addytywna) jako korekta do parytetu.

### 9.5 Z5 — zakres poza tabelą hunków: PRZYJMUJĘ JAKO ZAŁOŻENIA do akceptacji (Z-14..Z-16)

- Z-14: `isOutpostPlacementAllowed` (posterunek tylko na własnym terytorium przy granicy; web `game/fort-territory.ts`) w `improvement_build.rs`.
- Z-15: `buildCandidateHexKeys` (pierścienie węzłów terytorium gracza) oraz sąsiad z `rzeka.obecna` w kwalifikatorze irygacji (`improvement_build.rs::is_river_adjacent`). Źródło: `improvement-build.ts` (§8.2).
- Z-16: regeneracja `tests/p6_m16_vectors/qualifier.json` z 180c08305 (`rules.json`, `gallery.json` bajt-identyczne). Wymaga osobnej akceptacji właściciela: rozszerza allowlistę o hunk spoza tabeli 2c.

### 9.6 Z6 — dwie wersje reguł ekonomii: PRZYJMUJĘ JAKO DŁUG (D-1, D-2)

- D-1: `resource_production_amount_for_era` (stare nazwy, migawka dla `turn_economy`) i `*_all_producers` współistnieją; `*_all_producers` nie jest wołane produkcyjnie. Właściciel długu: orkiestrator. **Termin: NIE_USTALONO.** Propozycja: zamknięcie razem z repinem ekonomii (D-2).
- D-2: `economy_yield.rs` wywołuje `apply_improvement_bonuses` bez epoki (Z-8). Rust NIE jest 1:1 z webem w ekonomii do czasu repinu ekonomii. Poza zakresem tego tematu.
- Cache planu dróg między turami (Z-9): tylko wydajność, bez wpływu na wynik.

### 9.7 Bramki r3

- `cargo fmt --all -- --check` EXIT=0; `git diff --check` EXIT=0 (przed commitem).
- `cargo test --test p6_8i_pick` (pełny, 5125 scenariuszy, z nowym `pick.json`): **5 passed, 0 failed** (349 s).
- Pozostałe binarki: kod Rust nie zmieniony; wyniki r2 (§8.6: 2103 + 22 + 5) dotyczą tego samego drzewa `src`.
- Nowe `#[ignore]`: 0.

## 10. Runda 4/5 — zarzut Z2 (Operator r4, baza 07fa33dad = FC r3)

Kod Rust (`rust-port/engine/src`) NIE zmieniony (puste `git diff`). Zmiany r4: generator (rodziny F9 `kz-fort-tie-*`,
F10 `kz-fort-obcy-konie`, dopiski na koncu listy), wektor `tests/p6_8i_vectors/pick.json` (5128 scenariuszy; `helpers.json`
bajt-identyczny), log `logs/mut-result-r4.txt`, ta sekcja. Wektory z web `180c08305` (`git archive` do katalogu poza repo).
Przed zmiana generatora regeneracja dala bajt-identyczny `pick.json` z commitowanym stanem.

### 10.1 N35 (remis wlasciciela konia) — ZABITY

- Przyczyna braku zabojstwa w r3: scenariusze `kz-tie-*` nie maja wezla fortu, wiec galaz `fortHorseExtra` (web) /
  `fort_horse_extra` (Rust, `city_phases.rs:317-351`) nie jest osiagalna.
- Proba 1 (miasta +-4, bez fortu) i proba 2 (fort (0,-2), miasta +-6): SURVIVED. Przyczyna: kandydaci miasta to
  promien okolicy (`cityRangeForPopulation`, min 5) + 1 (`territory_radius_pin + 1`); zloze (0,0) w odleglosci 6 lezy
  w pierscieniu kandydatow obu miast, wiec `inCityRing` je wyklucza z galezi fortu.
- F9 `kz-fort-tie-z1a1` / `kz-fort-tie-a1z1`: miasta z1 (-8,0), a1 (8,0), wlasny fort (0,-2) promien 5 (`FORT_TERRITORY_RADIUS`),
  zloze konia (0,0). Web (remis -> mniejsze id): stadnina na (0,0) dla a1 w obu kolejnosciach. Rust = web (`P6_8I_ONLY=kz-` PASS).
  Mutant `tie = false`: w kolejnosci [z1,a1] stadnina przechodzi na z1 -> **KILLED**.
- Wynik: 101 + 1 = **102/119 = 85,7%** (prog 85% spelniony).

### 10.2 N20 (zdjety `is_farm_base_terrain` z `is_river_no_citizen_clear_hex`) — ROWNOWAZNE (dowod)

Wszystkie wywolania predykatu sa poprzedzone sprawdzeniem `wyrab_ma_sens` (= `is_farm_base_terrain(hx.terrain, Brak)` na
TYM SAMYM heksie), wiec klauzula usunieta przez mutanta jest zawsze prawdziwa w miejscu uzycia:
- `city_phases.rs:121` (`hex_allows_key`, klucz `wyrab`): osiagalne tylko z `river_krok0_ok` (`:146` sprawdza `wyrab_ma_sens`)
  albo z petli `phase_wyrab_by_type` (`hex_phases.rs:369`), albo z `step0_applies` (`hex_phases.rs:317/323`).
- `hex_phases.rs:251` (licznik po `push_pick`): tylko gdy `step0_applies` = prawda (wszystkie galezie wymagaja `wyrab_ma_sens`).
- `hex_phases.rs:393` (licznik): po `wyrab_ma_sens` (`:369`) w tej samej petli.
- `hex_phase_priority` NIE zawiera `wyrab` (`city_phases.rs:388`), a `defense_priority` to tylko `ZERO_YIELD` (`posterunek`,
  `fort`; `auto_improvements.rs:106`), wiec `hex_allows_key(wyrab)` nie jest wolane z petli bez strazy.
Wniosek: mutant nie zmienia zadnego wyniku. Dlatego `kz-gory-*` nie zabija N20 (to nie jest luka wektorow).

### 10.3 N47 (pominiete `continue` w `phase_probe`) — ROWNOWAZNE (dowod)

`hex_phases.rs:452-454`: bez `continue` ponowne przejscie petli dla heksu juz obecnego w `filter_waiting_keys` moze tylko
wykonac `filter_waiting_keys.insert(hex_key)` (idempotentne; zbior tylko rosnie, nic go nie usuwa), a `break` konczy
iteracje. Pozostale wywolania w ciele (`hex_allows_key`, `key_blocked_on_hex`, `qualifies`, `hex_layers_contain`) sa
bez efektow obserwowalnych poza memo (`road_plan_has`), ktorych wynik nie zalezy od stanu cache (jak w N71, sek. 9.2).
Brak zmiany wyniku pickera -> ROWNOWAZNE.

### 10.4 N29 (`n.owner_id != opts.owner_id` -> `false`) — OTWARTE

Wektor F10 `kz-fort-obcy-konie` (fort wlasciciela 2 przy zlozu, web: brak stadniny) PRZEZYWA mutanta. Hipoteza do
sprawdzenia: po dodaniu zloza do kandydatow bramka wlasnosci heksu (`territory`) je odrzuca. NIE_ZMIERZONO, nie udowodniono.

### 10.5 N07, N40, N42 — ponownie zmierzone w r4: SURVIVED (OTWARTE)

Wczesniejsze wpisy r2 w logu byly przeniesione bez pomiaru; teraz zmierzone na aktualnych wektorach: N07, N40, N42 — SURVIVED.
N07 wymaga stanu `river_no_citizen_clears == max` i kandydata innego klucza (np. `tartak`) na heksie rzecznym bez obywatela
(`city_phases.rs:121`, `hex_allows_key` dla KAZDEGO klucza). N40/N42: przyczyna NIE_ZMIERZONO (nie zbadano, czy istniejace rodziny `df-`/`rc-` osiagaja stan graniczny limitu lub kapu miasta).

### 10.6 N56, N57, N58, N85, N88, N90, N100 — OTWARTE (bez wektora i bez dowodu w r4)

Nie wygenerowano wektorow ani dowodow w tej rundzie (ograniczenie czasu/dysku). Kierunki: N56-N58 — stan oczekujacego
celu (etap/fort/niedobor) i jednoczesnie wolny heks rzeczny (`pick.rs:258-290`, `:335-346`); N85/N88/N90 — plan drog z
cyklem bez trojkata, remis kosztu skladowych MST, koszt sciezki = cap (`road_network_plan.rs`); N100 — rozszerzenie M16
o heks `zloze='konie'` bez nakladki `ZlozeKonia` (`improvement_build.rs`).

### 10.7 Stan zbiorczy (ostatni wpis per ID w `logs/mut-result-all-r3.txt` + r4)

Zabite: 102/119 (85,7%). Rownowazne z dowodem: N20, N47 (r4); N71, N81, N89, N93 (r3, sek. 9.2 — do akceptacji FC).
Otwarte bez zabojstwa i bez dowodu: N07, N29, N40, N42, N56, N57, N58, N85, N88, N90, N100 (11 pozycji).
Uwaga: `logs/mut-result-all-r3.txt` zawiera zduplikowane ID (kolejne przebiegi); werdykt = ostatni wpis.

### 10.8 Zalozenia Z-13..Z-16 i dlugi D-1/D-2

NIE_WYKONANO w r4 (poza zakresem tej rundy): lista do akceptacji wlasciciela pozostaje jak w sek. 9.4-9.6.

### 10.9 Bramki r4

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --test p6_8i_pick pick_auto` (pelny, 5128 scenariuszy, nowy `pick.json`): 1 passed, 0 failed (358 s).
- `git diff --check`: EXIT=0.
- Pozostale binarki `cargo test`: NIE_ZMIERZONO w r4 (kod `src` nie zmieniony wzgledem FC r3; baseline 2130/0 z r2).
- Nowe `#[ignore]`: 0.
