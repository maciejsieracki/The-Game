# P1.18 — Macierz hot-seat: zachowanie web → moduł Rust docelowy → scenariusz akceptacyjny

**Temat:** `R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1` (runda 1/5, Operator).
**Piny:** web `main` = `edb8fb56` (odczyt: `gra/src/**`); Rust `rust-port/parity-v2` = `9e33fc77` (odczyt: `rust-port/engine/**`, HEAD po poprawce terenu Desert/Tundra).
**Metoda:** świeże snapshoty przez `git archive` do scratchpadu (read-only, bez zmian w repo gry). Wszystkie wiersze zweryfikowane na żywo na tych pinach. Archiwum OpenClaw i patche `worktree-overlays/` NIE są dowodem stanu; nie cytowane jako dowód.

**Legenda stanu Rust:** ISTNIEJE (działa i jest podpięte do ścieżki gry) / CZĘŚCIOWO (kod domenowy istnieje, nie podpięty do `PlayableGame`/bridge) / BRAK (brak nawet szkieletu).

**Ogólny stan:** Rust `playable` (`rust-port/engine/src/domain/playable.rs`) to jednoosobowy wertykalny slice: jedna stała `HUMAN_PLAYER_ID = 1` (linia 15), jeden człowiek. Cały hot-seat po stronie Rust = BRAK.

## A. Wybór dwóch graczy ludzkich

| # | Zachowanie web (ścieżka:linia, pin edb8fb56) | Moduł Rust docelowy | Stan Rust (parity-v2 9e33fc77) | Scenariusz akceptacyjny |
|---|---|---|---|---|
| A1 | Przełącznik „Dodaj drugiego gracza (hot-seat)", domyślnie wyłączony: `gra/src/ui/newGameFlow.ts:1933-1962` (`hotSeatEnabled`, linia 826) | `playable` / ekran startu (Tauri) | BRAK. `StartGameParams` (playable.rs:90) nie ma pola drugiego człowieka; brak UI | Ustawić w kreatorze hot-seat=on i wybrać cywilizację fotela 2 → `StartGameParams` zawiera 2 pola człowieka. Dziś: brak pola → FAIL |
| A2 | Ekran „Fotel 2 — Drugi Gracz", wybór cywilizacji fotela 2 (różnej od fotela 1): `newGameFlow.ts:1440-1500`, `2256`, dane `selCiv2`/`civId2`: `newGameFlow.ts:97-120, 808-829, 2019-2030` | `playable` (`StartGameParams.civ_id_2`) | BRAK | Test: `civ_id_2 == civ_id_1` → błąd walidacji (analogicznie do web: „Cywilizacja fotela 1 jest niedostępna"). Dziś: brak pola |
| A3 | Przekazanie `civId2` do startu gry: `newGameFlow.ts:2027` → `main.ts:37317` (`applyClusterStartPlan(..., { secondHumanCivId })`) | `playable::PlayableGame::new` | BRAK | Start gry z 2 fotelami → `state().players` zawiera 2 graczy z `is_human == true`. Dziś: `players` ma 1 człowieka (playable.rs:418-421) → FAIL |
| A4 | Utworzenie fotela 2 w generatorze/stanie: `main.ts:9014-9030` (`playerStartHexByOwner`, `humanSeats` z drugim `ownerId`, `_menuCivIdByOwner`) | `playable` + generator mapy (`domain/map_generator.rs`) | BRAK po stronie gry; `map_generator.rs` nie ma koncepcji drugiego startu człowieka | Dwa startowe heksy o odległości zgodnej z `humanDistanceMode` (`blisko`/`daleko`/`losowo`, `main.ts:8988`) → test generatora. Dziś: brak → FAIL |
| A5 | Bridge: `AddPlayer` tworzy wyłącznie gracza NIEludzkiego (`is_human: false`) | `bridge.rs` `EngineCommand::AddPlayer` | ISTNIEJE jako komenda testowa, ale z założenia nie-człowiek (deklaracja `bridge.rs:29`; obsługa przez `PlayableGame`: `bridge.rs:267-269` → `playable.rs:472-484`, `is_human: false`; druga ścieżka `execute` w `bridge.rs:331-345`, `is_human: false` w linii 344) | Komenda `AddHumanPlayer` (lub flaga) ustawia `is_human=true`; dziś brak → FAIL |

## B. Aktywny fotel i przełączanie tury

| # | Zachowanie web (ścieżka:linia) | Moduł Rust docelowy | Stan Rust | Scenariusz akceptacyjny |
|---|---|---|---|---|
| B1 | Model stanu foteli: `HumanSeats { humanOwnerIds, activeHumanOwnerId }`, `isHumanOwner`, `isActiveHuman`, `nextHumanSeat` (cyklicznie), `isHotSeat`: `gra/src/game/human-owners.ts:21-64` | `domain/seats.rs` (nowy, czysty) | BRAK | Test: seats `[0,1]`, active `0` → `next == 1`; active `1` → `next == 0`; seats `[0]` → `None`. Dziś: brak modułu |
| B2 | Stan `humanSeats` i alias `ME()` (= aktywny fotel): `main.ts:11124-11138` | `playable` (pole `active_human_id`) | BRAK. Jeden człowiek `HUMAN_PLAYER_ID` (playable.rs:15, 493, 527) | Po `advance_turn` przy 2 fotelach `active_human_id` zmienia się 1→2. Dziś: pole nie istnieje → FAIL |
| B3 | Przełączenie aktywnego fotela `switchActiveHuman()` (7 kroków: zamknięcie paneli, wyczyszczenie logów, build-mode, cache HUD, zmiana fotela, focus kamery): `main.ts:11314-~11420`, no-op gdy cel == aktywny (`11315`) | `playable` (`switch_active_human`) + warstwa Tauri (UI) | BRAK (brak pojęcia fotela; `select_unit`/`move_unit` sprawdzają tylko stałego człowieka, playable.rs:486-530) | Test: po `switch(2)`: `select_unit(u_of_1)` → `UnitNotOwned`; `select_unit(u_of_2)` → OK. Dziś: brak API switch → FAIL |
| B4 | Kolejka końca tury fotel-po-foteln: `advanceSeat()` `main.ts:36047-36100` (strażnik `canPlayerInitiateEndTurn`, `seatsFinishedThisRound` `main.ts:11130`, przełącz na następny nieukończony; dopiero po ostatnim → świat) | `playable::advance_turn` (rozszerzenie) | BRAK. `advance_turn` (playable.rs:554) przesuwa tylko kolejkę faz, bez rotacji graczy | Test: 2 fotele; `end_seat(1)` → tura nie rośnie, aktywny=2; `end_seat(2)` → `turn += 1`, aktywny=1. Dziś: `end_seat` nie istnieje → FAIL |
| B5 | Powrót na PIERWSZY fotel po przejściu świata: `main.ts:35993` (`switchActiveHuman(humanOwnerIds[0])`) | `playable::advance_turn` | BRAK | Jak B4: po `end_seat(2)` aktywny == pierwszy element listy foteli. Dziś: FAIL |
| B6 | Automatyczne „załóż pierwsze miasto" dla fotela wchodzącego bez miasta: `main.ts:36080-36086` (`beginOnboardingFoundCity`, `13467`) | `playable` (onboarding) | BRAK | Test: fotel 2 bez miasta → stan zwraca `needs_first_city=2`. Dziś: pojęcie nieobecne → FAIL |
| B7 | Ekran zasłony „przekazania kontroli" między fotelami (pełnoekranowy, zero śladu fotela A): `gra/src/ui/hotSeatHandoff.ts:1-135`. **UWAGA: w produkcji NIEPODŁĄCZONY** — jedyne wywołanie `showHotSeatHandoff` to hak testowy `__hotSeatTestDebug` (`main.ts:24234-24692`, wiersz 24543-24544); `advanceSeat` przełącza bez zasłony | Warstwa Tauri (UI) | BRAK | Test UI (Tauri/Playwright): po „Zakończ turę" fotelem 1 widoczny jest overlay z napisem przekazania, a na mapie nie ma elementów fotela 1 do momentu kliku „Kontynuuj". Dziś: web też nie pokazuje w prod → zachowanie do ustalenia z właścicielem (patrz §Ryzyka) |

## C. Dane per fotel (nie per globalny gracz)

| # | Zachowanie web (ścieżka:linia) | Moduł Rust docelowy | Stan Rust | Scenariusz akceptacyjny |
|---|---|---|---|---|
| C1 | Mapy per właściciel: `exploredByHuman` (`main.ts:11166`), `playerStateByHuman` (`11178`), `playerCivTypeByHuman` (`11188`), `pracaPoolByHuman` (`11199`), `playerStartHexByOwner` (`9018`, `2668`) | `domain/player.rs` (`Player` z zasobami), `domain/turn_economy.rs` | CZĘŚCIOWO. `Player` (player.rs:7-10) ma tylko `id`+`name`; `turn_economy.rs` (skarbiec, nauka, kultura, Praca per tura) istnieje w `lib.rs`/`domain/mod.rs`, ale NIE jest używany przez `playable.rs` (brak importu) | Test: 2 fotele, `settle_economy` tylko dla fotela 1 nie zmienia skarbca fotela 2. Dziś: `playable` nie ma skarbca per gracz → FAIL |
| C2 | Bankowanie ekonomii każdego fotela w pętlach `for hOid of humanSeats.humanOwnerIds`: `main.ts:31533, 31685, 31874, 32982` | `domain/turn_economy.rs` (wywołanie per fotel) | CZĘŚCIOWO (moduł jest, bez wywołania z gry) | Test: `turn_economy::settle` dla każdego z 2 fotelu przy tych samych wejściach → niezależne salda. Dziś: brak wywołania z `PlayableGame` → FAIL |
| C3 | Widoczność mgły per fotel: `refreshFog`, `meNow()`, `playerOwnerId: meForRender?.()`: `main.ts:2581, 2632, 10906`; `render/cities.ts:657,785,804`; `render/units.ts:6465` | `domain/` (widoczność per gracz) + warstwa render Tauri | BRAK (brak mgły, brak `visible` per gracz w `PlayableState`) | Test: fotel 2 nie widzi heksów poza swoim zasięgiem odkrytym przez fotela 1 (`explored` per fotel). Dziś: brak → FAIL |
| C4 | Zdarzenia/dzienniki: `warEventLog` itd. CZYSZCZONE przy przełączeniu (nie filtrowane) — `main.ts:11398-11410` (KROK 3); dług: `SidePanelEvent` bez pola ownera | `domain/events.rs` | BRAK wyczyszczenia (brak pojęcia fotela); `events.rs` ma kolejkę faz, bez właściciela-fotela | Test: po `switch` kolejka zdarzeń fotela 1 jest pusta dla fotela 2. Dziś: FAIL |
| C5 | Ustawienia Handlu/Podziału per właściciel: `empireDetailPanel.ts:61-65, 91, 160, 1169`, `main.ts` (`ownerDefaultPodzialHandlu`, `initOwnerDefaultCityFields`, `9141-9142`) | `domain/trade.rs`/ustawienia gracza | BRAK (`trade.rs` nie ma pojęcia fotela ani ustawień per gracz w ścieżce gry) | Test: zmiana polityki handlu fotela 2 nie zmienia polityki fotela 1. Dziś: FAIL |
| C6 | Dyplomacja MIĘDZY fotelami (skrzynka propozycji, akceptacja/kontrpropozycja, `proposeToHuman`/`respondToHumanProposal`): `main.ts:17899-17990`, `openInterHumanDiplomacyHud` `18026-18060` (gating `isHotSeat`, `18027`) | `domain/diplomacy.rs` (ścieżka przez gracza ludzkiego) | BRAK ścieżki hot-seat. `diplomacy.rs` istnieje, ale nie zawiera pojęcia człowieka ani nie jest podpięty do `playable`/`bridge` (grep: 0 trafień na human/seat) | Test: fotel 1 wysyła „pokój" do fotela 2 → fotel 2 widzi 1 propozycję; `accept` → stan pokoju w obu fotelach. Dziś: FAIL |
| C7 | Zapis gry v3 z `humanOwnerIds`/`activeHumanOwnerId`: `gra/src/game/save.ts:373-377, 688-715` (fallback do 0 dla v2) | `domain/save_load.rs` | BRAK (`CURRENT_SNAPSHOT_VERSION = 2`, `save_load.rs:34`, brak pól foteli) | Test: zapis w fotelu 2 → load → `active_human_id == 2`; load snapshotu v2 → fotel domyślny 1 (zgodnie z fallbackiem web). Dziś: FAIL |

## D. Ekrany/UI specyficzne dla hot-seat (zachowanie gating)

| # | Zachowanie web (ścieżka:linia) | Moduł Rust docelowy | Stan Rust | Scenariusz akceptacyjny |
|---|---|---|---|---|
| D1 | Przycisk „dyplomacja między fotelami" widoczny TYLKO w hot-seat: `main.ts:22614-22620` (`isInterHumanDiploVisible: () => isHotSeat(humanSeats)`), `mapToolbarHud.ts:34-38, 103, 130-148` | Warstwa Tauri (UI) | BRAK | Test UI: przy 1 fotelu element `#…interhuman` nie istnieje w DOM; przy 2 — istnieje. Dziś: brak → FAIL |
| D2 | Panele i modale zależne od „Ty" (`isMe`): `cityPanel.ts:601-616` (domyślnie `ownerId === 0`), `siegeMapPanel.ts:20`, `powerOverlayHud.ts:146`, `preBattle.ts:137, 582` | Warstwa Tauri (UI) z `active_human_id` | BRAK | Test: miasto fotela 2 z panelu fotela 2 → `isMe == true`; z panelu fotela 1 → `false`. Uwaga: wg komentarza web domyślnie `ownerId === 0` (zaszyte w `cityPanel.ts:616`) — do sprawdzenia w porcie |
| D3 | Ekran wyboru fotela 2 w kreatorze: `newGameFlow.ts:1440-1500` | Tauri UI (kreator) | BRAK | Test UI: włączony przełącznik → po „ROZPOCZNIJ" pojawia się ekran „Fotel 2"; wyłączony → pomija go (zachowanie single-player). Dziś: FAIL |
| D4 | Zasłona przekazania fotela (patrz B7) | Tauri UI | BRAK | jak B7 |
| D5 | Zakres widoku przy przełączeniu: kamera skupiona na stolicy nowego fotela `focusCameraOnOwnerCapital` (`main.ts:28698`, wołane w `switchActiveHuman` KROK 6) | Tauri UI | BRAK | Test: po `switch(2)` środek widoku = stolica fotela 2 (tolerancja 1 heks). Dziś: FAIL |

## Ryzyka i znane luki po stronie web (do świadomości przy porcie)

1. `refreshLiveEmpireRatesUnsafe()` (`main.ts:18487`) jest CZĘŚCIOWO per-fotel, nie w pełni. Per-fotel: filtr miast `isMe` (`main.ts:18488`), upkeep Pracy `.get(ME())` (`18586`) i zapis `setOwnerLastPracaUpkeep(ME(), ...)` (`18593`). Nadal singleton fotela 0: `ownerCivMap.set(0, player.civType)` (`18494`), `player.era` i `player.zbadane` (`18505-18506`; `player` = `createPlayerState()`, `main.ts:11120`). Komentarz `main.ts:11416-11417` („zahardkodowana na fotela 0", odwołanie do `main.ts:17077`) jest nieaktualny co do numeru linii i pełnego zakresu. Port nie powinien kopiować części singletonowej.
2. Zasłona przekazania (`hotSeatHandoff.ts`) nie jest podpięta w produkcji (B7/D4). Port ma implementować zachowanie zamierzone (kontrakt zasłony z dokumentu projektu), a nie bieżący brak — wymaga decyzji właściciela, czy port ma ją mieć.
3. `advanceSeat` w web przełącza fotel bez zasłony, więc zasada „zero śladu fotela A" nie jest egzekwowana przez UI w produkcji — ryzyko no-leak do potwierdzenia.

## Podsumowanie stanu

- Rust: hot-seat = BRAK na poziomie `playable`/`bridge`/`save_load`; CZĘŚCIOWO tylko w domenach `turn_economy.rs` i `diplomacy.rs` (istnieją, nie podpięte).
- Web: hot-seat zaimplementowany w `main.ts` i `human-owners.ts` (model, switch, rotacja tur, dane per fotel, dyplomacja, gating UI); zasłona przekazania istnieje w module, ale jest podpięta tylko w hooku testowym.
- Każdy wiersz ma ścieżkę+linię web, stan Rust z dowodem (ścieżka/plik na parity-v2) i konkretny scenariusz testowalny.
