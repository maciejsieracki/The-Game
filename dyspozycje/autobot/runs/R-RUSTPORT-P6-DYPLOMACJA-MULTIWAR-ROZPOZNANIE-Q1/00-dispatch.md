# DISPATCH R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie (BEZ zmian kodu)

TEMAT: DYPLOMACJA-MULTIWAR (#181): bramki wojen epoki i MULTIWAR-ERA — rozpoznanie
DOMENA: GAME (rozpoznanie). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`, melee zintegrowane). Worktree na `wip/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` (oraz pozostałe pliki `gra/src` z `git show 07d2fbd72:<ścieżka>`).

## GOAL
Ustalić, które bramki wojen zależne od epoki (MULTIWAR-ERA, wojny wielostronne) są w pinie i czego brakuje w Rust (`rust-port/engine/src/domain/diplomacy*.rs`, `war_turn_*.rs`). Szukać w pinie po `multiwar`, `MULTIWAR`, `epoch`, `era`, `declareWar`. Każda bramka: plik:linia pinu, plik:linia Rust, status. Zaproponować podział tematu 3 na tematy wykonawcze z zależnościami i rundami.

## ZAKRES
- Tylko czytanie kodu i raport. Zero zmian w `rust-port/**`, `gra/**`, testach.
- Zakres: bramki wojen pinu (multiwar/era) i ich odpowiedniki w Rust; zależność od CRED-HAK (#120) zaznaczyć, nie rozstrzygać.
- Każde twierdzenie: plik:linia (Rust i pin). Niepewne = NIE_ZMIERZONO.
- Nie zgadywać wartości liczbowych; jeśli są potrzebne do dalszej pracy — wpisać jako NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ROZPOZNANIE-Q1/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2.

## KRYTERIA KOŃCA
1. Tabela: każdy element zakresu → pin (plik:linia) → Rust (plik:linia) → status, z dowodem.
2. Lista brakujących elementów z plik:linia.
3. Propozycja podziału na tematy wykonawcze z zależnościami i szacunkiem rund (uzasadnionym, nie zgadniętym).

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokument)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
