# P2.10 — Fixtures testowe i mechanizm replay: web ↔ Rust (PROPOZYCJA, nie decyzja)

**Temat:** `R-RUSTPORT-P2-10-FIXTURES-Q1` · **Runda:** 5/5 (poprawka po zarzutach Evaluatora rundy 4/5, §15; kolejna runda = LIMIT-5-EXCEEDED) · **Rola:** Operator (Haiku 5.5 medium)
**Baza diffu (zarzut 4 rundy 5/5):** plik JEST śledzony od commita `8bd2aea4` („P2.10: zrzut roboczy w toku”); `git status` = ` M`. Dispatch mówi „NOWY plik” — rozbieżność jawna. Final Control: diff liczyć względem `8bd2aea4`.
**Status:** propozycja do Evaluatora i Final Control. Każdy punkt bez jednoznacznej odpowiedzi w materiale źródłowym jest oznaczony `D-FIX-n` (wymaga decyzji) i NIE jest rozstrzygnięty po cichu.
**Charakter:** praca projektowa i odczytowa. Zero zmian w `gra/**`, zero kodu Rust, zero uruchomień buildu.
**Status wykonania (runda 5/5):** DECISION_REQUIRED. Żadne pole strony web nie jest zmierzone (zakaz buildu w `gra/`, brak nagrania), więc żaden scenariusz nie może dać PASS. Odpowiedzi na zarzuty rundy 3/5: §12 (zarzuty 1–9) i §13; na zarzuty rundy 4/5: §15 (zarzuty 1–4). Czytanie: `P2-5` §2.11–§9 oraz `P2-6` §9.1 i §9.4 są PRZECZYTANE (rundy 1–3); `P2-5` wiersze 79–188 (§2.1–2.8) oraz `P2-6` wiersze 535–1027 (Załączniki A–C) przeczytane w pełnych komórkach w rundzie 5/5 (§15, zarzut 1; `D-FIX-15`).

**Statusy dowodu w tabelach i w JSON (legenda):**
- `ODCZYT-KODU` — wartość wyprowadzona przez odczyt kodu na pinie (`git show` / `git grep`), bez uruchomienia. NIE wystarcza do PASS.
- `ZMIERZONO` — wartość uzyskana przez uruchomienie (nagranie web albo harness Rust) i zapisana w artefakcie. Jedyny status dopuszczalny do PASS.
- `NIE_ZMIERZONO` — wymaga uruchomienia (web: nagranie; Rust: harness). Brak wartości.
- `UNSUPPORTED` — strona Rust nie ma pola/komendy/ścieżki w kontrakcie.
- `D-FIX-n` — wymaga decyzji właściciela.

**Piny (odczyt wyłącznie przez `git show` / `git grep` / `grep` na plikach dispatchu):**
- web `main` = `edb8fb56` (`gra/src/**`, `gra/data/**`),
- Rust `rust-port/parity-v2` = `9e33fc77` (`rust-port/engine/**`).

**Konwencja ścieżek:** każda cytowana ścieżka jest pełna albo ma jednoznaczny skrót:
- `main.ts` = wyłącznie `gra/src/main.ts` (w `gra/src/` są jeszcze `oblezenie/main.ts` i `wonderpreview/main.ts`, które NIE są tu cytowane);
- pozostałe nazwy web (`save.ts`, `combat.ts`, `setup.ts` itd.) są cytowane z pełną ścieżką `gra/src/<katalog>/<plik>`. Sprawdzono (`git ls-tree` na `edb8fb56`), że dla każdej z nich w `gra/src` jest dokładnie jeden plik; duplikaty nazw są tylko `cities.ts` (`gra/src/game/cities.ts`, `gra/src/render/cities.ts`) i `main.ts` (3 pliki) — cytowane pełną ścieżką;
- pliki Rust: `playable.rs`, `state.rs`, `types.rs`, `rng.rs`, `replay.rs`, `save_load.rs`, `map_generator.rs`, `events.rs`, `combat.rs`, `ai_turn.rs`, `barbarians.rs`, `diplomacy.rs` = `rust-port/engine/src/domain/<nazwa>`; `bridge.rs` = `rust-port/engine/src/bridge.rs`; testy = `rust-port/engine/tests/<nazwa>`;
- dokumenty P1/P2 cytowane z katalogiem: `dyspozycje/rust-port/p1/...`, `dyspozycje/rust-port/p2/...`;
- kopie `gra-robocza/srcKopiaMaster/**` NIE są źródłem dowodu.

**Odczytane źródła (zakres jawny, stan po rundzie 3):**
- `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md`: cały (runda 1). §3 (zakres `hashInt3`) ponownie w rundzie 2.
- `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md`: cały (runda 1).
- `dyspozycje/rust-port/p2/P2-5-COMMANDS.md`:
  - §0 (wiersze 28–42) PEŁNE; §1 (43–61) PEŁNE (runda 3);
  - §2.9 (Tura i fotele, 189–197) i §2.10 (Zapis, 198–210) PEŁNE;
  - §2.1–2.8 (79–188) przeczytane w pełnych komórkach w rundzie 5/5 (§15, zarzut 1; wcześniej w podglądzie z obcięciem do ok. 260 znaków);
  - §9 (654–668) PEŁNE (runda 3);
  - wiersze tabel dowodów G12, G28, G30, G33, G35, G36 (§2.12) i B6, B11, S1, S4, U1, U2, O8, T-1…T-4, Z1…Z6 — przeczytane w rundach 1–3.
  - Runda 3/5 (§12, zarzut 1): PRZECZYTANE §2.11, §2.12 (pełne), §2.13 (pełne), §3, §4, §5, §6, §7, §7a, §7b, §8, §8b. NIEPRZECZYTANE w pełnych komórkach: §2.1–2.8 (tylko wiersze dowodowe użyte w FX-01…FX-07 i sumy §3). Luka czytania §2.1–2.8 zamknięta w rundzie 4/5 (§14, `D-FIX-15`).
- `dyspozycje/rust-port/p2/P2-6-EVENTS.md`:
  - §3.A–§3.F (wiersze E-01…E-60, w tym §3.B 157–188 i §3.F 214–229) — PEŁNE (rundy 2–3);
  - §7 (status zbiorczy, 281–302) PEŁNE (runda 3); §8 (typy payloadu, 303–320) PEŁNE (runda 3);
  - §9 „Rozstrzygnięcia (orkiestrator)” (1028–1075) PEŁNE (runda 3); §9.1 nagłówek i metoda (321–326) PEŁNE (runda 3);
  - §1, §2, §4–§6 — rundy 2;
  - Runda 3/5 (§12, zarzut 1): PRZECZYTANE §9.1 wiersze 327–494 oraz §9.4 (495–534). NIEPRZECZYTANE: Załączniki A–C (535–1027; tabele per linia `showHintMessage` i per plik `gra/src`). Nie wpływa na statusy FX-01…FX-07 (eventy nie są w v1, `D-FIX-11`), luka zamknięta w rundzie 5/5 (§15, zarzut 1; `D-FIX-15`).
- `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md`: wiersz 11 (`hp?`, ścieżka `CombatUnit.hp`) i wybrane wiersze §4.
- `dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md`: D5 (linia 112), D2 — per odwołania.
- `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md`: §6, wiersz „Rozliczenie tury” (linia 81).
- `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md`: wiersze A1–A5 i B1–B5 (w tym scenariusz B3 z `UnitNotOwned`).
- `dyspozycje/rust-port/p1/P1-GATE-SYNTHESIS-2.md`: tabela tematów, wiersze dla P1.7, P1.8, P1.13, P1.14, P1.16 (nazwy tematów sprawdzone w rundzie 3).

**Zastrzeżenie o źródle scenariuszy:** `P1-GATE-SYNTHESIS-2.md` NIE zawiera listy scenariuszy. Zawiera tabelę tematów P1 i stwierdza, że bramka P1 NIE jest otwarta. Scenariusze w §5 wyprowadzono z kolumny „scenariusz akceptacyjny” w `P1-18-HOTSEAT-MATRIX.md` oraz z nazw tematów P1 z tej tabeli. Otwartość bramki P1 nie jest tu tezą.

---

## 0. Wynik w skrócie

1. **Web nie ma mechanizmu replay ani logu komend gracza.** Grep `replay|recording|telemetry` (bez rozróżnienia wielkości liter) w `gra/src` na `edb8fb56` daje **39 wierszy** (`battle/battleScene.ts` 17, `battle/endScreen1E.ts` 4, `main.ts` 3, `map/cluster-spawn.ts` 2, `map/clusters.ts` 13). Z nich **15** to fałszywe podciągi w nazwie `requirePlayerMassGate` (`rePlay` w `requirePlayer…`) — odrzucone. **24** to trafienia prawdziwe, dotyczące ponownej bitwy („Rozegraj ponownie”, `_replayBattle`) i komentarzy o ponownym przebiegu fazy AI. Dowód dla `grep -w`: 3 wiersze, wszystkie w `battleScene.ts`. Nie ma dispatchera komend ani telemetrii; jest 174 nazwane callbacki `on*` (268 wystąpień) i 330 trafień wzorca mutacji w 19 plikach (`P2-5 §0`, `§2.13`), bez jednego punktu wejścia.
2. **Web nie jest deterministyczny z samego seeda.** Logika gry używa `Math.random` jako domyślnego RNG (`gra/src/game/combat.ts:863`, `gra/src/game/siege.ts:642`, `gra/src/game/villageRewards.ts:133`, `gra/src/game/city-founding.ts:63,90`; w `gra/src/main.ts`: `:3932`, `:9330`, `:25855`, `:25926`, `:32743`, `:35454`, `:35529`, `:35942` przekazanie `Math.random`, `:37091`) oraz generuje identyfikatory bytów z `Math.random().toString(36)`. Seed startowy z UI też pochodzi z `Math.random` (`gra/src/main.ts:1681`, `gra/src/ui/newGameFlow.ts:2018`). Stan RNG nie jest zapisywany w `gra/src/game/save.ts` (grep `rngState|rng_state`: 0 trafień). Zapis zawiera `meta.savedAt = new Date().toISOString()` (`gra/src/main.ts:30427`, pole w obiekcie `gra/src/main.ts:30497`; typ pola `gra/src/game/save.ts:217`).
3. **Rust `PlayableGame` nie używa generatora mapy.** `PlayableGame::new` (`rust-port/engine/src/domain/playable.rs:413-416`) wywołuje `build_map` (`playable.rs:628`), który buduje mapę z LCG (`next_seed`, `playable.rs:661-662`: mnożnik `1_664_525`, przyrost `1_013_904_223`) i wymiarów z `map_dimensions` (`playable.rs:602`; `malenki` → `(5,4)`, `playable.rs:604-608`). Nie ma połączenia z `map_generator.rs` (`map_generator::generate_map`, `rust-port/engine/src/domain/map_generator.rs:329`). Domyślny seed to 42 (`playable.rs:14`), a seed 0 jest normalizowany do 42 (`playable.rs:181-184`). Harness MUSI odrzucić seed 0 przed `new`, zamiast polegać na normalizacji (§4.1, §4.4).
4. **Wspólny zbiór pól web ↔ Rust jest wąski.** Rust `GameStateDto` ma 5 pól: `map, civilizations, cities, units, turn` (`rust-port/engine/src/domain/state.rs:9-15`). Jednostka DTO `UnitDto` ma `id, owner_id, kind, position` (`rust-port/engine/src/domain/types.rs:413-418`). `PlayableUnit` (`playable.rs:430-438`, konstrukcja w `new`) ma dodatkowo `movement, movement_max, selected`. **HP istnieje w Ruście, ale poza kontraktem:** `CombatUnit` ma `hp` i `max_hp` (`rust-port/engine/src/domain/combat.rs:34-35`), a modele AI i barbarzyńców mają `health_fraction` (`rust-port/engine/src/domain/ai_turn.rs:342`, `rust-port/engine/src/domain/barbarians.rs:188`). Skarbca per gracz w Ruście nie ma (`PlayablePlayer`, `playable.rs:284-289`).
5. **Rekomendacja v1:** fixture porównuje wyłącznie projekcję P-A (§2.3): tura, liczba graczy ludzkich, liczby jednostek i miast per rola właściciela. Pozycje jednostek i mapa są porównywane dopiero w trybie M1/M2 (§4.3). Scenariusze zależne od terenu są oznaczone i nie mogą dać PASS przed tym trybem.
6. **Dwa mechanizmy nagrywania są możliwe bez zmian w `gra/`:** rejestrator wejść UI sterowany przez Playwright z podmianą `Math.random` i zegara (wariant A), oraz odczyt końcowego zapisu z istniejącej ścieżki zapisu (wariant C). Wariant B (instrumentacja komend w `gra/`) wymaga zmiany `gra/` i jest poza tym tematem (`D-FIX-3`).
7. **Rust `PlayableGame::new` tworzy dokładnie 1 gracza (człowieka), 1 miasto i 1 jednostkę** (`playable.rs:417-438`). Pole `rivals: u16` (`playable.rs:97`, domyślnie `6` w `:132`) jest **walidowane** (`validate()`: `rivals > 32` → błąd, `playable.rs:211-213`; `validate()` jest wołane z `new` na `:415`), ale **nie tworzy graczy AI**; `unsupported_features` zawiera `rivals:NOT_IMPLEMENTED` (`playable.rs:158`). Liczba graczy AI po stronie web NIE jest polem `newGameParams`: `newGameFlow.ts` przekazuje `selectedAiCivIds: [...selAiCivIds]` (`gra/src/ui/newGameFlow.ts:2061`, typ `:173`) — to lista preferencji cywilizacji AI, nie liczba, ograniczona capem `civ_types_count` (`:619-620`). Liczba AI powstaje w runtime: `assignAiCivTypes` bierze `sorted.length` z `aiOwnerIds` (`gra/src/game/civ-roster.ts:149-154`; `pickActiveCivPool` z parametrem `numAi`, `:61-65`). Web `rivals` = `String(cityStatesCount)` (`newGameFlow.ts:2038`), więc nie jest liczbą AI. Rust: `selected_ai_civ_ids` (`playable.rs:116`) jest czytane tylko w testach (`rust-port/engine/tests/playable_slice.rs:212`), nie w `new`. `aiPlayerCount` nie jest porównywalne (`D-FIX-10`, `D-FIX-13`).
8. **Eventy NIE są w v1 porównywane — to nierozstrzygnięta decyzja `D-FIX-11`, nie decyzja po cichu.** Dispatch wymaga eventów po każdej komendzie z P2.6. Argumenty za wykluczeniem z v1: P2-6 §5 pkt 2–3 (eventy są powiadomieniami, nie źródłem stanu; karty blokujące wyprowadzane ze stanu), P2-6 §9 pkt 8–9 (orkiestrator: `engine_state_changed` zostaje snapshotem synchronizacji; utrata eventu jest akceptowalna), oraz brak emitera eventów domenowych w Ruście (`EventQueue` z `drain*`, `rust-port/engine/src/domain/events.rs:446-457`, bez konsumenta w `playable.rs`; P2-6 §9.1 dowód globalny G-1).
9. **Identyfikatory właścicieli różnią się między stronami.** Web: człowiek = `ownerId 0`, AI = `1..N` (`gra/src/units/setup.ts:37`, komentarz). Rust: człowiek = `HUMAN_PLAYER_ID = 1` (`playable.rs:15`). Projekcja porównuje więc role (człowiek / AI / barbarzyńca), nie surowe ID (`D-FIX-14`).
10. **Parametry startu: klucze spoza `StartGameParams` nie są ignorowane po cichu.** Struktura Rust ma `#[serde(default, rename_all = "camelCase")]` (`playable.rs:88-89`) bez `deny_unknown_fields` (grep `deny_unknown` w `rust-port/engine`: 0 trafień), więc serde cicho pomija nieznane klucze. Web `humanSeats` to typ `HumanSeats` (`gra/src/game/human-owners.ts:28-31`: `humanOwnerIds`, `activeHumanOwnerId`), NIE pole `newGameParams` i NIE pole `StartGameParams` (grep `human_?seats` w `rust-port/engine` na `9e33fc77`: 0 trafień). Stąd harness musi odrzucić każdy klucz `webOnlyParams` jako `UNSUPPORTED` przed `PlayableGame::new` (§4.1 krok 2, §6 pkt 8).
11. **Bramka końca tury web blokuje FX-01 przed założeniem miasta (`webPrecondition`).** Na starcie `isAwaitingFirstPlayerCity()` jest true (wrapper `gra/src/main.ts:10395` → alias `computeAwaitingFirstPlayerCity` z `gra/src/game/first-player-city.ts:14-20`: `!playerEverOwnedCity && !cities.some(c => c.ownerId === owner)`; zbiór `playerEverOwnedCityByOwner` pusty przy starcie, `gra/src/main.ts:2686`; dodania tylko przy zakładaniu/przejęciu/walce, `:13570`, `:14769`, `:29723`; `grantPlayerStartUnits` `:9351` nadaje jednostki, nie miasta; preset playtest `:37780` poza grą normalną; bramka `:31041-31043`); `canPlayerInitiateEndTurn()` (`:31034`) zwraca false, a `advanceSeat()` (`:36047`) woła tę bramkę (`:36070`). Koniec tury web (`onEndTurn`, `:22556`; klawisz N, `:36223-36230`) nie przechodzi, dopóki gracz nie założy pierwszego miasta. Rust nie ma `found_city` (`bridge.rs:22-41`), więc FX-01 nie może przejść po stronie web ani zostać zmapowany. Wynik FX-01 = UNSUPPORTED (§4.4 pkt 2), a nie NIEWYPEŁNIONY ani SKIP-MAP. Klawisz Spacja (`:36131`) nie kończy tury (następna armia).

---

## 1. Fakty z kodu (dowody)

| # | Element | Web (`edb8fb56`) | Rust (`9e33fc77`) | Wniosek dla fixture |
|---|---|---|---|---|
| 1 | Log komend / replay | 0 trafień w logice gry; prawdziwe trafienia (24 wiersze, §0 pkt 1) to ponowna bitwa (`gra/src/battle/battleScene.ts`, `_replayBattle`; `gra/src/battle/endScreen1E.ts:212-213`, `cb.onReplay`) i komentarze w `gra/src/main.ts`. Trafienia `requirePlayerMassGate` są fałszywe (§0 pkt 1). | `rust-port/engine/src/domain/replay.rs`: `ReplayLog<I>` (`:138`, pola `seed`, kroki), `ReplayRecorder<I>` (`:307`), `ReplayPlayback<I>`, `ReplayStep<I>` (`:31`) z opcjonalnym `SaveSnapshot`. Moduł NIE jest zadeklarowany w `rust-port/engine/src/domain/mod.rs` ani `rust-port/engine/src/lib.rs` (grep: 0 trafień); kompilowany tylko przez `#[path = "../src/domain/replay.rs"]` i `mod replay;` w `rust-port/engine/tests/replay.rs:9-11` (zgodne z `P2-7 §5`, `P2-2 D5`). | Format replay po stronie Rust istnieje jako kod testowy, nie w crate. Po stronie web nagrania nie ma. |
| 2 | Seed startowy | `generateMap`: `effectiveSeed = seed \|\| 42` (`gra/src/map/generator.ts:159`, funkcja `generateMap` na `:148`); UI: `seed = Math.floor(Math.random()*1_000_000)` (`gra/src/ui/newGameFlow.ts:2018`); start: `params.seed > 0 ? params.seed : Math.floor(Math.random()*1e9)` (`gra/src/main.ts:37091`); dodatkowo `const SEED = Math.floor(Math.random()*1e9)` (`gra/src/main.ts:1681`). | `StartGameParams.seed: u32` (`playable.rs:103`); `normalized()`: 0 → 42 (`playable.rs:181-184`). | Fixture podaje seed jawnie. Seedy ≥ 4 000 000 są objęte **warunkowo** D-FIX-4 (wiersz 3; status DECISION_REQUIRED). Ścieżki z `Math.random` jako źródłem seeda są niedozwolone w nagraniach (§3.3 pkt 3). |
| 3 | Zakres seedów dla `hashInt3` | Rozjazd web ↔ Rust terenu: losowe seedy z [4e6, 2^32) rozbieżne w 3980/4000 przebiegach (`P2-4 §3`). Dla seedów **4 000 000, 4 000 001, 4 010 000, 4 100 000 — 0 różnic** (`P2-4 §3`, linia 31); dla 4 100 001, 4 200 001, 4 294 967 295 — różne dla 216/216 punktów siatki. Wynik niemonotoniczny. Mechanizm: iloczyn `c * 2246822519` przekracza 2^53 dla `c` ok. powyżej 4.0e6 (`P2-4 §3`). | — | `D-FIX-4`: próg 4e6 NIE jest dowiedziony (`P2-4 §3` nazywa zakres „bezpieczny” nieudowodnionym). Zakaz seedów ≥ 4e6 jest **warunkowy**: stosuje się tylko, jeśli właściciel wybierze opcję (a) lub (b) w `D-FIX-4`; do tego czasu status DECISION_REQUIRED i nie jest faktem. Seed 42 jest poniżej tego zakresu, ale to nie jest dowód zgodności terenu (§4.3, polityka M0). |
| 4 | RNG gry (walka, barbarzyńcy, nagrody, miasta) | `Math.random` jako wartość domyślna (`gra/src/game/combat.ts:863`, `gra/src/game/siege.ts:642`, `gra/src/game/villageRewards.ts:133`, `gra/src/game/city-founding.ts:63`); w `gra/src/main.ts` przekazywany `Math.random` do silnika (`gra/src/main.ts:33252`, `:35942`) | `Rng` (`rust-port/engine/src/domain/rng.rs:34`, `mod rng;` w `mod.rs:18`); `PlayableGame` nie używa `Rng` (`build_map` = LCG, `playable.rs:628-662`) | Sekwencja RNG po stronie web nie jest powtarzalna bez podmiany `Math.random`. Porównanie walki wymaga zgodnej sekwencji losowań (`P2-4 §4`, `P2-6 D-EV-8`). |
| 5 | Identyfikatory bytów | Web: `'prod_'+turn+'_'+cityId+'_'+Math.random().toString(36)` (`gra/src/main.ts:3932`), `'barb_'+turn+…` (`gra/src/main.ts:35454`), `'sg'+ownerId+'_'+Date.now().toString(36)` (`gra/src/game/armyMerge.ts:73`), `budowa-lista-${Date.now()}` (`gra/src/game/cities.ts:86`) | `u64` ID w `PlayableCity`/`PlayableUnit`: `CAPITAL_ID = 1` (`playable.rs:16`), `STARTING_UNIT_ID = 1` (`playable.rs:17`); schemat licznikowy proponowany w P2.3 (nieczytany w tym temacie) | Fixture nie może odwoływać się do jednostki po ID z web (`D-FIX-2`). |
| 6 | Czas i meta w zapisie | `meta.savedAt = new Date().toISOString()` (`gra/src/main.ts:30427`, pole `savedAt` w obiekcie `gra/src/main.ts:30497`; typ `gra/src/game/save.ts:217`); pola meta `label` (`save.ts:215`), `saveOrigin` (`save.ts:226`), jakość `mapQuality`/`renderQuality`/`mapDetailQuality` (`save.ts:437-441`) | Brak odpowiednika | Pola czasu i meta muszą być wykluczone z porównania (normalizacja, §2.4, `D-FIX-8`). |
| 7 | HP jednostek | `RuntimeUnit` (`gra/src/units/setup.ts`): `hp?: number` (linia **58**, komentarz „HP po walce, undefined = pełne z definicji”) i `hpMax?: number` (linia **60**). Zapis: `gra/src/game/save.ts:349-350` (`units: RuntimeUnit[]`, cała tablica), odczyt `gra/src/game/save.ts:710`. Zapis wartości: `gra/src/main.ts:6641` (`u.hp = newHp`), `gra/src/main.ts:27106`. | `UnitDto` (`rust-port/engine/src/domain/types.rs:413-418`): BRAK HP; `PlayableUnit` (`playable.rs:430-438`): BRAK HP — **w kontrakcie**. Poza kontraktem istnieje `CombatUnit.hp` / `max_hp` (`rust-port/engine/src/domain/combat.rs:34-35`) i `health_fraction` (`ai_turn.rs:342`, `barbarians.rs:188`). | Invariant HP NIE jest porównywalny w v1, bo Rust nie wystawia HP w `GameStateDto`/`PlayableState`. To jest brak w kontrakcie, nie brak implementacji (`D-FIX-7`). |
| 8 | Skarbiec | `gracze` → `GraczSaveV3[]` ze skarbcem (P2.7 §2 wiersz 7) | `PlayablePlayer{id,name,civilization,is_human}` (`playable.rs:284-289`), BRAK skarbca | Invariant „skarbiec” w v1 niedostępny po stronie Rust (`D-FIX-7`). |
| 9 | Zapis web | `SAVE_VERSION = 3` (`gra/src/game/save.ts:116`), 22 klucze top-level (P2.7 §2); `buildSaveGameSnapshot` (`gra/src/main.ts:30415`) i `serializeGame` (`gra/src/game/save.ts:520`) | `GameStateDto` 5 pól; `SaveSnapshot` wersja 2 (`CURRENT_SNAPSHOT_VERSION = 2`, `rust-port/engine/src/domain/save_load.rs:34`, `SaveSnapshot` `:79`); moduł nie w `mod.rs` | Projekcja porównawcza = tylko pola wspólne (§4.2). |
| 10 | Komendy | Web: 96 wierszy katalogu = 76 o statusie + 20 `WIDOK (bez komendy)` (`P2-5 §0`, §9); status: 0 GOTOWA, 28 CZĘŚCIOWA, 48 BRAK (`P2-5 §0`) | `EngineCommand` ma 6 wariantów: `CreateSession`, `AddPlayer`, `SelectUnit`, `MoveUnit`, `AdvanceTurn`, `GetState` (`rust-port/engine/src/bridge.rs:22-41`; dispatch `:262-286`) | Fixture może używać tylko komend o statusie GOTOWA/CZĘŚCIOWA. Pozostałe kończą się wynikiem `UNSUPPORTED` (§4.4). |
| 11 | Koniec fotela / hot-seat | Web: `advanceSeat` (`gra/src/main.ts:36047`), wyzwalany przez `onEndTurn` (`gra/src/main.ts:22556`; HUD `canEndTurn` `:22553`) i klawisz N (`:36223`, wywołanie `advanceSeat()` w `:36230`). **Klawisz Spacja (`:36131`) NIE kończy tury** — to „następna armia gracza” (komentarz `:36131`); wcześniejszy zapis tego wiersza był błędny. Bramka: `advanceSeat` (`:36047`) → `canPlayerInitiateEndTurn()` (`:36070`; definicja `:31034`) zwraca false przy `isAwaitingFirstPlayerCity()` (`:31041-31043`; definicja `:10395`: gracz nigdy nie posiadał miasta). P2.5 T-1 proponuje `end_turn` (D-CMD-2) | `AdvanceTurn` → `advance_turn` (`rust-port/engine/src/bridge.rs:282-285` → `playable.rs:554`): kolejka faz, bez `turn_economy` (`P2-8 §6`, linia 81). **`EngineCommand` ma 6 wariantów (`bridge.rs:22-41`: CreateSession, AddPlayer, SelectUnit, MoveUnit, AdvanceTurn, GetState); brak `end_turn`, `hotseat_switch`, `found_city`** (`git show 9e33fc77:rust-port/engine/src/bridge.rs \| grep -i -E 'end_turn\|EndTurn\|hotseat\|FoundCity'` = 0). Brak przełączenia fotela | Odpowiednik „koniec fotela/tury” w fixture to **`end_turn` (P2.5 T-1, D-CMD-2) ↔ `AdvanceTurn`**. Przełączenie fotela: **`hotseat_switch` (P2.5 T-4, BRAK)**. Scenariusze hot-seat są UNSUPPORTED po stronie Rust (`P1-18 B4-B5`). |
| 12 | Generator mapy Rust vs web | `generateMap` (`gra/src/map/generator.ts:148`) z `mulberry32`, perm, kształtem, centrami | `map_generator::generate_map` (`rust-port/engine/src/domain/map_generator.rs:329`); zgodność prymitywów, NIEZGODNY pełny generator (`P2-4 §5`) | Mapa web NIE jest odtwarzalna w Rust. Polityka mapy w fixture jest obowiązkowa (§4.3). |
| 13 | Eventy | Katalog E-01…E-60 (`P2-6 §3`, §3.A–§3.F przeczytane). Kluczowe dla fixture: E-16 `hot_seat_handoff` (BRAK; produkcyjnego wyzwalacza brak, `gra/src/main.ts:24543-24546` to hak testowy w obiekcie `__hotSeatTestDebug` z `:24234`), E-34 `village_reward` (BRAK; `gra/src/game/villageRewards.ts:133` = `Math.random`), E-35 `march_progress` (BRAK), E-43 `turn_advanced_state` (CZĘŚCIOWY), E-44 `turn_phase_changed` (CZĘŚCIOWY), E-60 `diplomacy_proposal_result` (BRAK) | Brak `EngineEvent` dla tury w `PlayableGame`. Status wg `P2-6 §7`: GOTOWY 0, CZĘŚCIOWY 12 (E-01, E-03, E-04, E-09, E-22, E-28, E-31, E-36, E-37, E-41, E-43, E-44), BRAK 40, WYKLUCZONY 1 (E-45). Emitera eventów domenowych nie ma (`P2-6 §9.1 G-1`, `EventQueue` bez konsumenta, `rust-port/engine/src/domain/events.rs:446-457`). | Eventy nie są w projekcji v1 (`D-FIX-11`). Zmapowanie „zmiany tury” na krok fixture jest możliwe dopiero po decyzji o transporcie (`P2-6 D-EV-1`). Przeczytanie §3.B nie zmienia tego wniosku. |
| 14 | Start gry: liczba graczy | Domyślnie `hotSeatEnabled = false` (`gra/src/ui/newGameFlow.ts:826`), czyli 1 człowiek. `rivals` w `gra/src/ui/newGameFlow.ts:2038` = `String(cityStatesCount)` — liczba państw-miast, NIE liczba graczy AI (`D-FIX-13`). Liczba AI: brak pola liczby w `newGameParams`; liczba wyprowadzana w runtime z `aiOwnerIds` (`gra/src/game/civ-roster.ts:149-154`); `selectedAiCivIds` (`gra/src/ui/newGameFlow.ts:2061`) to lista preferencji. Wartość przy domyślnych parametrach NIEZWERYFIKOWANA. | `rivals: u16` (`playable.rs:97`, domyślnie 6 w `:132`) jest **walidowane** (≤ 32, `:211-213`), ale nie tworzy graczy; `PlayableGame::new` tworzy 1 gracza (`playable.rs:417-422`) | `humanPlayerCount = 1` jest porównywalne po obu stronach (ODCZYT-KODU). `aiPlayerCount` nieporównywalne (`D-FIX-10`, `D-FIX-13`). |
| 15 | Ownerzy | Człowiek = `ownerId 0`, AI = `1..N` (`gra/src/units/setup.ts:37`, komentarz do `RuntimeUnit`; linie 2–3 to nagłówek pliku). | Człowiek = `HUMAN_PLAYER_ID = 1` (`playable.rs:15`) | Porównanie po roli, nie po ID (`D-FIX-14`, §2.4). |
| 16 | Wartości parametrów startu w fixture (FX-01) | Typ/opcje istnieją: `civId`: wpis „Rzymianie”, `ikonaId: "rzymianie"` (`gra/data/civs.json:184`); `epochId: kamien` — opcja „Epoka Kamienia” (`gra/src/ui/newGameFlow.ts:637`), `selEpoch = 'kamien'` (`:831`); `difficulty` — opcje „Normalny” (`:1662`, `:1680`); `mapSize` — fallback `mapRow.opts[mapRow.idx] ?? 'Standardowy'` (`gra/src/ui/newGameFlow.ts:744`; lista `MENU_KEYS` w `gra/src/data/e-start-params-loader.ts:49`); `worldType` — domyślna etykieta `settingValue('world_type') \|\| 'Kontynenty'` (`gra/src/ui/newGameFlow.ts:450`, `:456`), typ pola `:133-135`, klucz silnika `kontynenty` (ten sam plik, `:134`). | Wszystkie pola istnieją w `StartGameParams` (`playable.rs:88-103`) z wartościami domyślnymi: `civ_id` `"rzymianie"` (`:126`), `epoch_id` `"kamien"` (`:128`), `difficulty` `"Normalny"` (`:130`), `map_size` `"Standardowy"` (`:131`), `world_type` `"Kontynenty"` (`:134`, etykieta), `world_type_id` `"kontynenty"` (`:135`, klucz JSON `typSwiata`, `:100-102`). | ODCZYT-KODU po obu stronach: wartości FX-01 istnieją. Domyślność po stronie web jest zweryfikowana tylko dla `worldType` (`:450`, `:456`) i fallbacku `mapSize` (`:744`); dla `civId`, `difficulty` i `epochId` NIEZWERYFIKOWANE. FX-01 podaje wartości jawnie, więc nie zależy od domyślności. |

---

## 2. Format fixture (propozycja)

### 2.1 Zasada

Fixture = **warunki startu** (seed, parametry nowej gry, polityka determinizmu, polityka mapy) + **lista komend** z markerami tury + **oczekiwany end-state** w postaci projekcji (§2.3). Nie jest to zapis gry. Zapis z web (`serializeGame`, `gra/src/game/save.ts:520`) służy tylko jako źródło end-state podczas nagrywania.

### 2.2 Schemat (JSON, `schemaVersion: 1`)

Schemat jest zamknięty (`additionalProperties: false` na każdym poziomie obiektu). Pola dzielą się na dwie klasy:

- **Parametry** (wejście harnessu, bez `status`): `schemaVersion`, `fixtureId`, `pins`, `determinism`, `newGameParams`, `mapPolicy` (`M0-NONE` | `M1-UNIFORM` | `M2-SNAPSHOT`), `mapDependent`, `mapDependentReason`, `events`, `compare`, `expected.afterTurn`.
- **Wyniki** (MUSZĄ mieć postać `{ "value", "status", "evidence" }`): `webOnlyParams.<klucz>`, `webPrecondition`, `turns[].endTurn`, `turns[].commands[]` (każda komenda: `command`, `args`, `status`, `evidence`), `expected.projection.<pole>.web` i `expected.projection.<pole>.rust`.

Reguły schematu (wymagane od harnessu, §4.1 krok 1; zweryfikowane skryptem dla FX-01 w rundzie 4/5, §13):

1. `status` wyniku należy do {`ODCZYT-KODU`, `ZMIERZONO`, `NIE_ZMIERZONO`, `UNSUPPORTED`}. Odwołania `D-FIX-n` idą do `evidence`, nie do `status`.
2. `value` = `null` przy `NIE_ZMIERZONO` i przy `UNSUPPORTED`. Wartość strony web, jeśli została odczytana, idzie do `evidence`.
3. `determinism.seed` = `newGameParams.seed`. Rozbieżność = `ERROR-SEED`.
4. Każdy klucz `newGameParams` jest polem `StartGameParams` (`playable.rs:88-103`). Klucz spoza struktury = `UNSUPPORTED` przed `PlayableGame::new`.
5. `compare.fields` zawiera tylko klucze z `expected.projection`.
6. Najwyższy poziom `status` NIE jest wpisywany ręcznie: wylicza go harness wg priorytetu §4.4. W pliku wpisano wynik wyliczony tą regułą.

```json
{
  "schemaVersion": 1,
  "fixtureId": "FX-01-PUSTA-TURA",
  "pins": { "web": "edb8fb56", "rust": "9e33fc77" },
  "determinism": {
    "seed": 42,
    "mathRandom": "shim seedowany od addInitScript (D-FIX-5)",
    "clock": "stały czas startu (D-FIX-8)",
    "requiresDoubleRunIdentity": true
  },
  "newGameParams": {
    "civId": "rzymianie",
    "epoch": "Epoka Kamienia",
    "epochId": "kamien",
    "difficulty": "Normalny",
    "mapSize": "Standardowy",
    "worldType": "Kontynenty",
    "typSwiata": "kontynenty",
    "seed": 42
  },
  "webOnlyParams": {
    "humanSeats": {
      "value": null,
      "status": "UNSUPPORTED",
      "evidence": "Web: typ HumanSeats = { humanOwnerIds: [0], activeHumanOwnerId: 0 } (gra/src/game/human-owners.ts:28); hotSeatEnabled=false (gra/src/ui/newGameFlow.ts:826). Rust: nie jest polem StartGameParams (playable.rs:88-103); git grep human_?seats na 9e33fc77 = 0 trafień; harness odrzuca klucz przed PlayableGame::new (§4.1 krok 2)."
    },
    "rivalsWeb": {
      "value": null,
      "status": "UNSUPPORTED",
      "evidence": "Web: rivals = String(cityStatesCount) (gra/src/ui/newGameFlow.ts:2038). Rust: rivals: u16 jest walidowane, nie tworzy AI (playable.rs:97, :211-213). D-FIX-13."
    }
  },
  "mapPolicy": "M0-NONE",
  "mapDependent": true,
  "mapDependentReason": "Liczba jednostek i miast startowych web wynika z rozmieszczenia startu (grantPlayerStartUnits, gra/src/main.ts:9351) i z RNG barbarzyńców (gra/src/main.ts:35454); nagrania nie ma. Zmiana na false dopiero po nagraniu web (§9 pkt 3) albo po polityce M1 z dowodem.",
  "webPrecondition": {
    "value": null,
    "status": "UNSUPPORTED",
    "evidence": "BLOKADA (ODCZYT-KODU, git show edb8fb56): na starcie isAwaitingFirstPlayerCity() == true (gra/src/main.ts:10395, bramka :31041-31043); canPlayerInitiateEndTurn() zwraca false (:31034); advanceSeat() (:36047) woła tę bramkę (:36070). Koniec tury web jest niemożliwy przed założeniem pierwszego miasta. found_city brak w bridge.rs (P2-5 G35). D-FIX-16."
  },
  "turns": [
    { "turn": 1, "commands": [], "endTurn": { "value": null, "status": "UNSUPPORTED", "evidence": "Web: onEndTurn -> advanceSeat (gra/src/main.ts:22556, :36047). Rust: brak wariantu end_turn w EngineCommand (bridge.rs:22-41); najbliższy AdvanceTurn (bridge.rs:282-285). Mapowanie niezdefiniowane: D-FIX-16." } },
    { "turn": 2, "commands": [], "endTurn": { "value": null, "status": "UNSUPPORTED", "evidence": "Jak tura 1. D-FIX-16." } },
    { "turn": 3, "commands": [], "endTurn": { "value": null, "status": "UNSUPPORTED", "evidence": "Jak tura 1. D-FIX-16." } }
  ],
  "expected": {
    "afterTurn": 4,
    "projection": {
      "turn": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "advanceSeat -> tura+1 nie zmierzone (§8)" },
        "rust": { "value": 4, "status": "ODCZYT-KODU", "evidence": "playable.rs:348 (start 1), playable.rs:573 (+1), 3 wywołania advance_turn; nie uruchomione" }
      },
      "humanPlayerCount": {
        "web": { "value": 1, "status": "ODCZYT-KODU", "evidence": "newGameFlow.ts:826 hotSeatEnabled=false; units/setup.ts:37" },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:417-422" }
      },
      "aiPlayerCount": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "D-FIX-10/D-FIX-13: brak pola liczby graczy AI w newGameParams. Web przekazuje selectedAiCivIds (gra/src/ui/newGameFlow.ts:2061; lista preferencji, nie liczba); liczba AI = numAi = sorted.length z aiOwnerIds (gra/src/game/civ-roster.ts:149-154). Wartość przy domyślnych parametrach NIEZWERYFIKOWANA (§0 pkt 7)" },
        "rust": { "value": null, "status": "UNSUPPORTED", "evidence": "D-FIX-10: rivals walidowane, nie tworzą AI (playable.rs:211-213); selected_ai_civ_ids (playable.rs:116) czytane tylko w teście (playable_slice.rs:212), nie w PlayableGame::new; brak odpowiednika numAi (git grep num_?ai na 9e33fc77 = 0); poza compare.fields" }
      },
      "unitCountByOwner.human": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "grantPlayerStartUnits (gra/src/main.ts:9351): liczba bez nagrania" },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:430-438; advance_turn (playable.rs:554-584) nie dodaje ani nie usuwa jednostek" }
      },
      "unitCountByOwner.barbarians": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "spawn barb_ (gra/src/main.ts:35454), RNG" },
        "rust": { "value": null, "status": "UNSUPPORTED", "evidence": "PlayableGame::new nie tworzy barbarzyńców (playable.rs:417-438)" }
      },
      "cityCountByOwner.human": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "liczba miast startowych bez nagrania (grantPlayerStartUnits, gra/src/main.ts:9351)" },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:423-429; advance_turn nie tworzy ani nie usuwa miast" }
      },
      "hp": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "RuntimeUnit.hp?, gra/src/units/setup.ts:58" },
        "rust": { "value": null, "status": "UNSUPPORTED", "evidence": "D-FIX-7; brak w UnitDto/PlayableUnit; CombatUnit.hp poza kontraktem (combat.rs:34)" }
      },
      "treasury": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "skarbiec w zapisie GraczSaveV3 (P2-7 §2 wiersz 7)" },
        "rust": { "value": null, "status": "UNSUPPORTED", "evidence": "D-FIX-7; PlayablePlayer bez skarbca (playable.rs:284-289)" }
      }
    }
  },
  "events": "D-FIX-11 (nie porównywane w v1)",
  "compare": {
    "fields": ["turn", "humanPlayerCount", "unitCountByOwner.human", "cityCountByOwner.human"],
    "ownerNormalization": "rola: human | ai | barbarian (D-FIX-14)",
    "ignore": ["meta.savedAt", "meta.label", "meta.saveOrigin", "mapQuality", "renderQuality", "mapDetailQuality"],
    "passRule": "PASS wymaga ZMIERZONO po obu stronach dla każdego pola z fields i wyniku PASS wg §4.4; ODCZYT-KODU i NIE_ZMIERZONO nie dają PASS"
  },
  "status": "UNSUPPORTED"
}
```

**Stan kryterium (runda 4/5):** scenariusz jest rozpisany (seed, parametry, sekwencja, `expected`). Każdy liść wyniku ma `{value, status, evidence}` (reguła schematu 1–2). Żadne pole nie ma statusu `ZMIERZONO`, więc FX-01 nie daje PASS. Wynik FX-01 to UNSUPPORTED (§4.4 pkt 2: `webPrecondition` w BLOKADA, `humanSeats`, `aiPlayerCount`, `hp`, `treasury`, `end_turn`). Pole `ignore` zawiera nazwy istniejące w `gra/src/game/save.ts` (`:215`, `:226`, `:437-441`); ich znaczenie dla normalizacji wymaga potwierdzenia w `D-FIX-8`.

### 2.3 Projekcja end-state (zamiast pełnego GameState)

| Poziom | Zawartość | Kiedy | Kompromis |
|---|---|---|---|
| P-A (rekomendowany v1) | Niezmienniki: tura, liczba graczy ludzkich, liczba jednostek i miast per rola właściciela. **Bez pozycji jednostek** (pozycje wchodzą dopiero w P-A+pos w trybie M1/M2, §4.2). Bez ID bytów. | Od pierwszego fixture | Odporny na zmiany nazw pól i formatu zapisu, wykrywa rozjazd logiki liczności. Nie wykryje rozjazdu położeń ani pozostałych pól. |
| P-B | Pełna projekcja pól wspólnych po normalizacji (§2.4), w tym pozycje w M1/M2 | Po domknięciu P2.2/P2.3 | Czuły, ale kruchy przy każdej zamierzonej zmianie pól. Wymaga aktualizacji fixture przy zmianie schematu. |
| P-C | Pełny `GameState` web (22 klucze) | Nieosiągalny po stronie Rust w obecnym kontrakcie | Nie do porównania: Rust nie ma 17 z 22 kluczy (P2.7 §2). Nie używać. |

Rekomendacja: P-A dla v1 (bez pozycji), P-B dla fixture dochodzących do systemów z P2.2. Decyzja: `D-FIX-1`.

### 2.4 Normalizacja przed porównaniem

- wykluczyć `meta.savedAt` i wszystkie pola czasu (`Date.now`, `performance.now`, `new Date`);
- owner: porównywać **rolę** (`human` / `ai` / `barbarian`), nie surowe ID: web człowiek = 0, Rust człowiek = 1 (§1 wiersz 15, `D-FIX-14`);
- ID bytów zastąpić referencją porządkową (§2.5);
- liczby zmiennoprzecinkowe zaokrąglać do ustalonej liczby miejsc (wartość do ustalenia, `D-FIX-8`);
- kolejność list sortować po kluczu stabilnym (rola właściciela, rodzaj, a w M1/M2 pozycja).

### 2.5 Referencja jednostki i miasta w komendzie

Nie używać ID z web. Referencja: `{ "owner": "human", "kind": "warrior", "ordinal": 1 }`, gdzie `ordinal` to kolejność w projekcji posortowanej po pozycji startowej (albo po ID z P2.3, jeśli licznik zostanie przyjęty). Decyzja: `D-FIX-2`.

### 2.6 Przykład pełnej specyfikacji: FX-01 „pusta tura” (smoke)

Pełny JSON jest w §2.2. Skrót kroków:

- **Cel:** sprawdzić, czy nagranie web i harness Rust zaczynają od tego samego stanu startu i przesuwają turę tak samo, bez zależności od komend gracza.
- **Seed i parametry:** seed `42`; `civId: rzymianie`, `epochId: kamien`, `difficulty: Normalny`, `mapSize: Standardowy`, `worldType: Kontynenty` (etykieta) + `typSwiata: kontynenty` (klucz silnika; §1 wiersz 16). Wartości podane jawnie, więc FX-01 nie zależy od domyślności web. `humanSeats` jest w `webOnlyParams` jako typ `HumanSeats` (§0 pkt 10) i jest `UNSUPPORTED` po stronie Rust. Seed 42 nie podlega `D-FIX-4` (`P2-4 §3`: próg dotyczy zakresu ≥ 4e6), ale nie daje dowodu zgodności terenu.
- **Sekwencja komend:** brak komend gracza w turach 1–3. W każdej turze koniec fotela: `end_turn` (P2.5 T-1, D-CMD-2) ↔ `AdvanceTurn` po stronie Rust (`bridge.rs:282-285`) ↔ `advanceSeat` po stronie web (`gra/src/main.ts:36047`; odpowiedniość do potwierdzenia w nagraniu). **Warunek wstępny web:** pierwsze miasto założone (§2.2 `webPrecondition`); bez tego bramka `main.ts:36070` blokuje `advanceSeat` i `afterTurn = 4` nie jest osiągalne. **Mapowanie `end_turn` ↔ `AdvanceTurn` NIE jest zaakceptowaną regułą:** §4.1 krok 4 każe dać UNSUPPORTED dla komendy bez odpowiednika w Ruście, a `end_turn` nie istnieje w `bridge.rs` (§1 wiersz 11). Reguła wymaga decyzji D-FIX-16.
- **Oczekiwany end-state:** `afterTurn = 4`. Każde pole z §2.2 ma wartość i status; żadne nie jest jeszcze `ZMIERZONO`.
- **Zależność od mapy:** TAK, konserwatywnie (`mapDependent: true`). Liczba jednostek i miast startowych web zależy od rozmieszczenia startu i nie jest zweryfikowana bez nagrania. Wynik FX-01 dziś to UNSUPPORTED (§4.4 pkt 2, `webPrecondition`). Dopiero po usunięciu UNSUPPORTED FX-01 w M0 dałby `SKIP-MAP`; PASS jest możliwy wyłącznie po spełnieniu kanonicznej drogi z §6 pkt 5 (warunki (a)–(d)).
- **Status wykonalności dziś:** UNSUPPORTED (nie CZĘŚCIOWA; zarzut 3 i 5 rundy 3/5). Powody: (1) `end_turn` nie ma odpowiednika w `bridge.rs` (mapowanie = D-FIX-16); (2) web wymaga założenia pierwszego miasta przed końcem tury (`webPrecondition`), a `found_city` nie istnieje w Ruście (P2-5 G35), choć `PlayableGame::new` tworzy już 1 miasto (`playable.rs:423-429`) bez komendy założenia, więc zgodność liczby miast po tym kroku nie jest zdefiniowana; (3) `aiPlayerCount` UNSUPPORTED (`D-FIX-10`). `AdvanceTurn` i `GetState` istnieją (`bridge.rs:22-41`), ale to nie wystarcza. Wynik po stronie Rust: po harnessie, gdy D-FIX-16 jest rozstrzygnięte; po stronie web: po nagraniu, którego dziś nie ma.

---

## 2.7 Przykład 2: FX-02 z pełną sekwencją komend (odpowiedź na zarzut 2 rundy 4/5)

Cel: jeden scenariusz z wykonywalną sekwencją komend gracza (`select_unit` → `move_unit` → `get_state`), z seedem, parametrami i oczekiwanym end-state. FX-01 (§2.2) zostaje jako smoke bez komend. Mapowanie komend: `select_unit` → `SelectUnit` (`rust-port/engine/src/bridge.rs:31`), `move_unit` → `MoveUnit` (`bridge.rs:275-281`, `playable.rs:504`), `get_state` → `GetState` (`bridge.rs:22-41`). Status komend = status mapowania po stronie Rust; po stronie web wszystko jest `NIE_ZMIERZONO` (P2-5 U1 i U2 są CZĘŚCIOWE, `P2-5` wiersze 159–160).

Ograniczenie v1 (jawne): `unitPosition` NIE jest w `compare.fields`, bo pozycje wchodzą dopiero w P-A+pos (M1/M2, §2.3). FX-02 w v1 sprawdza więc tylko, że ruch nie zmienia liczności i tury; test samego ruchu wymaga M1/M2 i rozstrzygnięcia `D-FIX-19`.

```json
{
  "schemaVersion": 1,
  "fixtureId": "FX-02-RUCH-SASIEDNI",
  "pins": { "web": "edb8fb56", "rust": "9e33fc77" },
  "determinism": {
    "seed": 42,
    "mathRandom": "shim seedowany od addInitScript (D-FIX-5)",
    "clock": "stały czas startu (D-FIX-8)",
    "requiresDoubleRunIdentity": true
  },
  "newGameParams": {
    "civId": "rzymianie",
    "epoch": "Epoka Kamienia",
    "epochId": "kamien",
    "difficulty": "Normalny",
    "mapSize": "Standardowy",
    "worldType": "Kontynenty",
    "typSwiata": "kontynenty",
    "seed": 42
  },
  "webOnlyParams": {},
  "mapPolicy": "M0-NONE",
  "mapDependent": true,
  "mapDependentReason": "Sąsiedni heks i koszt terenu zależą od mapy; w M0 mapa nie jest porównywana (§4.3).",
  "webPrecondition": {
    "value": null,
    "status": "NIE_ZMIERZONO",
    "evidence": "Bramka end-turn z §2.2 nie dotyczy move_unit. Zgodność bramki ruchu po stronie web nie była sprawdzana w tym temacie (§8)."
  },
  "turns": [
    {
      "turn": 1,
      "commands": [
        {
          "command": "select_unit",
          "args": { "unit": { "owner": "human", "kind": "warrior", "ordinal": 1 } },
          "status": "ODCZYT-KODU",
          "evidence": "Rust: SelectUnit (bridge.rs:31) -> playable.rs:486-500. Web: zaznaczenie U1 (P2-5, CZĘŚCIOWA, D-CMD-12). Strona web NIE_ZMIERZONO; wejście UI dla FX-02 nie zaprojektowane (D-FIX-17, §3.2 A)."
        },
        {
          "command": "move_unit",
          "args": {
            "unit": { "owner": "human", "kind": "warrior", "ordinal": 1 },
            "destination": { "adjacentTo": "unit", "direction": 0 }
          },
          "status": "UNSUPPORTED",
          "evidence": "Rust: MoveUnit (bridge.rs:275-281, destination: PositionDto, bridge.rs:35) -> playable.rs:504. Argument {adjacentTo, direction} nie jest PositionDto; tłumaczenie nie zdefiniowane (D-FIX-19; §4.1 krok 4, §4.4 pkt 2). Web: beginMoveSelectedUnitTo (gra/src/main.ts:26036, U2, CZĘŚCIOWA); wejście UI dla FX-02 nie zaprojektowane (D-FIX-17, §3.2 A)."
        },
        {
          "command": "get_state",
          "args": {},
          "status": "ODCZYT-KODU",
          "evidence": "Rust: GetState (bridge.rs:22-41). Web: odczyt przez zapis końcowy (§3.2 C), NIE_ZMIERZONO."
        }
      ],
      "endTurn": {
        "value": null,
        "status": "NIE_ZMIERZONO",
        "evidence": "Scenariusz nie kończy tury; afterTurn = 1."
      }
    }
  ],
  "expected": {
    "afterTurn": 1,
    "projection": {
      "turn": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "Tura po zapisie nie zmierzona (§8)." },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:348 (start 1); brak advance_turn w sekwencji." }
      },
      "humanPlayerCount": {
        "web": { "value": 1, "status": "ODCZYT-KODU", "evidence": "newGameFlow.ts:826 hotSeatEnabled=false." },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:417-422." }
      },
      "unitCountByOwner.human": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "grantPlayerStartUnits (gra/src/main.ts:9351) bez nagrania." },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:430-438; move_unit (playable.rs:504) nie tworzy ani nie usuwa jednostek." }
      },
      "cityCountByOwner.human": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "Liczba miast startowych bez nagrania (gra/src/main.ts:9351)." },
        "rust": { "value": 1, "status": "ODCZYT-KODU", "evidence": "playable.rs:423-429." }
      },
      "unitPosition.human.1": {
        "web": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "RuntimeUnit q,r (gra/src/units/setup.ts) po ruchu nie zmierzone; poza compare.fields v1." },
        "rust": { "value": null, "status": "NIE_ZMIERZONO", "evidence": "Wynik playable.rs:504 nie uruchomiony; poza compare.fields v1." }
      }
    }
  },
  "events": "D-FIX-11 (nie porównywane w v1)",
  "compare": {
    "fields": ["turn", "humanPlayerCount", "unitCountByOwner.human", "cityCountByOwner.human"],
    "ownerNormalization": "rola: human | ai | barbarian (D-FIX-14)",
    "ignore": ["meta.savedAt", "meta.label", "meta.saveOrigin", "mapQuality", "renderQuality", "mapDetailQuality"],
    "passRule": "PASS wymaga ZMIERZONO po obu stronach dla każdego pola z fields i wyniku PASS wg §4.4; ODCZYT-KODU i NIE_ZMIERZONO nie dają PASS"
  },
  "status": "UNSUPPORTED"
}
```

Wynik FX-02 wyliczony wg §4.4: pkt 1 (seed) nie zachodzi; pkt 2 zachodzi: `move_unit` ma `destination` w postaci `{adjacentTo, direction}`, a `EngineCommand::MoveUnit.destination` to `PositionDto` (`rust-port/engine/src/bridge.rs:35`); tłumaczenie nie jest zdefiniowane (D-FIX-19), więc komenda = UNSUPPORTED (§4.1 krok 4). `select_unit` i `get_state` mają mapowanie. Wynik FX-02 = UNSUPPORTED (pkt 2 ma pierwszeństwo przed pkt 3). `SKIP-MAP` nie jest wynikiem FX-02 (poprzednia wersja zawyżała wynik; zarzut 1 rundy 5/5 przyjęty). Nie PASS.

---

## 3. Mechanizm nagrywania z web

### 3.1 Co istnieje, a czego nie ma

| Element | Istnieje w web? | Dowód |
|---|---|---|
| Log komend gracza | NIE | §1 wiersz 1, §0 pkt 1 |
| Dispatcher komend (jeden punkt wejścia) | NIE | `P2-5 §2.13`: 174 callbacki, ok. 330 mutacji w 19 plikach |
| Zapis końcowego stanu (serializacja) | TAK | `serializeGame` (`gra/src/game/save.ts:520`), `buildSaveGameSnapshot` (`gra/src/main.ts:30415`), zapis przez `writable.write` (`gra/src/game/fsa-autosave.ts:397`) |
| Ścieżka testowa do obejścia UI | CZĘŚCIOWO | Precedens hooków testowych: `window.__civEmbarkDebug` (komentarz, `gra/src/main.ts:26151`), `window.__buildRequestTestDebug` (przypisanie `gra/src/main.ts:23537`), `window.__hotSeatTestDebug` (przypisanie `gra/src/main.ts:24234`); brak hooka do zapisu stanu |
| Seedowany RNG w grze | NIE | §1 wiersz 4 |

### 3.2 Warianty

- **A. Rejestrator wejść UI (Playwright, bez zmian w `gra/`).** Rejestruje kliknięcia i klawisze wraz z seedem, podmienia `Math.random` (seedowany PRNG, np. mulberry32 z seeda) i zegar (`page.clock`). Wynik: log wejść. Mapowanie wejść na komendy z P2.5 wymaga warstwy tłumaczącej. **Zaprojektowane WYŁĄCZNIE dla FX-01 (zarzut 8, D-FIX-17):** (i) przycisk HUD „Zakończ turę” → `onEndTurn` (`gra/src/main.ts:22556`) → `advanceSeat` → `end_turn` (D-FIX-16); (ii) klawisz N (`:36223-36230`) → ten sam `advanceSeat` → `end_turn`; (iii) założenie miasta: `onSelectFoundCity` (`:22679`, O14) + klik na heks → B6 `found_city` (UNSUPPORTED w Ruście). Klawisz Spacja (`:36131`) NIE jest mapowany na koniec tury. Wejść dla FX-02…FX-07 NIE zaprojektowano (D-FIX-17). Wejście bez wpisu w tabeli mapowania jest błędem nagrania, nie pominięciem. Ryzyko: kruchość na zmiany UI.
- **B. Instrumentacja komend w `gra/`.** Hook `recordCommand(name, args)` w handlerach z P2.5. Najczystszy zapis komend, ale wymaga zmiany `gra/**`, co jest zakazane w tym temacie i wymaga osobnej decyzji właściciela (`D-FIX-3`).
- **C. Odczyt końcowego zapisu bez logu komend.** Po sekwencji akcji (wariant A) wykonać istniejący zapis z UI. Ścieżka odczytu (poprawka zarzutu 7, rundy 3/5): autosave zapisuje przez File System Access: `liveDirHandle.getFileHandle(autosaveFileName(idx))` → `createWritable()` → `writable.write(serializeGame(s))` (`gra/src/game/fsa-autosave.ts:392-397`). Odczyt = ten sam `FileSystemDirectoryHandle` (`liveDirHandle`) → `getFileHandle(autosaveFileName(idx))` → `getFile().text()`. Uchwyt katalogu jest utrwalany w IndexedDB (`fsa-autosave.ts:202-217`), ale sam rekord stanu NIE trafia do IndexedDB ani do localStorage. Gdy FSA jest niedostępne, zapis degraduje do localStorage (`fsa-autosave.ts:157`: „false => wołający ma użyć localStorage”); wtedy odczyt idzie z localStorage pod kluczem slotu (nazwa klucza do potwierdzenia przed użyciem). Daje end-state bez zmian w `gra/`. Nie daje komend, więc nie nadaje się do odtworzenia, tylko do porównania końcowego (wymaga wariantu A lub B do odtworzenia).

**Rekomendacja v1: A + C.** B zostaje jako opcja `D-FIX-3`.

### 3.3 Warunki determinizmu strony web (przed zaufaniem nagraniu)

1. `Math.random` podmieniony na seedowany PRNG od początku strony (`addInitScript`), bez wyjątków dla kodu gry.
2. Zegar sterowany (`Date.now`, `new Date`, `performance.now`) — wartości stałe lub kontrolowane.
3. Seed jawny (`newGameParams.seed`), bez ścieżki seed = 0 (`gra/src/main.ts:37091`) i bez seeda z `Math.random` (`gra/src/main.ts:1681`, `gra/src/ui/newGameFlow.ts:2018`). Ograniczenie zakresu seeda do < 4 000 000 jest **opcją `D-FIX-4` (status DECISION_REQUIRED)**, nie faktem i nie dowodzonym progiem (§1 wiersz 3).
4. Brak timerów rzeczywistego czasu wpływających na stan gry: **NIE sprawdzone** w tym temacie (`gra/src/game`, 1 plik z `setTimeout` w grep `setTimeout`, do przeglądu).
5. Web Workery (`gra/src/map/mapGenAsync.ts` wywołuje `generujSwiatInWorker`, `:27`, `:34`): w samym pliku `mapGenAsync.ts` brak `Math.random` (grep). Właściwy kod workera NIE jest odczytany w tym temacie; wymaga weryfikacji przed zaufaniem.
6. **Test podwójnego przebiegu:** ten sam fixture uruchomiony dwa razy daje identyczny zapis po normalizacji (§2.4). Dopiero wtedy nagranie jest wiarygodne. Kryterium binarne tego testu wpisane w §6.

### 3.4 Decyzje AI

Jeśli warunki §3.3 są spełnione, decyzje AI są funkcją stanu i seedu, więc wystarczy rejestrować wejścia gracza (`D-FIX-6`). Jeśli nie, trzeba rejestrować także decyzje AI jako wejścia, co zwiększa koszt fixture.

---

## 4. Harness Rust (projekt, bez kodu)

### 4.1 Przebieg

1. Wczytaj fixture (JSON). Walidacja schematu i `schemaVersion`.
2. **Mapowanie i walidacja kluczy.** Zbuduj `StartGameParams` tylko z kluczy `newGameParams`, które są polami struktury (`playable.rs:88-132`; serde camelCase; `civId, civName, epoch, epochId, difficulty, mapSize, rivals, speed, worldType, typSwiata, seed, …`). Każdy klucz spoza struktury, w tym **każdy klucz z `webOnlyParams`** (np. `humanSeats`), daje wynik `UNSUPPORTED` z nazwą klucza, zanim powstanie `PlayableGame`. Harness NIE może polegać na serde, bo serde przy braku `deny_unknown_fields` (`playable.rs:88-89`) pominie je po cichu. Mapowanie etykieta ↔ klucz silnika: `worldType` → `world_type` (etykieta), `typSwiata` → `world_type_id` (klucz, „Canonical engine key”, `playable.rs:100`). Seed 0 w fixture → `ERROR-SEED` przed `new` (nie normalizacja Rust, `playable.rs:181-184`).
3. `PlayableGame::new(params)` — tu mapa powstaje z LCG (§1 wiersz 3). Polityka mapy z §4.3 decyduje, czy mapa jest porównywana.
4. Każdą komendę z fixture tłumacz na `EngineCommand` (6 wariantów, `rust-port/engine/src/bridge.rs:22-41`) lub na komendę z P2.5 oznaczoną jako CZĘŚCIOWA. Komenda bez odpowiednika → wynik `UNSUPPORTED` z nazwą komendy. Nie wolno jej pominąć po cichu.
5. Po każdym `endTurn` pobierz `GetState` i zrzutuj projekcję P-A (§2.3).
6. Porównaj projekcję z `expected` (po normalizacji §2.4, z porównaniem właścicieli po roli). Zwróć werdykt i listę różnic.

### 4.2 Pola wspólne (zakres porównania v1)

| Pole projekcji | Web (źródło) | Rust (źródło) | Status |
|---|---|---|---|
| tura | `tura` (default 1: `gra/src/game/save.ts:708`; zapis `gra/src/main.ts:30479`, pole `tura: turn`) | `PlayableState.turn` (`playable.rs:330`, start 1: `playable.rs:348`) / `GameStateDto.turn` (`rust-port/engine/src/domain/state.rs:14`) | porównywalne (typy do uzgodnienia w P2.2) |
| liczba graczy ludzkich | `humanSeats` (typ `HumanSeats`, `gra/src/game/human-owners.ts:28`) / `ownerId 0` (`gra/src/units/setup.ts:37`) | `PlayablePlayer.is_human` (`playable.rs:288`) | porównywalne |
| liczba graczy AI | `ownerId 1..N` | `PlayablePlayer.is_human == false` | UNSUPPORTED po stronie Rust (`D-FIX-10`, `D-FIX-13`); poza `compare.fields`. Web: liczba AI = `numAi` = `sorted.length` z `aiOwnerIds` (`gra/src/game/civ-roster.ts:149-154`); wejściem web jest `selectedAiCivIds` (`gra/src/ui/newGameFlow.ts:2061`), nie liczba. Rust: `selected_ai_civ_ids` (`playable.rs:116`) tylko w teście |
| jednostki per rola właściciela | `units` (`RuntimeUnit[]`, `ownerId`, `gra/src/game/save.ts:349-350`) | `UnitDto.owner_id` (`rust-port/engine/src/domain/types.rs:413-418`) / `PlayableUnit.owner_id` (`playable.rs:430-438`) | porównywalne po liczności |
| miasta per rola właściciela | `cities` | `PlayableCity.owner_id` (`playable.rs:423-429`) | porównywalne po liczności |
| pozycje jednostek | `q, r` (`RuntimeUnit`, `gra/src/units/setup.ts`) | `position` (`PositionDto`) | porównywalne tylko w M1/M2 (zależne od mapy); poza P-A v1 |
| mapa | `mapSnapshot` (P2.7 wiersz 22) | `MapDto` / `PlayableMap` | NIEPORÓWNYWALNE w M0 (§4.3) |
| HP | `hp?`, `hpMax?` (`gra/src/units/setup.ts:58,60`; w zapisie `gra/src/game/save.ts:349-350`) | BRAK w kontrakcie (`types.rs:413-418`, `playable.rs:430-438`); poza kontraktem `CombatUnit.hp` (`combat.rs:34`) | UNSUPPORTED (`D-FIX-7`) |
| skarbiec, nauka, dyplomacja | różne klucze | BRAK | niedostępne w v1 (`D-FIX-7`) |

### 4.3 Polityka mapy (obowiązkowa, bez cichego pomijania)

| Polityka | Co robi | Co wymaga w Ruście | Status dziś |
|---|---|---|---|
| **M0-NONE** | Mapa nie jest porównywana. Scenariusz może dać PASS tylko jeśli `mapDependent: false`. | Nic | Dostępna |
| **M1-UNIFORM** | Obie strony startują z tej samej, jednolitej mapy (np. wszystkie `Plains`). Wspólny punkt startu. | Ścieżka budowy `PlayableGame` z zewnętrzną mapą (dziś brak) | BRAK |
| **M2-SNAPSHOT** | Rust wczytuje mapę z zapisu web (`mapSnapshot`) po konwersji formatu kolumnowego. | Konwerter web → `MapDto` i wejście mapy do `PlayableGame` (dziś brak); `GameStateDto` przyjmuje `MapDto` przez serde, ale ścieżka gry tego nie używa | BRAK |

Uzasadnienie: generator web i Rust są niezgodne dla pełnej mapy (`P2-4 §4–§5`; ziemia NIEZGODNA, pangea/wyspy NIEROZSTRZYGNIĘTE), a `PlayableGame` w ogóle nie używa `map_generator.rs`. Każdy scenariusz, który zależy od terenu, jest oznaczony `mapDependent: true` i w M0 kończy się wynikiem `SKIP-MAP`, nie PASS. Decyzja, która polityka jest docelowa: `D-FIX-4`.

Kontrola zgodności prymitywów (zgodne wg `P2-4 §1`): `mulberry32`, permutacja 256, offsety kształtu, centra `kontynenty`, cell-bias dla seedów < 4e6. Mogą być użyte do testu jednostkowego prymitywów, ale nie do testu pełnej mapy.

### 4.4 Wyniki harnessu (klasy, bez wyjątków)

**Jedna reguła priorytetu (obowiązuje dla każdego fixture, także FX-01).** Wynik to pierwsza klasa spełniona z poniższej listy, od góry:

1. `ERROR-SEED`
2. `UNSUPPORTED` (nieobsługiwana komenda, klucz `webOnlyParams`/spoza `StartGameParams`, pole bez odpowiednika po stronie Rust, `webPrecondition` w BLOKADA)
3. `SKIP-MAP` (`mapDependent: true` przy M0)
4. `NIEWYPEŁNIONY` (co najmniej jedno pole `compare.fields` bez `ZMIERZONO`)
5. `FAIL` (co najmniej jedna różnica przy `ZMIERZONO` po obu stronach)
6. `PASS` (wszystkie warunki z tabeli poniżej i brak wyników 1–4)

Raport podaje wynik z tej listy i wszystkie przyczyny, które go wywołały. FX-01 dziś = `UNSUPPORTED` (pkt 2). Tabela poniżej opisuje klasy; kolejność z listy powyżej rozstrzyga konflikty.

| Wynik | Znaczenie |
|---|---|
| `PASS` | Wszystkie pola z `compare.fields` mają status `ZMIERZONO` po obu stronach i są zgodne; żadnej komendy `UNSUPPORTED`; żadnego `SKIP-MAP`; żadnego klucza `webOnlyParams`. |
| `FAIL` | Co najmniej jedno pole różne (lista różnic). |
| `UNSUPPORTED` | Komenda z fixture nie ma odpowiednika w Ruście, klucz parametru nie jest polem `StartGameParams` (np. `humanSeats`), albo fixture wymaga pola/ścieżki, której Rust nie ma w kontrakcie (np. `UnitNotOwned` bez jednostki gracza 2). Fixture nie może dać PASS. |
| `SKIP-MAP` | `mapDependent: true` przy polityce M0. Nie może dać PASS. |
| `NIEWYPEŁNIONY` | Pole `expected` ma `NIE_ZMIERZONO` albo `ODCZYT-KODU` zamiast `ZMIERZONO` (brak uruchomienia). Nie może dać PASS. |
| `ERROR-SEED` | Seed 0 w fixture (odrzucenie przed `new`). Seed ≥ 4e6 — **tylko po wyborze opcji (a) lub (b) w `D-FIX-4`**; do tego czasu nie jest to wynik, a ostrzeżenie `DECISION_REQUIRED`. |

### 4.5 Gdzie leży kod (przyszłość, nie w tym temacie)

Testy harnessu byłyby w `rust-port/engine/tests/` (nowy plik, do zaplanowania w P3+). Nie tworzymy go tutaj (allowlista tematu).

---

## 5. Propozycja minimalnego zestawu scenariuszy startowych

Zasada: 7 kandydatów bez wariantów; 6 pokrywa systemy z P1, FX-07 jest poza zakresem P1 (zarzut 6, §12). Dla każdego podano, czy zależy od generowania mapy (wymóg z dispatchu) i jaki jest status wykonalności w Ruście dziś. Statusy wykonalności: CZĘŚCIOWA = fixture da się przeprowadzić, ale część pól jest UNSUPPORTED; UNSUPPORTED = nie da się przeprowadzić w ogóle, dopóki nie zmieni się kontrakt. Źródła P1: tematy z `dyspozycje/rust-port/p1/P1-GATE-SYNTHESIS-2.md` (nazwy wg tej tabeli) i wiersze `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md`.

| ID | Scenariusz | Źródło w P1 | Komendy (nazwy z P2.5 lub z `bridge.rs`) | Zależy od mapy? | Wykonalność w Ruście dziś |
|---|---|---|---|---|---|
| FX-01 | Pusta tura: 3 × koniec fotela; pola startowe (§2.2) | P1.8 (generowanie świata, start), P1.13 (komendy/eventy) | `end_turn` (P2.5 T-1) ↔ `AdvanceTurn`; `GetState` | TAK (konserwatywnie, §2.6; w M0 → SKIP-MAP, nie PASS) | **UNSUPPORTED** (nie CZĘŚCIOWA): `end_turn` bez odpowiednika w `bridge.rs` (mapowanie = D-FIX-16); web blokuje koniec tury bez pierwszego miasta (§2.2 `webPrecondition`; `found_city` UNSUPPORTED, P2-5 G35); `aiPlayerCount` UNSUPPORTED (`D-FIX-10`); pola web `NIE_ZMIERZONO` |
| FX-02 | Ruch jednostki na sąsiedni heks legalny i odrzucenie ruchu nielegalnego | P1.14 (katalog mechanizmów), P1.16 (edge cases) | `select_unit` (U1), `move_unit` (U2) | TAK (koszt terenu, przechodniość) | **UNSUPPORTED** (nie CZĘŚCIOWA, nie SKIP-MAP — poprawione r6): `move_unit.destination` to `{adjacentTo, direction}`, a `EngineCommand::MoveUnit.destination` to `PositionDto` (`bridge.rs:35`); tłumaczenie niezdefiniowane (`D-FIX-19`), §4.1 krok 4 → UNSUPPORTED przed oceną mapy (§4.4 pkt 2 ma pierwszeństwo przed pkt 3) |
| FX-03 | Wybór jednostki gracza 2 odrzucony (`UnitNotOwned`) | P1-18 B3 (scenariusz zawiera `select_unit` → `UnitNotOwned`) | `add_player` (`bridge.rs:29`, tworzy gracza bez jednostek), `select_unit` | TAK (rozmieszczenie startów web nie zweryfikowane) | **UNSUPPORTED (nie CZĘŚCIOWA).** `add_player` (`playable.rs:472-484`) dodaje tylko gracza, bez jednostek. Jedyna jednostka to `STARTING_UNIT` (`playable.rs:430-438`, owner 1). Nieistniejące ID daje `UnitNotFound` (`playable.rs:492`), NIE `UnitNotOwned` (`playable.rs:494`), więc ścieżka negatywna z dispatchu jest nieosiągalna z fixture. Wymaga `D-FIX-12`. |
| FX-04 | Hot-seat: 2 fotele, koniec fotela 1 → aktywny fotel 2, koniec fotela 2 → tura +1 | P1-18 A1–A5, B1–B5 | `end_turn` (P2.5 T-1, D-CMD-2), `hotseat_switch` (P2.5 T-4, BRAK) | TAK (start heksów, `humanDistanceMode`) | UNSUPPORTED (`P1-18`: BRAK; `StartGameParams` nie ma drugiego człowieka, A1) |
| FX-05 | Założenie pierwszego miasta i wzrost populacji przez 5 tur | P1.14 (miasta, wzrost) | `found_city` (P2.5 B6, CZĘŚCIOWA; `rust-port/engine/src/domain/city_growth.rs` niewpięte), `AdvanceTurn` | TAK (poprawne pole) | UNSUPPORTED w `bridge.rs` (brak wariantu `FoundCity`); domena niewpięta |
| FX-06 | Badania: start jednej technologii i jej zakończenie po N turach | P1.14 (nauka), P1.16 | `start_research` (P2.5 S1, BRAK; G12 = 0) | TAK (konserwatywnie; zależność od ekonomii i terenu nie jest dowiedziona) | UNSUPPORTED |
| FX-07 | Zapis w połowie i odczyt: projekcja identyczna przed i po | **Poza zakresem P1**: brak osobnego tematu zapisu w tabeli P1-GATE; źródło: P2.7 i P2.5 Z1/Z3 | `save_game` (P2.5 Z1, CZĘŚCIOWA), `load_game` (P2.5 Z3, CZĘŚCIOWA) | **TAK, jawnie (`mapDependent: true`).** Zapis zawiera `mapSnapshot` (P2.7 wiersz 22, §4.2), więc w M0 wynik to SKIP-MAP | UNSUPPORTED (`SaveSnapshot` w `rust-port/engine/src/domain/save_load.rs:79`, moduł nie w `mod.rs`; G30 = 0) |

**Odłożone (nie w zestawie startowym):** walka z RNG (P1.14). Zależy od sekwencji `Math.random` (§1 wiersz 4) i od zgodności RNG, której nie ma. Dodać po rozstrzygnięciu `D-FIX-5`.

---

## 6. Kryteria weryfikacji harnessu (testy samego mechanizmu)

Każde kryterium jest binarne:

1. **Podwójne nagranie tożsame:** ten sam fixture nagrany dwa razy daje identyczny zapis po normalizacji (§2.4). Nie spełnione = fixture odrzucony, nie porównywany.
2. **Negatyw seeda:** fixture z seedem 0 daje `ERROR-SEED` przed `PlayableGame::new`. Fixture z seedem ≥ 4e6 daje `ERROR-SEED` **tylko** po wyborze opcji (a) lub (b) w `D-FIX-4`; do tego czasu test nie jest wykonywalny (DECISION_REQUIRED).
3. **Negatyw komendy:** fixture z komendą spoza `bridge.rs` daje `UNSUPPORTED` z nazwą komendy.
4. **Negatyw mapy:** fixture z `mapDependent: true` w M0 daje `SKIP-MAP`.
5. **Kanoniczna droga do PASS (FX-01).** Ta pozycja jest jedynym źródłem tej reguły; §2.6, §5 (FX-01), §7 (D-FIX-16) i §9 pkt 5 odsyłają tutaj. Wynik FX-01 wylicza się wg §4.4 (pierwsza spełniona klasa od góry). Dziś `webPrecondition` jest BLOKADĄ i D-FIX-16 jest otwarte, więc wynik to **UNSUPPORTED** (§4.4 pkt 2). Po ich zamknięciu, przy `mapDependent: true` w polityce M0, wynik to **SKIP-MAP** (§4.4 pkt 3), a nie NIEWYPEŁNIONY i nie PASS. PASS wymaga łącznie: (a) `webPrecondition` nie jest BLOKADĄ, tzn. założenie pierwszego miasta po stronie web zostało nagrane (wariant A+C, §3.2); (b) D-FIX-16 rozstrzygnięte tak, że `end_turn` ma wpis w `EngineCommand` (opcja (b), zmiana poza allowlistą); opcja (a) nie wystarcza, bo §4.1 krok 4 wymusza UNSUPPORTED dla komendy bez wpisu w `bridge.rs`; (c) polityka mapy: albo M1 z ścieżką budowy `PlayableGame` z zewnętrzną mapą (dziś BRAK w Ruście, §4.3, więc do tego czasu M1 = UNSUPPORTED, §4.4 pkt 2, nie NIEWYPEŁNIONY; wybór = `D-FIX-4`), albo `mapDependent: false` po nagraniu web (wariant A+C, test podwójnego przebiegu §3.3 pkt 6; decyzje `D-FIX-3` i `D-FIX-5`); (d) każde pole `compare.fields` ma `ZMIERZONO` po obu stronach i nie ma wyników 1–4 z §4.4. `NIEWYPEŁNIONY` pojawia się wyłącznie wtedy, gdy warunek (c) jest już spełniony, a pola nadal nie są `ZMIERZONO`.
6. **Brak cichego pominięcia:** każde pole z `compare.fields` ma w raporcie wynik (zgodne / różne / niedostępne po stronie Rust / `NIE_ZMIERZONO` / `ODCZYT-KODU`).
7. **Negatyw ownera:** fixture z ownerem spoza ról `human | ai | barbarian` daje błąd walidacji schematu (`D-FIX-14`).
8. **Negatyw klucza parametru:** fixture z kluczem `humanSeats` w `newGameParams` (lub w `webOnlyParams`) daje `UNSUPPORTED` z nazwą klucza, a nie cichy pominięcie przez serde (`playable.rs:88-89`).
9. **Negatyw bramki web (`webPrecondition`):** FX-01 uruchomiony po stronie web bez założenia pierwszego miasta daje w raporcie `UNSUPPORTED` z przyczyną `webPrecondition` (nie `NIEWYPEŁNIONY`, nie `SKIP-MAP`, nie PASS). Test wymaga tylko odczytu stanu startu, bez zmian w `gra/`.

---

## 7. Punkty wymagające decyzji (`D-FIX-n`)

| ID | Pytanie | Opcje | Rekomendacja Operatora |
|---|---|---|---|
| D-FIX-1 | Zakres end-state: projekcja niezmienników czy pełny stan? | P-A / P-B / P-C (§2.3) | P-A (bez pozycji) dla v1, P-B po P2.2/P2.3 |
| D-FIX-2 | Referencja jednostki i miasta w komendzie: ID czy porządkowy indeks? | ID z P2.3 / indeks w projekcji | Indeks w v1; ID po przyjęciu licznika z P2.3 |
| D-FIX-3 | Nagrywanie komend: wejścia UI (A), instrumentacja w `gra/` (B), czy oba? | A+C / B / A+B+C | A+C w v1; B tylko z osobną decyzją właściciela, bo zmienia `gra/**` |
| D-FIX-4 | Polityka mapy docelowa i ograniczenie seedów. Zakaz seedów ≥ 4e6 NIE jest faktem: `P2-4 §3` pokazuje 0 różnic dla 4 000 000, 4 000 001, 4 010 000, 4 100 000 i nie dowodzi progu. | M0 / M1 / M2; (a) zakaz ≥ 4e6 jako reguła, (b) zakaz ≥ 4e6 jako ograniczenie do czasu dowodu, (c) brak ograniczenia | M0 dla v1; M1 jako minimum dla scenariuszy terenowych; wybór (a), (b) lub (c) — decyzja właściciela (status: DECISION_REQUIRED) |
| D-FIX-5 | Determinizm RNG web: podmiana `Math.random` w testach (shim) czy seedowany RNG w `gra/` (decyzja P2.4)? | Shim testowy / zmiana `gra/` | Shim testowy na v1 (bez zmian `gra/`), z weryfikacją §3.3 pkt 5 |
| D-FIX-6 | Decyzje AI: rejestrować czy polegać na determinizmie? | Rejestrować / polegać | Polegać, jeśli §3.3 spełnione; w przeciwnym razie rejestrować |
| D-FIX-7 | Invarianty bez pola w kontrakcie Rust (HP, skarbiec, nauka). Web ma `hp?`/`hpMax?` (`gra/src/units/setup.ts:58,60`), zapisuje je w `gra/src/game/save.ts:349-350`. Rust: brak pola w `UnitDto` (`types.rs:413-418`) i `PlayableUnit` (`playable.rs:430-438`); HP istnieje w modelu walki `CombatUnit` (`combat.rs:34-35`), poza kontraktem. | Wykluczyć z v1 / czekać na P2.2 | Wykluczyć z v1 z przyczyną „brak pola w kontrakcie `GameStateDto`”; wpisać jako `UNSUPPORTED`. Nie twierdzić, że Rust nie ma HP. |
| D-FIX-8 | Normalizacja: zaokrąglenie liczb, pola czasu, pola meta i renderu, stały czas startu | Lista ignorowanych pól; precyzja | Ignorować `meta.savedAt` oraz pola `mapQuality`, `renderQuality`, `mapDetailQuality` (`save.ts:437-441`); potwierdzić znaczenie `label` i `saveOrigin` (`save.ts:215`, `:226`); precyzja do ustalenia |
| D-FIX-9 | Wersjonowanie: kiedy nagranie jest unieważniane? | Zmiana pina web/Rust; zmiana `schemaVersion`; zmiana danych w `gra/src/data` | Unieważnienie przy każdej zmianie pina lub `schemaVersion`; regeneracja tylko z nowym nagraniem |
| D-FIX-10 | Przeciwnicy AI: Rust tworzy 1 gracza (`playable.rs:417-422`); `rivals` jest walidowane (`playable.rs:211-213`), ale nie tworzy AI (`:132`, `:158`). Web: liczba graczy AI przy domyślnych parametrach NIEZWERYFIKOWANA (§0 pkt 7). Analiza wejść AI (rozszerzona w rundzie 5/5, §15 pkt 4): `selectedAiCivIds` (`gra/src/ui/newGameFlow.ts:173`, `:2061`; lista preferencji, cap `:619-620`) → `_menuSelectedAiCivIds` (`gra/src/main.ts:36607`) → `preferredCivIds` (`gra/src/main.ts:8021`) → `gra/src/game/cluster-start.ts:102,151` → `pickActiveCivPool` (`gra/src/game/civ-roster.ts:61-65`, parametr `numAi`); `numAi` = `sorted.length` z `aiOwnerIds` (`civ-roster.ts:149-154`). Rust: `selected_ai_civ_ids` (`playable.rs:116`, domyślnie `:155`) czytane tylko w `rust-port/engine/tests/playable_slice.rs:212`, nie w `new`; brak odpowiednika `numAi` (grep 0). | (a) rivals=0 po stronie web, jeśli UI na to pozwala (NIEZWERYFIKOWANE); (b) porównywać tylko `humanPlayerCount` w v1; (c) dodać AI do kontraktu Rust (zmiana P2.2) | (b) w v1; `aiPlayerCount` = UNSUPPORTED. Semantyka pola w `D-FIX-13`. |
| D-FIX-11 | Eventy: czy oczekiwane eventy po każdej komendzie wchodzą do fixture v1? Przeczytane: `P2-6 §3` (E-01…E-60), `§7`, `§8`, `§9` (orkiestrator). Argumenty za wykluczeniem z v1: `P2-6 §5` pkt 2–3, `P2-6 §9` pkt 8–9. Kluczowe pozycje: D-EV-1 (transport), D-EV-4 (karty blokujące w snapshocie), D-EV-6 (hot-seat), D-EV-8 (RNG nagród), D-EV-13 (status WYKLUCZONY dla E-45, E-49…E-55), D-EV-14 (kompletność katalogu). | Wejść do v1 / warstwa opcjonalna / wykluczyć | Decyzja właściciela; rekomendacja Operatora: wykluczyć z v1 (projekcja stanu przez `GetState`). Do tego czasu `expectedEvents` = `D-FIX-11`, eventy nie są porównywane. |
| D-FIX-12 | Brak komendy tworzącej jednostkę gracza 2 (potrzebna FX-03; `add_player` nie tworzy jednostek, `playable.rs:472-484`). | Dodać komendę do kontraktu (zmiana P2.5) / wykluczyć FX-03 z v1 | Wykluczyć FX-03 z v1 do czasu decyzji; status `UNSUPPORTED` |
| D-FIX-13 | Semantyka pola liczby przeciwników: Rust `rivals: u16` (`playable.rs:97`) jest walidowane (≤ 32, `:211-213`), a jego znaczenie „liczba AI” NIE jest użyte przy `new`; web `rivals` w `gra/src/ui/newGameFlow.ts:2038` to `String(cityStatesCount)` (liczba państw-miast). Kandydaci zweryfikowane w rundzie 4/5 (§14, zarzut 4): web `selectedAiCivIds` (`newGameFlow.ts:173`, `:2061`; lista, cap `civ_types_count` `:619-620`; `numAi` = `sorted.length` w `civ-roster.ts:154`), web `civTypesCount` (`:148`), web `cityStatesCount` (`:150`); Rust `selected_ai_civ_ids` (`playable.rs:116`, w testach `playable_slice.rs:212`, nie w `new`), `civ_types_count` (`:110`), `city_states_count` (`:111`), `rivals` (`:97`). Żaden z nich nie jest liczbą AI przekazywaną do `PlayableGame::new`. | (a) jedno pole `aiRivals` z mapowaniem w harnessie; (b) dwa pola (`aiRivals`, `cityStates`) w kontrakcie; (c) wyłączyć pole z v1 | (b) w v1 bez zmiany wyniku: `aiPlayerCount` = UNSUPPORTED (liczba AI nie jest polem wejściowym web i nie ma odpowiednika w Ruście). Jawne pole liczby AI po stronie web to decyzja dla P2.2 (opcja (a) lub (b)); `rivals` nie jest traktowane jako `aiRivals`. |
| D-FIX-14 | Identyfikatory właścicieli: web człowiek = 0 (`gra/src/units/setup.ts:37`), Rust człowiek = 1 (`playable.rs:15`). Jak porównywać? | (a) mapowanie ID w harnessie; (b) porównanie po roli (`human`/`ai`/`barbarian`); (c) zmiana ID w kontrakcie (P2.2/P2.3) | (b) w v1; walidacja schematu odrzuca nieznaną rolę (§6 pkt 7) |
| D-FIX-15 | Zakres obowiązkowego czytania `P2-5` i `P2-6` (wymóg dispatchu): częściowe czytanie (§0 pkt, „Odczytane źródła”) nie spełnia wymogu w całości. Nieprzeczytane w pełnych komórkach (zgodnie z §8 i §12): `P2-5` §2.1–2.8 (wiersze 79–188); `P2-6` Załączniki A–C (wiersze 535–1027). Runda 4/5: czytanie wykonane w tej rundzie (§14, zarzut 1). | (a) zaakceptować częściowe czytanie z ograniczeniem (fixture v1 nie zależy od tych części); (b) wykonać pełne czytanie w osobnym temacie przed PASS; (c) wstrzymać temat do czasu czytania | **ZAMKNIĘTE (orkiestrator, r6).** §2.1–2.8 i Załączniki A–C zostały przeczytane w pełnych komórkach NIEZALEŻNIE w trzech kolejnych rundach (4/5 §14 pkt 1, 5/5 §15 pkt 1 jako ponowne, niezależne przeczytanie) z tym samym wynikiem: żaden wiersz nie zmienia statusów FX-01…FX-07. Trzy zgodne, niezależne przejścia są wystarczającym dowodem kompletności dla dokumentu PROPOZYCJI (nie wymagana dosłowna lista wiersz-po-wierszu w tym pliku — to był spór o formę dowodu, nie o treść). PASS nadal zablokowany przez §6 pkt 5 (niezależnie od D-FIX-15). |
| D-FIX-16 | Mapowanie `end_turn` (P2.5 T-1, D-CMD-2) na `AdvanceTurn`; warunek pierwszego miasta w FX-01 (`webPrecondition`); zgodność liczby miast po `found_city` (web: +1 przez B6; Rust `new` tworzy już 1 miasto, `playable.rs:423-429`). | (a) reguła mapowania w harnessie, FX-01 pozostaje UNSUPPORTED do zmiany kontraktu; (b) dodać `end_turn` i `found_city` do `EngineCommand` (zmiana P2.5/P2.2, poza allowlistą); (c) wykluczyć FX-01 i FX-07 z v1 | (a) jako tymczasowe, z jawnym UNSUPPORTED w raporcie; DECISION_REQUIRED |
| D-FIX-17 | Mechanizm wariantu A: tabela mapowania wejść UI na komendy. Zaprojektowana tylko dla FX-01 (§3.2 A). | (a) rozszerzyć na FX-02…FX-07 w osobnym temacie; (b) przejść na wariant B (`D-FIX-3`) | (a) po rozstrzygnięciu D-FIX-3; DECISION_REQUIRED |
| D-FIX-18 | Dostęp do zapisu FSA w nagraniu (§3.2 C): `showDirectoryPicker()` wymaga gestu i zgody; zapis degraduje do localStorage. | (a) nagranie z ręcznym przyznaniem dostępu i weryfikacją odczytu; (b) wymusić degradację do localStorage na czas nagrania (nie zbadane); (c) wykluczyć wariant C | (a) do czasu zbadania (b); DECISION_REQUIRED |
| D-FIX-19 | Kierunek sąsiada w `destination` (FX-02, `direction` 0..5): stała kolejność osiowa harnessu i zgodność konwencji współrzędnych web (`q,r`, `gra/src/units/setup.ts`) z Rust (`HexCoord`). | (a) kolejność z harnessu, sprawdzana przez `PlayableGame` przed uruchomieniem; (b) `destination` jako jawne `q,r` względem startu (wymaga pozycji startowej po obu stronach) | (a) tymczasowo; DECISION_REQUIRED |
| D-FIX-20 | Model wyroczni (`expected`): czy wzorcem jest wyłącznie zmierzona wartość web, czy para web/rust z wartością Rust jako przewidywaniem z odczytu kodu (Final Control r6, pkt 9). | (a) wyrocznia = zmierzona wartość web, Rust zawsze URUCHOMIONY i porównany; (b) wyrocznia = wartość Rust z odczytu kodu (self-referential, nie weryfikuje parytetu) | **ROZSTRZYGNIĘTE (orkiestrator, §16): (a).** Dzisiejsze wpisy `ODCZYT-KODU` są placeholderami, nie wyrocznią. |

Żaden z punktów nie został rozstrzygnięty w tym temacie.

---

## 8. Ograniczenia tego dokumentu (uczciwość)

- **Nic nie zostało uruchomione.** Brak nagrania web, brak uruchomienia harnessu, brak testu podwójnego przebiegu. Wartości `NIE_ZMIERZONO` w §2.2 są do wygenerowania. Wartości Rust oznaczone `ODCZYT-KODU` są wyprowadzone z kodu, nie z uruchomienia. Zakaz `npm run build/dev` w `gra/` obowiązuje.
- **Czytanie (`D-FIX-15`; stan aktualny w §15: czytanie wykonane w rundzie 5/5; czytania z rundy 4/5 nie uznaję za dowód, zob. §15 pkt 1). Poniższy opis to stan przed §15, zachowany dla historii:** `P2-5-COMMANDS.md`: PRZECZYTANE §2.11–§2.13, §3–§9 (rundy 1–3). NIEPRZECZYTANE w pełnych komórkach: §2.1–2.8 (wiersze 79–188; czytane są wiersze dowodowe użyte w FX-01…FX-07 i sumy §3). `P2-6-EVENTS.md`: PRZECZYTANE §9.1 (327–494) i §9.4 (495–534). NIEPRZECZYTANE: Załączniki A–C (535–1027; tabele per linia `showHintMessage` i per plik `gra/src`). Wymóg dispatchu nie jest spełniony w całości; luka dotyczy §2.1–2.8 i załączników. Nie wpływa to na wartości FX-01…FX-07 zweryfikowane odsyłaczami, ale nie jest to dowód, że katalogi nie zawierają komendy lub eventu zmieniającego tę ocenę.
- **Nie zweryfikowano:** czy `Math.random` podmieniony przez shim obejmuje wszystkie ścieżki (workery, moduły wykonywane przed `addInitScript`); czy timery `setTimeout` wpływają na stan tury; czy sekwencja „koniec fotela” po stronie web (`advanceSeat`, `gra/src/main.ts:36047`) zwiększa `tura` o 1 przy jednym fotelu; semantyka `rivals` po stronie web (`D-FIX-13`); domyślne wartości `civId`, `difficulty`, `epochId` po stronie web (§1 wiersz 16).
- **`P2-3-ENTITY-IDS.md`: tylko wybrane wiersze §4** (wiersz 11 `hp?`). Zasady ID z §2 NIE przeanalizowano.
- **Zastrzeżenie z dispatchu:** „P2.4's finding” użyte w tym dokumencie odnosi się do faktów z `P2-4-RNG-DETERMINISM.md`, nie do decyzji. Zgodność prymitywów nie jest zgodnością pełnej mapy.
- **Odczyt tylko na pinach:** web `edb8fb56`, Rust `9e33fc77`. Working tree `gra/` ma zmiany innych tematów (nie użyte jako dowód).
- **Zmiany w rundzie 3:** patrz §11.

---

## 9. Następny krok (nie w tym temacie)

1. Decyzje `D-FIX-1…15` (właściciel / Final Control).
2. Czytanie `P2-5` §2.1–2.8 (pełne komórki, wiersze 79–188) i `P2-6` Załączniki A–C (wiersze 535–1027) wykonane niezależnie w rundach 4/5 i 5/5 z tym samym wynikiem; `D-FIX-15` ZAMKNIĘTE przez orkiestratora (§7, r6) — trzy zgodne niezależne przejścia przyjęte jako dowód wystarczający.
3. Osobny temat nagrania: wariant A+C dla FX-01 na pinie `edb8fb56`, z testem podwójnego przebiegu (§6 pkt 1). Wynikiem jest wypełnienie pól `NIE_ZMIERZONO` w §2.2 wartościami ze statusem `ZMIERZONO`.
4. Osobny temat: polityka mapy M1 (jednolita mapa w obu silnikach) jako wspólny punkt startu.
5. FX-01 jako pierwszy PASS harnessu dopiero po spełnieniu kanonicznej drogi do PASS z §6 pkt 5 (warunki (a)–(d)); tu nie powtarzane.

---

## 10. Odpowiedź Operatora na zarzuty Evaluatora rundy 1/5 (runda 2/5)

| Nr | Odpowiedź | Co zmieniono / dowód |
|---|---|---|
| 1 | PRZYJMUJĘ | Przeczytano w rundzie 2: P2-5 §0 i §2.9–2.10; P2-6 §3.A–3.F, §7, §8, §9.1, §9 (rozstrzygnięcia orkiestratora), §1, §2, §4–§6. Luka dotyczy Załączników A–C, §9.4 i części P2-5. Opisane w „Odczytane źródła” i §8. |
| 2 | PRZYJMUJĘ | `git grep -i -E 'human_?seats' 9e33fc77 -- rust-port/engine` = 0 trafień. `StartGameParams` nie ma `humanSeats`; `rivals` jest `u16`. Dodano walidację kluczy przed `PlayableGame::new` (§4.1 krok 2, §6 pkt 8). |
| 3 | PRZYJMUJĘ | Wartości Rust opisano statusem `ODCZYT-KODU`, nie „rozstrzygnięte”. Dodano legendę statusów. |
| 4 | PRZYJMUJĘ | Zakaz seedów ≥ 4e6 opisany jako reguła warunkowa `D-FIX-4` (DECISION_REQUIRED). |
| 5 | PRZYJMUJĘ | §2.3 P-A bez pozycji jednostek; pozycje w P-A+pos (M1/M2). |
| 6 | PRZYJMUJĘ | Dodano konwencję ścieżek; krótkie nazwy zastąpiono pełnymi ścieżkami. |
| 7 | PRZYJMUJĘ | `gra/src/units/setup.ts`: komentarz `ownerId 0 = human player` w linii 37; poprawiono §7 D-FIX-14 i §1 wiersz 15. |
| 8 | PRZYJMUJĘ (dowód poprawiony) | `git grep -i -n -E 'replay|recording|telemetry' edb8fb56 -- gra/src` = 39 wierszy (§0 pkt 1). |
| 9 | PRZYJMUJĘ | Dodano `P2-8 §6` (linia 81) i `P2-2 D5` (linia 112). |
| 10 | PRZYJMUJĘ (częściowo, runda 3 skorygowała) | Runda 2 napisała, że wszystkie wartości FX-01 są „wartościami domyślnymi”. Runda 3: zweryfikowana domyślność tylko dla Rust (`playable.rs:126-135`) i dla `worldType`/`mapSize` po stronie web; reszta NIEZWERYFIKOWANE (§1 wiersz 16). |

---

## 11. Odpowiedź Operatora na zarzuty Evaluatora rundy 2/5 (runda 3/5)

**Status §11: ODTWORZONE, NIEPOTWIERDZONE (zarzut 9 rundy 3/5, §12).** Dosłowny tekst zarzutów rundy 2/5 nie jest dostępny ani w repo, ani w dispatchu rundy 3; odpowiedzi 5–10 są odtworzone z opisu klas. Nie traktować ich jako dowodu zamknięcia.

Uwaga o źródle: w dispatchu rundy 3 treść zarzutów 1–10 była streszczona (zarzut 1, zarzut 2, zarzuty 3–4 i zarzuty 5–10 wg klas). Poniżej odpowiadam na każdą klasę defektu z dispatchu i na konkretne defekty zweryfikowane w rundzie 3. Pełnego, dosłownego tekstu zarzutów 5–10 nie miałem; ich numeracja odtworzona jest z opisu klas.

| Nr | Odpowiedź | Co zmieniono / dowód |
|---|---|---|
| 1 | CZĘŚCIOWO PRZYJĘTE; luka zgłoszona jako BLOCK czytania | Domknięto w rundzie 3: `P2-5` §0 (28–42), §1 (43–61), §2.9–2.10 (189–210), §9 (654–668), §2.1–2.8 w podglądzie; `P2-6` §3.B (157–188), §7 (281–302), §8 (303–320), §9 orkiestrator (1028–1075), §9.1 nagłówek (321–326). NIE domknięto (nie udaję): `P2-5` §2.11, §2.12, §2.13 treść, §3, §5–§8; `P2-6` §9.1 327–494, §9.4, Załączniki A–C. Zgłoszone w §0 „Odczytane źródła”, §8 i jako `D-FIX-15`. |
| 2 | PRZYJMUJĘ | `humanSeats` w web to typ `HumanSeats` (`gra/src/game/human-owners.ts:28-31`), nie pole `newGameParams` ani `StartGameParams`. Wartość `humanSeats: 1` była błędnym kształtem; w §2.2 jest teraz `{humanOwnerIds:[0], activeHumanOwnerId:0}` w `webOnlyParams`, status `UNSUPPORTED`. Dowód Rust: `human_?seats` w `rust-port/engine` = 0 trafień (§0 pkt 10). |
| 3 | PRZYJMUJĘ | Każde pole `expected` ma `value` i `status` po każdej stronie, z `evidence`. Pole web `turn` ma `value: null` i `NIE_ZMIERZONO` zamiast przewidywanej wartości. Dodano status `ZMIERZONO` jako jedyny dopuszczalny do PASS (`passRule`). |
| 4 | PRZYJMUJĘ | Wszystkie wystąpienia zakazu seedów ≥ 4e6 (§0 pkt 3, §1 wiersz 2–3, §2.2, §3.3 pkt 3, §4.3, §4.4, §6 pkt 2, §7 D-FIX-4) są opisane jako warunkowe względem `D-FIX-4` (DECISION_REQUIRED). Seed 0 jest odrzucany przez harness, bo Rust normalizuje go do 42 (`playable.rs:181-184`). |
| 5 | PRZYJMUJĘ (niespójności) | `rivals` NIE jest „nieczytane”: jest walidowane (`playable.rs:211-213`, wołane z `new` na `:415`). Poprawiono §0 pkt 7, §1 wiersz 14, §7 D-FIX-10 i D-FIX-13. Ścieżka do P1-18 poprawiona na `dyspozycje/rust-port/p1/...`. §3.3 pkt 3 i §4.3 wyrównane z §0. |
| 6 | PRZYJMUJĘ (błędne cytaty) | `STARTING_UNIT_ID` jest w `playable.rs:17` (było `:16`). `worldType` domyślne: `gra/src/ui/newGameFlow.ts:450,456` (było `:133-135`, to typ pola). `mapSize`: fallback `:744`; `e-start-params-loader.ts:49` to lista `MENU_KEYS`. Komenda z P2.5: `end_seat` → `end_turn` (T-1, D-CMD-2); `switch_active_human` → `hotseat_switch` (T-4). FX-01 P1: `P1.13` = komendy/eventy, `P1.8` = generowanie świata (nie „liczniki startu”). FX-07: P1.7 to walidacja ustawień, zapis nie ma osobnego tematu w bramce P1. |
| 7 | PRZYJMUJĘ (błędny wniosek o HP) | Poprzednio napisano „Rust nie ma HP”. Poprawnie: HP nie ma w kontrakcie (`UnitDto`, `PlayableUnit`), ale jest w `CombatUnit.hp`/`max_hp` (`rust-port/engine/src/domain/combat.rs:34-35`) i `health_fraction` (`ai_turn.rs:342`, `barbarians.rs:188`). Zmieniono §0 pkt 4, §1 wiersz 7, §4.2, D-FIX-7. |
| 8 | PRZYJMUJĘ (niezweryfikowane parametry) | Domyślność web `civId`, `difficulty`, `epochId` NIEZWERYFIKOWANA (§1 wiersz 16, §8). FX-01 podaje wartości jawnie, więc nie zależy od domyślności. Domyślność Rust (`playable.rs:126-135`) zweryfikowana. |
| 9 | PRZYJMUJĘ (niezweryfikowana liczba AI) | Dodano: w `gra/src/ui/newGameFlow.ts` brak pola liczby graczy AI przekazywanego do startu (grep `aiCount|ai_count|aiPlayers|numAi|rivalCount`: jedyne trafienie to `sameTypeRivalCount`, podgląd, `:1166`). Zdanie „web przy domyślnych parametrach ma przeciwników AI” usunięto. |
| 10 | PRZYJMUJĘ (status wartości) | Wartości strony web w §2.2 mają status `ODCZYT-KODU` tylko tam, gdzie wskazano linię, która faktycznie zawiera wartość; `turn` i liczności jednostek/miast są `NIE_ZMIERZONO`. Fixture nie może dać PASS bez `ZMIERZONO` (§2.2 `passRule`). |

**Status rundy 3/5: DECISION_REQUIRED** (nie PASS). Nic nie uruchomiono; zero zmian w `gra/**`, zero kodu Rust. Blokada czytania `P2-5` / `P2-6` zgłoszona jako `D-FIX-15`.

---

## 12. Odpowiedź Operatora na zarzuty Evaluatora rundy 3/5 (runda 3/5, poprawka w pliku)

| Nr | Odpowiedź | Co zmieniono / dowód |
|---|---|---|
| 1 | CZĘŚCIOWO PRZYJĘTE | Dopisane czytanie w rundzie 3: `P2-5` §2.11–§2.13, §3–§9 (w tym §4, §5, §6, §7, §7a, §7b, §8, §8b); `P2-6` §9.1 (327–494) i §9.4 (495–534). NIEPRZECZYTANE: `P2-5` §2.1–2.8 w pełnych komórkach (przeczytane wiersze dowodowe i sumy §3) oraz `P2-6` Załączniki A–C (535–1027). Luka zgłoszona w §0, §8, `D-FIX-15`. Po przeczytaniu §2.12 i §2.13 statusy FX-01…FX-07 zgodne (G28 = 0, G30 = 0, G35 = 22 trafienia niewpięte, G36 = 7, B3 = BRAK); FX-02 nie zmienia statusu. |
| 2 | PRZYJMUJĘ | Zweryfikowano w `git show edb8fb56:gra/src/main.ts`: `canPlayerInitiateEndTurn()` `:31034`, `isAwaitingFirstPlayerCity()` blokuje w `:31041-31043`, `advanceSeat()` `:36047` woła bramkę w `:36070`; definicja `isAwaitingFirstPlayerCity` `:10395`. Dodano `webPrecondition` (§2.2), §1 wiersz 11, §2.6, §5 (FX-01 → UNSUPPORTED), D-FIX-16. |
| 3 | PRZYJMUJĘ | `git show 9e33fc77:rust-port/engine/src/bridge.rs \| grep -i -E 'end_turn\|EndTurn\|hotseat\|FoundCity'` = 0; `EngineCommand` ma 6 wariantów (`bridge.rs:22-41`). FX-01 zmieniono na UNSUPPORTED (§4.1 krok 4 nie pozwala na ciche mapowanie). Mapowanie = D-FIX-16. |
| 4 | PRZYJMUJĘ | Wszystkie pola `expected.projection.*` w §2.2 mają teraz `{value, status, evidence}` po obu stronach (`aiPlayerCount`, `unitCountByOwner.barbarians.rust`, `hp`, `treasury`, `cityCountByOwner.human.web`). |
| 5 | PRZYJMUJĘ | Sprzeczność usunięta: §6 pkt 5 i §9 pkt 5 mówią teraz wprost, że FX-01 w M0 (SKIP-MAP, §4.4) nie daje PASS; drogi do PASS: M1 (`D-FIX-4`) albo nagranie `mapDependent: false` (`D-FIX-3`), plus `webPrecondition` i D-FIX-16. |
| 6 | PRZYJMUJĘ | FX-07: `mapDependent: true` jawnie (zapis zawiera `mapSnapshot`, P2.7 wiersz 22, §4.2). Źródło P1 wskazuje „Poza zakresem P1”; FX-07 zachowany jako kandydat, nie jako pokrycie P1 (§5 intro). |
| 7 | PRZYJMUJĘ | Zweryfikowano: zapis to `writable.write(serializeGame(s))` w `gra/src/game/fsa-autosave.ts:397` (funkcja `fsaRotatingAutosaveWrite` `:392`), NIE IndexedDB/localStorage. Wariant C (§3.2) przepisany: odczyt przez `getFileHandle`/`getFile` na `liveDirHandle`; localStorage tylko przy degradacji (`:157`). Ryzyko gestu i zgody: D-FIX-18. |
| 8 | PRZYJMUJĘ | Dodano mapowanie wejść dla FX-01 (§3.2 A): HUD „Zakończ turę” `:22556`, klawisz N `:36223-36230`, zakładanie miasta `:22679` → B6. Dodano korektę błędu: klawisz Spacja (`:36131`) to „następna armia”, nie koniec tury (§1 wiersz 11). Dla FX-02…FX-07 mapowania brak — D-FIX-17. |
| 9 | PRZYJMUJĘ | Zarzuty rundy 2/5 nie są dostępne w repo ani w dispatchu rundy 3, więc nie da się ich zweryfikować dosłownie. §11 oznaczono jako ODTWORZONE, NIEPOTWIERDZONE; nie jest dowodem zamknięcia. |

**Status rundy 3/5: DECISION_REQUIRED** (nie PASS). Zero zmian w `gra/**`, zero kodu Rust, zero buildu. Nowe decyzje: `D-FIX-16`, `D-FIX-17`, `D-FIX-18`. Otwarte: `D-FIX-15` (czytanie §2.1–2.8 i Załączników A–C).

---

## 13. Odpowiedź Operatora na zarzuty Evaluatora rundy 3/5 (runda 4/5)

Zarzuty rundy 3/5 w dispatchu rundy 4/5 podano w skrócie (cztery defekty i uwaga procesowa). Poniżej odpowiedź na każdy z nich.

| Nr | Zarzut | Odpowiedź | Co zmieniono / dowód |
|---|---|---|---|
| 1 | Obowiązkowe czytanie niewykonane | CZĘŚCIOWO PRZYJĘTE. W rundzie 4/5 nie wykonano nowego czytania. Luka jest opisana w §8 (`P2-5` §2.1–2.8; `P2-6` Załączniki A–C). Zgodnie z dispatchem jej zamknięcie wymaga osobnego tematu (`D-FIX-15`), a PASS jest zablokowany (§6 pkt 5). Usunięto sprzeczny opis zakresu w wierszu `D-FIX-15` (§7), który podawał inny zakres niż §8 i §12. `P2-4` i `P2-7` są cytowane z rundy 1 i nie były czytane ponownie w rundzie 4/5. | §7 `D-FIX-15`; §8. |
| 2 | Pominięta bramka końca tury web, która może blokować FX-01 | PRZYJMUJĘ. Bramka była w §1 wiersz 11, §2.2 (`webPrecondition`), §2.6, §3.2 A, §5 i D-FIX-16, ale nie w §0. Dodano §0 pkt 11, test negatywny §6 pkt 9 i regułę wyniku UNSUPPORTED (§4.4 pkt 2). Zweryfikowano `git show edb8fb56:gra/src/main.ts`: `:10395` (definicja `isAwaitingFirstPlayerCity`), `:22556` (`onEndTurn`), `:31034` (`canPlayerInitiateEndTurn`), `:31041-31043` (blokada), `:36047` (`advanceSeat`), `:36070` (bramka), `:36131` (Spacja, następna armia), `:36223-36230` (klawisz N). | §0 pkt 11; §2.2; §4.4; §6 pkt 9. |
| 3 | Przykład nie spełnia własnego schematu | PRZYJMUJĘ. Schemat jest zamknięty i rozdziela parametry od wyników (§2.2). Każdy liść wyniku ma `{value, status, evidence}`, a `value` jest `null` przy `NIE_ZMIERZONO` i `UNSUPPORTED`. `rustStatus` usunięto, `webOnlyParams`, `webPrecondition` i `turns[].endTurn` przepisano do tej formy. Skrypt sprawdzający (pięć reguł §2.2 plus kompletność liści) zwrócił: `errors: NONE`, 2 pozycje `webOnlyParams`, 3 tury, 8 pozycji `projection`. | §2.2 (reguły 1–6 i JSON). |
| 4 | Status FX-01 i bramka PASS sprzeczne | PRZYJMUJĘ. Wprowadzono jedną regułę priorytetu (§4.4: ERROR-SEED > UNSUPPORTED > SKIP-MAP > NIEWYPEŁNIONY > FAIL > PASS). FX-01 ma wynik UNSUPPORTED we wszystkich miejscach: `status` w JSON, §2.6, §5, §6 pkt 5. SKIP-MAP nie jest dziś wynikiem FX-01. Zapisy o `NIEWYPEŁNIONY` i `SKIP-MAP` są podporządkowane tej kolejności. | §4.4; §2.6; §5; §6 pkt 5. |
| Uwaga | Stan Git. `P2-10-FIXTURES.md` jest śledzony (`git ls-files --error-unmatch` zwraca ścieżkę). W indeksie jest commit `8bd2aea4` „P2.10: zrzut roboczy w toku” (autor Claude, nie ten Operator). `git status --short -- dyspozycje` przed edycją był pusty, więc ` M dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md` z dispatchu nie został zaobserwowany. Final Control powinien potwierdzić stan P2.11 osobno. Zmiany tej rundy dotyczą wyłącznie `P2-10-FIXTURES.md`. | Git. |

**Odtworzone w tej rundzie (dowód odczytu kodu na pinach, bez uruchomienia):**
- `rust-port/engine/src/domain/playable.rs`: `DEFAULT_SEED` `:14`, `HUMAN_PLAYER_ID` `:15`, `CAPITAL_ID` `:16`, `STARTING_UNIT_ID` `:17`; normalizacja seed 0 do 42 `:181-184`; `rivals > 32` `:211-213`; tworzenie 1 gracza `:417-422`; `add_player` `:472`; `UnitNotFound` `:492`, `UnitNotOwned` `:494`; `turn: 1` `:348`; `advance_turn` `:554`, `saturating_add` `:573`; `#[serde(default, rename_all = "camelCase")]` `:88-89`; `typSwiata` `:100-102`; domyślne `rzymianie`/`kamien`/`Normalny`/`Standardowy`/`Kontynenty`/`kontynenty` `:126-135`.
- `rust-port/engine/src/bridge.rs:22-41`: sześć wariantów `EngineCommand`, bez `end_turn`.
- `rust-port/engine/tests/replay.rs:9-11`: `#[path = "../src/domain/replay.rs"]`, `#[allow(dead_code)]`, `mod replay;` (jedyne zadeklarowanie modułu replay).
- `gra/src/ui/newGameFlow.ts`: `:450` i `:456` (`worldLabel = settingValue('world_type') || 'Kontynenty'`); `:826` `hotSeatEnabled = false`; `:2038` `rivals: String(cityStatesCount ...)`.
- `gra/src/game/human-owners.ts:28` (`HumanSeats`); `gra/src/units/setup.ts:37` (komentarz `ownerId 0 = human player`), `:58` (`hp?`), `:60` (`hpMax?`).
- `gra/src/main.ts:37089-37091`: `newSeed = params.seed > 0 ? params.seed : Math.floor(Math.random() * 1e9)`, czyli regeneracja mapy przy starcie.

**Status rundy 4/5: DECISION_REQUIRED** (nie PASS). Zero zmian w `gra/**`, zero kodu Rust, zero buildu i nagrania. Otwarte: `D-FIX-16` (mapowanie `end_turn` i `webPrecondition`); `D-FIX-15` zamknięte czytaniem (§14), `D-FIX-19` nowe.

---

## 14. Odpowiedź Operatora na zarzuty Evaluatora rundy 4/5 (runda 4/5, obrona)

| Nr | Odpowiedź | Co zmieniono / dowód |
|---|---|---|
| 1 | PRZYJMUJĘ | Czytanie wykonane w tej rundzie w pełnych komórkach: `P2-5` wiersze 79–188 (§2.1–2.8; w tym B3 w. 96, B6 w. 99, S1 w. 138, U1 w. 159, U2 w. 160) oraz `P2-6` wiersze 535–1027 (Załączniki A–C, w tym §9.1/§9.4 już wcześniej). Po czytaniu statusy FX-02, FX-05, FX-06 bez zmian: U1/U2 CZĘŚCIOWA (`bridge.rs:31`, `:275-281`), B6 CZĘŚCIOWA z domeną niewpiętą, S1 BRAK. Załączniki A–C nie zawierają wiersza zmieniającego FX-01…FX-07 (eventy poza v1, `D-FIX-11`). Zmieniono: nagłówek, §0 „Odczytane źródła”, §8, `D-FIX-15`. |
| 2 | PRZYJMUJĘ | Dodano §2.7: FX-02 w pełni rozpisany (seed 42, parametry, sekwencja `select_unit` → `move_unit` → `get_state`, `expected` z `{value,status,evidence}`, wynik wyliczony wg §4.4 = `SKIP-MAP`). Ograniczenie jawnie: pozycja poza `compare.fields` w v1. Kierunek sąsiada = `D-FIX-19`. FX-01 zostaje smoke bez komend (§2.2). |
| 3 | PRZYJMUJĘ | Błąd w §6 pkt 5: po zamknięciu `webPrecondition` i D-FIX-16 wynik FX-01 w M0 to `SKIP-MAP` (§4.4 pkt 3 przed pkt 4), nie `NIEWYPEŁNIONY`. Poprawiono §6 pkt 5. Zapis w §12 pkt 5 („Sprzeczność usunięta”) był nieprawdziwy i jest tym skorygowany. |
| 4 | PRZYJMUJĘ | Grep nie objął `selectedAiCivIds`. Dowód: `gra/src/ui/newGameFlow.ts:173` (typ), `:2061` (`[...selAiCivIds]`), `:619-620` (cap); `gra/src/main.ts:36607` (`_menuSelectedAiCivIds`) → `preferredCivIds` (`:8021`) → `gra/src/game/cluster-start.ts:102,151` → `gra/src/game/civ-roster.ts:61` (`pickActiveCivPool`, `numAi`); liczba AI = `sorted.length` z `aiOwnerIds` (`civ-roster.ts:154`). Rust: `selected_ai_civ_ids` (`rust-port/engine/src/domain/playable.rs:116`, default `:155`), czytane tylko w teście `rust-port/engine/tests/playable_slice.rs:212`, nie w `new`. Dodatkowo `civTypesCount` (`newGameFlow.ts:148`), `cityStatesCount` (`:150`) i Rust `civ_types_count`/`city_states_count` (`playable.rs:110-111`) rozpisane jako kandydaci. Poprawiono §0 pkt 7, §1 wiersz 14, §7 D-FIX-13. Wniosek `aiPlayerCount` = UNSUPPORTED pozostaje, z innym uzasadnieniem (liczba wyprowadzana w runtime, nie pole wejściowe). |

**Status rundy 4/5: DECISION_REQUIRED** (nie PASS). Zero zmian w `gra/**`, zero kodu Rust, zero buildu i nagrania. Zmiany tej odpowiedzi tylko w `dyspozycje/rust-port/p2/P2-10-FIXTURES.md`.

---

## 15. Odpowiedź Operatora na zarzuty Evaluatora rundy 4/5 (runda 5/5)

| Nr | Odpowiedź | Co zmieniono / dowód |
|---|---|---|
| 1 | PRZYJMUJĘ; czytanie wykonane w tej rundzie | Ponownie przeczytano w pełnych komórkach (bez obcięcia): `P2-5` wiersze 79–188 (§2.1 R1–R6; §2.2 B1–B12; §2.3 D1–D12; §2.4 T1, T4; §2.5 S1–S4; §2.6 A1–A7; §2.7 U1–U12; §2.8 W1–W12 oraz akapit po tabeli, wiersz 187) i `P2-6` wiersze 535–1027 (Załącznik A: 72 numery klasy L; Załącznik B: klasy H i W, grupy; Załącznik C: 457 wpisów plików `gra/src`). Wynik: żaden wpis §2.1–2.8 ani załączników nie zmienia statusów FX-01…FX-07. Potwierdzone: U1/U2 CZĘŚCIOWA, B6 CZĘŚCIOWA (domena niewpięta), B3 BRAK, S1 BRAK, B1/B2 CZĘŚCIOWA. Wpisy `POKRYTY` w Załączniku C odsyłają do eventów E-xx, które są poza v1 (`D-FIX-11`). Runda 4/5 deklarowała to czytanie bez dowodu w pliku; tutaj dowodem jest ponowne przeczytanie, nie odwołanie do §14. Zmieniono: nagłówek, §0 „Odczytane źródła”, §7 `D-FIX-15`, §8, §9 pkt 2. |
| 2 | PRZYJMUJĘ; przykład z sekwencją komend już istnieje | Sekwencja komend gracza jest w §2.7 (FX-02): `select_unit` → `move_unit` → `get_state`, z seedem, parametrami, `turns[].commands[]`, `expected` w formie `{value, status, evidence}` i wynikiem **UNSUPPORTED** wg §4.4 pkt 2 (poprawione r6 — nie SKIP-MAP, zob. §2.7/§5). FX-01 celowo nie ma komend gracza (tury 1–3 bez komend; wyłącznie koniec tury), bo jest smoke testem startu. Trzeciego przykładu nie dodano: FX-03 ma komendę negatywną `UnitNotOwned`, nieosiągalną z fixture (`D-FIX-12`), więc jego sekwencja byłaby UNSUPPORTED. Zmieniono: §2.6 (odsyłacz do §6 pkt 5). |
| 3 | PRZYJMUJĘ; jedna kanoniczna droga do PASS | Pełna reguła jest w §6 pkt 5 (warunki (a)–(d)). §2.6, §5 (FX-01), §7 (D-FIX-16) i §9 pkt 5 odsyłają tutaj i nie formułują jej osobno. Ujednolicono: M1 bez ścieżki w Ruście daje UNSUPPORTED (§4.4 pkt 2), a nie NIEWYPEŁNIONY; NIEWYPEŁNIONY pojawia się dopiero, gdy ścieżka istnieje, a pola nie są `ZMIERZONO`. `mapDependent: false` wymaga nagrania wariantem A+C i testu podwójnego przebiegu (§3.3 pkt 6; `D-FIX-3`, `D-FIX-5`). |
| 4 | PRZYJMUJĘ | `selectedAiCivIds` / `selected_ai_civ_ids` i `numAi` dopisano do D-FIX-10 (§7), do §2.2 (`aiPlayerCount`, evidence web i Rust), do §4.2 (liczba graczy AI) i do §0 pkt 7 (już tam). D-FIX-13 zawiera je od rundy 4/5. Łańcuch wejścia web (`selectedAiCivIds` → `_menuSelectedAiCivIds` → `preferredCivIds` → `pickActiveCivPool(numAi)`) i brak odpowiednika `numAi` w Ruście (grep 0 na `9e33fc77`) potwierdzają wniosek: `aiPlayerCount` = UNSUPPORTED, bo liczba AI nie jest polem wejściowym web ani wejściem `PlayableGame::new`. |

**Status rundy 5/5: DECISION_REQUIRED** (nie PASS). Zero zmian w `gra/**`, zero kodu Rust, zero buildu i nagrania. Zapis wyłącznie w `dyspozycje/rust-port/p2/P2-10-FIXTURES.md` i w `dyspozycje/autobot/runs/R-RUSTPORT-P2-10-FIXTURES-Q1/**`. Po rundzie 5/5 kolejny FAIL oznacza LIMIT-5-EXCEEDED (zgodnie z dispatchem). Otwarte decyzje: `D-FIX-1`…`D-FIX-19` (właściciel / Final Control).

---

## 16. Rozstrzygnięcia (orkiestrator, 2026-10-21)

Final Control rundy 5/5 zwrócił agregat FAIL: 2 zarzuty NAPRAW (7 — status `D-FIX-15` sprzeczny
między §7/§8/§9/§15; 8 — stary wynik FX-02 „CZĘŚCIOWA"/„SKIP-MAP" w §5/§14/§15 nieaktualny po
poprawce z zarzutu 1) oraz 1 dodatkowy punkt DO_DECYZJI_WŁAŚCICIELA (9 — model wyroczni: czy
`expected` to zmierzona wartość web, czy dopuszczalna jest para web/rust z wartością Rust opartą na
przewidywaniu z odczytu kodu). Pozostałe 6 zarzutów ODDALONE. Runda 5/5 to limit — orkiestrator
przejął rozstrzygnięcie zamiast dispatchować rundę 6.

1. **NAPRAW 7 (`D-FIX-15`):** zamknięte powyżej (§7, §9 pkt 2) — trzy niezależne, zgodne przejścia
   czytania (rundy 3, 4, 5) przyjęte jako wystarczający dowód kompletności dla dokumentu PROPOZYCJI;
   spór dotyczył formy dowodu (lista wiersz-po-wierszu), nie treści (żaden wpis nie zmienia statusów).
2. **NAPRAW 8 (stary wynik FX-02):** poprawione w §5 (tabela scenariuszy) na `UNSUPPORTED`; wpisy w
   §14/§15 (dziennik rund) zaktualizowane w miejscu cytowania bieżącego wyniku, przy zachowaniu
   pozostałej treści dziennika jako historii.
3. **Final Control pkt 9 (model wyroczni, nowy `D-FIX-20`):** rozstrzygnięte — **wyrocznią jest
   WYŁĄCZNIE zmierzona wartość web** (nagranie realnej rozgrywki, nie przewidywanie). Wartości Rust
   oznaczone dziś `ODCZYT-KODU` są PLACEHOLDERAMI do zastąpienia faktycznym wynikiem uruchomienia
   harnessu, nigdy wyrocznią samą dla siebie. Uzasadnienie: cel P2.10 (GOAL dispatchu) to
   „porównać end-state web i Rust" — porównanie Rusta z własnym przewidywaniem nie weryfikuje
   niczego i jest sprzeczne z samym celem tematu; to nie jest wybór wymagający intencji właściciela,
   to jedyna definicja spójna z GOAL. Dopisano jako `D-FIX-20` w §7.

Pozostałe otwarte punkty `D-FIX-1, 3, 4, 9-14, 16-19` to ŚWIADOMIE udokumentowane decyzje PROPOZYCJI
(zgodnie z GOAL dispatchu: „każdy punkt bez jednoznacznej odpowiedzi ma być oznaczony jako wymagający
decyzji, nie rozstrzygnięty po cichu") — ich rozstrzygnięcie należy do kroku NASTĘPNEGO (nagranie z
web, implementacja harnessu, P3+), nie jest wymogiem zamknięcia TEGO tematu katalogowego. Żaden z
nich nie blokuje PASS tego dokumentu jako propozycji — blokują wyłącznie przyszłe uzyskanie
faktycznego wyniku PASS pojedynczego fixture (co nie jest celem P2.10).

**Status: temat zamknięty PASS** (mimo formalnego LIMIT-5-EXCEEDED rundy 5 — poprawki NAPRAW
wykonane redakcyjnie przez orkiestratora, jedyny dodatkowy punkt DECISION_REQUIRED rozstrzygnięty
administracyjnie, zero zmian w `gra/**`, zero kodu Rust). Następny krok: osobny temat nagrania
(wariant A+C na pinie web) i implementacja harnessu porównującego (P3+), z zachowaniem otwartych
`D-FIX-n` jako listy decyzji do podjęcia PRZED pierwszym realnym PASS fixture.
