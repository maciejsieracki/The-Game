# Plan portu "The Game" (web) → Rust/Tauri — pełny parytet 1:1

**Data:** 2026-10-20
**Autor:** orkiestrator tej sesji (Sonnet 5.5)
**Aktualizacja stanu:** 2026-11-07 (sekcje 0a–0c, §5, §6) — `R-RUSTPORT-PLAN-UPDATE-2026-11-07-Q1`.
**Status:** ZATWIERDZONY DO WYKONANIA (decyzje §0.1–§0.3 przyjęte jako robocze domyślne rekomendacje orkiestratora — właściciel może je w każdej chwili nadpisać)
**Źródło:** zbudowany od nowa na bazie planu `PLAN-RUST-PORT-ORCHESTRACJA-20260920.md` (poprzedni system OpenClaw) — struktura faz P0–P11 zachowana jako sprawdzona, warstwa infrastruktury OpenClaw (plugin Controller, Flow, Workboard, A/B routing) odrzucona; **uniwersalne zasady procesu z `autobot-controller`** (ślad dowodowy per faza, zakaz fałszywej niezależności ról, integracja tylko po PASS) **przyjęte i wplecione w §2/§2a** — to są zasady przeniesione pierwotnie z AutoBota tego repo, nie coś obcego.

**Trwały anchor tego projektu:** `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md` (status bieżącej fazy/rundy, aktualizowany po każdym cyklu Workflow). Ten plik (pełny plan) jest statyczny — zmiany planu idą przez edycję z datą, nie przez nowy plik.

---

## 0. Decyzje

1. **Baza startowa kodu Rust.** Przyjęte: potraktować istniejący `rust-port/engine` (scalony w `main` + gałęzie `autobot/real24-staging`, `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`) jako **bibliotekę referencyjną do audytu i częściowego reużycia**, nie jako gotową bazę do kontynuacji. Powód: baza kodu jest z 19.09.2026, web main odjechał od niej o 52 commity, interfejs komend (`bridge.rs::EngineCommand`) ma dziś 6 wariantów i żaden system poza ruchem jednostki/turą nie jest podłączony.
2. **Lokalizacja.** Przyjęte: nowa gałąź w tym samym repo `maciejsieracki/The-Game` (np. `rust-port/parity-v2`), żeby zachować jedno źródło prawdy danych/assetów zamiast duplikować repo. Topiki/worktree pojedynczych zadań Workflow nadal idą pod `autobot/<ID>` zgodnie z konwencją repo.
3. **Model routingu (zatwierdzone przez właściciela 2026-10-20, skorygowane 2026-10-20):** Orkiestrator = Sonnet 5.5 (ta sesja) — **wyłącznie orkiestruje, nie wykonuje żadnej pracy merytorycznej sam ani przez narzędzie `Agent`/subagent**. Operator i Evaluator = Haiku 5.5, effort medium. Final Control = Sonnet 5.5, effort medium. **Wszystkie trzy role — Operator, Evaluator, Final Control — dispatchowane WYŁĄCZNIE jako wywołania `agent()` wewnątrz skryptów narzędzia Workflow, nigdy przez narzędzie `Agent` (subagent) ani przeze mnie bezpośrednio.** Moja rola: pisać/uruchamiać skrypty Workflow, czytać ich wynik, decydować o kolejnej rundzie, prowadzić licznik rund i ledger, oraz wykonywać integrację (scoped diff, commit, push) już zatwierdzonego wyniku — integracja nie jest "pracą" delegowaną, to czynność orkiestratora z kanonu tego repo (Operator/Evaluator/Final Control nie integrują, nie pushują). **Uwaga:** niższa siła modelu na Operatorze/Evaluatorze oznacza realistycznie więcej rund naprawczych niż przy Sonnet 5.5 — uwzględnione w szacunku czasu (§6).

---

## 0a. STAN NA 2026-11-07 (aktualizacja planu, temat `R-RUSTPORT-PLAN-UPDATE-2026-11-07-Q1`)

**Źródła tej sekcji (bez uruchamiania `cargo test`):** `LEDGER.md` (cały), `GOAL-RUST-PORT-20261020.md`, `PLAN-AKTUALIZACJI-PORTU-DO-WEBA-20261030.md`, `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (FALA 509–543), `git ls-tree -r origin/rust-port/parity-v2`. Liczby oznaczone „wg LEDGER" pochodzą z ostatniego wpisu rejestru, nie z nowego uruchomienia testów.

**Punkty odniesienia (zmierzone 2026-11-07):**
- `origin/rust-port/parity-v2` = `783c6b766` (FC REPIN-WEB-UI-3-INTEGRACJA, fast-forward z `8bc2efcf8`). Drzewo: `rust-port/engine` 852 pliki (92 moduły `src/domain/*.rs` + 56 plików w podkatalogach `src/domain/mapgen` (38, w tym `rivers_a`/`rivers_b`), `okolica` (6), `auto_improvements` (7), `resource_access` (3), `society_breakdown` (2) — wszystkie pod `rust-port/engine/src/domain/`, 307 plików testów `tests/*.rs`), `rust-port/renderer` 906, `rust-port/assets` 429, `src-tauri/frontend-v2` 796, `src-tauri/frontend` 2 (stary slice).
- Testy wg LEDGER: silnik **2122 passed / 0 failed** (ostatni pełny przebieg: merge `e1c040160`, 2026-11-03, DYPLOMACJA-PROFIL-WOJNY-POKOJU); renderer **466/0** (RENDER-3-RUST, FC `707696397`); frontend-v2: harnessy UI-3 A–E 0 różnic (INTEGRACJA, 2026-11-07). Od 2026-11-03 nie dodano kodu silnika — porty UI/3D nie ruszają `rust-port/engine`.
- Web `origin/main` = `bd5386c8b` (etykieta deployu ROBOCZA `35e9ec5a` z message commita `bd5386c8b`, FALA 543 — to NIE jest obiekt gita; `git cat-file -t 35e9ec5a` zwraca błąd). Piny portu są **rozjechane**: UI/3D = web `9b019a7d8` (FALA ≤532, bez FALA 534–543); logika silnika = mieszanka pinów `4bbef081d` (auto-ulepszenia, ekonomia, wojna), `23dd158e9` (słodka woda, dyplomacja-profil), `dc8a3adc` (starsze moduły); mapgen = `86d510c66`/`91dc998a`. Pomiar: `git diff 4bbef081d origin/main -- gra/src gra/data` = **167 plików, +16 468 / −2 296**, w tym **91 plików w `gra/src/game` + `gra/data`** (lista w §0b).
- Wstrzymania (LEDGER): 2026-11-03 wstrzymanie logiki Rust na rzecz poprawek webu, uchylone tylko dla grafiki/UI; 2026-11-07 „dalszy REPIN po zmianach weba dopiero po końcu kolejki webowej" — kolejka webowa na 2026-11-07: AIRESERVE/AIN10, AI-PLAYER-PARITY-FIXES, FULLREG w toku/oczekujące. **Polecenie właściciela z 2026-11-07 („zacznij pracę nad kilkoma zadaniami kolejnymi z Taurus") uchyla to wstrzymanie dla tematów z §0c.** (ZAŁOŻENIE orkiestratora do potwierdzenia; web nadal rośnie, więc każdy temat portu zaczyna od własnego pomiaru dryfu do `origin/main` w chwili startu.)

### 0a.1 Fazy P0–P11

| Faza | Status | Dowód / adnotacja |
|---|---|---|
| P0 kalibracja | **ZROBIONE** | PASS 2026-10-20 (`R-RUSTPORT-P0-KALIBRACJA-Q1`), pin `edb8fb56`, gałąź `rust-port/parity-v2` |
| P1 audyt + reference pack | **ZROBIONE** (z uwagami) | P1.1–P1.18 PASS; synteza `P1-GATE-SYNTHESIS-2` PASS (41 wierszy); klasyfikacja `gra/src` 300 plików: REUSE 0 / ADAPT 14 / REPLACE 10 / UNKNOWN 276; długi: P1.16b LIMIT-5 rozbite na 16c–16f |
| P2 kontrakt domeny + adapter | **ZROBIONE** | P2.1–P2.13; bramka P2 otwarta formalnie po rundzie 3 fan-out (DECISION_REQUIRED→PASS) |
| P3 dane/assety | **ZROBIONE z uwagami** | 30 plików danych, loader/walidator, CI zielone (P3-16 `17454b33`); werdykt bramki P3 = FAIL (pomiar) zamknięty decyzją administracyjną (P3-13R) |
| P4 model świata + renderer | **ZROBIONE (CPU/model), W TOKU (GPU)** | MOD01–14 + P4.36 Q1–Q5 (bitwa 3D) PASS; REPIN-3D A1–A6, B1–B4 PASS; REPIN-WEB-RENDER-3-RUST `707696397` (L1/L2). **Otwarte:** L3 (UnitRenderer, smallPartLod, unitStaticMerge, pule) po porcie kompozytora jednostek; RR-T1 (GPU) wymaga maszyny właściciela; indeks Uint16/32 niepodpięty do uploadu wgpu |
| P5 frontend/UI 1:1 | **ZROBIONE do webu `9b019a7d8`** | P5.1–P5.8 (shell, L0/L1A/L2/C4, cityPanel K01–K09B), REPIN-UI-2 A–G, REPIN-UI-3 A–E + INTEGRACJA (`783c6b766`). **Otwarte:** K09C/K09D i hooki kontrolera v2 (czekają na DTO/producenta z P6); UI po `9b019a7d8` (FALA 534 układ banera A, FALA 537 panele pod banerem, komunikat o rezerwie przed bitwą) → REPIN-UI-4 |
| P6 gameplay core | **W TOKU (~mniej niż połowa)** | patrz tabela 0a.2; silnik ma 92 moduły domeny, ale produkcyjnej pętli tury (P7) brak: kilka modułów „osiągalnych tylko z testów" |
| P7 integracja Rust↔Tauri↔frontend | **NIEROZPOCZĘTE** | kontroler v2 nie podpina nowych hooków (toggle automatyzacji budowy, panel rekrutacji imperium, zakładki zdarzeń, DTO Milicji/głodu) |
| P8 parity pass | **NIEROZPOCZĘTE** | wymaga P6/P7; bramka seedów web vs Rust nie istnieje |
| P9 kontrola + integracja | **NIEROZPOCZĘTE** | |
| P10 wydajność | **NIEROZPOCZĘTE** | tylko znalezisko z P1.8 (Standardowy 90–212 s w webie) |
| P11 packaging | **NIEROZPOCZĘTE** | wymaga osobnej zgody |

### 0a.2 Zadania P6.x / Mxx (stan zintegrowany na `parity-v2`)

| Zadanie | Status | Co jest / czego brak (wg LEDGER) |
|---|---|---|
| P6.1 stan początkowy | **ZROBIONE** (1/1B/1C/1D/1E; REPIN-LOGIKA-CIV) | hot-seat BRAK (P1.18) — osobny temat; nazwy miast: web FALA „nazwa miasta zużyta na zawsze" do REPIN |
| P6.2 walidacja komend | **CZĘŚĆ** | P6.23-KOMENDY-TEREN (69 eksportów `order.ts`); brak pełnej transakcyjności |
| P6.3 teren/przechodniość | **ZROBIONE** | Desert/Tundra fix (P1), `terrain.rs`, wektory M04 |
| P6.4–P6.5 jednostki | **CZĘŚĆ** | P6.4 ruch, P6.5A/B życie; `unit_health`, `unit_epoch`, `formation_rules`, `generals`, `general_quick_follow`, `battle::orders` zintegrowane; wektory P6.5B (`tests/p6_5b_vectors`) obecne w drzewie; brak produkcyjnego lifecycle'u i wpięcia |
| P6.6–P6.8 miasta/ekonomia | **PRAWIE ZROBIONE (logika), NIEWPIĘTE** | 6A/6B zakładanie, 7A/7B wzrost, 8A–8H2, 8J, ADVANCE-CITY-ECONOMY Q1–Q6, ECON-TICK (EMPIREFOOD, POST, ORDER-LANE, HEAL, STATE-SOURCES), REPIN-EKONOMIA A–E, REPIN-DELTA-4. **Brak:** 8I2, poprawka natywnego dostępu do żelaza (web 2026-11-03), cały dryf FALA 500–543 (§0b); pętla miast bez produkcyjnego wywołującego |
| P6.8I auto-ulepszenia | **ZROBIONE na pinie `4bbef081d`**, wymaga REPIN | `auto_improvements*` (2227 scenariuszy, mutanty 366); web zmienił zasady 5 razy po pinie |
| P6.9–P6.10 tura gracza/świata | **CZĘŚĆ** | `turn_economy_*` (≈20 modułów), `ai_turn`; brak: odroczenie zdarzeń na koniec tury, marsze tylko na koniec tury, życie zdarzeń 1 tura |
| P6.11–P6.12 AI + wojny wymuszone | **CZĘŚĆ (≈35%)** | `ai_turn`, `ai_move_range`, `ai_general_war_campaign`, `army_consolidation`, `war_all_in_capital*` (3 moduły), `war_rules_multiwar`, `alliance_war_obligation`, `ai_era_unit_promotion`. **NIEPORTOWANE:** `forced-war-*` (common/stone/bronze/iron), `ai-war-home-defense`, `ai-war-target-select`, `ai-march-guard`, `army-concentration`, `ai-difficulty-bonus`, `ai-city-capture-executor` — **najwyższe ryzyko planu (§5)** |
| P6.13 walka | **CZĘŚĆ** | `combat.rs`, `battle_mode`, `battle::orders`, renderer bitwy 3D (P4.36) gotowy; **brak:** oblężenie (głód/kapitulacja/wypad/wejście do miasta), limit bitwy 500 i limit stosu, łup/zajęcie |
| P6.14 dyplomacja | **CZĘŚĆ (2 z 10 tematów podziału)** | `diplomacy.rs` 4078 LOC, `diplomacy_truce`, `diplomacy_aggressor`, `diplomacy_war_peace_profile`, `diplomacy_war_gates`, `diplomacy_tick_war_brake`. Kolejka z `DYPLOMACJA-PODZIAL-AUDYT.md`: 1 TRUCE-AGRESOR ✔, 2 PROFIL-WOJNY-POKOJU ✔, **3 MULTIWAR-ERA-BRAMKI, 4 WOJNY-WYMUSZONE, 5 POKOJ-ROZEJM-CESJA, 6 WIARYGODNOSC-RELACJE, 7 BILANS-OFERTY-PLATNOSCI, 8 PANSTWA-MIASTA, 9 NEGOCJACJE-BLOKADY, 10 AI-DECYZJE-SOJUSZE — NIEROZPOCZĘTE** |
| P6.15 handel | **CZĘŚĆ** | `trade.rs`, `trade_flow_apply`; web zmienił bramki (kontakt zamiast połączenia, bezkarne zerwanie po 10 turach, premia morska wymaga portu) |
| P6.16 kultura/religia | **CZĘŚĆ** | `order_effects_culture`; odświeżenie `culture-religion.ts` (+43/−21) nieprzeportowane |
| P6.17 cuda + tech | **CZĘŚĆ** | `wonder_placement`, `territory` (M14); brak transferu cudu przy podboju (web FALA 541/543) i drzewka tech jako system |
| P6.18 państwa-miasta + barbarzyńcy | **CZĘŚĆ** | `barbarians.rs`; kod państw-miast MARTWY w produkcji (P1.14b); aneksja ze zdobyczami (web) nieprzeportowana |
| P6.19 zwycięstwo/porażka | **NIEROZPOCZĘTE** | |
| P6.20–P6.22 save/load/replay | **CZĘŚĆ** | `save_load.rs` (+`meta.battleModeSettingVersion`), `replay.rs`; brak pól i migracji z §0b |
| P6.23–P6.24 testy + niezależny Evaluator | **W TOKU** | wektory z uruchomionego weba przy każdym temacie; Evaluator całego gameplayu — po P6 |
| M00–M14 mapgen | **PRAWIE ZROBIONE** | M00–M07B4, M09, M11, M12, M14, M06A1–A9, M06B1/B2 PASS; wpisy LEDGER istnieją dla M15 (PASS-WITH-NOTES), M16 (PASS), M17 (PASS-WITH-NOTES), M10 (PASS) — wpis 2026-10-23, „ZINTEGROWANE", parity-v2 `95b91471`; brak wpisu w LEDGER dla M08, M13, M18 (NIE_ZMIERZONO, czy są potrzebne; wg `P6-25-MAPA-GAP`), REPIN `relocate_forest_horses` (konie, web 2026-11-03), Pangea `topUpPangeaLandFraction` fazy 2–3 |

**Bilans:** zintegrowane i zielone: P0–P3, większość P4–P5, mapgen (M00–M14 z wyjątkami M08/M13/M18 bez wpisu; M15–M17 zintegrowane), ekonomia miast; dyplomacja 2 z 10 tematów podziału; AI/wojny i walka — częściowo (liczby tematów w tabeli wyżej; procenty NIE są miarą, patrz uwaga pod tabelą). Największe luki P6: AI + wojny wymuszone, oblężenie, dyplomacja (8/10 tematów), hot-seat, zwycięstwo, save/migracje. P7–P11 = zero kodu.

## 0b. Różnice WEB→RUST wymagające REPIN logiki (materiał do P6)

Zakres: zmiany webu po pinach logiki Rust (`4bbef081d`/`23dd158e9`), FALA 495–543 oraz zgłoszenia z LEDGER 2026-11-03…07. **Dokładne hunki (plik:linia) zmierzy temat `R-RUSTPORT-REPIN-DELTA-5-Q1` (§0c, poz. 1)** — poniższe grupowanie wynika z rejestru i listy 91 zmienionych plików (`git diff --name-only 4bbef081d origin/main -- gra/src/game gra/data`), nie z odczytu hunków; wszystko poza pozycjami z FALA/LEDGER = NIE_ZMIERZONO.

| Moduł Rust (zadanie) | Zmiany webu do przeniesienia (FALA / temat) | Pliki webu |
|---|---|---|
| **P6.8 ekonomia/produkcja** | mnożnik zużycia obywateli m(e)=1+0,5(e−1) dla racji i surowców (FALA 500, `R-WEB-CITIZEN-CONSUMPTION-ERA-MULT`); cegła ×2 + Cegielnia +50% bazy/epokę (512); odlewnie 25→50 cykli + m(e) (517); Magazyn: +20% bazy pojemności państwa, bez żywności (513 + `WAREHOUSE-STATE-CAP-20PCT`); Spichlerz Królewski/Pismo, Spichlerz II tech (509, 503); limit ludności Spichlerz II=12, Akwedukt=20; Młyn tylko przy rzece (bramka), natywny dostęp do żelaza (`ownerHasNativeZelazoAccess`, błąd 1:1 w Rust); dostęp do wody = słodka woda lądowa; Emporion (516); cap bonusu Magazynu | `production.ts`, `converters.ts`, `economy*.ts`, `turn-economy.ts`, `citizen-*.ts`+json, `building-resource-gate.ts`, `zelazo-access.ts`, `resource-access.ts`, `buildings.json`, `econ-params.json`, `resources.json`, `empire-food.ts`, `manpower.ts`, `population-growth-*.ts` |
| **P6.8I auto-ulepszenia** | żywność tylko na polach obywateli (FOOD-ONLY-WORKED-HEXES, SIMPLE-FOOD-RULE); irygacja nie budowana po farmach/trzodzie; wycinka lasu przy rzece (limit gracz 2/AI 1, podłoga Pracy 60, pierwszy krok tury; FALA 500); HILLS-CLEAR-REVERT; obóz łowiecki zachowuje relief wzgórza; AUTOBUILD domyślnie OFF (515, `meta.autoBuildEnabled`); drogi AI MST tylko między miastami (521) | `auto-improvements.ts`, `auto-build-gate.ts`, `road-network-plan.ts`, `relief-preserving-improvements.ts`, `terrain-improvements.ts` |
| **P6.9–10 tura** | zdarzenia żyją jedną turę; odroczenie zdarzeń na koniec tury; marsze zaplanowane tylko na koniec tury gracza (MARCH-END-OF-TURN-ONLY); następna aktywna jednostka, kolejność listy rekrutacji; widoczność fortów (`fortSightSources`, 2026-11-02) | `event-*.ts`, `eot-event-defer.ts`, `planned-march.ts`, `next-active-unit.ts`, `recruit-list-order.ts`, `visibility.ts` |
| **P6.11–12 AI i armia** | AI-ARMY-CONCENTRATION-REPLACEMENT, ALL-CIVS-GATHER-UNDER-GENERAL, SCATTERED-NOT-MERGED, MOVE-FULL-RANGE, MARCH-AVOID-FOREIGN, AI-NO-SIEGE/NO-MARCH-WITHOUT-WAR (FALA 497–502), DEFEND-HOME-BEFORE-OFFENSE, HOME-DEFENDERS-CIVILIAN-FILTER, WAR-ALLIN-KEEP-BARB-DEFENSE, zwiadowca nie lider (510), `empire-recruit-plan`, więcej wodzów niż limit (FALA 533, bramka narodzin + migracja), limit stosu armii 500 (540), AI-RESERVE/AIN10 (w toku w webie) | `ai*.ts` (8 plików), `army-concentration.ts`, `army-stack-limit.ts`, `armyMerge.ts`, `stack-leader.ts`, `generals.ts`, `empire-recruit-plan.ts`, `warAllInCapital.ts` |
| **P6.12 wojny wymuszone / zmęczenie wojną** | wojny epoki Brąz/Żelazo znów włączone (536), brak pola `playerEpochWarEnabled` w zapisie = true (542), zmęczenie wojną + karencja po pokoju 40/100 (520), przegrywający oferuje miasta za pokój (WEARY), kampania wodza | `war-weariness.ts`+json, `war-rules-params.json`, `forced-war-*` (nieportowane) |
| **P6.13 walka/oblężenie** | głód garnizonu 6/8/10% maxHP/turę, poddanie gdy ΣHP<50% (511); wypad ostatniej woli ≥80% (SIEGE-LAST-STAND), wypad w dowolnej turze (505); blokada rekrutacji/posiłków/wejścia w obleganym mieście; po poddaniu jednostka wchodzi do miasta; plakietka „tur do poddania"; wieża oblężnicza = wyłom (2026-11-04); limit bitwy 120→500 (538); jednostki spoza limitu nie giną po bitwie (535); atak ręczny oblężniczy | `siege*.ts` (7 plików), `city-fortification.ts`, `city-defense.ts`, `city-towers.ts`, `post-battle-map.ts`, `combat-params.json`, `battle/*` |
| **P6.14–15 dyplomacja/handel** | NAP wymaga Zaufania ≥30 + narzut granicy +20/flaga agresora +15 (514/515); handel wymaga tylko znajomości (CONTACT-ONLY); bezkarne zerwanie umowy handlowej po 10 turach (501); premia morska handlu tylko z portem; wymuszony pokój AI, blokada wojny przy oblężeniu | `diplomacy*.ts` (7 plików), `trade-routes.ts`, `diplomacy.json` |
| **P6.17–18 cuda/aneksja/barbarzyńcy** | cud przechodzi na kontrolującego hex z bonusami (541), nie na rebeliantów/barbarzyńców, założenie miasta przenosi cud (543); ANNEX-CITYSTATE-SPOILS; nazwa miasta zużyta na zawsze; `cluster-start` | `wonder-transfer.ts`, `capital-capture.ts`, `barbarians.ts`, `cities.ts`, `city-names-pool.ts`, `civ-names.ts`, `cluster-start.ts` |
| **P6.20–22 zapis** | migracje: nadmiar wodzów, siatka stosu >limit na starcie tury, `playerEpochWarEnabled`, `autoBuildEnabled`, niespójny właściciel cudu (web: NIE wykonana) | `save*.ts`, `civ-test-hooks.ts` |
| **Mapgen (M-)** | `relocate_forest_horses` (konie, 2026-11-03); Pangea fazy 2–3; wpływ `map-gen-params.json` | `map/*`, `map-gen-params.json` |
| **UI/3D (poza P6)** | UI po `9b019a7d8`: układ banera A (534), panele pod banerem (537), powiadomienia 3 zakładki (518), baner większe liczby (519), komunikat o rezerwie bitwy (535), muzyka cywilizacji w dyplomacji (539, `civ-music.json`, +15 MB); 3D: obóz łowiecki — relief, unitStaticMerge/pule materiałów (L3 RENDER-3) | `ui/*`, `render/*`, `audio/*` |

Zmiany webu **bez wpływu na logikę Rust** (wydajność/pamięć/minimapa: FALA 510, 522, 524–532, 531, 528) — nie wymagają REPIN logiki; jedynie L3 renderera (zob. P4).

## 0c. Rekomendowana kolejka następnych zadań (stan 2026-11-07)

Zasady doboru: rozłączne pliki (równoległość §2b: do 6 tematów, ale **maks. 2 jednocześnie z `cargo`/worktree kodu Rust** — dysk ≈ 8 GB, ≈1 GB na worktree; tematy czysto dokumentacyjne nie liczą się do limitu); polityka modeli: Operator/Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5, Operator Sonnet 5.5 tylko dla tematów trudnych (z uzasadnieniem), **Opus wyłącznie pamięć/grafika — w tej kolejce brak**; 1:1 z webem, odstępstwo = ZAŁOŻENIE do akceptacji właściciela; każdy temat zaczyna od pinu `origin/main` w chwili startu (wektory z uruchomionego weba, nie z pamięci).

| # | ID tematu | GOAL (skrót) | Allowlista | Zależności | Ryzyko | Model | Rundy |
|---|---|---|---|---|---|---|---|
| 1 | `R-RUSTPORT-REPIN-DELTA-5-Q1` | Pomiar dryfu logiki: hunki behawioralne (plik:linia) `4bbef081d`/`23dd158e9` → `origin/main`, przypisanie do tematów 2–8 i do modułów Rust, lista wektorów/`meta.pin` do regeneracji. Tylko dokumentacja. | `dyspozycje/rust-port/p6/REPIN-DELTA-5.md`, katalog runu | brak | niskie | Operator Sonnet (czytanie 91 plików/diffu — uzasadnione trudnością), Evaluator/FC Sonnet | 2–3 |
| 2 | `R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1` | Port zmian ekonomii/produkcji FALA 500–517 (§0b P6.8): m(e) zużycia obywateli, cegła ×2/Cegielnia, odlewnie, Magazyn, Spichlerz Królewski/II, limity ludności, Młyn, natywny dostęp do żelaza. Wektory z weba. | `rust-port/engine/src/domain/{turn_economy_resources,turn_economy_empirefood,turn_economy_upkeep,resource_production,resource_access/**,building_costs,city_growth,economy_city_*}.rs`, `rust-port/engine/data/**` (addytywnie), `rust-port/engine/tests/p6_repin_ekon_f_*`, `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-F.md` | częściowo #1 (hunki); może ruszyć równolegle z #1 | średnie (dużo liczb, bit-w-bit) | Haiku/Sonnet | 3–5 |
| 3 | `R-RUSTPORT-REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA-Q1` | Port zasad auto-ulepszeń po pinie `4bbef081d`: żywność tylko na polach obywateli, irygacja po farmach, wycinka lasu przy rzece (limity, podłoga Pracy 60, pierwszy krok), HILLS-REVERT, relief obozu łowieckiego, AUTOBUILD OFF, drogi MST. | `rust-port/engine/src/domain/auto_improvements*.rs` + `auto_improvements/**`, `improvements.rs`, `rust-port/engine/tests/p6_repin_autoimpr_*`, dok. `P6-REPIN-AUTOIMPROVE.md` | rozłączne z #2 (inne pliki) | średnie | Haiku/Sonnet | 3–4 |
| 4 | `R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1` | Temat 3 podziału dyplomacji: bramki wojen epoki Kamień/Brąz/Żelazo (`enabledForcedWarEras`), `playerEpochWarEnabled`, NAP Zaufanie ≥30 z narzutami, `war-weariness` + karencja, zależność od `war_rules_multiwar.rs`. | `rust-port/engine/src/domain/{diplomacy_war_gates,war_rules_multiwar,alliance_war_obligation,diplomacy_tick_war_brake}.rs` + nowe `diplomacy_multiwar*.rs`, `domain/mod.rs`, `engine/data/**`, `tests/p6_dyplo_multiwar_*`, dok. `P6-DYPLOMACJA-MULTIWAR.md` | wynik #1 zalecany; po DYPLOMACJA-PROFIL ✔ | średnie | Haiku/Sonnet | 3–5 |
| 5 | `R-RUSTPORT-P6-DYPLOMACJA-WOJNY-WYMUSZONE-Q1` | Temat 4 podziału: `forced-war-common/stone/bronze/iron` — fale wymuszonych wojen, persystencja `meta.forcedWarWavesByPairKey` (luka z audytu OpenClaw). | nowe `domain/forced_war*.rs`, `domain/mod.rs`, `data/**`, `save_load.rs` (addytywnie), testy `p6_forced_war_*` | **po #4** (wspólne bramki) | **wysokie** (§5 ryzyko 1) | Operator Sonnet (algorytm stanowy), reszta Sonnet | 4–5 (możliwy podział na A/B) |
| 6 | `R-RUSTPORT-P6-AI-ARMIA-ZBIORKA-MARSZ-Q1` | Port AI armii: `army-concentration`, `ai-march-guard`, `ai-war-home-defense`, `ai-war-target-select`, zwiadowca nie lider, bramki „bez marszu/oblężenia bez wojny", limit stosu 500. | nowe `domain/ai_army*.rs`, `ai_turn.rs` (wpięcie, addytywnie), `army_consolidation.rs`, `tests/p6_ai_armia_*` | po #5 (`forced_war_*`) i #1 | **wysokie** | Operator Sonnet, reszta Sonnet | 4–5 |
| 7 | `R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1` | Port oblężenia i zdobyczy: głód garnizonu, poddanie, wypad, blokada rekrutacji, wejście do miasta, limit bitwy 500, transfer cudu, aneksja miasta-państwa. | nowe `domain/siege*.rs`, `combat.rs`, `wonder_placement.rs`, `fort_territory.rs`, `tests/p6_oblezenie_*` | rozłączne z #2–#4 (inne pliki); #1 | średnie-wysokie | Haiku/Sonnet | 4–6 |
| 8 | `R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1` | Pola i migracje zapisu: `autoBuildEnabled`, `playerEpochWarEnabled`, nadmiar wodzów, siatka stosu, właściciel cudu, `forcedWarWavesByPairKey`. | `save_load.rs`, `session.rs`, `tests/p6_zapis_*` | po #5, #7 | średnie | Haiku/Sonnet | 2–3 |

**Plan fal (limit dysku: 2 worktree kodu):** fala 1 = #1 (dok.) + #2 + #3; fala 2 = #4 + #7 (gdy zwolnią się sloty); fala 3 = #5; fala 4 = #6 i #8. Dispatche gotowe dla pozycji 1–4: `dyspozycje/autobot/runs/<ID>/00-dispatch.md`. Pozycje 5–8 tylko w tabeli (dispatch po PASS zależności).

## 1. Zasady nadrzędne

1. Źródłem prawdy jest **aktualny `main` repo webowego** (`maciejsieracki/The-Game`), re-pinowany na starcie P0 i przy każdej rundzie P8 (parity pass) — nie stary snapshot z 2026-09. **Ta zasada obowiązuje też przy KAŻDYM reużyciu starego materiału Rust lub audytu webowego** (archiwum OpenClaw, worktree-overlays, stare gałęzie Rust): stary kod/audyt mógł powstać na starszym pinie webowym (np. `69ccb145`, zatwierdzony w poprzednim procesie, 59 commitów za obecnym `edb8fb56`). Zanim cokolwiek z takiego materiału trafi do klasyfikacji REUSE/ADAPT albo do P1/P2, Operator musi jawnie sprawdzić i zapisać: na jakim pinie webowym ten materiał powstał, i czy delta do `edb8fb56` unieważnia go częściowo/całkowicie. Brak takiej weryfikacji = materiał traktowany jako `UNKNOWN`, nigdy jako `REUSE`.
2. Cel to **zachowanie zachowania 1:1** (UI, dane, reguły gameplayu, komunikaty) — architektura wewnętrzna Rust/Tauri nie musi kopiować struktury plików TS.
3. Web pozostaje **wyłącznie referencją read-only** — zero zmian w `gra/**` w ramach tego projektu.
4. Zakaz budowania "drugiej uproszczonej gry": fake DOM zamiast renderera, hard-coded podzbiór cywilizacji, placeholder zamiast realnego systemu — każdy taki skrót dyskwalifikuje temat na Final Control.
5. Wydajność jest **ostatnią bramą** (P10) — do tego czasu liczy się wyłącznie poprawność funkcjonalna/wizualna/deterministyczna.
6. Każdy istniejący fragment kodu Rust dostaje w P1/P2 jedną z etykiet: `REUSE` / `ADAPT` / `REPLACE` / `UNKNOWN` — nic nie jest automatycznie zachowywane ani automatycznie wyrzucane.

## 2. Proces wykonawczy (mój, nie OpenClaw)

Dla każdego tematu/modułu:

```
Orkiestrator (ja) przygotowuje dispatch (GOAL, allowlista, kryteria binarne, plan testów, worktree)
  → Workflow, agent() #1: Operator (Haiku 5.5, medium) implementuje w izolowanym worktree
  → Workflow, agent() #2: Evaluator (Haiku 5.5, medium) — adwersaryjnie, numerowane zarzuty, lista może być pusta
  → (tylko jeśli zarzuty niepuste) Workflow, agent() #3: Operator — Obrona, ta sama runda
  → Workflow, agent() #4: Final Control (Sonnet 5.5, medium) — per zarzut: NAPRAW / ODDAL / DO DECYZJI WŁAŚCICIELA
  → ja integruję (scoped diff od merge-base, nigdy ślepy git apply całej gałęzi), uruchamiam bramki referencyjne Rust (cargo test) sam, commituję
```

**Jedna zasada bez wyjątków od tej poprawki:** żadna z czterech ról nie jest dispatchowana przez narzędzie `Agent` (subagent) ani wykonywana przeze mnie bezpośrednio — wyłącznie `agent()` wewnątrz skryptu Workflow, w tym samym albo kolejnym skrypcie tego samego tematu. Dotyczy to też pracy rozpoznawczej (np. P0.1–P0.3) — jeśli to realna praca nad tematem (nie czysto administracyjna czynność orkiestratora typu `git status`/odczyt pliku do dispatchu), idzie przez Workflow.

Limit rund: 5, jak w reszcie tego repo. Po 5 rundach bez PASS — `LIMIT-5-EXCEEDED`, decyzja właściciela.
Jeden pisarz na worktree. Allowlista per temat, nigdy `git add -A`.
Raport Final Control musi zawierać: hash/diff zakres, komendy testów i ich realny wynik (nie deklarację), porównanie z web-source dla tego konkretnego zachowania.

### 2b. Równoległość tematów — do 6 jednocześnie (dodane 2026-10-20, na żądanie właściciela)

Żeby w pełni wykorzystać możliwości Workflow, prowadzę **do 6 niezależnych tematów jednocześnie**,
każdy jako osobne wywołanie narzędzia Workflow (osobny `runId`, osobna pętla rund w tle) — nie jedno
wywołanie obsługujące 6 tematów naraz. Zgodne z istniejącą konwencją tego repo
(`civ-autobot-workflow` §5): pula 6, efektywnie ~5 tematów jeśli watchdog orkiestratora dzieli z nią
limit uwagi — liczba 6 to pojemność dispatchu, nie gwarancja że wszystkie 6 idą do PASS w tym samym
tempie.

**Zweryfikowane fakty techniczne (nie z pamięci, zmierzone w tej sesji):**
- Ten kontener ma 4 rdzenie (`nproc`), więc limit współbieżnych `agent()` **wewnątrz jednego**
  wywołania Workflow to `min(16, nproc-2)` = **2**. Nie ogranicza to liczby tematów, bo pipeline
  Operator→Evaluator→Final Control jednego tematu jest **sekwencyjny** (jedna rola aktywna naraz) —
  6 tematów naraz oznacza najwyżej 6 jednoczesnych `agent()` w całej sesji, po jednym na temat.
- Nie istnieje udokumentowany twardy pułap liczby **oddzielnych** wywołań Workflow (osobnych
  `runId`) działających jednocześnie w tle w jednej sesji — traktować empirycznie: jeśli dispatch
  szóstego tematu zacznie się wyraźnie opóźniać albo kolejkować, to jest sygnał do zejścia z 6 na
  mniej, nie błąd do zignorowania.

**Zasada ciągłości (dodane 2026-10-20, na żądanie właściciela):** gdy temat w puli się zamyka
(PASS / FAIL ostateczny / DECISION_REQUIRED / LIMIT-5-EXCEEDED), natychmiast otwieram kolejny,
bezkolizyjny temat w zwolnionym slocie — pula 6 ma być stale w pełni wykorzystana, bez przestojów
między falami, dopóki jest jeszcze gotowa, bezkolizyjna praca do zrobienia w aktywnej fazie.

**Zasady przy wielu tematach naraz:**
1. Każdy temat ma własny pełny dispatch (`dyspozycje/autobot/runs/<ID>/00-dispatch.md`), własny wpis
   w `dyspozycje/rust-port/LEDGER.md`, własną allowlistę.
2. **Tematy dotykające tych samych plików nigdy nie idą w tej samej fali** — dispatchowane
   sekwencyjnie, jeden po drugim, nie równolegle (ta sama reguła co w `civ-autobot-workflow` §dispatch
   checklist). Przed otwarciem nowego tematu sprawdzam allowlisty aktywnych tematów pod kątem
   pokrywania się ścieżek.
3. Limit rund (5) i ledger prowadzone **per temat**, nie wspólnie.
4. Integracja (commit) nadal wyłącznie moja, po PASS danego tematu — różne tematy integruję osobnymi
   commitami, nie zbiorczo.
5. `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md` §Status bieżący trzyma listę wszystkich aktywnych
   tematów (do 6), nie jeden wiersz — aktualizowana po każdym zdarzeniu (dispatch/PASS/FAIL/itd.).

### 2a. Dwie zasady przejęte wprost z `autobot-controller` (uniwersalne, nie OpenClaw-specyficzne)

Właściciel słusznie zwrócił uwagę, że ten skill niesie zasady pierwotnie przeniesione z AutoBota tego repo, nie obcą infrastrukturę. Dwie z nich przyjmuję wprost do tego projektu:

1. **Ślad dowodowy zapisuję w momencie zajścia fazy, nie rekonstruuję go później z pamięci.** Każdy plik `0X-operator.md`/`0X-evaluator.md`/`0X-final-control.md` w `dyspozycje/autobot/runs/<ID>/` powstaje zaraz po zakończeniu tej konkretnej fazy — ledger odtworzony dopiero z raportu końcowego nie jest dowodem rzeczywistych przejść.
2. **PASS wymaga realnie zweryfikowanych, niezależnych faz; nie wolno sugerować niezależności, której nie ma.** Operator/Evaluator dispatchowane przez Workflow jako osobne wywołania `agent()` na Haiku 5.5 są prawdziwie niezależne. Jeśli kiedykolwiek sam (bez osobnego dispatchu) pełnię dwie role w jednej turze — muszę to jawnie oznaczyć jako `logical-single-session` w raporcie, zamiast milcząco sugerować dwie niezależne oceny.

## 3. Hierarchia źródeł

1. Decyzje właściciela w tym repo (rejestr decyzji / bezpośrednie polecenia w czacie).
2. Aktualny, świeżo pinowany commit `main` repo webowego.
3. Zaakceptowany kontrakt Rust (powstaje w P2).
4. Istniejący `rust-port/engine` i gałęzie Hermes/real24-staging — wyłącznie jako materiał do klasyfikacji REUSE/ADAPT/REPLACE.
5. Dokumenty OpenClaw (`PLAN-RUST-PORT-ORCHESTRACJA-20260920.md`, audyty) — wyłącznie historia/kontekst, nie źródło wymagań.

---

## 4. Graf faz i zadań

### P0 — kalibracja i pinning (szacunek: 1–2 dni)

- P0.1 Ustalić aktualny `main` web (`git ls-remote` na żywo, nie z pamięci), zapisać SHA + datę.
- P0.2 Policzyć manifest SHA-256 wszystkich plików `gra/**` na tym pinie.
- P0.3 Zmapować istniejący `rust-port/engine` + gałęzie (`autobot/real24-staging`, `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`, `hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915`): HEAD, pliki, testy, co faktycznie się kompiluje (`cargo test`, `cargo build`) na żywo, nie z deklaracji starych raportów.
- P0.4 Zdecydować i zapisać: start od `rust-port/engine` jako referencja do adaptacji (patrz §0.1) — chyba że właściciel zdecyduje inaczej.
- P0.5 Założyć docelową gałąź/worktree projektu, allowlistę top-level (`rust-port/**`, zakaz `gra/**`).
- P0.6 Zapisać ten dokument jako decyzję projektu + pierwszy dispatch P1.1.

**Bramka P0:** web pinned z hashem, istniejący Rust skatalogowany z realnym (nie deklarowanym) wynikiem `cargo test`, allowlista zapisana.

### P1 — audyt aktualnego weba i reference pack (szacunek: 2–4 tyg. przy Haiku-operatorach, równolegle po modułach)

Cel: spisać DOKŁADNIE co ma robić Rust, zanim ktokolwiek napisze linijkę kodu portu.

- P1.1 Katalog plików/modułów `gra/src/game` (179 plików), `gra/src/ui` (105), `gra/src/map`, `gra/src/units`, `gra/src/battle`, `gra/src/render`, entry pointy.
- P1.2 Toolchain: jak się buduje/uruchamia web dziś (node, vite, zakaz `npm run build/dev` bez scratch outDir — C-001 z CLAUDE.md tego repo).
- P1.3–P1.9 Przejść ręcznie (żywy Chromium) każdy ekran: intro, wybór epoki, wybór cywilizacji (wszystkie pozycje), warianty liczby cywilizacji/mapy, ustawienia gry, generowanie świata (kilka seedów), ekran mapy/HUD/panele/tooltipy/dialogi.
- P1.10 Katalog viewportów/breakpointów UI.
- P1.11 Katalog assetów: fonty, ikony, sprite'y, modele 3D, dźwięki.
- P1.12 Katalog pełnych danych: `gra/data/*.json` (30 plików: cywilizacje, epoki, tereny, budynki, jednostki, zasoby, dyplomacja, handel, kultura/religia, parametry AI).
- P1.13 Katalog komend/eventów/przejść stanu (na podstawie `main.ts` i modułów `game/*.ts`).
- P1.14 Katalog mechanizmów gameplayu z podziałem na podsystemy (patrz §5 niżej — to jest serce portu):
  - ekonomia tury (produkcja, dochód, koszty, magazyn, bankowanie),
  - miasta (założenie, wzrost, populacja, budynki, okolica/worked tiles),
  - jednostki (rekrutacja, ruch, HP/manpower, upgrade, auto-zarządzanie),
  - walka (pojedyncza, auto-battle, oblężenie, straty, rozpad),
  - AI (ekspansja, budowa, dyplomacja, wymuszone wojny/fale, zachowanie trudności),
  - dyplomacja (relacje, traktaty, audiencje, handel, aneksja/wasalizacja),
  - kultura/religia,
  - cuda świata/technologie,
  - państwa-miasta,
  - barbarzyńcy,
  - hot-seat (dwóch graczy ludzkich na jednym urządzeniu),
  - save/load.
- P1.15 Zrzuty referencyjne (screenshoty) + zrzuty DOM/stanu dla każdego scenariusza z P1.3–P1.9.
- P1.16 Spisane edge case'y i znane błędy (bez benchmarków).
- P1.17 Porównanie z istniejącym `rust-port/engine`: per moduł web → `REUSE`/`ADAPT`/`REPLACE`/`UNKNOWN`.
- P1.18 Macierz `zachowanie web → moduł Rust docelowy → scenariusz akceptacyjny` — to jest kontrakt odbioru dla P8.

**Bramka P1:** reference pack kompletny, z hashami i macierzą klasyfikacji całego istniejącego kodu Rust.

### P2 — kontrakt domeny Rust + adapter Tauri (szacunek: 1–2 tyg.)

- P2.1 Moduły domeny: world/teren/rzeki/granice, cywilizacje, miasta, jednostki, ekonomia, tury, AI, walka, dyplomacja, kultura/religia, handel, cuda/tech, państwa-miasta, barbarzyńcy, persystencja.
- P2.2 Canoniczny `GameState` + niezmienniki.
- P2.3 ID encji i relacje (miasto↔właściciel↔fotel, jednostka↔miasto, itd. — w tym hot-seat: dwóch ludzkich właścicieli).
- P2.4 Seed/RNG deterministyczny (zgodny z `Mulberry32`/LCG już używanym w `map_generator.rs` — zweryfikować zgodność z web RNG).
- P2.5 Pełny zestaw komend frontend→Rust (dziś jest 6, docelowo dziesiątki: rekrutacja, budowa, dyplomacja, handel, badania, zarządzanie automatyczne, itd.).
- P2.6 Pełny zestaw eventów Rust→frontend.
- P2.7 Serializacja/wersjonowanie save (zgodność z web `meta.forcedWarWavesByPairKey` i resztą stanu zapisu — już zidentyfikowany realny gap w audycie OpenClaw).
- P2.8 Adapter Tauri — granice odpowiedzialności (co robi Rust, co JS/frontend).
- P2.9 Mapowanie ID assetów/danych (web JSON → Rust struktury, z zachowaniem kluczy).
- P2.10 Fixtures testowe + replay fixtures.
- P2.11 Reguła kompatybilności save/load między wersjami.
- P2.12 Macierz zgodności kontraktu wobec wszystkich scenariuszy P1.
- P2.13 Niezależna kontrola kontraktu (Final Control) przed otwarciem P3–P6.

**Bramka P2:** wersjonowany kontrakt komend/eventów/stanu zaakceptowany; frontend nie duplikuje logiki domenowej.

### P3 — fundament, dane, assety (szacunek: 2–4 tyg., duża równoległość po P2)

- P3.1–P3.2 Czysty worktree integracyjny, toolchain (`cargo build/test` zielony od zera).
- P3.3 Błędy/logging/diagnostyka.
- P3.4 ID/config/wersjonowanie.
- P3.5–P3.7 Przeniesienie **wszystkich** 30 plików `gra/data/*.json` 1:1 (nie podzbioru) — cywilizacje, epoki, tereny, budynki, jednostki, zasoby, dyplomacja, handel, kultura/religia, AI params.
- P3.8 Assety (fonty, ikony, modele, dźwięki) z kontrolą kompletności wobec P1.11.
- P3.9 Loader/walidator danych.
- P3.10 Fixtures seedów/map/scenariuszy z P1.
- P3.11–P3.12 Testy zgodności liczby/ID cywilizacji i brakujących/uszkodzonych danych.
- P3.13 Final Control danych i assetów przed otwarciem P4–P6.

**Bramka P3:** dane ładowane ze źródła (nie hard-coded), manifest assetów przechodzi walidację wobec web.

### P4 — model świata i renderer (szacunek: 3–6 tyg.)

- P4.1–P4.5 Geometria heksagonalna, generator świata z seedem, teren/przejścia, rzeki/granice/widoczność, model miast/jednostek/zasobów/overlay.
- P4.6–P4.10 Prawdziwy renderer mapy (nie HTML grid), zoom/pan/viewport, picking/hit-testing, selekcja/highlight, tooltipy.
- P4.11 Podłączenie assetów.
- P4.12–P4.14 Odtworzenie fixture mapy z P1, test mutacyjny wykrywający placeholder, niezależny test wizualny/interakcyjny.

**Bramka P4:** realna mapa, klikalna, bez fake DOM.

### P5 — frontend/UI 1:1 (szacunek: 3–6 tyg.)

- P5.1–P5.6 Shell aplikacji, intro, wybór epoki/cywilizacji, ustawienia gry, generowanie/loader/progress/error.
- P5.7–P5.10 HUD, panele miast/budynków/jednostek, tooltipy/dialogi/błędy, stany hover/selected/disabled/focus.
- P5.11–P5.12 Typografia/kolory/spacing/ikony, responsywność.
- P5.13 Podłączenie do kontraktu z P2 — zero lokalnej symulacji w JS/frontend.
- P5.14–P5.15 Porównania screenshot/DOM per ekran, niezależny Evaluator UI.

**Bramka P5:** ekran po ekranie zgodny z pinned web, włącznie ze stanami błędów.

### P6 — gameplay core (szacunek: 6–12 tyg. — **największa i najbardziej ryzykowna faza**)

To jest serce portu — każdy punkt odpowiada realnemu systemowi z `gra/src/game/` (179 plików):

- P6.1 Stan początkowy/seed/inicjalizacja (w tym hot-seat: dwóch właścicieli ludzkich).
- P6.2 Walidacja komend, transakcyjność mutacji.
- P6.3 Teren/przechodniość/koszty ruchu.
- P6.4–P6.5 Jednostki: tworzenie, lifecycle, ruch, kolejka aktywności, manpower/HP, upgrade.
- P6.6–P6.8 Miasta: założenie, wzrost populacji, ekonomia/produkcja, budynki i efekty, okolica (worked tiles).
- P6.9–P6.10 Tura gracza (początek/akcje/koniec), aktualizacja świata.
- P6.11–P6.12 AI: inicjalizacja/priorytety, ruch/rozwój/koniec tury AI, **w tym wymuszone wojny i fale (forced-war-waves — nowy, nieportowany system)**.
- P6.13 Walka: pojedyncza, auto-battle, oblężenie, straty, zajęcie pola, łup.
- P6.14 Dyplomacja: relacje, traktaty, audiencje, aneksja/wasalizacja.
- P6.15 Handel i szlaki.
- P6.16 Kultura/religia.
- P6.17 Cuda świata i drzewko technologii.
- P6.18 Państwa-miasta i barbarzyńcy.
- P6.19 Warunki zwycięstwa/porażki.
- P6.20 Save.
- P6.21 Load (w tym błędne pliki, wersjonowanie, kompatybilność wsteczna).
- P6.22 Reprodukowalny replay.
- P6.23 Testy funkcjonalne + regresyjne każdego modułu.
- P6.24 Niezależny Evaluator całego gameplayu.

Każdy moduł: test stanu przed/po, przypadki negatywne, readback przez adapter. Zero benchmarków na tym etapie.

### P7 — integracja Rust↔Tauri↔frontend (szacunek: 2–4 tyg.)

- P7.1–P7.2 Rejestracja i weryfikacja wszystkich komend/eventów Tauri.
- P7.3–P7.4 Podłączenie stanów loading/empty/disabled/error, mapy/HUD/paneli/dialogów.
- P7.5 Usunięcie atrap/hard-code/martwych ścieżek.
- P7.6–P7.7 Serializacja payloadów, restart aplikacji i odtworzenie stanu.
- P7.8–P7.9 E2E: start→setup→mapa→akcja→tura; testy błędnych komend.
- P7.10 Niezależny Evaluator integracji.

**Bramka P7:** cała ścieżka używa realnego stanu Rust i realnego renderera.

### P8 — pełny parity pass (szacunek: 3–6 tyg.)

- P8.1 Identyczne seedy/ustawienia web vs Rust.
- P8.2–P8.12 Odtworzenie: start/onboarding, każda cywilizacja, warianty 3/5/7/9, generowanie mapy, ruch/selekcja, miasto/budynek/ekonomia, tura gracza/AI, walka, save/load, zwycięstwo/porażka, wszystkie błędy/edge case'y.
- P8.13–P8.14 Porównanie stanu po każdej istotnej akcji; porównanie screenshotów/tekstów/komunikatów/assetów.
- P8.15 Każdy finding: diagnoza→poprawka→test→evidence→readback.
- P8.16 Niezależny Evaluator pełnej macierzy parytetu.

**Bramka P8:** brak krytycznych różnic funkcjonalnych/wizualnych wobec świeżo pinowanego weba.

### P9 — kontrola funkcjonalna i integracja (szacunek: 1–2 tyg.)

Operator→Evaluator→Obrona→Final Control→Integracja na całości, zgodnie z §2. Zero push/merge/deploy/instalacji bez osobnej zgody właściciela.

### P10 — wydajność (dopiero po P9, szacunek: 2–6 tyg.)

Baseline web vs Rust, latency (start/mapa/klik/ruch/wejście do miasta), CPU/RSS przy rosnącej liczbie miast, wielotydniowe/wieloturowe sesje. Każdy regres: przyczyna→poprawka→pełna sekwencja kontroli→powtórka benchmarku. Wynik P10 nie zastępuje P8.

### P11 — packaging i dostarczenie (dopiero po osobnej zgodzie właściciela, szacunek: 1–2 tyg.)

Platformy docelowe, build release, kontrola assetów w paczce, czysta instalacja/uruchomienie, hashe/receipty dostarczenia. Push/merge/deploy wyłącznie po osobnej, jawnej zgodzie.

---

## 5. Najwyższe ryzyko (gdzie realnie może "wybuchnąć" harmonogram)

1. **AI + wymuszone wojny/fale** (`forced-war-waves.ts` i cała rodzina `ai-*.ts`, ~25 plików) — zupełnie nieportowane, złożona logika stanowa z persystencją w save. Historia tego repo pokazuje, że to jeden z najczęściej poprawianych systemów w grze webowej — oznacza ruchomy cel.
2. **Hot-seat** (dwóch graczy ludzkich na jednym urządzeniu) — już zidentyfikowany jako `PARTIAL` w poprzednim audycie; wymaga osobnego traktowania properties per-fotel w całym stanie gry, nie jednego globalnego "gracza".
3. **Dyplomacja + handel** — duża liczba wzajemnie zależnych plików (`diplomacy-*.ts`, ~15 plików), narracyjne komunikaty 1:1.
4. **Save/load wsteczna kompatybilność** — web ma już wieloletnią historię formatu zapisu; Rust musi to odtworzyć, nie zaprojektować od zera.
5. **179 plików `gra/src/game` vs. ~24 moduły istniejącego Rust** — rzeczywisty zakres portu jest wielokrotnie większy niż to, co dziś istnieje w Ruście, niezależnie od tego, ile "R01–R24" brzmi kompletnie w nazwach commitów.

**Aktualizacja 2026-11-07 (stan faktyczny):**

6. **Ruchomy cel weba — dryf po pinach.** Od pinu logiki `4bbef081d` web zmienił 91 plików `gra/src/game`+`gra/data` (+16 468/−2 296 w całym `gra/src`+`data`), a FALA 534–543 dochodzą dalej (kolejka webowa nie jest pusta: AIRESERVE/AIN10, AI-PLAYER-PARITY-FIXES, FULLREG). Piny portu są rozjechane (UI/3D `9b019a7d8`, logika `4bbef081d`/`23dd158e9`, mapgen `86d510c66`). Mitygacja: temat `REPIN-DELTA-5` jako pomiar bazowy, każdy temat portu liczy dryf do `origin/main` na starcie, finalny „jeden ruch pinu" (U4) dopiero po zamknięciu kolejki webowej.
7. **Brak produkcyjnej pętli tury.** Silnik ma ≈20 modułów `turn_economy_*`, ale kilka jest „osiągalnych tylko z testów" (np. `run_city_economy_resource_phase`, hak `OkolicaPopulationHook`, brak wywołującego `pick_auto_improvements`). Ryzyko: P7 odkryje, że moduły 1:1 z wektorami nie składają się w grę. Mitygacja: wcześniejszy, wąski temat wpięcia (po #6/#7 kolejki §0c) zamiast czekania do P7.
8. **Dług dyplomacji: 8 z 10 tematów podziału nieruszone** (≈17 400 LOC webu) + AI `forced-war-*`; połączone ze zmianami webu (NAP, wojny epoki, zmęczenie wojną) tworzy największy blok P6.
9. **Dysk i równoległość.** Realny limit to 2 worktree kodu Rust (≈1 GB każdy, wolne ≈8 GB); incydenty ENOSPC 2026-11-04. Wydłuża P6 względem założenia „do 6 równoległych".
10. **Konflikty merge we wspólnych plikach** (`package.json`, manifesty UI, `domain/mod.rs`, `P5-REPIN-UI-2.md`) — każdy równoległy temat to ręczna integracja; reguła: scalenie addytywne + `npm run check`/`cargo` po każdym merge.
11. **Nowe epoki (Klasyczna, Średniowieczna)** mają powstać dopiero przy „nowej wersji Rust" (decyzja 2026-11-05): dane/silnik muszą traktować epokę jako parametr (bez sufitu ×4) — ryzyko przeróbek, jeśli P6.8 zostanie zamknięte przed uwzględnieniem tego.

## 6. Szacunek czasu (zaktualizowany pod Haiku-operatorów)

| Faza | Szacunek przy Sonnet-operatorach | Szacunek przy Haiku 5.5 medium (więcej rund) |
|---|---:|---:|
| P0 | 1–2 dni | 2–3 dni |
| P1 | 2–4 tyg. | 3–6 tyg. |
| P2 | 1–2 tyg. | 2–3 tyg. |
| P3 | 2–4 tyg. | 3–6 tyg. |
| P4 | 3–6 tyg. | 5–9 tyg. |
| P5 | 3–6 tyg. | 5–9 tyg. |
| P6 | 6–12 tyg. | 10–18 tyg. |
| P7 | 2–4 tyg. | 3–6 tyg. |
| P8 | 3–6 tyg. | 5–9 tyg. |
| P9 | 1–2 tyg. | 1–2 tyg. (Final Control na Sonnet, bez zmiany) |
| P10 | 2–6 tyg. | 2–6 tyg. |
| P11 | 1–2 tyg. | 1–2 tyg. |
| **Razem** | **~6–8 miesięcy** | **~9–13 miesięcy** |

**Aktualizacja 2026-11-07 (realny stan po ≈2,5 tyg. od startu 2026-10-20; szacunki = ZAŁOŻENIE orkiestratora, do korekty po `REPIN-DELTA-5`):**

| Faza | Stan | Pozostało (przy 2 slotach kodu Rust, Haiku/Sonnet) |
|---|---|---|
| P0–P3 | zamknięte | 0 |
| P4 | CPU/model zamknięte; GPU czeka na maszynę właściciela, L3 po kompozytorze jednostek | 1–2 tyg. (RR-T1 poza kontrolą orkiestratora) |
| P5 | zamknięte do webu `9b019a7d8` | 1–2 tyg. (REPIN-UI-4 + K09C/K09D po DTO z P6) |
| P6 | CZĘŚĆ — mapgen, ekonomia miast ✔; dyplomacja 2/10 tematów podziału; AI/wojny i walka częściowo (procent postępu NIE zmierzony — szacunek bez metody usunięty) | **10–16 tyg.** (kolejka §0c ≈ 4–6 tyg. dla pozycji 1–8; potem dyplomacja 3–10, handel, kultura, państwa-miasta, zwycięstwo, hot-seat, zapis) |
| P7 | nierozpoczęte | 3–6 tyg. (częściowo równolegle z końcówką P6) |
| P8 | nierozpoczęte | 5–9 tyg. |
| P9 | nierozpoczęte | 1–2 tyg. |
| P10 | nierozpoczęte | 2–6 tyg. |
| P11 | nierozpoczęte, za zgodą | 1–2 tyg. |
| **Razem pozostało** | | **suma szeregowa 24–45 tyg. ≈ 5,5–10,5 miesiąca** (P4 1–2 + P5 1–2 + P6 10–16 + P7 3–6 + P8 5–9 + P9 1–2 + P10 2–6 + P11 1–2). Dolna granica zakłada nakładanie P7/P8 z końcówką P6 (nieskwantyfikowane — ZAŁOŻENIE do korekty po `REPIN-DELTA-5`). Poprzednio 9–13 mies. od zera; spadek wynika ze zrobionych P0–P5, ale P6 jest wolniejsze od założenia z powodu limitu dysku i ruchomego weba |

To są szacunki kalendarzowe przy kontrolowanej równoległości (kilka tematów naraz w rozłącznych worktree), nie przy jednym wątku pracy. Po P0/P1 wrócę z dokładniejszą estymacją opartą o rzeczywistą liczbę modułów/scenariuszy, nie o ten przedział.

---

## 7. Pierwszy cykl wykonawczy

Wszystko poniżej — włącznie z rekonesansem P0 — idzie przez Workflow (`agent()`), nigdy przeze mnie bezpośrednio:

1. Workflow, agent() Operator (Haiku 5.5, medium): `git ls-remote` na żywo + manifest hash web (P0.1–P0.2), realny `cargo test`/`cargo build` na `rust-port/engine` i na gałęziach z Tauri (P0.3) — bez ufania starym deklaracjom "218/218" sprzed miesiąca.
2. Workflow, agent() Evaluator (Haiku 5.5, medium): adwersaryjna kontrola wyniku P0.1–P0.3 (czy hash/wynik testów faktycznie zweryfikowany na żywo, nie zadeklarowany).
3. Workflow, agent() Final Control (Sonnet 5.5, medium): zatwierdzenie bramki P0 przed otwarciem P1.
4. Dopiero po PASS P0: Workflow, pierwszy wycinek P1 (katalog plików + toolchain, P1.1–P1.2) jako pilot Operator→Evaluator→Final Control.
5. Ja (orkiestrator): czytam wyniki każdego kroku, prowadzę ledger/licznik rund w `dyspozycje/rust-port/LEDGER.md`, i po PASS wykonuję samą integrację (commit) — bez samodzielnego wykonywania pracy merytorycznej.

## 8. Mechanizm autonomicznej kontynuacji (dodane 2026-10-20, na żądanie właściciela)

Cztery trwałe mechanizmy, działające razem, żeby praca szła do przodu niezależnie od obecności właściciela w czacie:

1. **TaskCreate/TaskUpdate** — lista zadań tej sesji śledząca aktualny krok wykonawczy (nietrwała między sesjami, ale widoczna właścicielowi na bieżąco).
2. **Scheduled task (`create_trigger`)** — cykliczne wybudzenie tej samej sesji (patrz `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md` §Automatyzacja po dokładny interwał i treść promptu), które każdorazowo: czyta ledger, sprawdza wynik ostatniego Workflow, integruje PASS, otwiera kolejny dispatch Workflow i aktualizuje plik GOAL.
3. **Trwały plik repo** — `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md` jako kanoniczna kotwica celu i statusu, niezależna od pamięci sesji czy scratchpadu; każda przyszła sesja (ta sama po wznowieniu albo inny agent) czyta go na starcie pracy nad tym tematem.
4. **Pętla w skrypcie Workflow** — w ramach jednego dispatchu, skrypt sam zapętla rundy Operator→Evaluator→(Obrona)→Final Control aż do PASS/FAIL/`LIMIT-5-EXCEEDED`, bez czekania na mój ręczny re-dispatch między rundami tego samego tematu.
