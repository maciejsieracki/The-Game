# 03 — Final Control r1 — R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1
GOAL: rozpoznanie komend `cancel_planned_march`, `preview_path` i wieloheksowego `move_unit` (#217) z podziałem na wdrożenia. Bez zmian w kodzie.
ZMIANY/COMMIT: oceniany SHA to `ef1901d7988f1d653ff78c74d6f0d062bff4883d` (Obrona r1). Wynikowy SHA FC to ten commit (raport FC dodany na `ef1901d79`).
TESTY: patrz §3
BLOKADY: dla rozpoznania brak. Blokady wdrożeń opisuje dokument w §0 i §4.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (dokumentacja). Przed dispatchem Q2 orkiestrator zapisuje w `REJESTR-RUST.md` decyzję techniczną o zachowaniu dla nieznanej lub obcej jednostki (§5 pkt 1 dokumentu).
DEPLOY/PUSH: NIE WYKONANO

## 1. Ancestry i allowlista

- Baza z dispatchu: `origin/rust-port/parity-v2` w chwili startu = `2f9a12786`. `git merge-base --is-ancestor 2f9a12786 ef1901d79` daje OK, `9df1d235d` (Operator r1) również jest przodkiem.
- Łańcuch: `2f9a12786` → `3a40894d8` (dokument) → `9df1d235d` (01-operator-r1) → `ef1901d79` (obrona r1).
- `git diff --stat 2f9a12786 ef1901d79` pokazuje 3 pliki i +247 linii. Wszystkie są w allowliście:
  - `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` (NOWY),
  - `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1/01-operator-r1.md`,
  - `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1/02a-obrona.md`.
- `git diff --quiet 2f9a12786 HEAD -- rust-port gra` daje exit 0: brak zmian w kodzie i w `gra/`, a `Cargo.lock` nie jest dotknięty. `git diff --check` jest czysty.
- `02-evaluator.md` leży na gałęzi Evaluatora `fdb9f0a7b` i nie wchodzi w ten łańcuch. Orkiestrator dołącza go przy integracji.

## 2. Zarzuty Evaluatora i orzeczenie FC

| # | Zarzut | Obrona | Weryfikacja FC (na pinie `07d2fbd72` i bazie `2f9a12786`) | Orzeczenie |
|---|---|---|---|---|
| 1 | Grep z dispatchu nie daje 0 trafień | Poprawiono §0 pkt 1 | `main.ts:1233` to `} from './game/planned-march';`; trafienia w `moveUnitIds` potwierdzone przez Evaluatora. Tekst §0 pkt 1 jest teraz zgodny ze stanem. | ODDAL (naprawione w r1 obrony) |
| 2 | `armyStackLimit()` jako NIE_ZMIERZONO | Wartość 500 wpisana | `main.ts:4358-4360` zwraca `BATTLE_MAX_PER_SIDE`, `battleScene.ts:721` ma `MAX_PER_SIDE = 500`, a `:723` eksport. `main.ts:908` to import. W Rust `save_migrations.rs:221` ma `ARMY_STACK_LIMIT: i64 = 500`. Wektory Q6 (500+1 odmowa, 499+1 dopuszczone) zgadzają się z `canJoinStackAt` (`army-stack-limit.ts:55-67`, warunek `there + moving.length <= limit`). | ODDAL (naprawione) |
| 3 | Rekomendacja `Ok` dla nieznanej lub obcej jednostki nie wynika z webu | Rekomendacja wycofana, decyzja przekazana orkiestratorowi | `PlayableError::UnitNotFound/UnitNotOwned` są w `playable.rs:681-682`, a ich użycie w `move_unit` w `:919-922`. Wariant A/B jest opisany jako decyzja techniczna (zasada 9), z wymogiem wpisu do `REJESTR-RUST.md` przed Q2. Uwaga FC: lista wołających `clearPlannedMarch` w §5 pkt 1 i §6 jest niepełna. Brakuje `:31141` (`atkUnit.id`), `:31732` (`selectedId`) i `:32110` (`u.id`). Wszystkie trzy podają jednak istniejącą jednostkę, więc wniosek („web nie rozstrzyga”) się nie zmienia. | ODDAL (naprawione, z uwagą) |
| 4 | Sonnet dla Q3 i Q6 sprzeczny z zasadą modeli | Domyślnie HAIKU | W tabeli §4 Q2–Q6 mają HAIKU, a reguła jest opisana pod nagłówkiem §4. | ODDAL (naprawione) |
| 5 | Q6 nie zależy logicznie od Q2 | Zmieniony opis zależności | `planMarchTo` (`main.ts:31213-31300`) nie woła `clearPlannedMarch` ani `plannedMarches.delete/clear` (grep na tym zakresie dał rc=1, 0 trafień). | ODDAL (naprawione) |

Nie ma żadnego orzeczenia NAPRAW ani DO DECYZJI CZŁOWIEKA. Decyzja z zarzutu 3 jest techniczna i należy do orkiestratora (CLAUDE.md, zasada 9), a nie do właściciela.

## 3. Bramki (zweryfikowane samodzielnie)

- Temat jest wyłącznie dokumentacyjny. Drzewo `rust-port/` i `gra/` w `ef1901d79` jest identyczne z bazą `2f9a12786` (`git diff --quiet` daje exit 0).
- `cargo fmt --check` (rust-port/engine) na `ef1901d79` zwrócił exit 0.
- `cargo clippy` i `cargo test --lib` nie zostały uruchomione ponownie przez FC. Na dysku zostało tylko 1,1 GB (`df -h /`: 98%), a reguła procesu każe wstrzymać kompilację przy < 2 GB. Kod Rust jest identyczny z `9df1d235d`, na którym Evaluator odtworzył bramki: clippy `-D warnings` exit 0 oraz `cargo test --lib` 119 passed. Status w FC: NIE_ZMIERZONO_PRZEZ_FC (wynik przeniesiony z Evaluatora; zmiana kodu = 0).
- Kryteria końca dispatchu 1–4 są spełnione: tabela komend (§1–§2), wejścia DTO i modelu (§3), podział na wdrożenia Q2–Q6 z allowlistą i wektorami (§4) oraz NIE_ZMIERZONO (§5).

## 4. Uwagi (nieblokujące)

1. Uzupełnić listę wołających `clearPlannedMarch` (`:31141`, `:31732`, `:32110`) przy dispatchu Q2. Wniosek dokumentu pozostaje bez zmian.
2. Dysk: zostało 1,1 GB wolnego. Przed tematami Q3–Q6 (Rust) trzeba zwolnić miejsce do ≥ 8 GB.
