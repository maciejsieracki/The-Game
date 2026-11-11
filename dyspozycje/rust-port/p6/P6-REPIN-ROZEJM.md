# P6-REPIN-ROZEJM — tabela luk: rozejm 5/10/15 (REPIN web FALA 605)

Temat: R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1, runda 3 (baza kodu: b9af6e5f7 = r2; patrz sekcja 5).
Baza: `rust-port/parity-v2` = 43f4064b0. Web (wzorzec): `origin/main` = 638e90bea (FALA ≤606, kod e7bf8acc8).
Sprawdzenie dryfu 2026-11-11: `gra/src/game/diplomacy-peace-lock.ts`, `gra/src/game/diplomacy-war-peace-profile.ts`
i `gra/data/diplomacy-war-peace-params.json` są BEZ ZMIAN między 638e90bea a origin/main f14894c61.
Próg siły: `przewagaMilitarna` (prog 0.20, epsilon 1e-9) w JSON weba.

## 1. Tabela luk (runda 2)

| # | Element weba | Odpowiednik w porcie (plik:symbol) | Status | Uwagi |
|---|---|---|---|---|
| L1 | `TRUCE_DURATION_OPTIONS` 5/10/15, `TRUCE_DEFAULT_TURNS` 10 | `domain/diplomacy_truce.rs` (`TRUCE_DURATION_OPTIONS`) | ZGODNE | stałe identyczne |
| L2 | `normalizeTruceDuration` (Z9 w module) | `diplomacy_truce.rs` (`normalize_truce_duration`) | ZGODNE (moduł), testy wektorowe z webu | wpięcie w ścieżkę propozycji = L9 |
| L3 | `truceUntilTurn` / `isTruceActive` / `truceExpiryAction` / `isTruceBreach` | `diplomacy_truce.rs` | ZGODNE | `tests/p6_dyplomacja_truce_aggressor.rs` 14 passed |
| L4 | `truceEndAiAccepts` (proponujący ≤ 80% adresata; 0 vs 0 = odmowa) | `diplomacy_truce_end.rs` (`truce_end_ai_accepts`, `_default`) | ZGODNE (wektory z webu) | `tests/p6_repin_rozejm_wektory_web.rs` |
| L5 | `truceEndOfferTarget` | `diplomacy_truce_end.rs` (`truce_end_offer_target`) | ZGODNE (wektory z webu) | |
| L6 | `truceEndOfferExpired` (`currentTurn > offerTurn`) | `diplomacy_truce_end.rs` (`truce_end_offer_expired`) | ZGODNE (wektory z webu) | |
| L7 | `isTruceWindowBreach` | `diplomacy_truce_end.rs` (`is_truce_window_breach`) | ZGODNE (wektory z webu) | `has_end_offer: bool` zamiast obiektu meta (adaptacja typu) |
| L8 | (C) zawarcie rozejmu = 0 Zaufania, pokój stały +5 | `diplomacy_truce_flow.rs` (`TruceDiplomacy::finalize_peace_between`) + `peace_finalize_gives_trust_event` | PODPIĘTE (R3) | rozejm 5/10/15: tylko status, 0 Zaufania; pokój stały: `apply_diplomatic_event(Peace)` + blokada; test `p6_repin_rozejm_silnik` |
| L9 | Z8 kara w oknie oferty; Z9 zła długość = odrzucenie; `startTruce`; tick pary | Z9: `diplomacy.rs::evaluate_proposal_with_params` (`ProposalAction::Truce`); startTruce + Z8 + tick + odpowiedź na ofertę: `diplomacy_truce_flow.rs` (`propose`, `tick`, `respond_to_truce_end_offer`, `declare_war`); pola `truceInitiatorId`/`truceEndOffer` jawne w `PairMetaWeb` | PODPIĘTE W ŻYWEJ ŚCIEŻCE PROPOZYCJI I W STANIE PARY (R3); wołanie `tick` z pętli tury świata = dług WIRE-WAR W6 | 18 testów przez silnik |
| L10 | (E) `aiTruceOrPeaceMode` (zmęczenie, willingness, zaufanie, słabszy) | `diplomacy_truce_end.rs` (`ai_truce_or_peace_mode`, progi jako stałe ZAŁOŻENIE) | FUNKCJA ZGODNA (wektory 96 przypadków); PODPIĘCIE OTWARTE (dług WIRE-WAR W6) | brak wywołania w decyzjach AI (poza zakresem R3) |
| L11 | (G) kontroferta zmienia długość 5/10/15 | — | OTWARTE | UI/main, poza domeną portu |
| L12 | Moc wojskowa = `sumArmyMForOwner` (nominalna) | parametr `army_m` w `TruceEndPorts` / argumenty `f64` | ZAŁOŻENIE-R5-A | port nie liczy armii; wejście `f64` bez określonej miary (nominalna vs Effective) |

## 2. Wektory testowe — z uruchomionego kodu weba

Plik: `rust-port/engine/tests/p6_repin_rozejm_wektory_web.rs` (15 testów, PASS) oraz
`rust-port/engine/tests/p6_repin_rozejm_koniec.rs` (9 testów, PASS, runda 1).
Źródło wektorów: `origin/main` 638e90bea, uruchomione pod Node 22.22 (`--experimental-strip-types`
+ loader rozwiązujący importy bez rozszerzenia i JSON). Harness i generator:
`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1/web-harness/`
(`gen.mjs` → `vectors.rs.txt`, `tick.mjs` → scenariusze S1–S8 tick pary, `hooks.mjs` + `reg.mjs` = loader).
Uruchomienie: `SCR=<katalog z webarch> node --experimental-strip-types --import ./reg.mjs ./gen.mjs`,
gdzie `webarch/` = `git archive 638e90bea gra/src gra/data` + `gra/package.json` z `"type":"module"`.

Pokryte: truceEndAiAccepts (14×14 siatka: 0, granica 80/80.0000001/80.001, 0 vs 0, adresat 0, ujemne, NaN, Infinity),
truceEndOfferTarget (brak/a/b/obcy inicjator), truceEndOfferExpired, isTruceWindowBreach (6 meta),
normalizeTruceDuration (5/10/15, 7, 0, 5.5, null, NaN, Infinity, -5), aiTruceOrPeaceMode (96 kombinacji),
peaceFinalizeTrustEvent (5/10/15/7/0/null), tick pary (S1 akceptacja AI, S2 odmowa AI = wojna, S3 oferta
dla gracza, S4 timeout = wojna + usunięcie wpisu, S5 nie-pokój, S6 brak inicjatora, S7 przed wygaśnięciem,
S8 drugi tick tej samej tury). Progi 0.20 / 1e-9: stałe w porcie; test `progi_zgodne_z_json_weba` pilnuje
wartości z 638e90bea (repo `rust-port` nie zawiera `gra/`, więc JSON nie jest czytany w teście).

## 3. Odstępstwa i ZAŁOŻENIA

- ZAŁOŻENIE-P1: `diplomacy_truce_end.rs` jest addytywny (allowlista `diplomacy*.rs` addytywnie); nowe
  funkcje nie zmieniają istniejących ścieżek `diplomacy.rs`.
- ZAŁOŻENIE-P2: prog/epsilon jako stałe `PRZEWAGA_PROG = 0.20`, `PRZEWAGA_EPSILON = 1e-9` (zgodne z JSON weba 638e90bea).
- ZAŁOŻENIE-P3: `TruceEndPorts<T>` z generycznym `T` zamiast `PlayerId`; `status_is_peace` zamiast stringu statusu.
- ZAŁOŻENIE-P4: progi `TRUCE_AI_*` (1.0 / 0.7 / 60) przepisane z web (ZAŁOŻENIE orkiestratora w TS, do ABC).
- ZAŁOŻENIE-P5: opis `przewagaMilitarna._opis` w JSON 638e90bea opisuje też regułę ogólną AI vs gracz
  (stosunek rw/(1−rw)). Funkcja `truceEndAiAccepts` w kodzie weba używa wyłącznie `prog` i `epsilon`
  (ten sam kod jak w porcie); NIE_ZMIERZONO, czy zamierzony jest inny sens progu dla rozejmu.
- Panel web używa wariantu Effective (`sumArmyMForOwnerEffective`), decyzja używa nominalnej — port przyjmuje
  wartości jako parametr (rozbieżność do akceptacji, jak w webie).

## 4. Następny krok (runda 3 / kolejne tematy)

1. L9: podpięcie `truce_end_tick_pair` i `normalize_truce_duration` w żywej ścieżce tury `diplomacy.rs`
   (tick pary, Z9 i Z8 w propozycji, `startTruce` przy akceptacji, `peaceFinalizeTrustEvent` przy finalizacji).
   Wymaga decyzji orkiestratora: rozszerzenie allowlisty o modyfikację istniejących funkcji `diplomacy.rs`
   oraz pól `truceEndOffer` / `truceInitiatorId` w `PairMetaWeb` (obecnie tylko `extra`).
2. L10: podpięcie `ai_truce_or_peace_mode` w decyzjach AI (po stronie Rust `ai`).
3. L11: kontroferta zmienia długość (poza domeną portu — decyzja, czy ujmować w temacie).

## 5. Runda 3 (2026-11-11) — podpięcie w żywej ścieżce

Zakres (zawężenie GOAL wg alternatywy FC): Z8, Z9, startTruce 5/10/15, 0 Zaufania za rozejm, pola meta, test przez silnik.

- `domain/diplomacy.rs` (minimalnie, addytywnie): `ProposalAction::Truce` (`"rozejm"`, alias `"truce"`); Z9 na wejściu
  `evaluate_proposal_with_params` (długość spoza 5/10/15, domyślnie 10 = odrzucenie, komunikat jak web); rozejm dzieli gałąź
  pokoju (wymóg wojny, bramka PW, waluta w wojnie dozwolona), baza PW = `TRUCE_BASE_PN` 200 (web `diplomacy-acceptance-points.json`).
  `turns` rozejmu to długość, nie mnożnik koszyka ani czas traktatu — przed bramką PW czyszczone (ZAŁOŻENIE-R3-E).
- `domain/diplomacy_truce.rs`: `PairMetaWeb.truce_initiator_id`, `PairMetaWeb.truce_end_offer` (`TruceEndOfferWeb`), serde default
  i skip_serializing_if; stary zapis bez pól = bez zmian (test `stary_zapis_pary_bez_pol_rozejmu_wczytuje_sie_bez_zmian`).
- `domain/diplomacy_truce_flow.rs` (nowy): `TruceDiplomacy` (relacje + umowy + meta par + armie + skrzynka) z implementacją
  `TruceEndPorts<PlayerId>`; `propose` → ewaluacja → `finalize_peace_between` (Z9, (C), startTruce); `tick` (pary raz na turę);
  `respond_to_truce_end_offer` (zgoda = pokój stały, odmowa = wojna bez kary); `declare_war` (Z8: okno aktywnego rozejmu lub oferty = złamanie,
  kasowanie oferty i wpisu skrzynki).
- Testy: `tests/p6_repin_rozejm_silnik.rs` (18): rozejm 5/10/15 → tick po końcu → oferta pokoju → akceptacja wg siły (80/100 przyjęte,
  80.001/100, 100/100, 150/100 wojna; 0 vs 0 i adresat 0 = wojna), oferta dla gracza (zgoda/odmowa/timeout), Z8, Z9, stary zapis, round-trip.
- ZAŁOŻENIE-R3-B: kara Z8 jako wpis `zlamanie_paktu_nap` w `credibility_events` (wartość N2 nalicza wołający); alliance/NAP breach z
  `chargeWarDeclarationCredibility` poza zakresem. ZAŁOŻENIE-R3-C (dług WIRE-WAR W6): `tick` z pętli tury świata, `peace_finalize...`
  z tury, `ai_truce_or_peace_mode` w decyzji AI, L11 (kontroferta zmienia długość). ZAŁOŻENIE-R3-D: miara armii = wejście `army_m`
  (web nominalna `sumArmyMForOwner`; panel Effective — rozbieżność odnotowana).
- ZAŁOŻENIE-R3-F: skrzynka (`InboxOffer`) i oferta kasowane przy zawarciu pokoju stałego (web czyści tylko meta); hygiena, brak wpływu na wynik.
