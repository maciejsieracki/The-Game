# R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1 — obrona Operatora (runda 1, zarzuty 1–6)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, read-only)
TEMAT: R7K7C-WIRING (#106) — obrona raportu `01-operator-r1.md` (SHA `9be44a148`)
GOAL: odpowiedzieć na każdy zarzut: PRZYJMUJĘ (poprawka w tym dokumencie + dowód) albo ODRZUCAM (dowód).
BAZA: `9be44a148` (commit raportu; zmiany względem `6acb1d81b`: tylko 2 pliki `.md`, +208).
ZMIANY/COMMIT: tylko ten dokument (allowlista rundy). Zero zmian kodu w `rust-port/**`, `gra/**`, testach.
TESTY: NIE DOTYCZY (read-only, zero zmian kodu). `git diff --check 6acb1d81b 9be44a148`: czysto.
BLOKADY: brak. NIE_ZMIERZONO: patrz pkt 8.
RUNDY: 2/5 (obrona)
NASTĘPNY KROK: orkiestrator decyduje o pytaniu ABC (pkt 5 raportu, rekomendacja A) i o tematach wykonawczych z korektą pkt 3 niniejszego dokumentu.
DEPLOY/PUSH: NIE WYKONANO

Wszystkie numery linii sprawdzone na `9be44a148` (Rust) i `07d2fbd72` (pin `gra/src/main.ts`, `gra/src/game/diplomacy-economy.ts`).

---

## Zarzut 1 — pominięte pola raportu (`city_resources`, `barbarian_grace`, `credibility_requests`, `tribute_breaks`, `truce_pairs_changed`)

### 1a. `city_resources` — PRZYJMUJĘ

Dowód:
- Pole: `turn_war_dipl_steps.rs:136` (`pub city_resources: Option<Vec<CityResourceState>>`), ustawiane w `:1009` jako `ledger.cities.clone().filter(|_| !report.cyclic.is_empty())`. Czyli `Some` tylko, gdy były umowy cykliczne.
- Pin: po dostawie `cities[i]!.surowce = after.surowce` w `applyCyclicDeliveryOutcome` (`main.ts:24008`). Zapas miast zmienia się więc w D3 i to jest efekt, którego raport nie stosuje.
- Rust: zapas miast to `PlayableState.economy.city_stock` (`playable.rs:436`, klucz: id miasta, typ `StockRecord`). Producent wejść czyta go do `CityResourceState` (`turn_war_inputs.rs:741-750`).
- Wniosek: poprawna lista zmian dla #106 musi zawierać zapis zapasów miast: dla każdego `CityResourceState` w `report.dipl.city_resources` zapisać `economy.city_stock[id] = resources`.
- Ważny detal do testu: producent daje miastu bez wpisu puste `resources` (`turn_war_inputs.rs:741-750`: `if let Some(stock) = city_stock.get(..)`), ale NIE tworzy wpisu w stanie. Zapis całego wektora `city_resources` utworzyłby wpisy `city_stock` tam, gdzie pin ich nie ma. Zapisywać tylko miasta, których zapas się zmienił (pin zapisuje tylko przy `after.surowce !== before.surowce`).

Korekta do `01-operator-r1.md` pkt 3: dodać pozycję „zapas miast: `report.dipl.city_resources` → `economy.city_stock` (tylko zmienione wpisy)”.

### 1b. `credibility_requests` — ODRZUCAM (jest stosowane w module)

Dowód:
- Zdarzenia wiarygodności są dopisywane do rejestru w tej samej funkcji: `turn_war_dipl_steps.rs:617-619` (`reg.append_event(r.owner, event, r.value, turn)`), a rejestr jest zapisywany do stanu wojny: `:~660` (`reg.store_changes(&before, &mut work.opaque)`).
- Kopia w `report.credibility_requests` jest informacyjna. Raport operatora nie pisał, że pole jest „gubione”, tylko że nie ma dowodu konsumenta. Konsument istnieje (`:617`).

### 1c. `tribute_breaks` — ODRZUCAM (stosowane w miejscu)

- `turn_war_dipl_steps.rs:950-957`: `work.diplomacy.apply_event(pid(payer), pid(receiver), DiplomaticEvent::TributeRefused)` jest wykonywane w stanie `work`. Pole `report.tribute_breaks` (`:957`) to kopia.

### 1d. `truce_pairs_changed` — ODRZUCAM (stosowane w miejscu)

- `turn_war_dipl_steps.rs:818-832`: wiersze `KEY_PAIR_META` są przepisywane w `war.opaque` (`:828-830`) przed dopisaniem do raportu. Skutek stanu jest w miejscu.

### 1e. `barbarian_grace` — PRZYJMUJĘ (realna luka, nie tylko raport)

Dowód:
- Komentarz pola `turn_war_dipl_steps.rs:132`: „do zastosowania przez wolajacego”. Pole jest wypełniane w `:581-584` (`recordBarbarianCooperationGrace`).
- Brak konsumenta w `rust-port/engine/src`: `git grep -i grace` daje tylko trafienia `karencja` w danych ekonomii i wiarygodności (`civilizations.rs:464-473`, `derived.rs:4338`, `economy_society.rs:105-112,610`). Żadnego pola stanu na karencję barbarzyńską w `PlayableState`.
- Pin: stan `barbarianCooperationGrace` jest zapisywany w `main.ts:22781` i `:24248`, czytany przez `hasAuthorizedBorderCrossing` (`main.ts:6020-6030`, `:41018-41026` — przekazanie do sprawdzenia przejścia granicą i sprawdzenia obecności w `:41024`). To wpływa na gameplay (przejście przez granicę, kary za granicę), nie tylko na raport.
- Wniosek: wpięcie `barbarian_grace` wymaga pola w stanie (np. `economy` albo `war`), zapisu w D4 oraz podania do sprawdzania przejścia granicą. To jest poza minimalnym wpięciem #106 — osobny temat (propozycja: R7K7C-BARB-GRACE, pkt 3).

Korekta do `01-operator-r1.md` pkt 3: dodać pozycję „barbarian_grace: pole stanu + zapis + konsument przejścia granicą (osobny temat)”.

Zarzut 1 ogólnie — stan końcowy: `city_resources` i `barbarian_grace` PRZYJĘTE (luka w liście zmian); `credibility_requests`, `tribute_breaks`, `truce_pairs_changed` ODRZUCONE (konsument/zapis w miejscu z podanymi liniami). Dodatkowo `expired_deals` (`:922`) jest zapisywane w miejscu: `work.diplomacy.expire_deals(turn_u)` (`:918`) — usunięcie umów jest w stanie `work`; pole raportu jest informacyjne.

---

## Zarzut 2 — przepływ Pracy to D3, nie D6; pula bez podłogi per krok — PRZYJMUJĘ

Potwierdzenie faktów z zarzutu:
- `tickDiplomacyPayments` (`diplomacy-economy.ts:78-124`) obsługuje wyłącznie złoto (`treasury.add`, `getPieniadze`). Pracy tam nie ma. Raport operatora (pkt 1, wiersz 2) mówił o D6 poprawnie tylko dla złota.
- Praca w pinie: `applyCyclicDeliveryOutcome` (`main.ts:23988`), gałąź `zaplataTyp === 'praca'` w `:24014-24016`: `setOwnerPracaPool(buyer, ownerPracaPool(buyer) - z)` i `setOwnerPracaPool(seller, ownerPracaPool(seller) + z)`. Drugie miejsce Pracy: `main.ts:24154` (sprawdzenie `buyerOk = ownerPracaPool(buyer) >= zaplata` przed dostawą). Oba w D3.
- `setOwnerPracaPool` (`main.ts:34879-34880`): `v = Math.max(0, value)`, czyli podłoga po KAŻDYM kroku.
- Rust: `apply_cyclic_outcome` (`turn_war_dipl_steps.rs:409-415`) zapisuje wartości NIEzmaksymalizowane: `ledger.praca.insert(buyer, b - z)` i `praca_delta -= z`. Podłoga jest dopiero w `apply_dipl_deltas_to_state` (`:1090-1093`), raz, na sumie delt.

Kontrprzykład (prześledzony na obu kodach, pula właściciela A = 5, A płaci 10 w umowie 1, A otrzymuje 10 w umowie 2):
- Pin: umowa 1: A = max(0, 5 − 10) = 0; umowa 2: A = 0 + 10 = 10. Wynik A = 10.
- Rust: umowa 1: ledger A = 5 − 10 = −5, `praca_delta[A] = −10`; umowa 2: ledger A = −5 + 10 = 5, `praca_delta[A] = −10 + 10 = 0`. `apply`: 5 + 0 = 5, podłoga bez efektu. Wynik A = 5. **Rozbieżność potwierdzona: pin 10, Rust 5.**

Poprawka (do wpięcia w temacie PARYTET/VEC-PRACA, nie w tym rozpoznaniu):
- W `Ledger` (ścieżka `Work`, `turn_war_dipl_steps.rs:409-415`) liczyć podłogę per operację i zapisywać REALNĄ zmianę:
  `let nb = (b - z).max(0.0); ledger.praca.insert(buyer, nb); *praca_delta[buyer] += nb - b;`
  analogicznie dla sprzedawcy `ns = s + z` (dodatnie, podłoga zbędna, ale symetrycznie `max(0.0)`).
- Po tej zmianie: umowa 1: delta A = 0 − 5 = −5; umowa 2: delta A = +10 → suma +5; `apply`: 5 + 5 = 10. Zgodne z pinem.
- Podłoga w `apply` (`:1090-1093`) zostaje jako obrona, ale staje się no-opem dla poprawnych delt.
- Wektory: rozszerzyć pin-generator o sekwencje wielu umów na jednej puli (zarzut dopuszcza taki zakres), bo obecne 203 wektory dotyczą skarbców, nie Pracy.

Korekta do `01-operator-r1.md` pkt 2–3: przepływ Pracy to D3 (`applyCyclicDeliveryOutcome`), a poprawka podłogi jest w `Ledger` (`:409-415`), nie tylko w `apply`.

---

## Zarzut 3 — „brak wpisu = 0” a mapowanie właściciela człowieka — PRZYJMUJĘ (uzupełnienie), z korektą

Fakty sprawdzone teraz:
- Pin: `ownerTreasury` (`main.ts:34864-34866`): człowiek → `playerStateByHuman.get(id)!.skarbiec` (wykrzyknik: brak wpisu = wyjątek), AI → `aiSkarbiecByOwner.get(id) ?? 0`. Analogicznie `ownerPracaPool` (`:34876-34878`): człowiek → `pracaPoolByHuman.get(id)!.praca`, AI → `?? 0`.
- Zapisy AI w pinie: `aiSkarbiecByOwner.set(ownerId, (get ?? 0) + delta)` (`main.ts:22642`). Gałąź człowieka: `playerStateByHuman.get(ownerId)!.skarbiec += delta` (`:22640`).
- Rust, człowiek: skarbiec z `state.economy.treasury` (`turn_war_inputs.rs:720-723`), w `apply` przez `state.players.iter().find(|p| p.is_human)` (`turn_war_dipl_steps.rs:100-104`). **Luka:** tylko PIERWSZY człowiek. Pin obsługuje wielu właścicieli-ludzi (`playerStateByHuman`, `pracaPoolByHuman`, HUMAN_OWNER_PRIMARY i fotele hotseat). Do zweryfikowania w #106, czy `PlayableState` może mieć wielu `is_human` (NIE_ZMIERZONO).
- Rust, Praca: `apply` nie rozróżnia człowieka i AI dla puli Pracy (`:1079`, wszystkie właścicielskie wpisy z `economy.praca_pool_by_owner`). Mapowanie człowieka do `praca_pool_by_owner` nie jest w producencie wyłączone (`turn_war_inputs.rs:738-740` przepisuje wszystkie wpisy). Czy produkcja w ogóle wstawia pulę człowieka do tej mapy: NIE_ZMIERZONO (`set_owner_praca_pool`, `playable.rs:920`, przyjmuje dowolnego właściciela; poza testami nie znaleziono producenta wpisów dla człowieka).
- Konflikt `HumanOwnerInAiTreasury` (`turn_war_inputs.rs:726-735`, błąd `:734`): dotyczy WYŁĄCZNIE mapy skarbców AI. Pin nie ma takiego konfliktu, bo skarbiec człowieka leży w `playerStateByHuman`, a nie w `aiSkarbiecByOwner` (`setOwnerTreasury` `:34869` rozdziela). Mapowanie zgodne, błąd jest poprawnie ograniczony do AI.

Argument za wariantem A (brak = 0), nowy dowód:
- Rust już ma precedens „brak wpisu = 0” dla tej samej puli Pracy w innym module: `diplomacy_basket.rs:143-157` (`.unwrap_or(0.0)` dla `from` i `to`, z komentarzem „Pin: praca = diplomacyPnPraca(qty)”). Wariant B (błąd) dla D-steps jest więc odstępstwem od sąsiedniego kodu zgodnego z pinem.
- Komentarze producenta (`turn_war_inputs.rs:712-714`, `:725`) i nagłówek modułu (`turn_war_dipl_steps.rs:43-45`, „BRAK CICHYCH ZER”) to świadoma decyzja portu, nie wynik pinu. Pin wprost daje 0 (`main.ts:22642`, `:34865`, `:34877`). Zgodnie z zasadą 9 odstępstwo od pinu wymaga pisemnej zgody właściciela w `REJESTR-RUST.md`.
- Rekomendacja pozostaje **A**. Zmieniamy uzasadnienie: nie „pin wprost daje 0” (to zostaje), ale również „Rust w `basket` już tak robi”.

Korekta do `01-operator-r1.md` pkt 1, wiersz 4 i pkt 4: dla człowieka pin czyta przez `get(id)!` (brak wpisu = wyjątek), dla AI przez `?? 0`. Wariant A dotyczy tylko AI. Dodać do zakresu #106: wielu ludzkich właścicieli w `apply` (`turn_war_dipl_steps.rs:100-104`).

---

## Zarzut 4 — `Co-Authored-By` z nazwą modelu w commicie operatora — PRZYJMUJĘ jako uwagę, BEZ zmiany SHA

- Commit `9be44a148` ma trailer `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`. Dispatch zabraniał nazwy modelu w treści, a trailer atrybucji wymaga polityki sesji (wytyczna atrybucji w kontekście sesji).
- Nie przepisuję historii commita `9be44a148` (SHA musi zostać stabilne dla orkiestratora). Rozstrzygnięcie należy do orkiestratora: albo akceptacja trailera jako polityki atrybucji, albo zmiana w commitach przyszłych rund.
- Treść tego dokumentu nie zawiera nazwy modelu poza trailerem commita.

---

## Zarzut 5 — bramki cargo nie uruchomione — ODRZUCAM

Dowód:
- Dispatch (`00-dispatch.md`, sekcja GOAL/RAPORT): „read-only”, „zero zmian w `rust-port/**`, `gra/**`, testach”, `TESTY: NIE DOTYCZY (read-only)`. Dispatch nie zlecał bramek cargo.
- `git show 9be44a148 --stat`: 2 pliki, +208, oba `.md` w `dyspozycje/`. Zero zmian kodu.
- `git diff --check 6acb1d81b 9be44a148`: bez błędów (potwierdzone teraz).
- Uruchomienie `cargo test` na dysku z 2,1 GB wolnego (stan z raportu) byłoby sprzeczne z progiem sprzątania (zasada 5/7 orkiestratora). Dla diffu bez kodu nie daje żadnej informacji.

---

## Zarzut 6 — dwie kopie raportu — ODRZUCAM jako defekt, PRZYJMUJĘ jako uwagę utrzymania

- Dispatch wprost wymienia obie ścieżki w allowliście: `dyspozycje/autobot/runs/<ID>/01-operator-r1.md` oraz `dyspozycje/rust-port/p6/<ID>.md` (NOWY). Dwie kopie są zamierzone.
- Uwaga utrzymania: poprawki z tej obrony (pkt 1–3 powyżej) trzeba nanieść w OBU kopiach, jeśli orkiestrator chce mieć spójny raport. Ten dokument nie zmienia żadnej z kopii, tylko je koryguje w osobnym pliku.

---

## Zmiany względem raportu operatora (zbiorcza korekta do pkt 3 `01-operator-r1.md`)

1. DODAĆ: zapis zapasów miast z `report.dipl.city_resources` do `economy.city_stock`, tylko zmienione wpisy (pkt 1a).
2. DODAĆ (osobny temat): `barbarian_grace` — pole stanu, zapis w D4, konsument w `hasAuthorizedBorderCrossing` (pkt 1e).
3. ZMIENIĆ: podłoga Pracy w `Ledger` (`turn_war_dipl_steps.rs:409-415`), nie tylko w `apply`; przepływ Pracy to D3 (zarzut 2).
4. DODAĆ do zakresu #106: wielu ludzkich właścicieli w `apply` (`turn_war_dipl_steps.rs:100-104`) i sprawdzenie, czy produkcja wstawia pulę człowieka do `praca_pool_by_owner` (zarzut 3, NIE_ZMIERZONO).
5. Bez zmian: rekomendacja A (brak = 0) dla AI, z dodatkowym uzasadnieniem z `diplomacy_basket.rs:143-157`.

## Propozycja tematów (korekta pkt 7)

| Temat | Zakres | Zależność | Rundy |
|---|---|---|---|
| R7K7C-WIRING-IMPL (#106) | `apply` w `run_diplomacy_war_phase` + zapis `city_stock` (tylko zmienione) + test sekwencji faz | ABC (pkt 5) przed startem; po #104 (ta sama funkcja `turn_war_dipl_steps.rs`) | 1–2 |
| R7K7C-PARYTET-BRAK-WPISU (tylko przy A) | brak = 0 dla AI w ledgerze i `apply`; korekta testu `apply_deltas_is_atomic_on_missing_owner` | przed #106 | 1 |
| R7K7C-PRACA-PODLOGA | podłoga per operacja w `Ledger` (`:409-415`) + wektor wielu umów na jednej puli | przed #106 lub razem z nim | 1 |
| R7K7C-VEC-PRACA | wektory pinu dla Pracy (D3, sekwencje) | niezależny od #106 | 1–2 |
| R7K7C-BARB-GRACE | pole stanu i konsument przejścia granicą | po decyzji właściciela (gameplay) | 2 |

## Niepewne (NIE_ZMIERZONO)

- Czy `PlayableState` może mieć wielu ludzkich właścicieli (hotseat) i czy `apply` musi ich obsługiwać.
- Czy produkcja wstawia pulę Pracy człowieka do `praca_pool_by_owner`.
- Czy brak wpisu w grze występuje (kod sprawdzony statycznie, gry nie uruchomiono).
- Efekt kolejności zapisu (koniec fazy vs inline) na D8 i fazę AI: wymaga testu sekwencyjnego przy wpięciu.
- Wyniki cargo: nie zmierzono (zakaz zmian kodu i dysk poniżej progu).

## Commit

Commit tylko tego dokumentu na gałęzi `wip/R-RUSTPORT-P6-R7K7C-WIRING-ROZPOZNANIE-Q1-obrona` (lokalnie, bez push). Trailer atrybucji wg polityki sesji.
