# 02a — Obrona Operatora (runda 1) — R-RUSTPORT-P6-SIEGE-TRANSFER-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q1
GOAL: funkcja galezi Transfer `resolveSiegeSurrender` z tabela skutkow web -> Rust; zarzuty Evaluatora rozpatrzone.
ZMIANY/COMMIT: commit obrony na galezi `rust-port-wip/R-RUSTPORT-P6-SIEGE-TRANSFER-Q1` (SHA ustawiany po commicie, patrz sekcja SHA ponizej). Pliki: `rust-port/engine/src/domain/siege_transfer.rs` (komentarze, dwa wpisy Ui w tabeli, doc apply_transfer), `rust-port/engine/tests/p6_siege_transfer.rs` (komentarz przy asercji populacji), `rust-port/engine/tests/p6_siege_transfer_gen.mjs` (komentarz o stubie), `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TRANSFER-Q1/02a-obrona.md`. Zmiany zachowania: BRAK. Vectors.json NIE zmieniony. Cargo.lock nie w commicie.
RUNDY: 2/5 (obrona w rundzie 1 Operatora; kolejna runda Evaluatora po akceptacji)
NASTEPNY KROK: Evaluator r2 weryfikuje odpowiedzi nizej; ZARZUT 4 (kolejka) wymaga osobnego tematu (patrz ponizej).
DEPLOY/PUSH: NIE WYKONANO (push tylko galezi wip; brak integracji, brak push do rust-port/parity-v2).

## Bazowe bramki (ZARZUT 1)

Zarzut: bramki odtworzone na f1e96f264, EXIT 0, generator na pinie daje bit-identyczny vectors.json, allowlista OK.

**PRZYJMUJE (jako potwierdzenie).** Nie ma czego poprawiac. Nowe zmiany tej rundy sa wylacznie komentarzami i szescioma wpisami `EffectStatus::Ui` (bez zmiany logiki i bez zmiany listy `Missing`), wiec wektory i test `coverage_table_has_no_silent_ported_gaps` (lista BRAK) pozostaja niezmienione.

**Dowod (ta runda):**
- `rustfmt --check --edition 2021` na `siege_transfer.rs` i `p6_siege_transfer.rs`: EXIT 0.
- `node --check tests/p6_siege_transfer_gen.mjs`: EXIT 0.
- `git diff --check`: bez bledow.
- `git status`: zmienione tylko 3 pliki kodu (powyzej) + dokument obrony.
- NIE_ZMIERZONO w tej rundzie: `cargo test` / `cargo clippy` po zmianach. Powod: wolne miejsce na `/` = 7.3 GB < 8 GB wymagane dispatchem przed startem bramek Rust. Zmiany sa komentarzami i wpisami tabeli (`EffectStatus::Ui`), bez zmiany sygnatur; FC powinien powtorzyc bramki po zwolnieniu dysku. Stan bramek z r1 (f1e96f264, EXIT 0) nie jest tym samym dowodem dla nowego SHA.

## Populacja bez applyCapturePopulationLoss (ZARZUT 2, ISTOTNY)

Zarzut: generator stubuje `applyCapturePopulationLoss` (undefined), oczekiwana populacja = max(1,pop) bez obywatela; naglowek testu/generatora mylacy.

**PRZYJMUJE.** Poprawka (komentarze, bez zmiany wektorow):
- `tests/p6_siege_transfer.rs` przy `let pop_exp = ...`: jawne zastrzezenie, ze populacja z pinu to wynik przy stubie, zgodna z webem tylko przy zalozeniu `applyCapturePopulationLoss = no-op`.
- `tests/p6_siege_transfer_gen.mjs` (przed komentarzem `Sentinel Stop`): jawna uwaga, ze wolania z statusem Missing nie sa wykonywane, a naglowek "stan = stan z pinu" dotyczy wykonanych wycinkow.
- `src/domain/siege_transfer.rs` przy wpisie `applyCapturePopulationLoss`: to samo zastrzezenie w tabeli.

Nie zmieniam wektorow ani asercji: zmiana oczekiwanej populacji wymagalaby implementacji `applyCapturePopulationLoss`, co jest poza zakresem tego tematu (BRAK, osobny temat).

## Skutki BRAK bez wolajacego (ZARZUT 3, ISTOTNY dla W8 r3)

Zarzut: publiczne `apply_transfer` pomija 12 skutkow; wolajacy nie moze byc podpiety przed ich uzupelnieniem.

**PRZYJMUJE (ryzyko), ODRZUCAM (zmiana zakresu).** Dispatch wprost dopuszcza brak wolajacego z jawna zaleznoscia do W8 r3 i nie daje tu zakresu na 12 skutkow. Poprawka tej rundy: doc-komentarz przy `apply_transfer` z zakazem podpinania wolajacego przed `applyCapturePopulationLoss` i `sanitizeProductionQueue(newOwner)`. Decyzja o zakresie (osobny temat na 12 BRAK) nalezy do orkiestratora.

## Kolejnosc / wolajacy (ZARZUT 4 — kolejka, SREDNI)

Zarzut: sciezka kolejki (sanitize_build_queue, filter_queue, odzysk Pracy, forfeit stolic, is_new_capital) nie jest weryfikowana wzgledem pinu; `banked` liczone z `migrated.prod` zamiast z wyniku `sanitizeProductionQueue`.

**PRZYJMUJE (ustalenie zarzutu jest prawdziwe).** Potwierdzam w pinie: web liczy `forfeitedBankedCapitalSurrender` z `sanitizedSurrenderProd.kolejka` (wynik `sanitizeProductionQueue`), Rust z `migrated.prod`. Zgodne tylko przy identycznosci `sanitizeProductionQueue`, a ten krok jest BRAK.
Poprawka tej rundy: komentarz `ROZBIEZNOSC Z WEBEM` przy `banked` w `apply_transfer` z jawnym NIE_ZMIERZONO.
Nie naprawiam wektorami kolejki w tej rundzie: generator nie stubuje `sanitizeBuildQueue`/`filterQueue` z pinu (sa w `production.ts`, z zaleznosciami `data.buildings`), a bez dostepu do bramek Rust (dysk 7.3 GB) nie moge zweryfikowac nowych testow kolejki. Proponowany osobny temat: wektory kolejki z pinu (wykonanie `sanitizeBuildQueue`/`filterQueue`, a `sanitizeProductionQueue` po zdjeciu BRAK), po zwolnieniu dysku.

## Pomocniki raportowe/UI (ZARZUT 5, MALY)

Zarzut: brakuje wpisow dla `civLabelForOwner`, `buildCityCaptureReportRows`, `capturePopLossReportRow`, `captureReportOneLine`, `mocLabel`, `setSelectionHex`.

**PRZYJMUJE.** Dodane jako `EffectStatus::Ui` (nie zmieniaja listy `Missing`, wiec test listy BRAK przechodzi bez zmian). Potwierdzone w pinie: `setSelectionHex` (zakres 17646-17893, linia 165) oraz pozostale wolane w zakresie galezi (linie 186-217).

## Test pokrycia wpisow po wejsciu (ZARZUT 6, MALY)

Zarzut: wpisy po `enterCityAfterSurrender` (syncCityGarnizon, playerEverOwnedCityByOwner.add, runCapitalCapturePlunder, recordCityCaptureEvent, applyLiveSafeRationForCity, endMapSiege) sa reczne; zgodne wg Evaluatora.

**PRZYJMUJE jako notę, bez zmiany kodu.** Generator konczy sie na `Stop` przed wejsciem, wiec test pokrycia obejmuje tylko wolania przed wejsciem; wpisy po wejsciu pozostaja zgodnosciowo sprawdzane recznie (Evaluator potwierdzil zgodnosc z `main.ts`). Rozszerzenie generatora poza `Stop` to osobny temat.

## Kolejnosc krokow w apply_transfer (ZARZUT 7, MALY)

Zarzut: kolejnosc wzgledna krokow nie jest asercjonowana wzgledem pinu poza stanem koncowym; rozbieznosci Evaluator nie znalazl.

**PRZYJMUJE jako notę (bez zmiany kodu).** Nie znaleziono rozbieznosci; asercja kolejnosci wymagalaby wlaczenia wolan Ported do logu pinu, co zmienia generator i wektory. Odlozone do tematu wektorow kolejki (ZARZUT 4).

## SHA

- Baza operatora: `f1e96f264` (r1).
- Commit obrony: ustawiany po `git commit` na galezi `rust-port-wip/R-RUSTPORT-P6-SIEGE-TRANSFER-Q1`; pelny SHA w odpowiedzi orkiestratorowi.

## BLOKADY

- BRAK skutkow z tabeli `TRANSFER_EFFECTS` (w tym applyCapturePopulationLoss, sanitizeProductionQueue, wonder transfer) — bez zmian, jawnie oznaczone.
- Wolajacy galezi Transfer NIE podpiety (W8 r3 zalezy od BRAK i ExistsNotWired).
- Testy kolejki wzgledem pinu: NIE_ZMIERZONO.
- Bramki Rust po tej rundzie: NIE_ZMIERZONO (dysk 7.3 GB < 8 GB).
