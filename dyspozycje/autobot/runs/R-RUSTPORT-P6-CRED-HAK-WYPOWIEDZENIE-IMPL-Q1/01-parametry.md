# 01-parametry — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (KROK 0)

Pin web: `07d2fbd72`. Wszystkie wartości odczytane `git show 07d2fbd72:...` (nie z pamięci).

## Wartości parametrów (`gra/src/game/diplomacy.ts`, blok `DIPLOMACY_PARAMS`)

| Klucz web | Wartość | Linia (pin) | Rust (`rust-port/engine/src/data/civilizations.rs`, pole) |
|---|---|---|---|
| `wiarygodnoscN1BezOstrzezenia` | -10 | :323 | `wiarygodnosc_n1_bez_ostrzezenia` |
| `wiarygodnoscN1KarencjaTur` | 1 | :325 | `wiarygodnosc_n1_karencja_tur` |
| `wiarygodnoscN2ZlamaniePaktuNap` (N2 NAP) | -18 | :327 | `wiarygodnosc_n2_zlamanie_paktu_nap` |
| `wiarygodnoscN2ZlamaniePaktuSojusz` (N2 sojusz) | -25 | :329 | `wiarygodnosc_n2_zlamanie_paktu_sojusz` |
| `wiarygodnoscN3AtakWOknieKarencji` (N3 kara) | -12 | :331 | `wiarygodnosc_n3_atak_woknie_karencji` |
| `wiarygodnoscN3KarencjaBezterminoweTur` (N3 okno, tury) | 10 | :333 | `wiarygodnosc_n3_karencja_bezterminowe_tur` |
| `wiarygodnoscN4OdmowaObowiazkuSojuszu` | -15 | :335 | `wiarygodnosc_n4_odmowa_obowiazku_sojuszu` |
| `wiarygodnoscN5ZerwanieTraktatCzasowy` (N5 traktat) | -6 | :337 | `wiarygodnosc_n5_zerwanie_traktat_czasowy` |
| `wiarygodnoscN5ZerwanieHandelCzasowy` (N5 handel) | -4 | :339 | `wiarygodnosc_n5_zerwanie_handel_czasowy` |
| `wiarygodnoscOdwetOknoTur` (okno odwetu) | 10 | :347 | `wiarygodnosc_odwet_okno_tur` |

Zgodność: wartości w `rust-port/engine/data/diplomacy.json` (`params`) = wartości webu powyżej (potwierdzone w rozpoznaniu, zarzut 5 obrony). Test `n2_wartosci_zgodne_z_pinem` w `tests/p6_cred_hak_kolejnosc.rs` pinuje -18 / -25 / 10.

Skalowanie trudnością: `scaleDiplomacyParamsForDifficulty` (`diplomacy.ts:570-586`) przelicza wyłącznie progi bram (`DIPLO_RELATION_THRESHOLD_KEYS`, `DIPLO_ZAUFANIE_THRESHOLD_KEYS`, `DIPLO_RESPEKT_THRESHOLD_KEYS`), nie klucze `wiarygodnosc*`. N2 nie zależy więc od trudności. (Rozstrzygnięte z kodu; wcześniej NIE_ZMIERZONO.)

## Kary zerwania traktatu (`applyDiplomaticEvent`, `diplomacy.ts:957-963`)

| Zdarzenie | Zaufanie (dZ) | Źródło |
|---|---|---|
| `zlamana_obietnica` (gracz) | -40 | komentarz `diplomacy.ts:865`, `p.zlamanaPaktGracz_zaufanie`; Rust `DiplomacyParams::default().broken_pact_player_trust = -40.0` (`diplomacy.rs:342`) |
| `zlamana_obietnica_ai` (AI) | -20 | komentarz `diplomacy.ts:866`; Rust `broken_pact_ai_trust` |

Modyfikator tempa wiarygodności (`applyWiarygodnoscTempoDoDelty`, web `diplomacy.ts:1089`; Rust `apply_credibility_tempo`, `diplomacy.rs:740`) — podawany przez `applyDiploEventTracked` (`main.ts:12310-12327`): `undefined` gdy `cur.status === 'wojna'` albo para bez gracza.

## Okna i progi karencji (wartości, nie decyzje)

- Okno N3 po jednostronnym anulowaniu traktatu BEZTERMINOWEGO: 10 tur (`wiarygodnoscN3KarencjaBezterminoweTur`). Krok `setDiploPairMeta(n3Window)` NIE jest w tym temacie (zakres B5 poza zakresem).
- Handel bez kary po wieku: `TRADE_TREATY_BREAK_PENALTY_FREE_AGE_TURNS` = 10 tur (Rust `diplomacy.rs:4306`; web odpowiednik w `diplomacy-penalty-preview.ts`). Nie używany w wrapperze wojny (dotyczy dobrowolnego zerwania).
- Karencja N1 po wypowiedzeniu: 1 tura (`wiarygodnoscN1KarencjaTur`). Krok N1 nie jest częścią `playerDeclareWarOnOwner` (liczy się w kontekście ataku, poza tym tematem).
- Okno rozejmu / oferty (Z8): `truceUntilTurn` / `isTruceWindowBreach` (`main.ts:12176-12225`): traktowane jako zdarzenie `zlamanie_paktu_nap` (wartość N2 NAP).
- Odwet (`isCredibilityRetaliation`, `main.ts:12161-12167`): okno `wiarygodnoscOdwetOknoTur` = 10 tur; typy otwierające odwet: `wypowiedzenie_wojny_bez_ostrzezenia`, `zlamanie_paktu_nap`, `zlamanie_paktu_sojusz`, `odmowa_obowiazku_sojuszu` (`main.ts:12148-12153`).

## Kolejność kroków `playerDeclareWarOnOwner` (`gra/src/main.ts:13152-13186`, pin `07d2fbd72`)

| Krok | Linie webu | Treść |
|---|---|---|
| G0 | 13153-13156 | `isPeaceLockedBetween(ME, owner)` → hint + `return false` (wejście `peace_locked` w Rust) |
| G1 | 13158-13163 | `diplomacyLayerForOwner` + `playerDiplomacyActionAllowed(layer,'war')` (POZA ZAKRESEM tego tematu, BRAK) |
| a | 13168 → 12176-12225 | `chargeWarDeclarationCredibility(ME, owner)`: N2, reset pary, `ostatniePrzewinienieWobecNas`, P4; bez relacji |
| b | 13169 → 23688-23702 | `breakTreatiesOnWar(ME, owner, true)`: zerwanie umów + kara `zlamana_obietnica` (tylko gdy zerwano >= 1) |
| (poza) | 13170 | `applyAllianceObligationsOnWar` (POZA ZAKRESEM, BRAK) |
| c | 13171-13175 | `setDiploRelation(applyDiploEventTracked(..., 'wojna_wypowiedziana'))` |
| d | 13177 | `zarejestrujWypowiedzenie(ME, turn, przyczynaWypowiedzenia({zlamanieRozejmu, casusBelliAktywny}))` |
| (poza) | 13178-13181 | `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations` (POZA ZAKRESEM, BRAK) |
| (UI) | 13182-13185 | hinty/odświeżenia UI (poza silnikiem) |

Rust (`rust-port/engine/src/domain/diplomacy_player_war.rs`): `declare_war_by_player` wykonuje a → b → c → d w tej kolejności.

## Testy wektorowe (wynikają z powyższych wartości)

- N2 NAP bez okna: zdarzenie `zlamanie_paktu_nap` = -18, zerwany NAP, relacja `wojna`, P4 zeruje oba liczniki.
- N2 sojusz: `zlamanie_paktu_sojusz` = -25 (else-if: bez dodatkowej kary NAP).
- Okno rozejmu: `zlamanie_paktu_nap` = -18 (Z8), `truceUntilTurn` zerowany, przyczyna `bez_powodu` (priorytet zlamanie_rozejmu > casus belli).
- Odwet (przewinienie w oknie 10 tur): brak N2, P4 zachowany. Po oknie (17 > 10): N2 wraca.
- Kolejność: kara `zlamana_obietnica` z tempem przy relacji pokoju; zamiana a<->c daje inny wynik (test mutacji).
- Barbarzyńca: brak N2 i P4 (wczesny return), zerwanie i wojna pozostają.
- Guard pokoju: brak zmian stanu.

## NIE_ZMIERZONO / BRAK w tym temacie

- `applyAllianceObligationsOnWar`, `diplomacyLayerForOwner`, `playerDiplomacyActionAllowed`, `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations`, `applyDiploEventTracked` (tracking `recordDiploFactor`): poza allowlistą / zakresem.
- Krok N3 (`setDiploPairMeta(n3Window)`) i N5 (`appendWiarygodnoscEvent` przy dobrowolnym zerwaniu): poza zakresem (ścieżka dobrowolnego zerwania, nie wojny).
