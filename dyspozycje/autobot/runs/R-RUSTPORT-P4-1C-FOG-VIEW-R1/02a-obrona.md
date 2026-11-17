# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — obrona Operatora r3 (odpowiedź na 02-evaluator.md, sekcja r3)

STATUS: PASS (żaden zarzut nie wymaga zmiany kodu; zarzuty 0, 1, 3, 4 przyjęte bez poprawek kodu, zarzut 2 odrzucony z dowodem)
DOMAIN: GAME (widok/DTO mgły) + PROCESS (zarzuty 1, 3, 4)
TEMAT: R-RUSTPORT-P4-1C-FOG-VIEW-R1
GOAL: producent `FogViewDto` dla aktywnego fotela `ME()` w parytecie z pinem `07d2fbd72`
ZMIANY/COMMIT: tylko ten plik. Kod bez zmian: `a17f28d42` (`git diff --stat a17f28d42 HEAD -- rust-port` pusty).
  Rodzic: `e894fd007` (Evaluator r3). Gałąź lokalna `rust-port-wip/p4-1c-fog-view-r3-obrona`, bez push.
TESTY: bez ponownego uruchamiania cargo (brak zmian kodu; bramki odtworzone niezależnie przez Evaluatora r3:
  engine 3893 passed / 0 failed / 1 ignored sprzed tematu, renderer 666 passed, fmt/clippy EXIT 0, mutacje 7/7 FAIL).
  Weryfikacja zarzutu 2: `git show`/`git grep` na pinie `07d2fbd72` (cytaty niżej). Dysk: 11 GB wolnego.
BLOKADY: brak
RUNDY: 3/5 (obrona po Evaluatorze r3)
NASTĘPNY KROK: Final Control r3, potem integracja orkiestratora (bez oznaczania tematu jako wpiętego w grę, patrz zarzut 1)
DEPLOY/PUSH: NIE WYKONANO

## Zarzut 0 (podsumowanie Evaluatora: bramki odtworzone, mutacje 7/7 FAIL) — PRZYJMUJĘ
Brak zarzutu do odparcia. Wynik zgodny z raportem Operatora r3 (`03-operator-r3.md`, commit `b48cff1a6`):
te same liczby (522 binaria / 3893 passed engine, 77 binariów / 666 passed renderer). Evaluator dołożył
mutacje (d)–(g) ponad wymagane (a)–(c); wszystkie dają FAIL, co wzmacnia dowód czułości testu.

## Zarzut 1 (nieblokujący) — brak wołającego produkcyjnego `refresh_fog` / `fog_view_dto` — PRZYJMUJĘ (bez zmiany kodu)
Fakt prawdziwy: `fog_view_dto` (state.rs:1414) i `refresh_fog` (state.rs:1441) są wołane tylko z testu
`p4_1c_fog_view`. Poprawka w tej rundzie naruszałaby dispatch: DODATEK r3 jawnie wyłącza wołającego
produkcyjnego z zakresu („POZA ZAKRESEM … wołający produkcyjny producenta … Zapis w rejestrze jako FOG-WIRE”),
a allowlista nie obejmuje bridge ani pętli renderera. Zależność jest jawna w dispatchu i w rejestrze
(FOG-WIRE, L6/#308). Zalecenie dla integracji: status „PRODUCENT GOTOWY, NIEWPIĘTY (FOG-WIRE)”, nie „wpięty w grę”.

## Zarzut 2 (teoretyczny) — web `ownPlayerVisibleHexes` nie pomija fortu z `radius <= 0`, Rust pomija — ODRZUCAM
Dowód, że rozbieżność jest nieobserwowalna (wynik identyczny dla każdego osiągalnego stanu):
1. Źródła fortu w webie pochodzą wyłącznie z `fortSightSources` (pin `gra/src/game/fort-territory.ts:390-400`):
   `radius: cityTerritoryRadius(fortNodeAsCityNode(f))`.
2. `cityTerritoryRadius` (pin `gra/src/map/territory.ts:89-93`): fort → `FORT_TERRITORY_RADIUS = 5` (`:75`),
   posterunek → `OUTPOST_TERRITORY_RADIUS = 3` (`:77`), w pozostałych przypadkach `cityRangeForPopulation(pop)`
   (komentarz `:87`: `max(5, pop)`). Promień jest zawsze ≥ 3, więc `radius <= 0` nie zachodzi ani w webie, ani w Rust.
3. Rust (`state.rs:1100-1104`, `if s.radius <= 0.0 { continue; }`) odpowiada kanonicznej pętli w pinie
   (`gra/src/game/visibility.ts:304`: `if (s.radius <= 0) continue;`), czyli funkcji
   `computePlayerVisibility`, którą dispatch wskazuje jako źródło. Usunięcie strażnika rozjechałoby Rust
   z `visibility.ts` i nie zmieniłoby żadnego obserwowalnego zachowania `main.ts`.
Wniosek: nie ma odstępstwa od webu, a zmiana kodu nie ma uzasadnienia (DODATEK r3: „Nie zmieniać kodu”).

## Zarzut 3 (proces) — trailer z nazwą modelu w commicie r1 `f56b2b796` — PRZYJMUJĘ (bez przepisywania historii)
Fakt potwierdzony (`git show -s f56b2b796`: trailer `Co-Authored-By: Claude Opus 5.5`). Operator nie przepisuje
historii gałęzi innej rundy ani refs/keep (to poza rolą Operatora). Commit tej obrony ma trailer bez nazwy
modelu (#289). Poprawka po stronie orkiestratora przy integracji, zgodnie z uwagą Evaluatora. Kod `a17f28d42`
tego nie dotyczy.

## Zarzut 4 (informacja) — pełny cargo test engine > 590 s; `renderer/Cargo.lock` przywrócony — PRZYJMUJĘ
Zgodne z raportem Operatora r3 (pierwsza próba EXIT 124 = timeout, powtórka w tle EXIT 0). `Cargo.lock`
nie występuje w żadnym commicie tematu (`git diff --stat 2760b4f0c HEAD -- '*Cargo.lock'` pusty).
Zalecenie procesowe dla orkiestratora: w dispatchach z pełną bramką engine przewidzieć uruchomienie w tle z zapisem EXIT.

---

# R-RUSTPORT-P4-1C-FOG-VIEW-R1 — obrona Operatora r1 (historia; odpowiedź na 02-evaluator.md r1)

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
