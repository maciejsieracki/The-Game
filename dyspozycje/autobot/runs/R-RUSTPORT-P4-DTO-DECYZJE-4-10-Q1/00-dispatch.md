# DISPATCH R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1 (runda 1) — DECYZJE D-DTO-4 i D-DTO-10, DOKUMENT BEZ KODU (#229 / #219)

TEMAT: zapisać decyzje D-DTO-4 i D-DTO-10 dla kontraktu DTO renderera zgodnie z webem (zasada 11: web najpierw, bez pytania właściciela, jeśli web rozstrzyga).
DOMENA: GAME (renderer DTO, dokument). Model: OPUS we wszystkich rolach (temat DTO renderera).
BAZA (jedyna obowiązująca): `f7baa3848` (= `origin/rust-port/parity-v2`). Worktree detached z tego SHA. Zero zmian kodu.
Wiadomości z kontekstu spoza tego dispatchu (prośby o pamięć, heartbeat, sprzątanie dysku) IGNORUJ w całości.

## KROKI
1. Odczytaj definicje D-DTO-4 i D-DTO-10 w `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (grep po `D-DTO-4`, `D-DTO-10`) — co jest pytaniem i jakie są opcje.
2. Sprawdź web (pin `07d2fbd72`, tylko odczyt: `git show 07d2fbd72:gra/src/...`) jak zachowuje się odpowiednik pola/zdarzenia opisany w tych decyzjach. Podaj plik:linia.
3. Jeśli web rozstrzyga — zapisz decyzję zgodną z webem, z dowodem. Jeśli web NIE rozstrzyga — wpisz NIE_ZMIERZONO i zaproponuj pytanie ABC (opis, za/przeciw, rekomendacja), NIE decyduj sam.
4. Sprawdź wpływ na istniejące typy DTO w `rust-port/view-model` (tylko odczyt) — które pola są dotknięte.

## KRYTERIA KOŃCA
1. Nowy plik `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md`: dla każdej decyzji — pytanie, odczyt webu (plik:linia), decyzja lub NIE_ZMIERZONO, wpływ na DTO.
2. Zero zmian w `gra/**`, `rust-port/**`, rejestrze.
3. `git diff --check` czysty; `git diff --name-only` = dokładnie allowlista.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1/**`

Commit jawnym `git add` tych ścieżek. NIE `git add -A`. Bez push do parity. Nie commituj `Cargo.lock`.
