# GOAL — Port "The Game" (web) → Rust/Tauri, pełny parytet 1:1

**Status dokumentu:** TRWAŁA KOTWICA CELU — aktualizowana po każdym cyklu Workflow (orkiestrator). Nie usuwać, nie przenosić bez jawnej decyzji właściciela.
**Utworzono:** 2026-10-20
**Pełny plan:** `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md`
**Ledger rund:** `dyspozycje/rust-port/LEDGER.md`

## GOAL

Ukończyć funkcjonalny i wizualny port gry webowej `maciejsieracki/The-Game` (`gra/**`) do aplikacji Rust/Tauri, zachowując zachowanie 1:1 (UI, dane, reguły gameplayu, komunikaty). Wydajność jest ostatnią bramą (P10), nie substytutem parytetu (P8). Packaging/dostarczenie (P11) dopiero po osobnej, jawnej zgodzie właściciela.

## Decyzje przyjęte (§0 pełnego planu)

1. Baza startowa: `rust-port/engine` + gałęzie Tauri = **biblioteka referencyjna**, nie baza kontynuacji.
2. Lokalizacja: nowa gałąź w tym repo, `rust-port/parity-v2` (tematy robocze nadal pod `autobot/<ID>`).
3. Model routingu: Orkiestrator = Sonnet 5.5 (tylko orkiestruje). Operator/Evaluator = Haiku 5.5 medium. Final Control = Sonnet 5.5 medium. **Wszystkie trzy role wyłącznie przez `agent()` w skryptach Workflow — nigdy przez narzędzie `Agent`, nigdy wykonywane bezpośrednio przez orkiestratora.**
4. **(2026-10-21, jawna decyzja właściciela w czacie)** Orkiestrator pracuje SAMODZIELNIE i AUTONOMICZNIE, na zasadzie AutoBota, aż do ukończenia WSZYSTKICH faz planu (P0→P11), bez pytania o zgodę na przejście między fazami. Gdy bramka danej fazy zamyka się (wszystkie jej tematy PASS), orkiestrator od razu, bez czekania na kolejne polecenie, otwiera dispatch pierwszych tematów następnej fazy wg grafu §4 planu. **To NIE znosi istniejących, trwałych barier:** zakaz `npm run build`/`dev` w `gra/`, zakaz READY_FOR_DEPLOY/deploy/push bez osobnej, jawnej zgody właściciela (P11 jawnie wymaga tego osobno — patrz GOAL wyżej), eskalacja do właściciela przy GENUINE `DECISION_REQUIRED` (decyzja produktowa, nie administracyjna pomyłka orkiestratora — rozróżnienie z precedensu P1.17c/P1.16b), oraz zasada „do 6 tematów naraz, tematy na tych samych plikach sekwencyjnie". Jeśli faza wymaga decyzji, której wytwór sam nie rozstrzyga (np. wybór architektury, kompromis projektowy bez jednoznacznej odpowiedzi w kodzie/audycie) — orkiestrator pyta `AskUserQuestion`, nie zgaduje i nie blokuje się w nieskończoność.

## Równoległość tematów — do 6 jednocześnie (§2b planu)

Do 6 niezależnych tematów naraz, każdy jako osobne wywołanie Workflow (osobny `runId`). Tematy
dotykające tych samych plików — zawsze sekwencyjnie, nigdy w tej samej fali. Ten kontener ma 4 rdzenie
(limit `agent()` wewnątrz jednego Workflow = 2), ale pipeline per temat jest sekwencyjny, więc 6 tematów
= najwyżej 6 jednoczesnych `agent()` w całej sesji.

## CEL PĘTLI AUTONOMICZNEJ (właściciel, 2026-10-29: "pracuj w pętli, ustal cel, leć samodzielnie jak długo możesz")
**Cel końcowy:** ukończyć wszystkie fazy planu P0→P11 portu Rust/Tauri z pełnym parytetem względem aktualnego weba (po re-pinie z T0), każdy temat ścieżką 11 etapów (`R-PROC-AUTOBOT.md` §5d).
**Cel bieżący (do wtorku 2026-11-03):** (1) zamknąć pierwszą falę (REPIN-DELTA, M05B, P5.8 podział, P4.36 Q3); (2) z każdym zwolnionym slotem otwierać następny gotowy, bezkolizyjny kawałek wg `PLAN-PO-WZNOWIENIU-20261029.md` §1 (T1 mapgen M06A→…→M18; T2 P6.8; T3 porty sekcji `cityPanel.ts`; T4–T8) — tylko lekkie tematy na Haiku/Sonnet; (3) ciężkie 3D (Opus) wyłącznie: dokończenie P4.36 Q3→Q4→Q5 oraz dalsze według planu §2 przy zapasie limitu przed odnowieniem; (4) po raporcie REPIN-DELTA dodać tematy odświeżenia pinu wg jego kolejności.
**Zasady pętli:** max 2 równoległe worktree kodu Rust; tematy na tych samych plikach sekwencyjnie; `df -h /` przed startem i sprzątanie po każdym workflow (§5c); FAIL → ten sam ID; DECISION_REQUIRED tylko dla genuine decyzji produktowej (AskUserQuestion); brak deploy/push produkcyjnego i zmian w `gra/`; raportowanie postępu numerami etapów 1–11. Każdy cykl: ReadNotifications → przegląd wyników Workflow → integracja PASS (scoped diff na `rust-port/parity-v2`) → LEDGER + tabela → dispatch następnego tematu.

## Status bieżący — aktywne tematy (max 6)

> **WSTRZYMANIE NOWYCH DISPATCHY (właściciel, 2026-10-23):** limity się kończą — dokończ do Final Control i integracji wszystko, co już trwa (P6.7A, P6.7B, M05A, M12, P5.7, P4.36-Q2); NIE otwieraj nowych tematów ani nie wypełniaj zwolnionych slotów, dopóki właściciel nie wznowi w czacie.

> **WZNOWIENIE (właściciel, 2026-10-29):** wstrzymanie dispatchy zdjęte dla wszystkiego, co NIE jest ciężką grafiką/3D — plan w `PLAN-PO-WZNOWIENIU-20261029.md`. Ciężkie prace 3D (Opus) odłożone na sam koniec, tylko przy zapasie limitu. Brak Opusa w pozostałych tematach.

> **POLITYKA MODELI (właściciel, 2026-10-24, oszczędność limitów):** Haiku 5.5 (medium) dla Operatora/Obrony, a EVALUATOR i FINAL CONTROL zawsze Sonnet 5.5 medium (decyzje 2026-10-24 po kłopotach Haiku-Evaluatora i 2026-10-25 „Haiku za słaby na Final Control”) we WSZYSTKICH tematach; WYŁĄCZNIE jednostki i obiekty 3D (modele, bitwa 3D, renderer 3D: np. P4.36 części 2–5, MOD-xx) — Opus 5.5 medium. Zastępuje wcześniejszą regułę „grafika/renderer/UI-wizualia → Opus” (UI/panele P5 i wizualia 2D → Haiku). Uwaga procesowa: Evaluator na Haiku bywał bez werdyktu — Final Control weryfikuje niezależnie.

| # | Temat | Faza | Runda | runId Workflow | Status | Ostatnia aktualizacja |
|---|---|---|---|---|---|---|
| 1 | R-RUSTPORT-REPIN-DELTA-Q1 | P1-delta | 3/5 | wf_b78ba3d8-189 | **PASS — zintegrowane** (docs, `da7a92f6`); slot wolny | 2026-10-29 |
| 2 | R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1 | P6 mapgen | 4/5 | wf_9fa60ee3-244 | **PASS — zintegrowane** na `parity-v2` (`ec1a8552`); slot wolny | 2026-10-29 |
| 7 | R-RUSTPORT-REPIN-LOGIKA-CIV-Q1 | REPIN krok 2 | 4/5 | wf_eefb36b6-1a8 | **PASS-WITH-NOTES — zintegrowane**; `repin-wip` scalone do `parity-v2` (1243/0); slot wolny | 2026-10-29 |
| 8 | R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1 | P6 mapgen | 2/5 | wf_06809315-5d2 | **ZAMKNIĘTE ADMINISTRACYJNIE (zakres 22/46) — zintegrowane**; resztę przejmuje M06A2 | 2026-10-29 |
| 14 | R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1 | P6 mapgen | 4/5 | wf_806cd4d4-c64 | **PASS (partia 1: 4 symbole) — zintegrowane**; reszta 17 symboli → M06A3 | 2026-10-29 |
| 15 | R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1 | P5.8 | 3/5 | wf_0bfa71b4-d3c | **PASS-WITH-NOTES — zintegrowane** (`a2920ce3`); slot wolny | 2026-10-29 |
| 16 | R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1 | P5.8 | 2/5 | wf_f56cd643-2d7 | **PASS-WITH-NOTES — zintegrowane**; slot wolny | 2026-10-29 |
| 17 | R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1 | P5.8 | 2/5 | wf_9411516f-c63 | **PASS (po poprawce N1/N2) — zintegrowane**; slot wolny | 2026-10-29 |
| 18 | R-RUSTPORT-P6-M06A3-LAD-MORZE-RESZTA2-Q1 | P6 mapgen | 3/5 | wf_768b56ee-a38 | **PASS-WITH-NOTES (partia 1) — zintegrowane** (`7ee595c0`, 1250/0); zamknięte adm., reszta → M06A4 | 2026-10-29 |
| 19 | R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1 | P5.8 | 2/5 | wf_0cfab018-db1 | **PASS-WITH-NOTES — zintegrowane**; slot wolny | 2026-10-29 |
| 21 | R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1 | P5.8 | 3/5 | wf_2a898144-880 | **PASS-WITH-NOTES — zintegrowane** (ff `4900e0ba`); slot wolny | 2026-10-29 |
| 22 | R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1 | P5.8 | 3/5 | wf_aa434f47-3bf | etap 3 (Operator r3) | 2026-10-29 |
| 23 | R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1 | P5.8 | 3/5 | wf_b071e1ab-826 | **PASS-WITH-NOTES — zintegrowane** (`6daf5ed1`) | 2026-10-29 |
| 20 | R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4 (3D, Opus — zgoda właściciela) | P4.36 | 1/5 | (nowy) | etap 1 | 2026-10-29 |
| 24 | R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1 | P6 mapgen | 1/5 | (nowy) | etap 1 | 2026-10-29 |
| 25 | R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1 | P5.8 | 1/5 | (nowy) | etap 1 | 2026-10-29 |
| 3 | R-RUSTPORT-P5-8-CITYPANEL-PODZIAL-Q1 | P5.8 | 3/5 | wf_5b094795-b4f | **PASS — zintegrowane** (docs, `a1246e48`); slot wolny | 2026-10-29 |
| 4 | R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3 | P4.36 | 1/5 | wf_2ef132a4-a0e | **PASS — zintegrowane** na `parity-v2`; slot wolny | 2026-10-29 |
| 5 | R-RUSTPORT-P5-8-CITYPANEL-K01B-Q1 | P5.8 | 2/5 | wf_4e66ea20-909 | **PASS-WITH-NOTES — zintegrowane** (`d123d988`); slot wolny | 2026-10-29 |
| 9 | R-RUSTPORT-P5-8-CITYPANEL-K03-Q1 | P5.8 | 3/5 | wf_3158711a-6d9 | **PASS-WITH-NOTES — zintegrowane** na `parity-v2`; slot wolny | 2026-10-29 |
| 11 | R-RUSTPORT-P5-8-CITYPANEL-K04B-Q1 | P5.8 | 1/5 (+obrona) | wf_6ad6275b-4d3 | **PASS (po poprawce 97→98) — zintegrowane**; slot wolny | 2026-10-29 |
| 12 | R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1 | P5.8 | 2/5 | wf_03c48b0e-64b | **PASS-WITH-NOTES — zintegrowane** (`57242124`); slot wolny | 2026-10-29 |
| 13 | R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1 | P5.8 | 1/5 (+obrona) | wf_e7578c36-d0c | **PASS-WITH-NOTES — zintegrowane**; slot wolny | 2026-10-29 |
| 10 | R-RUSTPORT-P5-8-CITYPANEL-SCAL-K01K02-Q1 | P5.8 | 1/5 | wf_19fd2604-c69 | **PASS-WITH-NOTES — zintegrowane** (`ce8f4d45`); slot wolny | 2026-10-29 |
| 6 | R-RUSTPORT-P5-8-CITYPANEL-K02-Q1 | P5.8 | 3/5 | wf_febbb236-243 | **PASS-WITH-NOTES — zintegrowane** na `parity-v2` (po K01A); slot wolny | 2026-10-29 |



Kolejka (aktualizacja 2026-10-22): P3.23 FLATTEN etap 3 (po P3.21 — te same pliki domeny: macierz counter 35g, struktury, wzrost 35b, mapa 35j–k, społeczeństwo 35n, wioski 35c, ruch 35i, produkcja 19–22b), MOD-07 jednostki żelaza, ujednolicenie typu drzewa sceny, P5.3+ kolejne poziomy `PORTING-QUEUE.md`, pierwotna kolejka: MOD-06/07 (jednostki brązu/żelaza, po P4.19), MOD-09 miasta, MOD-13 misc, ujednolicenie typu drzewa sceny (3 typy: `core::scene`, `wonders::model`, `unit_core::model`) po paczkach, P3.21 `CityId` po P3.22, P5.2+ kolejka portowania paneli (`PORTING-QUEUE.md`), RR-T1 spike (wymaga GPU właściciela).

**Zamknięte w tej sesji (kod na `rust-port/parity-v2`, HEAD `aa7b225b`, 292 testy):** P3.4b, P3.4c (newtypy ID), P3.8 (assety 428), P3.8b (manifest), P3.9 (data wiring), P3.11 (zgodność danych), P3.12 (loader), P3.14 (fmt/clippy w `src/data`).

**KOREKTA BŁĘDU ROUTINGU MODELI (2026-10-21, zgłoszone przez właściciela):** pierwsze uruchomienia
P3.4b (`wf_afbe5aaf-7a4`) i P3.9 (`wf_8b0cdc58-ca7`) miały w skrypcie Workflow brakujący parametr
`model` dla ról Operator/Evaluator/Obrona — bez jawnego `model`, `agent()` dziedziczy model
głównej pętli (Sonnet 5.5), więc wszystkie 3 role biegły na Sonnet zamiast wymaganego Haiku 5.5
(`R-PROC-AUTOBOT.md` §5a, skill `civ-autobot-workflow`). P3.4b **zatrzymany i zrelansowany** (v2,
`wf_5b626c1b-664`) z jawnym `model: 'claude-haiku-5-5'` dla Operator/Evaluator/Obrona i
`model: 'claude-sonnet-5-5'` dla Final Control — zero straconej pracy (worktree Operatora był
jeszcze w trakcie, niescommitowany). P3.9 był już zintegrowany w chwili wykrycia błędu — jego
Operator (jedyna rola, która zdążyła odpowiedzieć przed INFRA) biegł na Sonnet, ale wynik został
niezależnie zweryfikowany przez orkiestratora (diff+build+test), więc nie wymaga powtórki — błąd
modelu odnotowany jako nota procesowa w dyspozycji P3.9, nie podważa wyniku technicznego. **Od tego
momentu wszystkie nowe dispatche Workflow MUSZĄ jawnie ustawiać `model` per rola — zero poleganie na
domyślnym dziedziczeniu.**

**P3.9 ZAMKNIĘTY PASS (2026-10-21), zintegrowany `9f9ffee7`.** 5 modułów danych P3.5A-E podpięte pod
`pub mod data;` w `lib.rs`, `serde_json` → `[dependencies]`. 256/256 testów PASS, zero regresji.
Szczegóły procesowe (INFRA przerwało Evaluatora, orkiestrator zweryfikował bezpośrednio) w
`LEDGER.md` i `R-RUSTPORT-P3-9-DATA-CONSOLIDATION-Q1/04-orchestrator-disposition.md`.

**Incydent INFRA #4 (2026-10-21) — ZAMKNIĘTY:** dysk spadł do **0 bajtów wolnych** (100% zajęte),
do tego stopnia że nawet podstawowe komendy Bash (w tym `df`) chwilowo zawodziły z powodu braku
miejsca na własny bufor wyjścia narzędzia. Przyczyna: `target/` niesprzątniętych worktree (w tym
P3.4b 1,2GB, P3.9 Operatora) + dwie zapomniane kopie worktree w scratchpadzie z wczesnej fazy P0
(`wt` 724MB, `wt-parity-v2` 1,6GB — nieużywane od dawna, nigdy wcześniej nie sprzątnięte, bo leżały
poza standardowym `git worktree list` z czujności). Posprzątano wszystko → **5,4GB wolne**. **Wniosek,
teraz NAGLĄCY po 4. powtórce:** sparse-checkout dla worktree kodu Rust jest już nie "do rozważenia",
tylko wymagany PRZED kolejną falą równoległych tematów kodu — do wdrożenia w najbliższym wolnym
momencie puli (nie przy obciążonej puli). Do tego czasu: twardy limit 2 równoległe worktree kodu
Rust, i każdorazowe sprawdzenie `du -sh` wszystkich katalogów scratchpad/worktree (nie tylko
`git worktree list`) przy każdym podejrzeniu INFRA.

**Pula całkowicie wolna (2026-10-21, po zamknięciu fali P3.5 i P3.4 częściowego):** wszystkie 6
tematów w locie zamknięte, wszystkie worktree posprzątane, zero `locked`. `origin/rust-port/parity-v2`
HEAD: `df8d8592`, **256/256 testów PASS**.

**Fala P3.5A-E KOMPLETNA — 5/5 PASS, zintegrowane:** P3.5D (`e72c74f7`), P3.5C (`7c34b7d3`), P3.5E
(`92ae1e81`/`1051b66d` — wymagał ręcznego scalenia kodu i poprawionego dokumentu Obrony z dwóch
osobnych worktree tego samego Workflow, szczegóły w `LEDGER.md`), P3.4-SCHEMA_VERSION (`9d4f2aba`),
P3.5B (`401a625f`), P3.5A (`df8d8592`). Wspólny dług: `serde_json` nadal tylko
`[dev-dependencies]` w 5 nowych modułach danych — do przeniesienia w osobnym, sekwencyjnym temacie
konsolidacji (roboczo **P3.9-DATA-CONSOLIDATION**), który podepnie wszystkie moduły do
`lib.rs`/`domain/mod.rs` naraz (celowo odłożone, by nie kolidować podczas równoległej pracy P3.5A-E).

**P3.4 — DECISION_REQUIRED rozstrzygnięty administracyjnie, zakres podzielony:** Operator trafił
złą bazę (`edb8fb56` zamiast `origin/rust-port/parity-v2`) i nie miał jasności co do
`dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` (plik istnieje wyłącznie na gałęzi dokumentacyjnej
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na `rust-port/parity-v2`) — dispatch nie wyjaśnił
tej struktury dwóch gałęzi, co wywołało błędne wrażenie niespójności procesu u agentów, nie genuine
decyzję produktową. Obrona naprawiła bazę i dodała WYŁĄCZNIE `SCHEMA_VERSION`
(`src/version.rs`+`pub mod version;`) — zweryfikowane przez orkiestratora (`cargo test` zielony) i
zintegrowane (`9d4f2aba`). Refaktor newtype ID (`PlayablePlayer.id`/`CombatUnit.id`/`AiUnit`/`BarbUnit`)
NIE podjęty — jawnie odnotowany, przenoszony do nowego tematu **P3.4b** z poprawionym dispatchem:
jawny pierwszy krok `git fetch && git checkout --detach origin/rust-port/parity-v2`, i wyjaśnienie
"dokumentacja P2.3 dostępna WYŁĄCZNIE przez `git show <docs-branch-sha>:<ścieżka>` — to oczekiwana
struktura dwóch gałęzi, nie błąd" w pierwszym akapicie KONTEKST.

**Incydent INFRA (2026-10-21, 3. powtórka w tej sesji) — ZAMKNIĘTY:** P3.5A/B zawiodły pierwotnie z
`WorktreeIsolationError` (301MB wolne), dysk spadał wielokrotnie do krytycznych poziomów (do 962MB)
w trakcie równoległej pracy 5+ worktree kodu Rust (każdy ~430MB+ bez sparse-checkout). Orkiestrator
sprzątał agresywnie po każdej integracji (`git merge-base --is-ancestor` przed każdym usunięciem,
nigdy worktree w użyciu) — obecnie 3,9GB wolne, zero aktywnych worktree. **Wniosek na przyszłość,
coraz pilniejszy po 3. powtórce:** wdrożyć sparse-checkout dla worktree tematów kodu Rust (tylko
`rust-port/**`) PRZED dispatchem kolejnej fali równoległej — priorytet nad P3.8-ASSETS (dodałby
~500MB) i P3.4b. Do czasu wdrożenia: nie dispatchować więcej niż 2-3 równoległe tematy `isolation:
worktree` kodu Rust naraz.

**Kolejne kroki (refill puli):** P3.4b (newtype ID refactor, poprawiony dispatch), P3.9-DATA-CONSOLIDATION
(podpięcie 5 modułów danych P3.5A-E do `lib.rs`, `serde_json` → `[dependencies]`), P3.8-ASSETS
(dispatch już napisany, czeka na ustabilizowanie dysku/sparse-checkout). Zalecenie: dispatchować
najwyżej 2-3 na raz do czasu wdrożenia sparse-checkout.

## *** FAZA P2 ZAMKNIĘTA — FAZA P3 OTWARTA (2026-10-21) ***

`R-RUSTPORT-P2-13-FINAL-CONTROL-Q1`: PASS po 3 architekturach (2× LIMIT-5-EXCEEDED sekwencyjne →
fan-out równoległy zamknął w rundzie 2/5). Wszystkie 12 podtematów P2.1-P2.12 zamknięte PASS.
Synteza wykryła i orkiestrator NAPRAWIŁ BEZPOŚREDNIO 3 realne sprzeczności międzydokumentowe
(`inGarnizon` P2.3↔P2.11, `budowaListaBiblioteka` P2.2↔P2.11, D-EV-11 typy payloadu pominięte w
P2.6) — pierwsze takie znaleziska w całej fazie P2, potwierdzające wartość niezależnej kontroli
końcowej. **Bramka P2 formalnie otwarta.** Zgodnie z decyzją właściciela (2026-10-21, poz. 4 wyżej):
start P3 NATYCHMIAST, bez pytania o zgodę.

4 zobowiązania techniczne jawnie przeniesione do P3 (nie blokują, ale wymagają realizacji): (1)
pełny przegląd linia po linii 195 plików heurystyki eventów przed P3.6; (2) formalna definicja w
Rust typów ID zaakceptowanych jako rozszerzenie kanonu P2.3 (`DealId`, `BattleId`, `SlotId`, `ItemId`,
`TechId`, `TradeRouteId`, `WonderId`, `ImprovementId`, `ProductionItemId`, `UnitTypeId`, `CommandId`)
oraz pozostałych typów danych (`OkolicaTryb`, `OwnerPolicy` i in.) przy pisaniu `bridge.rs`/
`events.rs`; (3) osobny temat czyszczący rozjazd `babilon`/`babilonia` i klasyfikację 6/15 surowców
poza `ResourceKey`; (4) kosmetyczne korekty cytowań w P2.12 (15 vs 16 kluczy forced-war).

## *** FAZA P1 ZAMKNIĘTA — FAZA P2 OTWARTA (2026-10-21, zamknięta 2026-10-21) ***

`R-RUSTPORT-P1-GATE-SYNTHESIS-2-Q1`: PASS. Pełna tabela 41 wierszy P1.1-P1.18(+warianty), wszystkie
PASS lub PASS-WITH-NOTES jako status najnowszego ogniwa. 4 zastrzeżenia Final Control rozstrzygnięte
administracyjnie przez orkiestratora (`04-orchestrator-disposition.md` tego tematu) — żadne nie było
genuine decyzją produktową. **Bramka P1 formalnie otwarta.** Zgodnie z decyzją właściciela
(2026-10-21, poz. 4 wyżej): start P2 NATYCHMIAST, bez pytania o zgodę.

**P2.1 zamknięty PASS** (katalog 15 modułów domeny, 183/183 plików web przypisanych, stan
`rust-port/engine` zweryfikowany code-level na obu gałęziach). Kolejna fala: **P2.4** (zgodność RNG
web↔Rust — weryfikacja faktów, nie decyzja) i **P2.9** (mapowanie `gra/data/*.json` → struktury Rust)
— oba niezależne od siebie i od reszty P2, każdy do własnego nowego pliku.

**P2.2 (kontrakt `GameState`) ZAMKNIĘTY PASS** — 1 genuine decyzja produktowa zadana właścicielowi
(D7: Rust czyta zapisy web 1:1 → TAK, wymaga P2.11), 15 punktów strukturalnych rozstrzygniętych
administracyjnie, patrz `04-orchestrator-disposition.md` tego tematu i §8 dokumentu.

**P2.3 (schemat ID encji + pełne porównanie pól UnitState/CityState) ZAMKNIĘTY PASS** — 14 punktów
DECISION_REQUIRED (D-ID-1..D-ID-11 + 3 dodatkowe Final Control), WSZYSTKIE rozstrzygnięte
administracyjnie (żadna genuine decyzja produktowa — same wybory reprezentacji danych Rust), patrz
`04-orchestrator-disposition.md` tego tematu i §9 `P2-3-ENTITY-IDS.md`. Kluczowe: ID = newtype `u64`
per typ (PlayerId/CityId/UnitId), monotoniczny licznik bez ponownego użycia, `OwnerRef` enum zamiast
liczb ujemnych, `oblega: Option<CityId>` JAWNIE PRZECHOWYWANE (nie wyprowadzane — wymóg importu
zapisów 1:1), `kind` jednostki = klucz katalogu danych (nie zamknięty enum).

**P1.16b/P1.16c (4/4) ZAMKNIĘTE PASS** — cały łańcuch następców pierwotnego P1.16b jest teraz
zielony (patrz LEDGER). Ostatni kawałek P1 to `AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md`
(69 wierszy, zbyt duże na jeden temat) — podzielony na **5 w pełni równoległych tematów**, każdy do
WŁASNEGO NOWEGO pliku (`P1-16D-OPISY-*.md`): boilerplate (§2a/b, **PASS**, zamknięty), ekonomia ×5 +
reszta §2c/2e/3 (**PASS**, zamknięty — odkryty NOWY rozjazd tartak/kamieniołom 200 vs 50/turę, do
P2), Poradnik rozdziały 00-10, Poradnik rozdziały 14-16+follow-upy (**PASS**, zamknięty — 8/8 pozycji
listy B wszystkie NIEZGODNE/CZĘŚCIOWO, w tym rozdz.57 „47/47" przeliczone na 1/49 zgodnych),
CivPedia hasła + 17 paneli UI (**wszystko PASS, zamknięte — `P1.16e-OPISY-UI-PANELE` + 6/6
`P1.16f-*`**: Jednostki, Cuda, Ulepszenia, Pojęcia, Technologie, Cywilizacje — pełny, wyczerpujący
audyt wg decyzji właściciela 2026-10-21 UKOŃCZONY). **CAŁY AUDYT-OPISY jest teraz pokryty — P1.16
w całości PASS.** Dispatch `P1-GATE-SYNTHESIS` (bramka
P1 powinna się wtedy formalnie otworzyć — wszystkie P1.1-P1.18 PASS), potem start P2 bez pytania o
zgodę (decyzja właściciela 2026-10-21, patrz GOAL §"Decyzje przyjęte" poz. 4).

**Slot 1 świadomie WOLNY:** jedyny pozostały gotowy, bezkolizyjny materiał P1 to pozostałe 4 tematy
`P1.16d-OPISY-*`, już w locie. P2 nie otwieram przed formalną syntezą bramki P1 (dyscyplina faz z
planu §4) — to NIE jest naruszenie decyzji właściciela o autonomii, tylko kolejność faz z samego
planu, który ta decyzja każe wykonywać od P0 do P11 po kolei, nie pomijając bramek.

**P1.16c-PARYTET-AI, P1.16c-STOLICE, P1.16c-CIVPEDIA-OPISY czekają SEKWENCYJNIE** (ten sam plik
`P1-16-EDGE-CASES.md` co KODU-A) — nie dispatchować równolegle, dopiero po zamknięciu poprzedniego.

**Realna, niewyczerpana treść P1 poza łańcuchem P1.16c: BRAK.** Wszystkie pozostałe tematy
P1.1-P1.18 (poza wariantami 16c) mają PASS w LEDGER. 5 z 6 slotów jest teraz wolnych nie dlatego, że
czekają na decyzję właściciela (ta z STOLICE okazała się już rozstrzygnięta, patrz LEDGER
2026-10-21), ale dlatego że P1.16c jest z natury sekwencyjny (jeden plik) i nie ma już
niezależnego, gotowego, bezkolizyjnego materiału P1 do obsadzenia pozostałych slotów bez wchodzenia
w P1-GATE-SYNTHESIS (przedwczesne — P1.16c jeszcze nie zamknięte) albo we wczesny P2 (wymaga decyzji
właściciela o rozpoczęciu, patrz pytanie w czacie 2026-10-21).

**Zasada stałej:** gdy temat się zamyka (PASS/FAIL ostateczny/DECISION_REQUIRED/LIMIT-5-EXCEEDED),
natychmiast otwieram kolejny w zwolnionym slocie — pula 6 ma być stale w pełni wykorzystana, bez
przestojów między falami. Historia zamkniętych tematów (P0, poprawka terenu, P1.1/1.2/1.10/1.11/1.12 —
wszystkie PASS) — patrz `LEDGER.md`.

**Decyzje właściciela po P0 (2026-10-20):**
- Pin webowy: zostajemy przy świeżym `main` = `edb8fb56` (nie wracamy do `69ccb145`) — delta zostanie w pełni skwalifikowana w P1.
- Archiwum OpenClaw przeanalizowane w pełni (temat zamknięty DECISION_REQUIRED, patrz AUDYT-ARCHIWUM-OPENCLAW-20261020.md).
- **P0.4/P0.5 zamknięte:** baza = `autobot/real24-staging`, gałąź = `rust-port/parity-v2` (założona).
- 4 patche archiwum = tylko inspiracja/UNKNOWN, nigdy kopiowane 1:1.

**Znalezisko P0 istotne dla P0.4/P1:** `autobot/real24-staging` i `hermes/handoff` mają 215 testów
`cargo test` w `rust-port/engine`, main tylko 95 — potwierdza rekomendację poprzedniego agenta, że
`real24-staging` jest lepszym rusztowaniem startowym niż samo `rust-port/engine` z main.

**Decyzje właściciela (2026-10-20), zamykają P0.4/P0.5:**
- 4 patche z `worktree-overlays/` (bridge save/load+replay+assets, hot-seat, population-matrix,
  entrypoint-script) = **tylko inspiracja, UNKNOWN/REFERENCE** — żaden kod nie jest przenoszony 1:1.
  Dotyczy to też wszystkich przyszłych klasyfikacji w P1.17/P2.
- Poprawka żywego buga terenu (Desert/Tundra) w `real24-staging` = **pierwszy mały temat Workflow teraz**,
  przed otwarciem P1.
- **Baza startowa (P0.4):** `autobot/real24-staging` (78d494c7), nie main-owy `rust-port/engine` — więcej
  gotowego, testowanego kodu domenowego (28 plików vs 18).
- **Gałąź (P0.5):** `rust-port/parity-v2`, forkowana z `autobot/real24-staging`.

P1 otwarte: fala 1 (6 równoległych tematów katalogowych: P1.1, P1.2, P1.10, P1.11, P1.12, P1.13) w
toku. Po ich zamknięciu — fala 2: P1.14 (katalog mechanizmów gameplayu, największy punkt), P1.17
(klasyfikacja REUSE/ADAPT/REPLACE istniejącego Rust, zależy od P1.1), P1.18 (hot-seat behavior matrix
na obecnym pinie — archiwum go nie pokrywa rzetelnie), i ewentualnie P1.3–P1.9/P1.15 (manualne przejścia
w żywym Chromium — wymagają innego trybu pracy niż czysty katalog odczytowy, do zaplanowania osobno).

## Automatyzacja (mechanizm autonomicznej kontynuacji)

1. **TaskCreate/TaskUpdate** — lista zadań bieżącej sesji.
2. **Scheduled task** — cykliczne wybudzenie tej sesji (patrz `dyspozycje/rust-port/LEDGER.md` dla trigger_id i interwału), prompt: sprawdzić wynik ostatniego Workflow, zintegrować PASS, otworzyć kolejny dispatch, zaktualizować ten plik.
3. **Ten plik** — trwała kotwica niezależna od sesji/scratchpadu.
4. **Pętla w skrypcie Workflow** — rundy Operator→Evaluator→(Obrona)→Final Control zapętlone wewnątrz jednego dispatchu, max 5 rund.

## Granice nienaruszalne (skrót, pełna lista: `docs/decyzje/R-PROC-AUTOBOT.md` §9)

- Zero zmian w `gra/**` w ramach tego projektu (web = referencja read-only).
- Zakaz `npm run build`/`npm run dev` w `gra/` bez scratch outDir.
- Zakaz `git add -A` / `git add .`.
- Zakaz fake DOM / placeholder / hard-coded podzbioru jako substytutu realnego systemu.
- Integracja wyłącznie allowlist-only, scoped diff od merge-base.
- `READY_FOR_DEPLOY`/push/deploy tylko po osobnej, jawnej zgodzie właściciela — nie dotyczy zwykłych commitów dokumentacji/postępu tego projektu na gałęzi roboczej.
