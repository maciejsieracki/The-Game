# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — obrona Operatora r1 (odpowiedź na 02-evaluator.md)

STATUS: BLOCK (INFRA, tylko pełna bramka; zarzuty 2 i 3 przyjęte dokumentacyjnie)
DOMAIN: INFRA (bramka) + PROCESS (zarzuty 2 i 3)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` dla aktywnego fotela `ME()` w parytecie z pinem `07d2fbd72`
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1C-FOG-VIEW-R1/02a-obrona.md`).
  Kod bez zmian: `a17f28d42`. Commit obrony na `1e30517ba`, gałąź lokalna `rust-port-wip/p4-1c-fog-view-r1-obrona`.
TESTY: żadnych bramek cargo w tej rundzie obrony (dysk poniżej progu, patrz zarzut 1).
BLOKADY: INFRA, dysk 2,9–3,8 GB wolnego przy progu 8 GB.
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: r2 = pełna bramka na `a17f28d42` po zwolnieniu dysku do ≥ 8 GB, bez zmian w kodzie.
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 1 [BLOKUJĄCY, INFRA] — pełna bramka cargo niewykonana

**PRZYJMUJĘ zarzut co do faktu. Spełnić go teraz nie mogę.**

Pomiar w tej rundzie (2026-11-17 ok. 14:00, worktree `wf_adaaa3fa-712-3`):

```
$ df -h /
/dev/vda  252G  36G  2.9G  93% /    (na starcie obrony)
/dev/vda  252G  35G  3.8G  91% /    (po przełączeniu gałęzi)
```

Próg z dispatchu (§BRAMKI, DYSK) to ≥ 8 GB przed bramką pełną. Przy < 8 GB dispatch nakazuje BLOCK INFRA
z liczbą GB, a nie uruchomienie bramki. Uruchomienie `cargo test --all-targets` w engine i renderer przy
3–4 GB grozi zapełnieniem dysku i wywróceniem równoległych workerów. Nie uruchamiam.

Kod nie wymaga zmian: zarzut nie wskazuje błędu w kodzie, a Evaluator potwierdził statycznie logikę,
wektory z pinu i pokrycie mutacji. Do zamknięcia zarzutu orkiestrator musi zwolnić dysk do ≥ 8 GB i
puścić r2 z poleceniami (bez zmian w kodzie, SHA `a17f28d42`):

```
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<scratchpad>/target
cd rust-port/engine   && cargo fmt --check && cargo clippy --all-targets -- -D warnings \
                      && cargo test --test p4_1c_fog_view && cargo test --all-targets --no-fail-fast
cd rust-port/renderer && cargo fmt --check && cargo clippy --all-targets -- -D warnings \
                      && cargo test --all-targets --no-fail-fast
rm -rf "$CARGO_TARGET_DIR"
```

Plus odtworzenie mutacji (a), (b), (c) przez Evaluatora r2.

## Zarzut 2 [NOTA] — producent bez wołającego produkcyjnego

**PRZYJMUJĘ. Dopisuję jawny temat i zależności wpięcia.**

Dowód stanu (na `a17f28d42`): `git grep -n -E 'fog_view::|refresh_fog\('` poza `tests/` daje wyłącznie
definicję `rust-port/engine/src/domain/state.rs:1441` (`refresh_fog`) i `:1414` (`fog_view_dto`). To samo
dotyczy pozostałych producentów P4 (`city_views`, `build_map_view`, `overlays_view`): REJESTR-RUST.md:2620
odnotowuje „brak wołającego; renderer nie zależy od `civ-engine` (L6)”, decyzja #308. Zakres dispatchu
(§ZAKRES pkt 1) obejmował tylko producenta, więc wpięcie świadomie nie weszło do tej rundy.

Zależności wpięcia (do osobnego tematu, proponowane ID `R-RUSTPORT-P4-1C-FOG-WIRE`):
1. **Droga DTO engine → renderer (audyt L6, decyzja #308).** Renderer nie zależy od `civ-engine`.
   Dopóki nie ma adaptera ani mostu (bridge/IPC), `FogViewDto` z `refresh_fog` nie dojdzie do
   `renderer/src/view/fog.rs:65`.
2. **Flaga `ViewerDto.fog_active`.** Producent zwraca `fog_active = fogOn || revealAllLand`
   (`state.rs:1246-1247`, `:1456`). Wpięcie musi przenieść ją do `ViewerDto`/`RootDto`, zamiast liczyć ją
   drugi raz w adapterze.
3. **Stan wejściowy (Z-FOG-1).** `ME()`, `exploredByHuman`, `fogOn`, `revealAllLand`, start hex i promień
   startu podaje wołający. Wpięcie musi wskazać, skąd je bierze w sesji gry (nie ma ich w `PlayableState`).
4. **Odblokowanie PRIO-3D-11 L1/L2 (#279, #254) i PRIO-3D-10 F2 (#278).** REJESTR-RUST.md:2436 wiąże je
   z decyzją mgły dla fotela ≠ 0 (#253). Ten producent ją realizuje (mgła dla `ME()`), ale same tematy
   odblokuje dopiero wpięcie z pkt 1–3.

Wpis do REJESTR-RUST robi orkiestrator (zasada 8 orkiestratora). Operator nie dotyka rejestru, bo ten
plik jest poza allowlistą tematu.

## Zarzut 3 [NOTA] — Z-FOG-2 bez wektora z pinu

**PRZYJMUJĘ klasyfikację: Z-FOG-2 to decyzja techniczna, nie zmierzony parytet.**

Pin `07d2fbd72` ma jeden fotel ludzki: `exploredByHuman = Map([[HUMAN_OWNER_PRIMARY, explored]])`, a
`fogExploredForRender` czyta globalne `explored`. Wektora z dwoma fotelami z pinu nie da się wygenerować,
bo web takiego stanu nie buduje. Test `p4_1c_fog_explored_is_per_seat` sprawdza zachowanie Rust zgodne
z dispatchem („eksploracja per fotel: `exploredByHuman.get(ME())`”, pin `main.ts:13490`) i zabija mutację (b).
Dla jednego fotela wynik Rust jest identyczny z pinem (pokrywają to wektory 1–7 z generatora).

Proponowany wpis orkiestratora do REJESTR-RUST:
> **Z-FOG-2 (decyzja techniczna, R-RUSTPORT-P4-1C-FOG-VIEW-R1):** render czyta eksplorację aktywnego
> fotela `exploredByHuman.get(ME())`. Dla jednego fotela zgodne z pinem `07d2fbd72` (7 wektorów z
> uruchomionego `main.ts`). Dla ≥ 2 foteli brak wektora z pinu (web ma jeden fotel); zachowanie
> testowane tylko po stronie Rust (`p4_1c_fog_explored_is_per_seat`). Nie jest zmierzonym parytetem.

## Podsumowanie

| Zarzut | Odpowiedź | Zmiana |
|---|---|---|
| 1 pełna bramka (INFRA) | PRZYJMUJĘ, niewykonalne teraz: dysk 2,9–3,8 GB < 8 GB | brak, r2 po zwolnieniu dysku |
| 2 brak wołającego | PRZYJMUJĘ | temat `R-RUSTPORT-P4-1C-FOG-WIRE` i 4 zależności opisane wyżej |
| 3 Z-FOG-2 bez wektora | PRZYJMUJĘ | treść wpisu do REJESTR-RUST opisana wyżej |
