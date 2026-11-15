# 01-rozpoznanie — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: wypowiedzenie wojny przez gracza i zerwanie traktatu — rozpoznanie parytetu web ↔ Rust (CRED-HAK, zadanie #120/#171).
GOAL: mapa 1:1 ścieżki gracza z webu (pin `07d2fbd72`) do Rust dla `playerDeclareWarOnOwner`, `breakTreatyVoluntarily`, `breakTreatiesOnWar`, z oznaczeniem BRAK tam, gdzie brak odpowiednika.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/01-rozpoznanie.md`). Zero zmian w `gra/`, `rust-port/engine/`, `rust-port/renderer/`. Zero buildu, zero cargo/npm.
TESTY: NIE_DOTYCZY (tryb wyłącznie odczytu, zgodnie z dispatchem). Dowody: `git show` / `git grep` na pinie `07d2fbd72` (web) i na `a01363d5f` (origin/rust-port/parity-v2).
BLOKADY: brak blokad technicznych. Patrz §5 (NIE_ZMIERZONO).
RUNDY: 1/5
NASTĘPNY KROK: dispatch wdrożeniowy CRED-HAK-WYPOWIEDZENIE-IMPL (#171) wg listy BRAKÓW w §2; ZLOZA-WIRING-IMPL (#172) równolegle, jeśli dotyczy wyłącznie `zloze_grants`.
DEPLOY/PUSH: NIE WYKONANO (dispatch: bez push na parity-v2, bez integracji).

## 0. Baza i zastrzeżenia procesowe

- Baza porównania Rust: `origin/rust-port/parity-v2` = `a01363d5f` (fetch OK). Wszystkie odczyty Rust: `git show a01363d5f:...` / `git grep ... a01363d5f`.
- Pin web: `07d2fbd72` (obiekt istnieje, odczyt `gra/src/main.ts` OK).
- Kontrola dispatchu `git merge-base --is-ancestor a01363d5f HEAD`: WYNIK NEGATYWNY. HEAD worktree to `807ecebdd` (gałąź roboczej sesji), nie jest potomkiem `a01363d5f`. Nie integrowano ani nie przestawiano bazy (zakaz read-only). Ten commit jest tylko raportem; ancestry do integracji trzeba sprawdzić przy wdrożeniu.
- Korekta dispatchu: na liście „znanych BRAKÓW” pozycja `chargeWarDeclarationCredibility` NIE jest brakiem całkowitym — istnieje częściowy odpowiednik `declare_war_opts` (patrz §1, wiersz A4). Pozostałe pozycje z listy zweryfikowane (0 trafień nazwy w `rust-port/engine/src` i `rust-port/renderer`).
- Zgodnie z CLAUDE.md zasada 11: web czytany pierwszy; Rust potem.

## 1. Tabela: krok webu → odpowiednik Rust

Legenda: OK = odpowiednik 1:1 (domena); CZĘŚCIOWO = odpowiednik części; BRAK = brak; UI = efekt interfejsu, poza silnikiem.

### A. `playerDeclareWarOnOwner(ownerId)` — web `gra/src/main.ts:13152–13186`

| # | Krok webu (plik:linia) | Rust (plik:linia) | Status / różnica |
|---|---|---|---|
| A1 | `isPeaceLockedBetween(ME, ownerId)` → hint + `return false` (main.ts:13153–13156; funkcja main.ts:11817) | `is_peace_locked_between` — `domain/brake_inputs.rs:35` (czysta fn). Produkcyjny wołający: tylko `peace_locked_set` (`brake_inputs.rs:54`, używany przez `turn_war_pipeline.rs:325` dla ścieżki AI). Brak wejścia gracza. | CZĘŚCIOWO. Brak guardu gracza z efektem (hint + false). |
| A2 | `diplomacyLayerForOwner(ownerId, simplifiedOwners, foreignTypeOwners, getDiplomaticContacts())` (main.ts:13158; web `gra/src/game/diplomacy-layers.ts:272`) | BRAK (0 trafień nazwy/snake_case w `rust-port/engine/src`). Pomocnicze: `contacts_for` (`brake_inputs.rs:174`) to tylko lista kontaktów z odkrytych, bez warstwy pre_contact/simplified/full. | BRAK. |
| A3 | `playerDiplomacyActionAllowed(layer, 'war')` → hint + `return false` (main.ts:13160–13163; web `diplomacy-layers.ts:399`) | BRAK (0 trafień). | BRAK. |
| A4 | `chargeWarDeclarationCredibility(ME, ownerId)` (main.ts:13164; web main.ts:12176–12225) | CZĘŚCIOWO: `DiplomacyTruce::declare_war_opts` — `domain/diplomacy_truce_flow.rs:247`; `declare_war` :239 (wrapper, skip_n2=false). Zrobione: barbarzyńca → brak efektu (:249–251); okno rozejmu/oferty → zdarzenie `CREDIBILITY_EVENT_TRUCE_BREACH` (`diplomacy_truce_flow.rs:43` = `"zlamanie_paktu_nap"`, zgodne z N2 webu) gdy `!skip_n2` (:257–262); `clear_truce_end_offer_core`; zerowanie `truce_until_turn`/`truce_initiator_id`; `wojna_od_tury`; `n1_zastosowany=false`; relacja `DeclareWar`; zwrot `breach` (= `truceBreach`). BRAK: (a) N2 `zlamanie_paktu_sojusz` / `zlamanie_paktu_nap` z umowy sojuszu/NAP (web main.ts:12185–12193); (b) `ostatniePrzewinienieWobecNas` (web main.ts:12213–12218); (c) P4 — zerowanie licznika „bez wojny” OBU stron (`wiarygodnoscOstatniaWojnaTuraByOwner`, web main.ts:12222–12223) — w Rust `CredibilityRegistry::note_war_entered` (`domain/credibility.rs:855`) jest wołane tylko z `turn_war_dipl_steps.rs:898` i `war_turn_declare::declare_forced_wars`, NIE z `declare_war_opts`; (d) `isCredibilityRetaliation` → `skip_n2` przychodzi jako parametr, brak wyliczenia po stronie gracza (NIE_ZMIERZONO, patrz §5). **Uwaga: `declare_war_opts` i `declare_war` nie mają wołających w produkcji (tylko definicje i testy).** | CZĘŚCIOWO (najważniejsza luka CRED-HAK). |
| A5 | `breakTreatiesOnWar(ME, ownerId, true)` (main.ts:13169; web main.ts:23688) | `DiplomacyState::break_treaties_on_war` — `domain/diplomacy.rs:1690` (część domenowa, zgodna kolejnością: suspend → `treaties_broken_by_war` → retain → deactivate). Brak wołających w produkcji. Penalty/event — patrz B-tabela C1–C4. | CZĘŚCIOWO (domena OK, kara BRAK). |
| A6 | `applyAllianceObligationsOnWar(ME, ownerId)` (main.ts:13170; web main.ts:23867) | BRAK wpięcia. Czyste składniki istnieją: `alliance_obligations_for_war_declaration` — `domain/alliance_war_obligation.rs:177` (0 wołających w produkcji); `should_honor_alliance_war_obligation` — `alliance_war_obligation.rs:59`; `is_defensive_alliance_war_obligation` — `:200`; `treaties_broken_by_refusal` — `:208`. Brak: `filterAllianceObligationsRespectingPeaceLock`, `buildAllianceWarObligationCtx`, `joinAllyToWar`, `finalizeAllianceObligationRefusals`, `interCivWarBlockedForAi`. | BRAK (wpięcie). |
| A7 | `setDiploRelation(ME, ownerId, applyDiploEventTracked(ME, ownerId, getDiploRelation(...), 'wojna_wypowiedziana'))` (main.ts:13171–13175; `setDiploRelation` main.ts:11396; `applyDiploEventTracked` main.ts:12310) | `apply_diplomatic_event(relation, DiplomaticEvent::DeclareWar)` — `domain/diplomacy.rs:617` (sygnatura `(relation, event)`, bez `wiarygodnosc`), wariant `DeclareWar` — `diplomacy.rs:544–545`; `set_relation` (DiplomacyState). Brak: `applyDiploEventTracked` (modyfikator wiarygodności gracza gdy stan≠wojna, `recordDiploFactor` dla zaufania/respektu). Brak wywołań `recordDiploFactor` w Rust (0 trafień). | CZĘŚCIOWO (zdarzenie OK, tracking BRAK). |
| A8 | `zarejestrujWypowiedzenie(ME, turn, przyczynaWypowiedzenia({ zlamanieRozejmu: truceBreachPlayer, casusBelliAktywny: maCasusBelliAktywne(ME, ownerId, turn) }))` (main.ts:13177; web `diplomacy.ts:1899`, `:2017`, `:2022`) | `przyczyna_wypowiedzenia` — `domain/diplomacy_aggressor.rs:104` (OK, czysta fn, ten sam priorytet); `ma_casus_belli_aktywne` — `diplomacy_aggressor.rs:304` (metoda; czysta `ma_casus_belli` :241); `zarejestruj_wypowiedzenie` — `diplomacy_aggressor.rs:309`. **Wołających w produkcji: 0** (tylko definicje). | BRAK wywołania (funkcje gotowe). |
| A9 | `pruneTributeNegotiationsBetween(ME, ownerId)` (main.ts:13179; web main.ts:24481) | BRAK (0 trafień nazwy). Odpowiednik struktury `negotiationTable` (wpisy `trybut_zadanie`/`trybut_oferta`) — NIE_ZMIERZONO (nie zlokalizowano). | BRAK. |
| A10 | `recordWarDeclarationEvent(ME, ownerId)` (main.ts:13180; web main.ts:10753) | BRAK (0 trafień nazwy). Odpowiednik `warEventLog` — NIE_ZMIERZONO. | BRAK. |
| A11 | `pruneInvalidNegotiations()` (main.ts:13181; web main.ts:20315) | BRAK (0 trafień nazwy). Odpowiednik `negotiationStillValid` — NIE_ZMIERZONO. | BRAK. |
| A12 | `showHintMessage`, `updateDiplomacyAudience`, `updateDiplomacyPanel`, `updateHud`, `wireUnitRendererRingStance` (main.ts:13182–13185) | — | UI (poza silnikiem). |
| A13 | Brak wejścia gracza w silniku: w `rust-port/engine/src/bridge.rs` (grep `diplo|war|treaty|peace` — 0 trafień) nie ma komendy wypowiedzenia wojny ani zerwania traktatu. | — | BRAK (komenda EngineCommand). |

Różnica strukturalna do odnotowania: web `ownerDeclareWarOn` (main.ts:13197) — wersja AI/ogólna — NIE ma guardu hint i ma `force`; `playerDeclareWarOnOwner` ma guard z hintem i nie ma `force`. Rust nie rozróżnia obu (brak obu ścieżek w produkcji).

### B. `breakTreatyVoluntarily(dealId, initiatorOwnerId = 0)` — web `gra/src/main.ts:22741–22803`

| # | Krok webu (plik:linia) | Rust (plik:linia) | Status / różnica |
|---|---|---|---|
| B1 | `activeDeals.find(d => d.id === dealId)`; `if (!deal) return;` (main.ts:22742) | `DiplomacyState::break_treaty_voluntarily` — `domain/diplomacy.rs:1708` (`deals.iter().find(...)?` → `None`) | OK. |
| B2 | `wasAlliance`, `isTrade` (normalizeTreatyKind) (main.ts:22743–22747) | `TreatyKind::TradeRoute \| Exchange` w `trade_treaty_break_penalty_free` — `diplomacy.rs:4300` (`is_trade`); `wasAlliance` nie ma odpowiednika (BRAK; potrzebne do kroku B8). | CZĘŚCIOWO. |
| B3 | `otherOwnerId0 = a === initiatorOwnerId ? b : a` (main.ts:22748) | BRAK (Rust nie ma `initiator`; `break_treaty_voluntarily(deal_id, turn)` — brak parametru inicjatora). | BRAK. |
| B4 | `voluntaryTreatyBreakPlan(deal, turn)` → `{penaltyFree, openN3Window, n5Charged}` (main.ts:22755; web `diplomacy-penalty-preview.ts:192–200`: `openN3Window = !penaltyFree && wygasaTura===null`, `n5Charged = !penaltyFree && wygasaTura!==null`) | `voluntary_treaty_break_plan` — `domain/diplomacy.rs:4336–4342` — ta sama formuła (`open_n3_window: !penalty_free && expires_turn.is_none()`, `n5_charged: !penalty_free && expires_turn.is_some()`). Wywołanie: tylko z `break_treaty_voluntarily` (`diplomacy.rs:1714`). | OK (formuła zgodna). `penaltyFree` przez `trade_treaty_break_penalty_free` (`diplomacy.rs:4326`, próg 10 tur: `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS`, `diplomacy.rs:4319`). |
| B5 | `if (breakPlan.openN3Window)` → `setDiploPairMeta(... n3Window: {turn, typ:'bezterminowe', byOwnerId, charged:false})` (main.ts:22762–22767) | BRAK zapisu okna N3 w `break_treaty_voluntarily` (doc `diplomacy.rs:1714–1716`: „Poza zakresem (etap a)”). Typ `N3Window` istnieje: `domain/diplomacy_truce.rs:37–49` (nieużywany tu). | BRAK. |
| B6 | `else if (breakPlan.n5Charged)` → `appendWiarygodnoscEvent(initiator, 'zerwanie_dobrowolne_handel'\|'zerwanie_dobrowolne_traktat', N5 value)` (main.ts:22768–22777) | BRAK (doc `diplomacy.rs:1716`: „`appendWiarygodnoscEvent` (N5)” poza zakresem). | BRAK. |
| B7 | `removeTreatiesById(activeDeals, [dealId])`; `zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, dealId)` (main.ts:22780–22781) | `self.deals.retain(|d| d.id != deal_id)` + `deactivate_zloze_grants_for_deal` (`diplomacy.rs:1716–1717`; funkcja `diplomacy.rs:4292`) | OK (wiring produkcyjny: BRAK wołającego). |
| B8 | Karencja WspolnaWalkaBarbarzyncy: `recordBarbarianCooperationGrace(...)` gdy `rodzaj === WspolnaWalkaBarbarzyncy` lub `wspolnaWalkaBarbarzyncy === true` (main.ts:22785–22789; web `diplomacy-treaties.ts:104`) | BRAK. Typ traktatu istnieje (`TreatyKind::BarbarianCooperation`, `diplomacy.rs:1412`, `:1497`, `:1556`), brak odpowiednika `recordBarbarianCooperationGrace` i pola `barbarianCooperationGrace` (0 trafień). | BRAK. |
| B9 | Wybór zdarzenia: `penaltyFree ? 'zerwanie_handlu_bez_kary' : isTrade ? 'zerwanie_handlu' : 'zerwanie_traktatu'` (main.ts:22786–22788) | Warianty `zerwanie_handlu` (`diplomacy.rs:586`), `zerwanie_traktatu` (`diplomacy.rs:588`) istnieją w `DiplomaticEvent`. **Brak wariantu `zerwanie_handlu_bez_kary`** w enumie Rust (web: `diplomacy.ts:891`, `:1075`). | BRAK (wariant zdarzenia + gałąź bez kary). |
| B10 | `applyDiploEventTracked(a, b, cur, ev)` (main.ts:22790) | `apply_diplomatic_event` `diplomacy.rs:617` (bez wiarygodności, bez `recordDiploFactor`). | CZĘŚCIOWO (jak A7). |
| B11 | Fallback `wasAlliance && next.status === 'sojusz'` i brak innego sojuszu → `status = 'pokoj'` (main.ts:22791–22794) | BRAK. | BRAK. |
| B12 | `setDiploRelation(a, b, next)` (main.ts:22795) | BRAK w `break_treaty_voluntarily` (funkcja domenowa nie zapisuje relacji). | BRAK (wiring). |
| B13 | `showHintMessage`, `updateDiplomacyAudience`, `updateDiplomacyPanel`, `updateHud` (main.ts:22797–22801) | — | UI. |
| B14 | Wołający w produkcji: web — przycisk gracza `onBreakTreaty` (main.ts:25579), `breakAllianceDeal` (main.ts:24774). W Rust: **0 wołających** (`break_treaty_voluntarily` tylko definicja). | — | BRAK (wiring + komenda gracza). |

### C. `breakTreatiesOnWar(a, b, breakerIsPlayer, opts?: {bezKary?})` — web `gra/src/main.ts:23688–23702`

| # | Krok webu (plik:linia) | Rust (plik:linia) | Status / różnica |
|---|---|---|---|
| C1 | `suspendZlozeOnWar(a, b)` (main.ts:23689; wrapper main.ts:12706–12712 — wywołuje `suspendZlozeGrantsForWar` + hint) | `DiplomacyState::suspend_zloze_grants_for_war` — `diplomacy.rs:1671` → `suspend_zloze_grants_for_war` `diplomacy.rs:4272` (OK). Hint: UI. | OK (domena). |
| C2 | `treatiesBrokenByWar(activeDeals, a, b)`; `if (!brokenIds.length) return;` (main.ts:23690–23691) | `treaties_broken_by_war` — `domain/alliance_war_obligation.rs:251`; wywołanie `diplomacy.rs:1692`; pusta lista → `return` (`diplomacy.rs:1693–1695`). | OK. |
| C3 | `activeDeals = removeTreatiesById(activeDeals, brokenIds)`; `zlozeGrants = deactivateZlozeGrantsForDeal(...)` per id (main.ts:23692–23695) | `retain` + `deactivate_zloze_grants_for_deal` per id (`diplomacy.rs:1696–1699`). | OK. |
| C4 | `if (opts?.bezKary) return;` — wojna z progu/casus belli: traktaty znikają bez zdarzenia kary (main.ts:23697) | BRAK (`break_treaties_on_war(&mut self, a, b)` nie ma parametru `bezKary`/`breakerIsPlayer`). Wołający web z `bezKary: true`: main.ts:11705 (`breakTreatiesOnWar(declarer, victim, isMe(declarer), { bezKary: true })`). | BRAK. |
| C5 | `ev = breakerIsPlayer ? 'zlamana_obietnica' : 'zlamana_obietnica_ai'`; `setDiploRelation(a, b, applyDiploEventTracked(a, b, cur, ev))` (main.ts:23698–23700) | Warianty: `BrokenPromiseByPlayer` (`diplomacy.rs:552`, serde `zlamana_obietnica`), `BrokenPromiseByAi` (`diplomacy.rs:554`). Zastosowanie w produkcji: BRAK. | BRAK (kara zerwania wymuszonego). |
| C6 | Wołający web (wiedza kontekstowa): `playerDeclareWarOnOwner` (main.ts:13169, `breakerIsPlayer=true`), `ownerDeclareWarOn` (main.ts:13207, `isMe(attackerId)`), `joinAllyToWar` (main.ts:23809), wymuszona wojna (main.ts:40442, :41932), `triggerRebelProtectionWarConsequence` (main.ts:28493 komentarz). W Rust: **0 wołających** w produkcji. | — | BRAK (wiring). |

## 2. Lista BRAKÓW z rekomendowanym zakresem dispatchu wdrożeniowego

Kolejność wg zależności. Pliki w allowliście silnika (`rust-port/engine/src/domain/…`), wskazane poniżej. Zakres NIE obejmuje UI.

1. **Komenda wypowiedzenia wojny przez gracza (wejście)** — BRAK w `bridge.rs` (A13). Dodać komendę `PlayerDeclareWar{owner}` i wejście `player_declare_war` w domenie, z bramkami w kolejności webu: A1 (pokój) → A2 (`diplomacyLayerForOwner`) → A3 (`playerDiplomacyActionAllowed`). Pliki: `rust-port/engine/src/bridge.rs`, nowe/istniejące moduły domeny.
2. **Port warstw dyplomacji** — `diplomacyLayerForOwner` (web `diplomacy-layers.ts:272`) i `playerDiplomacyActionAllowed` (web `diplomacy-layers.ts:399`). Czyste funkcje; wejścia: `contacts_for` (`brake_inputs.rs:174`) + zbiory `simplifiedOwners`/`foreignTypeOwners`. Parytet: wektory z pinu. **Najpierw**, bo bramka A1–A3 blokuje resztę.
3. **Hak P4 i N2 w ścieżce gracza** — w `declare_war_opts` (`diplomacy_truce_flow.rs:247`) lub wrapperze gracza: (a) N2 `zlamanie_paktu_sojusz` / `zlamanie_paktu_nap` przy istniejącym sojuszu/NAP (web main.ts:12185–12193); (b) `ostatniePrzewinienieWobecNas` (web main.ts:12213–12218); (c) `CredibilityRegistry::note_war_entered` dla OBU stron (credibility.rs:855, zob. A4c). Weryfikacja: `CREDIBILITY_EVENT_TRUCE_BREACH` = `zlamanie_paktu_nap` (zgodne z N2) — potwierdzone.
4. **Zapis wywołania `chargeWarDeclarationCredibility` → `breakTreatiesOnWar` → `applyAllianceObligationsOnWar` → `setDiploRelation` → `zarejestrujWypowiedzenie` w jednej kolejności** (A4–A8). Wszystkie czyste elementy istnieją, brak wiązania (`przyczyna_wypowiedzenia` `diplomacy_aggressor.rs:104`, `zarejestruj_wypowiedzenie` :309, `ma_casus_belli_aktywne` :304 — 0 wołających).
5. **Kara zerwania wymuszonego** — `breakTreatiesOnWar` z parametrami `breakerIsPlayer` i `bezKary` (C4–C5): rozszerzyć `break_treaties_on_war` (`diplomacy.rs:1690`) o parametry i gałąź `zlamana_obietnica`/`_ai` przez `apply_diplomatic_event`. Wymaga rozszerzenia `apply_diplomatic_event` o modyfikator wiarygodności i tracking (`applyDiploEventTracked`, web main.ts:12310) — BRAK.
6. **`applyAllianceObligationsOnWar`** (A6) — największy element: wpięcie `alliance_obligations_for_war_declaration` (`alliance_war_obligation.rs:177`) z filtrem pokoju, kontekstem obowiązku (`buildAllianceWarObligationCtx`, web main.ts:23830–23850 — NIE_ZMIERZONO w pełnym zakresie), `joinAllyToWar` (web main.ts:23803–23814) i `interCivWarBlockedForAi`. Może być osobnym dispatchem (zależne od `ai_sojusz_obowiazek_*` parametrów).
7. **Porządki po wojnie gracza** — `pruneTributeNegotiationsBetween` (A9), `recordWarDeclarationEvent` (A10), `pruneInvalidNegotiations` (A11): BRAK nazw; odpowiedniki tabel `negotiationTable` i `warEventLog` NIE_ZMIERZONO (patrz §5). Dotykają stanu zapisu — wymagają decyzji zakresu przed wdrożeniem.
8. **`breakTreatyVoluntarily` — ścieżka domenowa** (B2–B12): (a) inicjator (B3, parametr `initiatorOwnerId`); (b) zapis okna N3 (B5, typ `N3Window` `diplomacy_truce.rs:47`); (c) N5 `zerwanie_dobrowolne_handel`/`_traktat` (B6); (d) wariant zdarzenia `zerwanie_handlu_bez_kary` (B9, web `diplomacy.ts:891`, `:1075`) i gałąź bez kary; (e) karencja WspolnaWalkaBarbarzyncy (B8); (f) fallback `pokoj` (B11); (g) `setDiploRelation` (B12). Zapis relacji i wiring komendy gracza: BRAK.
9. **Wiring produkcyjny** — `break_treaty_voluntarily`, `break_treaties_on_war`, `zarejestruj_wypowiedzenie`, `przyczyna_wypowiedzenia`, `ma_casus_belli_aktywne`, `alliance_obligations_for_war_declaration`, `declare_war_opts`, `declare_war`: wszystkie mają 0 wołających w produkcji (sprawdzono `git grep` bez testów).

Istniejące w Rust (dispatch „Obecne”) — potwierdzone: `break_treaties_on_war` (diplomacy.rs:1690), `break_treaty_voluntarily` (diplomacy.rs:1708), `voluntary_treaty_break_plan` (diplomacy.rs:4336), `zarejestruj_wypowiedzenie` (diplomacy_aggressor.rs:309), `przyczyna_wypowiedzenia` (diplomacy_aggressor.rs:104), `ma_casus_belli_aktywne` (diplomacy_aggressor.rs:304). Wszystkie to definicje bez wołających w produkcji (patrz pkt 9).

## 3. Zweryfikowane pozycje z listy znanych BRAKÓW (dispatch)

| Nazwa (web) | Wynik w Rust | Status |
|---|---|---|
| `diplomacyLayerForOwner` | 0 trafień (`rust-port/engine/src`, `rust-port/renderer`) | BRAK potwierdzony |
| `playerDiplomacyActionAllowed` | 0 trafień | BRAK potwierdzony |
| `chargeWarDeclarationCredibility` | częściowy: `declare_war_opts` (`diplomacy_truce_flow.rs:247`), bez N2 sojusz/NAP, bez P4, bez wołających | KOREKTA: CZĘŚCIOWO |
| `applyAllianceObligationsOnWar` | 0 wpięcia; czyste funkcje w `alliance_war_obligation.rs` | BRAK potwierdzony (wpięcie) |
| `pruneTributeNegotiationsBetween` | 0 trafień nazwy | BRAK potwierdzony |
| `recordWarDeclarationEvent` | 0 trafień nazwy | BRAK potwierdzony |
| `pruneInvalidNegotiations` | 0 trafień nazwy | BRAK potwierdzony |
| `applyDiploEventTracked` | 0 trafień nazwy; bazowe `apply_diplomatic_event` (`diplomacy.rs:617`) bez wiarygodności/tracking | BRAK nazwy, CZĘŚCIOWO funkcja |

## 4. Co web rozstrzyga jednoznacznie (bez pytania do właściciela)

- Kolejność i bramki `playerDeclareWarOnOwner`: pokój → layer → `playerDiplomacyActionAllowed('war')` → `chargeWarDeclarationCredibility` → `breakTreatiesOnWar(breaker=gracz, bez bezKary)` → alianse → relacja → przyczyna wypowiedzenia → porządki (main.ts:13152–13186).
- Gracz NIE ma `bezKary` przy wypowiedzeniu: wywołanie `breakTreatiesOnWar(ME(), ownerId, true)` (main.ts:13169) → kara `zlamana_obietnica`. Rozstrzygnięte kodem.
- Zerwanie dobrowolne: 10-turowa wolność od kary dla handlu (`TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS`); okno N3 dla traktatów bezterminowych; N5 dla czasowych — rozstrzygnięte w `voluntaryTreatyBreakPlan` i w Rust zgodną formułą (B4).
- Barbarzyńcy: zawsze poza rejestrem wiarygodności (`isBarbarian` → `return false`); Rust ma ten sam guard (`diplomacy_truce_flow.rs:249–251`).
- Web sam stwierdza, że AI nie ma dziś ścieżki dobrowolnego zerwania (komentarz przy `breakTreatyVoluntarily`, main.ts:22741 i `initiatorOwnerId` „dziś jej nie ma”) — więc parametr inicjatora nie wymaga decyzji gameplay; wystarczy przekazać ownerId 0 dla gracza.
- Zdarzenie `zlamana_obietnica` vs `_ai` — zależy od `breakerIsPlayer` (rozstrzygnięte kodem, main.ts:23698).
- Przy wątpliwości co do wariantu kodowania (np. `DiplomaticEvent` vs stringi web) — decyzja techniczna, do REJESTR-RUST.md, nie pytanie do właściciela.

**Pytania ABC do właściciela w tej rundzie: 0.** Wszystkie punkty BRAK wynikają z braku wdrożenia, nie z niejednoznaczności webu. Jedyne punkty wymagające dalszego ustalenia webem to pozycje z §5 (NIE_ZMIERZONO), i to przed wdrożeniem, nie przed rozpoznaniem.

## 5. NIE_ZMIERZONO (co web robi, czego nie da się sprawdzić statycznie w tym rozpoznaniu)

1. Dokładna treść `ownerDeclareWarOn` i `joinAllyToWar` poza trzema funkcjami dispatchu (main.ts:13197 i 23803–23814) — zakres wywołań AI, nie analizowany szczegółowo.
2. Wartości parametrów N2/N3/N5 (`_diplomacyParams()`, `wiarygodnoscN2…`, `wiarygodnoscN5…`) — wartości liczbowe z `diplomacy-params` nieodczytane; zgodność wartości Rust (`CREDIBILITY_EVENT_TRUCE_BREACH` = `zlamanie_paktu_nap`) potwierdzona tylko co do nazwy zdarzenia.
3. `isCredibilityRetaliation(declarer, target)` — web wylicza odwet (skip_n2); po stronie Rust brak wyliczenia dla ścieżki gracza. Nie sprawdzono funkcji ani jej odpowiednika w Rust.
4. `applyDiploEventTracked` → `recordDiploFactor` (zapis czynników relacji do UI/zapisu) — rozmiar i kształt w Rust nie zbadane poza brakiem nazwy.
5. `negotiationTable` i `negotiationStillValid` (A9, A11) — Rust nie ma pojedynczego odpowiednika nazwanego; czy logika pruningu jest rozproszona po modułach (np. `diplomacy_rejection_cooldown.rs`) — NIE_ZMIERZONO.
6. `warEventLog` / `recordWarDeclarationEvent` (A10) — odpowiednika nie zlokalizowano; czy zapis wpływa na stan gry (zapis/replay) — NIE_ZMIERZONO.
7. `ownerDeclareWarOn` z `force=true` i `triggerRebelProtectionWarConsequence` (main.ts:28493) — poza zakresem tego rozpoznania.
8. Zachowanie `suspendZlozeOnWar` w warunku hintu (`before > after`) — UI, nie zweryfikowano wpływu na stan (wpływ na stan = ten sam `suspendZlozeGrantsForWar`, zgodny).
9. Testy wektorowe pinu dla P4 istnieją (`p6_cred_wojna*.rs`, `p6_cred_wojna_gen*.mjs`), ale nie odczytano ich pokrycia ścieżki gracza — NIE_ZMIERZONO.

## 6. Zapis procesowy

- Bez zmian w kodzie, bez buildu, bez push na `rust-port/parity-v2`, bez integracji.
- Jedyny plik: ten raport. Commit z jawnym `git add` tej ścieżki.
- Attribution: commit zgodnie z dispatchem (bez nazwy modelu w treści, ostatnia linia `Claude-Session`).
