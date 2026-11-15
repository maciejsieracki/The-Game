# DISPATCH R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1 — DECYZJA TECHNICZNA, TYLKO ODCZYT (#232 / #170 / #139 / #151)

TEMAT: czy włączyć feature `float_roundtrip` serde_json dla testów wektorowych (zapis/odczyt f64 bit-w-bit). Decyzja + dowód, bez zmian w Cargo.toml.
DOMENA: PROCESS/TECH. Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `f7baa3848`. Worktree detached. ZERO zmian w `Cargo.toml`, `Cargo.lock`, kodzie.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## KROKI
1. Odczytaj `rust-port/engine/Cargo.toml` i `rust-port/view-model/Cargo.toml` (features serde_json).
2. `git grep -n "serde_json" rust-port` — które testy wektorowe wczytują/zapisują f64 przez serde_json.
3. Oceń dokumentacyjnie, czy domyślne parsowanie serde_json jest bit-w-bit dla wartości z wektorów (dokumentacja crate'a w `~/.cargo/registry` jeśli dostępna, bez pobierania sieciowego). Jeśli nie da się rozstrzygnąć bez uruchomienia — NIE_ZMIERZONO.
4. Zapisz decyzję: TAK (włącz feature w osobnym temacie) / NIE (wystarczy obecne) / NIE_ZMIERZONO, z plik:linia.

## KRYTERIA KOŃCA
1. Dokument `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` (NOWY): kroki 1–4, decyzja i uzasadnienie.
2. `git diff --check` czysty; `git diff --name-only` = allowlista.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SERDE-FLOAT-DECYZJA-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
