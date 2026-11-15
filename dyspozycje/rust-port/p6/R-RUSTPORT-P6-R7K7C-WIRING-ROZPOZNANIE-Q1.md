# R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 — rozpoznanie wpięcia `apply_dipl_deltas_to_state`

Status: ROZPOZNANIE, tylko odczyt. Zero zmian w `rust-port/**`, `gra/**`, testach.
Baza: `f7baa3848` (`origin/rust-port/parity-v2`, korekta bazy orkiestratora). Pin: `07d2fbd72` (odczyt).
Temat #106 (R7K7C-WIRING). Odniesienia: `plik:linia` w pinie i w Rust liczone na powyższych SHA.

## 1. Tabela: element pina → Rust → wołany w produkcji

| Element pina | Miejsce w pinie | Odpowiednik Rust | Wołany w produkcji? (`git grep`) |
|---|---|---|---|
| Przyrost skarbca przez krok dyplomacji (`add` w adapterze `buildDiploTreasury`) | `gra/src/main.ts:22618-22645` (add: 22634-22643) | `Ledger::add` `turn_war_dipl_steps.rs:359-366` (zapis do `treasury_delta`) | Tak, przez `run_dipl_steps` (`turn_war_pipeline.rs:370`) |
| Odczyt skarbca (`getPieniadze` → `ownerTreasury`, brak wpisu AI = `?? 0`) | `main.ts:34864-34866` (`?? 0` w 34865) | `Ledger::balance` `turn_war_dipl_steps.rs:350-357` — brak wpisu = **BŁĄD** | Tak |
| Zapis skarbca gracza/AI z podłogą 0 (`setOwnerTreasury`) | `main.ts:34867-34872` (`Math.max(0, value)` w 34868) | — (podłogi brak; zgodne z `buildDiploTreasury`, które podłogi NIE robi, `main.ts:22635-22643`) | — |
| Pula Pracy (`ownerPracaPool`, brak wpisu AI = `?? 0`) | `main.ts:34876-34878` | `Ledger::praca_of` `turn_war_dipl_steps.rs:344-349` — brak wpisu = **BŁĄD** | Tak |
| Zapis puli Pracy z podłogą 0 (`setOwnerPracaPool`) | `main.ts:34879-34882` (`Math.max(0, value)`) | `apply_dipl_deltas_to_state` `turn_war_dipl_steps.rs:1094-1095` (`value > 0 ? value : 0`) | **NIE** — tylko definicja i testy |
| Krok dyplomacji wpięty w tura: `tickDiplomacyPayments(payDeals, treasury, turn)` | `main.ts:24275-24277` (w `runDiplomacyTurnTick`, `main.ts:24229-24331`) | `run_dipl_steps` `turn_war_dipl_steps.rs:905`, wywołanie `turn_war_pipeline.rs:370` | Tak |
| Logika trybutu: `balance = getPieniadze(payer)`; `balance < amount` → zerwany; inaczej `add(payer,-amount)`, `add(receiver,+amount)` | `gra/src/game/diplomacy-economy.ts:106-116` (sprawdzenie w 108-111) | `turn_war_dipl_steps.rs` (ledger, przez `Treasury` trait) | Tak |
| Funkcja zapisująca przyrosty do stanu (skarbiec gracza, skarbiec AI, praca) | brak w pinie jako osobnej funkcji — pin pisze wprost przez `add` (zob. wiersz 1) | `apply_dipl_deltas_to_state` `turn_war_dipl_steps.rs:1041-1110` | **NIE** — tylko definicja (`turn_war_dipl_steps.rs:1041`) i testy `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` (linie 275-352) |
| Faza kolejki wołająca wojnę/dyplomację | `main.ts` ok. 24229 (`runDiplomacyTurnTick`) | `playable.rs:1180-1186` (`TurnPhase::Diplomacy` → `run_diplomacy_war_phase`) | Tak |

Potwierdzenie braku wołającego: `git grep apply_dipl_deltas_to_state -- rust-port` zwraca wyłącznie definicję (`turn_war_dipl_steps.rs:1041`) i testy (`p6_r7k7c_owner_pools.rs`, importy i asercje). Produkcyjnego wywołania nie ma.

## 2. Co dokładnie zapisuje funkcja i gdzie ją podpiąć

**Funkcja (`turn_war_dipl_steps.rs:1041-1110`):** zapisuje (a) skarbiec gracza ludzkiego do `economy.treasury` (1054-1066, zapis w 1103-1105), (b) skarbce AI do `economy.ai_treasury_by_owner` (1067-1077, zapis w 1107), (c) pule Pracy do `economy.praca_pool_by_owner` (1084-1101, zapis w 1108). Wszystkie wartości są liczone i walidowane (skończone) przed zapisem; błąd = brak zmiany (atomowość), co jest zgodne z pinem.

**Wiring (propozycja, nie zrobiona):** w `playable.rs::run_diplomacy_war_phase` (`playable.rs:1236-1250`) wynik `run_war_turn` jest dziś odrzucany (`run_war_turn(&mut ctx)...?;`). `WarTurnReport` ma pole `dipl: DiplStepsReport` (`turn_war_pipeline.rs:139-146`), które niesie `treasury_deltas` i `praca_deltas` (`turn_war_dipl_steps.rs:140-141`). Zmiana:
- `let report = run_war_turn(&mut ctx).map_err(...)?;` (ctx kończy życie przed dostępem do `self.state`),
- następnie `apply_dipl_deltas_to_state(&mut self.state, &report.dipl.treasury_deltas, &report.dipl.praca_deltas).map_err(...)?;`.
Błąd z `apply` idzie w górę do `advance_turn` (`playable.rs:1181-1185`), które już cofa `phase_queue` i `state.war` z migawek (`playable.rs:1165-1166`). Stan ekonomii nie jest częściowo zapisany, bo `apply` jest atomowe. Uwaga: ta sama ścieżka cofa `war`, ale NIE cofa `economy` gdy błąd padnie po `apply` — przy obecnej kolejności `apply` jest ostatnim krokiem fazy, więc to nie zachodzi.

**Kolejność w turze:** pin wykonuje tick płatności przed tickiem relacji i hamulcem (zgodnie z komentarzem nagłówkowym `turn_war_dipl_steps.rs:1-12`). Rust trzyma ten sam porządek w `run_war_turn`; wpięcie po `run_war_turn` (przed fazą Ai) zachowuje kolejność, bo wszystkie kroki D1-D8 już się wykonały. NIEZMIERZONO: nie uruchamiałem testów, więc porządek potwierdzam wyłącznie czytaniem kodu.

## 3. Czy `undefined` → 0 jest w pinie (dowód linii)

- Skarbiec AI: `ownerTreasury` zwraca `aiSkarbiecByOwner.get(ownerId) ?? 0` (`main.ts:34865`). Brak wpisu = 0.
- Pula Pracy AI: `ownerPracaPool` zwraca `aiPracaPoolByOwner.get(ownerId) ?? 0` (`main.ts:34877`). Brak wpisu = 0.
- Krok dyplomacji czyta przez `getPieniadze` (`buildDiploTreasury`, `main.ts:22620-22624`), więc płatnik bez wpisu ma saldo 0 i trybut się zrywa (`diplomacy-economy.ts:108-111`), zamiast rzucać błąd.
- Zapis do odbiorcy bez wpisu: `add` robi `(aiSkarbiecByOwner.get(ownerId) ?? 0) + delta` (`main.ts:22642`), czyli tworzy wpis = delta. Pin nigdy nie rzuca błędu przy braku wpisu.

**Wniosek:** w pinie brak wpisu = 0 i zapis go tworzy. Rust (`Ledger::balance`, `praca_of`, `apply`) rzuca `WarTurnError` przy braku wpisu. To jest odchylenie od zasady 9 (parytet 1:1).

**Dodatkowy fakt (ważny dla decyzji):** w produkcji `ai_treasury_by_owner` i `praca_pool_by_owner` są wypełniane tylko przez settery scenariusza/testu (`playable.rs:967`, `playable.rs:977`, `set_owner_treasury`). Nie znalazłem produkcyjnego inicjalizatora wpisów dla każdego AI (NIEZMIERZONO: nie prześledziłem całej ścieżki startu gry). Jeśli wpisów brak, każdy płatnik AI w `Ledger::balance` daje błąd już przy pierwszej płatności trybutu, co przerwałoby fazę dyplomacji. To jest ryzyko większe niż sam wybór wariantu.

## 4. Test wektorowy (≥150 z pinu, wymóg #106)

Proponowane źródło wektorów: `gra/src/game/diplomacy-economy.ts` jest czystym modułem (eksport `tickDiplomacyPayments`, adapter `TreasuryAdapter`). Harness Node odtwarza adapter pina (`getPieniadze` z `?? 0`, `add` bez podłogi, `setOwnerPracaPool` z `Math.max(0,·)`) i generuje ≥150 przypadków: brak wpisu płatnika/odbiorcy, saldo równe kwocie, ujemne wartości, `NaN`/`Inf`, wiele płatności w jednej turze, dwie pary z tym samym płatnikiem. Wyniki zapisuje jako JSON; test Rust (rozszerzenie `p6_r7k7c_owner_pools.rs`) porównuje je z `apply_dipl_deltas_to_state` i `tick`. NIEZMIERZONO: harness nie został uruchomiony w tym rozpoznaniu.

## 5. Odchylenie „brak wpisu → błąd” vs 0

**Obecny stan (Rust):** błąd `WarTurnError` (`turn_war_dipl_steps.rs:1066-1072`, `1089-1093`, `350-357`, `344-349`). Komentarz nagłówkowy (`turn_war_dipl_steps.rs:1036-1040`) oznacza to jako OTWARTE (DECISION_REQUIRED).

**ABC (wg zasady 10: opis, zalety i wady, rekomendacja):**

Przedmiot pytania: przy płatności trybutu lub przelewie dyplomatycznym do/od właściciela AI bez wpisu w `ai_treasury_by_owner` (lub `praca_pool_by_owner`) Rust przerywa całą fazę dyplomacji błędem. Pin traktuje brak wpisu jako saldo 0: płatnik nie płaci i trybut się zrywa, a odbiorca dostaje wpis równy kwocie. Zmiana wyboru wpływa na to, czy tura w ogóle się domknie oraz na zgodność z pinem.

- **Wariant A — zostawić błąd.** Za: wykrywa niespójny stan (brak producenta), nie tworzy zer po cichu. Przeciw: odchodzi od pina; przy braku wpisów w produkcji każda płatność AI przerywa turę; łamie zasadę 9.
- **Wariant B — parytet: brak wpisu = 0 przy odczycie, zapis tworzy wpis (jak `add` w pinie).** Za: 1:1 z pinem (`main.ts:22642`, `:34865`, `:34877`), nie przerywa tury, zgodne z zasadą 9. Przeciw: ukrywa niespójność producenta; wymaga testów wektorowych, żeby nie zgubić prawdziwego błędu danych.
- **Wariant C — jawny błąd tylko dla wpisów wymaganych przez scenariusz, reszta jak B.** Za: zachowuje wykrywanie błędów danych. Przeciw: nowa klasa stanu do utrzymania; pin nie ma takiego rozróżnienia.

**Rekomendacja: wariant B (Recommended).** Uzasadnienie: zasada 9 nakazuje parytet 1:1 z webem bez pytania właściciela, a pin wprost daje 0 (`?? 0`, `main.ts:34865`, `:34877`) i tworzy wpis przy zapisie (`main.ts:22642`). Wariant A w obecnej produkcji (brak inicjalizatora wpisów AI) blokuje turę. Wariant B jest zgodny z zasadą 9 i nie wymaga pytania ABC do właściciela; zapisuję to jako decyzję techniczną w `dyspozycje/rust-port/REJESTR-RUST.md` (zgodnie z zasadą 9), a nie jako otwarte pytanie.

## 6. Zmiany potrzebne do wpięcia (lista z plik:linia)

1. `rust-port/engine/src/domain/playable.rs:1247` (`run_diplomacy_war_phase`): zachować `report` z `run_war_turn` i wywołać `apply_dipl_deltas_to_state(&mut self.state, &report.dipl.treasury_deltas, &report.dipl.praca_deltas)`.
2. `rust-port/engine/src/domain/turn_war_dipl_steps.rs:350-357` (`Ledger::balance`) i `344-349` (`praca_of`): brak wpisu → 0 (wariant B), bez błędu.
3. `rust-port/engine/src/domain/turn_war_dipl_steps.rs:1066-1072` i `1089-1093` (`apply_dipl_deltas_to_state`): brak wpisu → 0, zapis tworzy wpis.
4. Testy: `rust-port/engine/tests/p6_r7k7c_owner_pools.rs:291` i `305` (asercje `is_err` dla brakującego wpisu) trzeba zmienić na asercje parytetu.
5. Uwaga do puli Pracy: Rust sumuje przyrosty `praca_delta` w `Ledger` i podłoguje dopiero na końcu (`turn_war_dipl_steps.rs:1094-1095`), a pin podłoguje przy każdym zapisie (`main.ts:34880`). Różnica pojawia się tylko, gdy pula schodzi poniżej zera w trakcie tury. NIEZMIERZONO: nie sprawdziłem, czy przelew pracy (`main.ts:12588-12589`) jest chroniony sprawdzeniem salda.

## 7. Propozycja tematów wykonawczych

| Temat | Allowlista | Zależności | Szacunek rund |
|---|---|---|---|
| R7K7C-PARITY-MISSING0: brak wpisu = 0 (wariant B) w `Ledger` i `apply` | `rust-port/engine/src/domain/turn_war_dipl_steps.rs`, `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` | brak; decyzja techniczna wg zasady 9 | 2 |
| R7K7C-WIRING-IMPL: wpięcie `apply_dipl_deltas_to_state` w `run_diplomacy_war_phase` | `rust-port/engine/src/domain/playable.rs` | po PARITY-MISSING0 (test wektorowy na nowej semantyce) | 1–2 |
| R7K7C-VEC: wektory ≥150 z pinu (harness Node + test Rust) | `rust-port/engine/tests/p6_r7k7c_owner_pools.rs`, katalog generatora (do wskazania w dispatchu) | po PARITY-MISSING0 | 2 |

Zależność od #104 (ZLOZE) i #172 (ZLOZE-IMPL): NIE ZACHODZI. Funkcja i jej krok dotyczą skarbców i pul Pracy, a nie zlożeń (`deactivate_zloze_grants_for_deal`). Nie znalazłem powiązania w kodzie pina przy `diplomacy-economy.ts` ani w `turn_war_dipl_steps.rs`.

## 8. Niepewne twierdzenia (NIEZMIERZONO)

- Porządek wpięcia względem fazy Ai i hamulca nie został uruchomiony w testach.
- Ścieżka startu gry nie została prześledzona: nie wiem, czy któryś scenariusz wypełnia `ai_treasury_by_owner` dla wszystkich AI.
- Wektory ≥150 nie zostały wygenerowane.
- Przelew pracy (`main.ts:12588`) nie zweryfikowany pod kątem sprawdzenia salda.

## 9. Korekty po obronie (runda 2, `02a-obrona.md`)

Commit rozpoznania (runda 1): `8a8fd30c8`. Korekty poniżej są dopisane zamiast przepisywania tabel wyżej, żeby było widać, co zmieniono.

**9.1 Wiersz D3 (tick cykliczny) — dodany, zarzut 1 PRZYJMUJĘ.**

| Element | Pin (plik:linia) | Rust (plik:linia) | Wołany w produkcji |
|---|---|---|---|
| D3 `tickCyclicResourceTradeDeals` (domknięcie w `main.ts`) | `main.ts:24077` | `turn_war_dipl_steps.rs:551` (`buyer_ok = ledger.praca_of(buyer)? >= z`) | Tak, przez tick cykliczny (do potwierdzenia w temacie D3-VEC) |
| D3 przelew Pracy po warunku kupca | `main.ts:24014-24016` (`setOwnerPracaPool` kupiec `-zaplata`, sprzedawca `+zaplata`) | sekcja cyklicznych dostaw w `turn_war_dipl_steps.rs` (~530-560) | Tak |
| Warunek kupca przed przelewem | `main.ts:24154-24155` (`buyerOk = ownerPracaPool(buyer) >= zaplata`) | `turn_war_dipl_steps.rs:551` | Tak |

Poprzednie wskazanie `main.ts:12588-12589` jest błędne: linia 12583 to `case 'praca'` w `transferBasketItems` (`main.ts:12566`), czyli wymianie koszykowej, nie w D3. Ścieżka koszykowa jest poza #106 (krok D1-D7 wymiany nie jest zakresem tego tematu); czy jest osiągalna z ticka dyplomacji, NIEZMIERZONO.

Podłoga przy D3: warunek kupca sprawdza saldo przed zapisem, więc kupiec nie schodzi poniżej 0; sprzedawca tylko rośnie. Różnica podłogi (przy każdym zapisie vs na końcu, `turn_war_dipl_steps.rs:1094-1095`) nie daje rozbieżności dla D3, co potwierdza zarzut ewaluatora.

**9.2 Test zależny od błędu „brak producenta” — zarzut 3 PRZYJMUJĘ, grep wykonany.**
`git grep DiplStep -- rust-port` (wynik): definicja `turn_war_pipeline.rs:160,180`; dokumentacja zamierzonego błędu `turn_war_inputs.rs:713-714`; asercje błędu `p6_wire_war_dipl_steps.rs:611` (brak skarbca płatnika AI, `m.contains("skarbca")`) i `:625` (brak puli Pracy, `m.contains("Pracy")`). Wariant B odwraca te asercje, więc `p6_wire_war_dipl_steps.rs` musi wejść do allowlisty PARITY-MISSING0 (nie tylko `p6_r7k7c_owner_pools.rs:291-305`). Asercje `is_err()` w innych plikach NIEZMIERZONO (grep po tekście błędu ich nie łapie).

**9.3 Korekta własna — wariant B nie usuwa luki producenta.** `turn_war_inputs.rs:713-714` mówi wprost, że AI nie ma skarbca w `PlayableState`, a brak wpisu to zamierzony błąd. Wariant B zamienia ten błąd w ciche zero. Parytet wyniku z pinem jest wtedy zachowany, ale luka producenta (brak AI-skarbca i AI-puli w stanie, `playable.rs` setter-y) znika z widoku. Rekomendacja B zostaje, pod warunkiem osobnego tematu producenta (R7K7C-PRODUCER: AI-skarbiec i AI-pula Pracy wypełniane w stanie gry, po wcześniejszym zapisie NIEZMIERZONO na ścieżce startu). Bez tego B maskuje błąd.

**9.4 Odporność `advance_turn` — zarzut 4 PRZYJMUJĘ.** `playable.rs:1165-1166` robi migawkę `queue_before` i `war_before`. Cofanie idzie tylko przy błędzie fazy Diplomacy (`playable.rs:1181-1184`). Przy `TurnPhaseQueueIncomplete` (`playable.rs` ok. 1205-1208) przywracane są tylko `koniec_before` i `flag_before`, bez ekonomii. Ponieważ apply jest ostatnim krokiem fazy Diplomacy, po udanym apply błąd kolejki zostawia zmienioną ekonomię. Poprawka (do temat WIRING-IMPL): migawka `economy_before` obok `war_before` i przywrócenie jej w gałęzi `TurnPhaseQueueIncomplete`. Alternatywa: jawna decyzja, że poza zakresem. Rekomendacja: migawka (koszt mały, wzorzec już użyty dla `war`).

**9.5 Tematy wykonawcze (zarzut 2 i 3 PRZYJMUJĘ).**
- R7K7C-PARITY-MISSING0: allowlista `turn_war_dipl_steps.rs`, `p6_r7k7c_owner_pools.rs`, `p6_wire_war_dipl_steps.rs`. Zależności: brak. Wykonać przed VEC.
- R7K7C-PRODUCER (nowy, z 9.3): allowlista do wskazania w dispatchu po rozpoznaniu ścieżki startu.
- R7K7C-WIRING-IMPL: `playable.rs` (wołanie apply + migawka ekonomii z 9.4). Zależność: PARITY-MISSING0.
- R7K7C-D3-VEC (nowy, z 9.1): osobny plik testowy (propozycja `rust-port/engine/tests/p6_r7k7c_d3_cyclic.rs`) i generator wektorów z `main.ts:24077-24160`. Zależność: PARITY-MISSING0 (ta sama semantyka braku wpisu). Nie współdzieli pliku z WIRING-IMPL.
- R7K7C-VEC (apply, ≥150): `p6_r7k7c_owner_pools.rs` i katalog generatora do wskazania w dispatchu. Sekwencyjnie po PARITY-MISSING0, nie równolegle (ten sam plik).
Scalenie VEC z D3-VEC jest możliwe, ale wtedy jeden temat ma dwa pliki testowe; rekomenduję rozdział.

**9.6 Hotseat — zarzut 5c PRZYJMUJĘ (wcześniej nierozpoznane, teraz rozpoznane).** Pin: `ownerTreasury`/`ownerPracaPool` wybierają `playerStateByHuman`/`pracaPoolByHuman` dla KAŻDEGO fotela człowieka (`main.ts:34864-34866`, `34876-34878`). Rust: `apply_dipl_deltas_to_state` bierze pierwszego człowieka `.find(|p| p.is_human)` (`turn_war_dipl_steps.rs:1049`), a `PlayableState` obsługuje wielu właścicieli-ludzi (`playable.rs:981-985`, `is_human_owner`). Skutek: delta dla drugiego fotela nie trafia do jego skarbca. Dokładny wynik (AI-ścieżka czy błąd), NIEZMIERZONO, do wyjaśnienia w testach. Poprawka do WIRING-IMPL: dispatch per właściciel przez `is_human_owner`, nie `find`.

**9.7 Notatka SHA i gałęzi (zarzut 5a, 5b PRZYJMUJĘ).** SHA rozpoznania: `8a8fd30c8`. Gałąź `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1` zawiera wcześniejszą rundę (`9be44a148` na `6acb1d81b`); rozpoznanie jest na `-Q1-b`. Ta runda obrony jest na `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1-obrona-r2`. Starszy `-obrona` (`5351fe1de`) nie jest przodkiem tej rundy. Zapis tych odstępstw w rejestrze należy do orkiestratora.
