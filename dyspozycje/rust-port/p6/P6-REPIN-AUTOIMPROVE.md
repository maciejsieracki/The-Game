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
