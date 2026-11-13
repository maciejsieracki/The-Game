# DISPATCH R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie, BEZ zmian kodu

TEMAT: ZDOBYCIE-MIASTA (#115/#175): wpięcie zdobycia miasta (apply_transfer_with_effects, run_capital_capture_plunder, akumulatory zdobyczy) i druga ścieżka przegranej po utracie miasta w bitwie (pin `main.ts:34018-34025`) — rozpoznanie
DOMENA: GAME (rozpoznanie). BAZA: `0ca58770e` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1`. Przed startem: `git checkout --detach 0ca58770e`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/<ścieżka>` — szukać `capture`, `captureCity`, `plunder`, `transferCity`, `zdobycz`, `34018`, `34025`.

## GOAL
Ustalić dla każdego miejsca zdobycia miasta z pina (wywołania ścieżek przejęcia w bitwie, w dyplomacji i w fazie kapitulacji): pin plik:linia → odpowiednik w Rust (plik:linia) → status (jest w produkcji / jest tylko w testach / brak). Wskazać, co blokuje wpięcie w produkcję (brakujący producent, allowlista, zależności od #106/#120). Zaproponować podział na tematy wykonawcze z liczbą rund jako szacunek (nie pomiar). Parytet z webem: nie wymyślać zachowania poza pinem.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/<ID>/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.*`, push do parity.

## KRYTERIA KOŃCA
1. Tabela wszystkich miejsc przejęcia z pina z odpowiednikami w Rust i statusem, z dowodem plik:linia po obu stronach.
2. Lista braków (pola, funkcje, producenty) z plik:linia.
3. Plan podziału na tematy wykonawcze z zależnościami; szacunek rund oznaczony jako szacunek.
4. Niepewne = NIE_ZMIERZONO.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokumenty)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Operator: Haiku. Commit BEZ linii `Co-Authored-By` z nazwą modelu (CLAUDE.md), z `Claude-Session`. RUNDY: 1/5.
