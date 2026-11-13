# DISPATCH R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie (BEZ zmian kodu)

TEMAT: SAVE-LOAD-MIGRACJE (#184): pola i migracje zapisu z §0b (P6.20–P6.22) — rozpoznanie
DOMENA: GAME (rozpoznanie). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`, melee zintegrowane). Worktree na `wip/R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` (oraz pozostałe pliki `gra/src` z `git show 07d2fbd72:<ścieżka>`).

## GOAL
Porównać pola zapisu pinu (funkcje zapisu/odczytu stanu gry w `gra/src`, np. `saveGame`, `restoreGame`, `serialize`, `version`) z modułem zapisu Rust (`rust-port/engine/src/**save**`, `replay*`, `load_json_with_migration_reports`). Zestawienie: pole → pin plik:linia → Rust plik:linia → status (jest/brak/inny typ). Lista migracji wersji zapisu z pinu i z Rust. Plan §0b w `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` (gałąź claude/rust-sivvrn) — odczytać i wskazać, które pola są w planie.

## ZAKRES
- Tylko czytanie kodu i raport. Zero zmian w `rust-port/**`, `gra/**`, testach.
- Zakres: pola i migracje zapisu pinu vs Rust; zgodność z §0b planu.
- Każde twierdzenie: plik:linia (Rust i pin). Niepewne = NIE_ZMIERZONO.
- Nie zgadywać wartości liczbowych; jeśli są potrzebne do dalszej pracy — wpisać jako NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SAVE-LOAD-MIGRACJE-ROZPOZNANIE-Q1/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2.

## KRYTERIA KOŃCA
1. Tabela: każdy element zakresu → pin (plik:linia) → Rust (plik:linia) → status, z dowodem.
2. Lista brakujących elementów z plik:linia.
3. Propozycja podziału na tematy wykonawcze z zależnościami i szacunkiem rund (uzasadnionym, nie zgadniętym).

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokument)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
