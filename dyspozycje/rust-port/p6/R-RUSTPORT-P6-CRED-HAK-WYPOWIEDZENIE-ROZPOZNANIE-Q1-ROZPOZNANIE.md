# R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 — rozpoznanie haka P4 dla wypowiedzenia gracza, sojuszu i klastra

Baza: `fc2ed160f` (czubek `origin/rust-port/parity-v2`). Pin (tylko odczyt): `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/*.ts`).
Zakres: wyłącznie czytanie kodu. Zero zmian w `rust-port/**`, `gra/**`, testach.
Legenda: NIE_ZMIERZONO = nie zweryfikowano w kodzie; brak = nie znaleziono w `rust-port/engine/src` ani `tests` (grep po nazwie i po odpowiedniku).

## 1. Miejsca wywołania `chargeWarDeclarationCredibility` w pinie → Rust

| # | Pin (plik:linia) | Ścieżka | Argumenty / opcje | Odpowiednik w Rust | Status |
|---|---|---|---|---|---|
| P1 | `main.ts:13168` (`playerDeclareWarOnOwner`, ME→owner) | wypowiedzenie gracza z UI | `(ME(), ownerId)`, bez opts; wynik `truceBreachPlayer` idzie do `zarejestrujWypowiedzenie` (`main.ts:13178`) | Brak komendy gracza: `EngineCommand` (`rust-port/engine/src/bridge.rs`) nie ma żadnego wariantu wojny/dyplomacji; brak `playerDeclareWarOnOwner`. Gracz w hamulcu jest wykluczony: `may_declare: !is_player(declarer)` (`src/domain/diplomacy_tick_war_brake.rs:338`). | **BRAK** (cała ścieżka gracza) |
| P2 | `main.ts:13205` (`ownerDeclareWarOn`, ogólne) | wypowiedzenie ogólne (ultimatum, odmowa negocjacji, rebelia z `force`) | `(attackerId, defenderId)`; wynik `truceBreachNow` | `declare_war` / `declare_war_opts` (`src/domain/diplomacy_truce_flow.rs:239-247`), **wołane tylko w testach** (`tests/p6_repin_rozejm_silnik.rs:223-282`). Produkcja nie wywołuje. | **CZĘŚCIOWO** (hak istnieje, niewpięty; brak N2 sojuszu/NAP, odwetu, P4) |
| P3 | `main.ts:23806` (`joinAllyToWar`) | obowiązek sojuszniczy: sojusznik wchodzi w wojnę | `(allyId, mustDeclareWarOn, {skipN2AllianceDefense: isDefensiveAllianceWarObligation(...)})` | Brak `joinAllyToWar` oraz `applyAllianceObligationsOnWar`/`breakTreatiesOnWar` jako funkcji produkcyjnych. Jest tylko czysta logika: `alliance_obligations_for_war_declaration` (`src/domain/alliance_war_obligation.rs:177`) i `is_defensive_alliance_war_obligation` (`:200`), bez wołających w produkcji (grep). | **BRAK** (wykonanie); czysta logika jest |
| P4 | `main.ts:40441` (klaster państw-miast → gracz, `hard`, rzut 60%) | wypowiedzenie klastra graczowi | `(csOwnerId, ME())`; wynik `truceBreachCluster` | Brak. Nie ma `resolveClusterCityStateWarOnPlayer` ani `isCityStateEligibleForPlayerWar` (pin `gra/src/game/city-state-difficulty.ts:95-133`; stałe `CITY_STATE_PLAYER_WAR_MIN_TURN=20`, `CITY_STATE_PLAYER_WAR_CHANCE=0.60`, `:82-83`). Grep `CITY_STATE_PLAYER_WAR` i logiki wojny klastra w `rust-port/engine/src`: brak trafień. | **BRAK** |
| P5 | `main.ts:41931` (wojna wymuszona epoki, AI) | wypowiedzenie wymuszone (`ironForceWarTargetId` itd.) | `(ownerId, targetId)`; wynik `truceBreachAi` | `war_turn_declare::declare_forced_wars` (`src/domain/war_turn_declare.rs:110-138`) wola TYLKO `note_war_declarations` (P4 zerowanie licznika, `:116`). NIE wola `declare_war_opts`: brak N1 (rozejm), N2 (kara), czyszczenia oferty, `breakTreatiesOnWar`, zmiany relacji. Wołający w produkcji: brak (tylko `tests/p6_cred_wojna_forced.rs`, `tests/p6_wire_war_declare_peace.rs`). | **CZĘŚCIOWO** (tylko P4) |

Uwagi do pinu (funkcje pomocnicze, część w innych modułach niż `main.ts`):
- `isCredibilityRetaliation` (`main.ts:12161-12168`): odwet; czyta `ostatniePrzewinienieWobecNas` i `wiarygodnoscOdwetOknoTur`. Rust: **brak logiki odwetu**; `skip_n2` jest tylko parametrem wołającego (`diplomacy_truce_flow.rs:244`). Pole `ostatniePrzewinienieWobecNas` nie jest zapisywane przez Rust (przechodzi tylko przez `extra`, `src/domain/diplomacy_truce.rs:16,92`). Stała `wiarygodnoscOdwetOknoTur` jest w danych (`src/data/civilizations.rs:486-487`), ale nieużyta w logice wojny.
- `isTruceWindowBreach` (`gra/src/game/diplomacy-peace-lock.ts:208-215`) = `isTruceBreach` (= `isTruceActive`, `:106-108`, `:87-90`: `currentTurn < until`) || `truceEndOffer != null`. Rust: `is_truce_window_breach` (`src/domain/diplomacy_truce_end.rs:63-72`) i `is_truce_active` (`src/domain/diplomacy_truce.rs:182-187`) są zgodne z tą definicją (zweryfikowane czytaniem obu stron). Ale `declare_war_opts` liczy okno inline (`diplomacy_truce_flow.rs:256`) zamiast wołać `is_truce_window_breach`: zachowanie równoważne, kod inny.
- `isDefensiveAllianceWarObligation` (`gra/src/game/diplomacy-treaties.ts:278-283`) = `mustDeclareWarOn === attackerId`. Rust: identycznie (`src/domain/alliance_war_obligation.rs:200-205`), bez wołającego w produkcji.

## 2. Zawartość haka `chargeWarDeclarationCredibility` (pin `main.ts:12176-12225`) vs Rust `declare_war_opts` (`diplomacy_truce_flow.rs:247-272`)

| Krok pinu | Pin | Rust `declare_war_opts` | Status |
|---|---|---|---|
| Guard barbarzyńcy | `:12177` `isBarbarian` → `return false` | `:252-254` `barbarians.contains` → `return false` | zgodne |
| Odwet `skipN2` | `:12178` `isCredibilityRetaliation` | brak; `skip_n2` od wołającego | **BRAK** odwetu |
| Okno rozejmu (N1) | `:12188` `isTruceWindowBreach` | `:256` inline `is_truce_active \|\| truce_end_offer.is_some()` | zgodne (inline) |
| N2 sojusz | `:12191-12196` `hasAlliance` → `zlamanie_paktu_sojusz` (`wiarygodnoscN2ZlamaniePaktuSojusz`) | **BRAK gałęzi** (brak sprawdzenia `activeDeals` ani zdarzenia `zlamanie_paktu_sojusz`) | **BRAK** |
| N2 NAP | `:12197-12198` `hasNap` → `zlamanie_paktu_nap` (`wiarygodnoscN2ZlamaniePaktuNap`) | **BRAK gałęzi** | **BRAK** |
| N2 złamanie rozejmu | `:12200-12202` `truceBreach` → `zlamanie_paktu_nap` | `:259-261` push `CREDIBILITY_EVENT_TRUCE_BREACH` (`zlamanie_paktu_nap`) | zgodne (jedyna gałąź N2 obecna) |
| Czyszczenie oferty | `:12206` `clearTruceEndOffer` | `:263` `clear_truce_end_offer_core` | zgodne |
| Zerwanie rozejmu / ustawienie wojny | `:12207-12216` (`truceUntilTurn`, `truceInitiatorId`, `wojnaOdTury`, `n1Zastosowany:false`) | `:264-270` | zgodne |
| Zapis `ostatniePrzewinienieWobecNas` (gdy nie odwet) | `:12217-12222` | **BRAK** | **BRAK** |
| P4 zerowanie licznika obu stron | `:12223-12224` `wiarygodnoscOstatniaWojnaTuraByOwner.set` | **BRAK w `declare_war_opts`**. Jest tylko w `note_war_declarations` / `note_war_entered` (`credibility.rs:855`), wołanych z pipeline (`turn_war_pipeline.rs:422`) | **BRAK** w tej ścieżce |
| Zwrot | `:12225` `truceBreach` | `:271` `breach` | zgodne |

Wniosek: w Rust hak P4 jest wpięty tylko na ścieżce hamulca (`note_war_declarations`, `turn_war_dipl_steps.rs:876-897`, wołane z `turn_war_pipeline.rs:422`). Pełny hak pinu (N2 sojusz/NAP, odwet, zapis ostatniego przewinienia, P4 przy wypowiedzeniu) nie istnieje w produkcji.

## 3. Brakujące elementy (komendy, stan, hooki) z plik:linia

Komendy / wejścia:
- Brak wariantu `EngineCommand` dla wypowiedzenia wojny przez gracza (`rust-port/engine/src/bridge.rs`: grep po `war`, `declar`, `diplo` bez trafień). Brak odpowiednika `playerDeclareWarOnOwner` (`main.ts:13158-13183`): `isPeaceLockedBetween` (`:13160`), `playerDiplomacyActionAllowed(layer,'war')` (`:13166`), `breakTreatiesOnWar(ME(),...)` (`:13169`), `applyAllianceObligationsOnWar` (`:13170`), `applyDiploEventTracked('wojna_wypowiedziana')` (`:13172`), `zarejestrujWypowiedzenie` z `przyczynaWypowiedzenia` (`:13178`; w Rust `przyczyna_wypowiedzenia` istnieje: `src/domain/diplomacy_aggressor.rs:104`, ale bez wołającego dla gracza), `pruneTributeNegotiationsBetween` (`:13179`), `recordWarDeclarationEvent` (`:13180`), `pruneInvalidNegotiations` (`:13181`).
- Brak produkcyjnych `breakTreatiesOnWar` i `applyAllianceObligationsOnWar` (pin `main.ts:23688`, `:23867`). Rust ma tylko czyste funkcje: `treaties_broken_by_war` (`src/domain/alliance_war_obligation.rs:251`), `alliance_obligations` (`:124`).
- Brak `joinAllyToWar` (pin `main.ts:23799-23816`) z `zarejestrujWypowiedzenie(allyId,turn,'wymuszona_inna')` (`:23813`) i `appendWiarygodnoscEvent(...'pomoc_sojusznikowi_realna')` (`:23815`).
- Brak logiki klastra: `resolveClusterCityStateWarOnPlayer` (pin `city-state-difficulty.ts:116-134`), `isCityStateEligibleForPlayerWar` (`:95-108`), zbieranie `clusterWarMembers` (pin `main.ts:40406-40429`), guard `interCivWarBlockedForAi` (`:40437`). Rust: brak odpowiedników.
- Brak `isCredibilityRetaliation` i `credibilityEventOpensOdwet` (pin `main.ts:12148-12168`) w Rust.

Stan:
- `ostatniePrzewinienieWobecNas` (typ `wypowiedzenie_wojny_bez_ostrzezenia`, pin `main.ts:12218-12221`): Rust nie zapisuje (tylko `extra` w `diplomacy_truce.rs`).
- P4 przy wypowiedzeniu: `wiarygodnoscOstatniaWojnaTuraByOwner` (pin `main.ts:12223-12224`) nie jest ustawiane w `declare_war_opts`.
- `zlamanie_paktu_sojusz`: w Rust brak ścieżki zapisu zdarzenia (klucz tylko w `credibility.rs:246`).

Hooki:
- `declare_forced_wars` nie ma wołającego w produkcji (grep: tylko testy). Pin `main.ts:41931` w Rust nie ma wpiętego odpowiednika N1/N2 (`declare_war_opts` też nie ma wołającego w produkcji).

Dług jawny (już w kodzie): `turn_war_dipl_steps.rs:24-29` oznacza ścieżki alians/klaster jako NIE_ZMIERZONO; `siege_transfer.rs:84` i `siege_transfer_effects.rs:198` oznaczają brak `force`/powodu `wymuszona_inna` w `declare_war_opts`.

## 4. Propozycja podziału na tematy wykonawcze (zależności)

| Temat | Zakres | Zależy od | Szacunek rund | Uwagi |
|---|---|---|---|---|
| **T1** CRED-HAK-DECLARE-OPTS | `declare_war_opts`: gałęzie N2 sojusz (`zlamanie_paktu_sojusz`) i NAP (`zlamanie_paktu_nap`) z `active_deals`; odwet (`isCredibilityRetaliation` + `wiarygodnoscOdwetOknoTur`); zapis `ostatniePrzewinienieWobecNas`; P4 `note_war_entered` przy wypowiedzeniu. Wektory z pinu: istniejący `tests/p6_cred_wojna_vectors_r2.rs` ma `fragSha256.chargeWarDeclarationCredibility` (`:96`). | brak | 2 | Testy: `p6_repin_rozejm_silnik.rs`, `p6_cred_wojna_vectors*.rs`. |
| **T2** CRED-HAK-FORCED-WPIECIE | `declare_forced_wars` (`war_turn_declare.rs:110`) wola pełny hak (wg T1) zamiast samego P4; wpięcie wojny wymuszonej (pin `main.ts:41931`). | T1; decyzja o wpięciu wojny wymuszonej w produkcji | 1-2 | Dziś `declare_forced_wars` wołane tylko w testach; bez wpięcia zmiana nie działa w grze. |
| **T3** CRED-HAK-PLAYER-DECLARE | Komenda gracza `DeclareWar` w `EngineCommand` + port `playerDeclareWarOnOwner` (P1), z `zarejestrujWypowiedzenie` i `przyczynaWypowiedzenia`. | T1; **pytanie ABC**: format komendy gracza (bridge/UI) | 2-3 | Konsument `EngineCommand` po stronie web/Rust: NIE_ZMIERZONO. |
| **T4** CRED-HAK-ALLIANCE-JOIN | `joinAllyToWar` (P3) + produkcyjne `applyAllianceObligationsOnWar` / `breakTreatiesOnWar`; `skipN2` z `is_defensive_alliance_war_obligation`. | T1, T3 (wspólne `breakTreatiesOnWar`) | 3 | Największy zakres; wymaga portu odmów AI (`aiHonorsAllianceWarObligation`, pin `main.ts:23830-23860`): NIE_ZMIERZONO w Rust. |
| **T5** CRED-HAK-CLUSTER | `resolveClusterCityStateWarOnPlayer` + `isCityStateEligibleForPlayerWar` + pętla klastra (P4) w ticku AI. | T1; **pytanie ABC**: czy wojna klastra graczowi (C-025/C-026) wchodzi w zakres Rust teraz | 2-3 | Pętla klastrów PM w Rust: NIE_ZMIERZONO (nie szukano w całym `src`). |

Równoległość: T1 najpierw; po nim T2, T3 i T5 mogą iść równolegle (różne pliki); T4 po T3.

## 5. Ograniczenia tego rozpoznania (NIE_ZMIERZONO)
- Nie uruchomiono testów ani `cargo` (dispatch: rozpoznanie bez zmian kodu; TESTY: NIE DOTYCZY).
- Nie czytano całego `main.ts` pod kątem innych wywołań `ownerDeclareWarOn`; ograniczono się do linii z dispatchu i wyników grep.
- Ścieżka wojny z `triggerRebelProtectionWarConsequence`: w Rust `rebel_war_request` (`src/domain/siege_transfer.rs:76-78, 281-282`), wykonanie po stronie wołającego; wykonanie w produkcji: NIE_ZMIERZONO.
- Zgodność `aiHonorsAllianceWarObligation` i `interCivWarBlockedForAi` z Rust: NIE_ZMIERZONO.
