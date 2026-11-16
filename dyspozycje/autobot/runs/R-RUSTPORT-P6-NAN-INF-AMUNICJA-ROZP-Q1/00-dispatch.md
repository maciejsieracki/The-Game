# DISPATCH R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1 (runda 1) — rozpoznanie NaN/Inf w amunicji i maxRounds (#137, #168)

DOMENA: rozpoznanie walki, TYLKO ODCZYT (bez kodu). MODEL: HAIKU (Operator), SONNET (Evaluator).
BAZA: `origin/rust-port/parity-v2` = `3a8f068f6`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).

## PYTANIA
1. Co pin robi, gdy amunicja (`resolveAmmo`, `gra/src/game/combat.ts` ~784) lub `maxRounds` jest NaN / Infinity / ujemne / ułamkowe? Zwróć tabelę: wejście → wynik pinu (plik:linia).
2. Co robi Rust (`rust-port/engine/src/domain/combat.rs`, `ranged_phase::resolve_ranged_phase` ~1136, oraz `resolve`/`resolve_combat`)? Ta sama tabela.
3. Gdzie rozjeżdżają się wyniki? Czy rozbieżność jest w kodzie (wymaga naprawy), czy w zakresie typów (np. f64 vs liczba całkowita)?
4. Lista wektorów, które trzeba napisać (bez ich pisania).

## WYJŚCIE
- Dokument `dyspozycje/rust-port/p6/NAN-INF-AMUNICJA-ROZPOZNANIE.md` (NOWY) i raport w katalogu runu.
- Wyraźnie oznacz NIE_ZMIERZONO tam, gdzie nie uruchomiono pina. Bez commitów kodu.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/NAN-INF-AMUNICJA-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1/**`
