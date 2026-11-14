# DISPATCH R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2 (runda 1) — ROZPOZNANIE, BEZ ZMIAN KODU

TEMAT: ZLOZE część 2 (#104): rozpoznanie wiringu `deactivateZlozeGrantsForDeal` i `syncRelationStatusFromDeals` do ścieżek produkcyjnych. Wynik: tabela miejsc, lista brakujących odpowiedników w Rust i propozycja podziału na tematy wykonawcze.
DOMENA: GAME (rozpoznanie, read-only).
Baza: `origin/rust-port/parity-v2` na chwilę startu (sprawdź `git rev-parse --short origin/rust-port/parity-v2`; zapisz SHA w raporcie). Worktree: detached, z tego SHA; gałąź roboczą NIE zakładaj.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts`, `git show 07d2fbd72:gra/src/game/diplomacy-pn-engine.ts`, `git show 07d2fbd72:gra/src/game/trade-routes.ts`.

## GOAL
Dla każdego z czterech wywołań `deactivateZlozeGrantsForDeal` w pinie (`main.ts` ok. 22774, 23694, 24234, 24294) ustal: (a) jaka to ścieżka domenowa (zerwanie przez gracza, wojna, wygaśnięcie, trybut, inna), (b) czy odpowiednik istnieje w Rust (plik:linia) i czy jest wołany w produkcji, (c) co brakuje do wpięcia. Dodatkowo: `syncRelationStatusFromDeals` i `suspendZlozeOnWar` / `suspendZlozeGrantsForWar` — to samo pytanie.

## ZAKRES
- Pomocnicze funkcje pina wołane obok: `removeTreatiesById`, `treatiesBrokenByWar`, `expireTreaties`, `suspendZlozeOnWar`, `breakTreatiesOnWar` (`main.ts` ok. 23688), `runDiplomacyTurnTick` (ok. 24222), obsługa trybutu (ok. 24270–24300).
- Rust: `rust-port/engine/src/domain/diplomacy.rs` (`DiplomacyState::deals` ok. 1738–1743; `sync_relation_status_from_deals` ok. 4276; `deactivate_zloze_grants_for_deal` ok. 4248 i metoda ok. 1675), `turn_war_dipl_steps.rs` (`sync_relation_from_deals` ok. 1004), `diplomacy_truce_flow.rs`, `diplomacy_basket.rs`. Szukaj też odpowiedników `expire`, `break`, `tribute` w `rust-port/engine/src`.

## KRYTERIA KOŃCA
1. Tabela: każde wywołanie pina → ścieżka → odpowiednik Rust (istnieje / brak / gdzie, plik:linia) → wołany w produkcji (tak/nie, dowód `git grep`).
2. Lista brakujących elementów (funkcje, stan, hooki), każdy z plik:linia.
3. Propozycja 2–4 tematów wykonawczych: nazwa, zakres, allowlista, zależności i szacowana liczba rund. Każdy temat ma być mały (jedna runda Operatora realnie).
4. Niepewne twierdzenia oznacz NIE_ZMIERZONO. Zero zmian w `rust-port/**`, `gra/**`, testach.

## ALLOWLISTA (tylko ten raport)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2/**`
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2.md` (NOWY, treść tabeli i propozycji)
ZAKAZ: wszystko inne. Bez push do `parity-v2`. Commit raportu na gałęzi `wip/R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2`, bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (SHA, allowlista)/TESTY: NIE DOTYCZY (read-only)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO.
