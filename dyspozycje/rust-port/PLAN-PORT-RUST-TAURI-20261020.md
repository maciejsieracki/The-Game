# Plan portu "The Game" (web) → Rust/Tauri — pełny parytet 1:1

**Data:** 2026-10-20
**Autor:** orkiestrator tej sesji (Sonnet 5.5)
**Status:** ZATWIERDZONY DO WYKONANIA (decyzje §0.1–§0.3 przyjęte jako robocze domyślne rekomendacje orkiestratora — właściciel może je w każdej chwili nadpisać)
**Źródło:** zbudowany od nowa na bazie planu `PLAN-RUST-PORT-ORCHESTRACJA-20260920.md` (poprzedni system OpenClaw) — struktura faz P0–P11 zachowana jako sprawdzona, warstwa infrastruktury OpenClaw (plugin Controller, Flow, Workboard, A/B routing) odrzucona; **uniwersalne zasady procesu z `autobot-controller`** (ślad dowodowy per faza, zakaz fałszywej niezależności ról, integracja tylko po PASS) **przyjęte i wplecione w §2/§2a** — to są zasady przeniesione pierwotnie z AutoBota tego repo, nie coś obcego.

**Trwały anchor tego projektu:** `dyspozycje/rust-port/GOAL-RUST-PORT-20261020.md` (status bieżącej fazy/rundy, aktualizowany po każdym cyklu Workflow). Ten plik (pełny plan) jest statyczny — zmiany planu idą przez edycję z datą, nie przez nowy plik.

---

## 0. Decyzje

1. **Baza startowa kodu Rust.** Przyjęte: potraktować istniejący `rust-port/engine` (scalony w `main` + gałęzie `autobot/real24-staging`, `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`) jako **bibliotekę referencyjną do audytu i częściowego reużycia**, nie jako gotową bazę do kontynuacji. Powód: baza kodu jest z 19.09.2026, web main odjechał od niej o 52 commity, interfejs komend (`bridge.rs::EngineCommand`) ma dziś 6 wariantów i żaden system poza ruchem jednostki/turą nie jest podłączony.
2. **Lokalizacja.** Przyjęte: nowa gałąź w tym samym repo `maciejsieracki/The-Game` (np. `rust-port/parity-v2`), żeby zachować jedno źródło prawdy danych/assetów zamiast duplikować repo. Topiki/worktree pojedynczych zadań Workflow nadal idą pod `autobot/<ID>` zgodnie z konwencją repo.
3. **Model routingu (zatwierdzone przez właściciela 2026-10-20, skorygowane 2026-10-20):** Orkiestrator = Sonnet 5.5 (ta sesja) — **wyłącznie orkiestruje, nie wykonuje żadnej pracy merytorycznej sam ani przez narzędzie `Agent`/subagent**. Operator i Evaluator = Haiku 5.5, effort medium. Final Control = Sonnet 5.5, effort medium. **Wszystkie trzy role — Operator, Evaluator, Final Control — dispatchowane WYŁĄCZNIE jako wywołania `agent()` wewnątrz skryptów narzędzia Workflow, nigdy przez narzędzie `Agent` (subagent) ani przeze mnie bezpośrednio.** Moja rola: pisać/uruchamiać skrypty Workflow, czytać ich wynik, decydować o kolejnej rundzie, prowadzić licznik rund i ledger, oraz wykonywać integrację (scoped diff, commit, push) już zatwierdzonego wyniku — integracja nie jest "pracą" delegowaną, to czynność orkiestratora z kanonu tego repo (Operator/Evaluator/Final Control nie integrują, nie pushują). **Uwaga:** niższa siła modelu na Operatorze/Evaluatorze oznacza realistycznie więcej rund naprawczych niż przy Sonnet 5.5 — uwzględnione w szacunku czasu (§6).

---

## 1. Zasady nadrzędne

1. Źródłem prawdy jest **aktualny `main` repo webowego** (`maciejsieracki/The-Game`), re-pinowany na starcie P0 i przy każdej rundzie P8 (parity pass) — nie stary snapshot z 2026-09.
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
