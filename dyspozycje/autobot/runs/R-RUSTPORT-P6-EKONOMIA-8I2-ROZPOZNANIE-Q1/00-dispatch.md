# DISPATCH R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie (BEZ zmian kodu)

TEMAT: EKONOMIA-8I2 (#180): brakujące 8I2 i dostęp do żelaza (P6.6–P6.8) — rozpoznanie
DOMENA: GAME (rozpoznanie). BAZA: `5e8b116e8` (czubek `origin/rust-port/parity-v2`, melee zintegrowane). Worktree na `wip/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts` (oraz pozostałe pliki `gra/src` z `git show 07d2fbd72:<ścieżka>`).

## GOAL
Ustalić, które reguły ekonomii miast z pinu (zestaw 8I2 oraz dostęp do żelaza/zasobu) nie mają odpowiednika w Rust. Szukać w pinie `gra/src` (grep po `8I2`, `iron`, `żelaz`, `city`) i w `rust-port/engine/src`. Dla każdej reguły: plik:linia w pinie, plik:linia w Rust, status (jest / brak / częściowo). Zaproponować podział na tematy wykonawcze z liczbą rund.

## ZAKRES
- Tylko czytanie kodu i raport. Zero zmian w `rust-port/**`, `gra/**`, testach.
- Zakres: pinowe funkcje ekonomii miast i zasobów; odpowiedniki w rust-port/engine/src/domain (economy*, city*, resource*).
- Każde twierdzenie: plik:linia (Rust i pin). Niepewne = NIE_ZMIERZONO.
- Nie zgadywać wartości liczbowych; jeśli są potrzebne do dalszej pracy — wpisać jako NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-8I2-ROZPOZNANIE-Q1/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.toml`, `Cargo.lock`, push do rust-port/parity-v2.

## KRYTERIA KOŃCA
1. Tabela: każdy element zakresu → pin (plik:linia) → Rust (plik:linia) → status, z dowodem.
2. Lista brakujących elementów z plik:linia.
3. Propozycja podziału na tematy wykonawcze z zależnościami i szacunkiem rund (uzasadnionym, nie zgadniętym).

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokument)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
