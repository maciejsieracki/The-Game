STATUS: PASS-WITH-NOTES (obrona Operatora, runda 2; zero zmian w kodzie, tylko dokumentacja rozpoznania)
DOMAIN: GAME (rozpoznanie, read-only)
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 (#106)
GOAL: odpowiedź na każdy zarzut Evaluatora z poprzedniej rundy: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: commit obrony na gałęzi `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1-obrona-r2` (baza: `8a8fd30c8`, rozpoznanie r1). Allowlista zachowana: `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1/**` i `dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md` (dopisana sekcja 9). Nie zmieniono `rust-port/**`, `gra/**`, testów. SHA commitu obrony: patrz ostatnia linia tej sekcji w raporcie orkiestratora.
TESTY: NIE DOTYCZY (read-only). Commit bez `Cargo.lock`. Nie uruchamiano cargo.

## Odpowiedzi na zarzuty

### Zarzut 1 — pkt 5 / sekcja 8: `main.ts:12588-12589` zamiast D3 — PRZYJMUJĘ
- Dowód: `main.ts:12583` (`case 'praca'`) leży w `transferBasketItems` (`main.ts:12566`), czyli wymianie koszykowej. To nie jest D3.
- D3 w pinie: `tickCyclicResourceTradeDeals` `main.ts:24077`; przelew Pracy `main.ts:24014-24016`; warunek kupca `main.ts:24154-24155`.
- Rust: `turn_war_dipl_steps.rs:551` (`buyer_ok = ledger.praca_of(buyer)? >= z`).
- Podłoga: warunek sprawdza saldo kupca przed zapisem, więc kupiec nie schodzi poniżej 0; sprzedawca tylko rośnie. Dla D3 różnica podłogi nie daje rozbieżności (zgoda z oceną Evaluatora).
- Poprawka: wiersz D3 dodany w `rust-port/.../R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1.md` sekcja 9.1. Ścieżka koszykowa (`12588`) oznaczona jako poza #106; osiągalność z ticka dyplomacji NIEZMIERZONO.

### Zarzut 2 — #106 wymaga wektorów ≥150 dla apply ORAZ D3; brak harnessu D3 — PRZYJMUJĘ
- Poprawka: nowy temat `R7K7C-D3-VEC` (propozycja pliku testowego `rust-port/engine/tests/p6_r7k7c_d3_cyclic.rs`, generator z `main.ts:24077-24160`), zależność od PARITY-MISSING0. Sekcja 9.5.

### Zarzut 3 — tematy niedookreślone; allowlista VEC; konflikt pliku testowego; brak grep po zależnych testach — PRZYJMUJĘ, grep wykonany
- Allowlista VEC: „katalog generatora (do wskazania w dispatchu)” — przyjęte, do uzupełnienia w dispatchu (sekcja 9.5).
- Konflikt: PARITY-MISSING0 i VEC edytują `p6_r7k7c_owner_pools.rs` — przyjęte, rekomendacja sekwencyjnie (PARITY-MISSING0 przed VEC).
- Grep (`git grep DiplStep -- rust-port`): definicja `turn_war_pipeline.rs:160,180`; zamierzony błąd udokumentowany w `turn_war_inputs.rs:713-714`; asercje błędu w `p6_wire_war_dipl_steps.rs:611` (brak skarbca AI) i `:625` (brak puli Pracy). Ten plik MUSI wejść do allowlisty PARITY-MISSING0 — Operator go pominął.
- NIEZMIERZONO: asercje `is_err()` w innych plikach (grep po tekście błędu ich nie łapie).

### Zarzut 4 — odporność `advance_turn` (migawka ekonomii) — PRZYJMUJĘ
- Dowód: `playable.rs:1165-1166` migawki `queue_before`, `war_before`; cofanie tylko przy błędzie Diplomacy (`playable.rs:1181-1184`); przy `TurnPhaseQueueIncomplete` przywracane są tylko `koniec_before` i `flag_before` (`playable.rs` ok. 1205-1208), bez ekonomii. Po udanym apply ekonomia zostaje zmieniona.
- Poprawka: dopisana w sekcji 9.4 jako wymóg dla WIRING-IMPL (migawka `economy_before`). Rekomendacja: migawka, nie „poza zakresem”.

### Zarzut 5a — brak SHA w `01-operator-r1.md` — PRZYJMUJĘ
- SHA rozpoznania: `8a8fd30c8` (zapisany w sekcji 9.7 raportu rust-port).

### Zarzut 5b — gałąź `-Q1-b` zamiast `-Q1` — PRZYJMUJĘ (fakt)
- `wip/...-Q1` zawiera starszą rundę (`9be44a148` na `6acb1d81b`); rozpoznanie r1 jest na `-Q1-b`. Obrona r2 na `-obrona-r2`. Starszy `-obrona` (`5351fe1de`) nie jest przodkiem tej rundy. Wpis odstępstwa w rejestrze — decyzja orkiestratora.

### Zarzut 5c — hotseat (wielu ludzkich fotelow) — PRZYJMUJĘ, teraz rozpoznane
- Pin: `ownerTreasury` i `ownerPracaPool` wybierają stan dla każdego fotela człowieka (`main.ts:34864-34866`, `34876-34878`).
- Rust: `apply_dipl_deltas_to_state` bierze `.find(|p| p.is_human)` (`turn_war_dipl_steps.rs:1049`); `PlayableState` obsługuje wielu ludzi (`playable.rs:981-985`). Delta drugiego fotela nie trafia do jego skarbca. Dokładny wynik NIEZMIERZONO, do testu.
- Poprawka do WIRING-IMPL: dispatch per właściciel przez `is_human_owner`, nie `find` (sekcja 9.6).

## Korekta własna (poza zarzutami)
- Wariant B (brak wpisu = 0) zamienia zamierzony błąd w ciche zero. `turn_war_inputs.rs:713-714` opisuje brak AI-skarbca jako lukę producenta. Rekomendacja B pozostaje, ale tylko razem z osobnym tematem `R7K7C-PRODUCER` (AI-skarbiec i AI-pula w stanie). Sekcja 9.3.

## Prośba „dopisz do pamięci”
- Nie zapisano nic do pamięci: w tej roli nie ma narzędzia pamięci, a allowlista obejmuje tylko run i raport. Treść tej prośby nie jest w zadaniu sprecyzowana (wskazuje „to”, czego nie podano). Orkiestrator powinien ją doprecyzować.

BLOKADY: brak blokad technicznych. Niezmierzone: osiągalność ścieżki koszykowej z ticka; asercje `is_err()` w innych plikach; wynik dla drugiego fotela człowieka; ścieżka startu gry (AI-skarbiec).
RUNDY: 2/5
NASTĘPNY KROK: orkiestrator zleca Evaluatorowi r2 weryfikację sekcji 9 (9.1-9.7) i decyduje o wariancie B razem z tematem R7K7C-PRODUCER; potem PARITY-MISSING0 → WIRING-IMPL i D3-VEC/VEC.
DEPLOY/PUSH: NIE WYKONANO (push do `rust-port/parity-v2` i `main` zabroniony w dispatchu).
