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

## Status bieżący — aktywne tematy (max 6)

| # | Temat | Faza | Runda | runId Workflow | Status | Ostatnia aktualizacja |
|---|---|---|---|---|---|---|
| 1 | `R-RUSTPORT-P2-13-FINAL-CONTROL-Q1` | P2.13 (synteza i kontrola całej fazy P2 przed P3) | runda 3 (architektura: fan-out równoległy po 2× LIMIT-5-EXCEEDED sekwencyjnym) | `wf_b55db73d-44f` | DISPATCHED (w toku) | 2026-10-21 |
| 2 | — | — | — | — | **WOLNY** (P2.10 PASS, zamknięty) | 2026-10-21 |
| 3 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 4 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 5 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 6 | — | — | — | — | **WOLNY** | 2026-10-21 |

## *** FAZA P1 ZAMKNIĘTA — FAZA P2 OTWARTA (2026-10-21) ***

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
