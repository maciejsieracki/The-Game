# DISPATCH R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1I / #218)

DOMENA: GAME, DTO renderera (zdarzenia bitwy). MODEL: OPUS we wszystkich rolach. ZERO zmian kodu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło kontraktu: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (decyzja D-DTO-7: zdarzenia bitwy jako snapshot wg webu).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie producenta zdarzeń bitwy (`BattleEventsDto`/snapshot, #218): jakie zdarzenia web emituje podczas bitwy dla renderera (animacje ciosów, strzałów, wież, wyłomu, ucieczki, zejścia z pola, logu), gdzie w pinie (plik:linia), które mają odpowiednik w Rust (`siege_tactics_loop.rs`, `combat`, `SeqEvent`), i które są luką.

## PIN (tylko odczyt)
`grep -rn "emit\|event\|Event\|battleLog\|onBlow\|onShot" gra/src/battle/battleScene.ts gra/src/render` — wyszukaj zdarzenia renderera bitwy. Zapisz plik:linia.
## RUST (tylko odczyt, `git grep` na bazie)
`SeqEvent`, `siege_tactics_loop.rs`, `combat`, `view-model/src/`, `renderer/`.

## KRYTERIA KOŃCA
1. Tabela: zdarzenie pinu (plik:linia) → dane → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista pól `BattleEventsDto` z wejściami z modelu bitwy.
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory). NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
