STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q4-Q1
GOAL: uzupelnic skutki przejecia miasta (galaz Transfer, bez Ui); kazdy: web -> Rust albo jawny BRAK z dowodem; wektory z pinu przez wyciecie i wykonanie funkcji (bez atrap).
ZMIANY/COMMIT: Obrona Operatora r2 (zarzuty Evaluatora r1, plik 02-evaluator.md, commit f37a106c5).
  Kod: da9c4d77c na lokalnej galezi rust-port-wip/SIEGE-TRANSFER-Q4-Q1-operator-r2 (potomek 4a7e904d1, bez push).
  Allowlista: rust-port/engine/src/domain/siege_transfer.rs; siege_transfer_effects.rs; tests/p6_siege_transfer.rs;
  tests/p6_siege_transfer_effects_q4.rs; tests/p6_siege_transfer_gen.mjs; tests/p6_siege_transfer_vectors/vectors.json.
  Cargo.lock: wygenerowany przez cargo, nieśledzony, usuniety, NIE commitowany. gra/, WERSJE.md, Cargo.toml: nietkniete.
  Raport: ten plik, osobny commit (SHA w odpowiedzi orkiestratora).

TESTY (po da9c4d77c, CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
  cargo fmt --check: EXIT 0 (po cargo fmt; zmienione tylko pliki z allowlisty).
  cargo clippy --all-targets -- -D warnings: EXIT 0.
  cargo test --lib: EXIT 0, 48 passed.
  cargo test --test p6_siege_transfer: EXIT 0, 2 passed (test wektorowy: 160 wektorow transfer, >=10 odbic, >=10 wojen).
  p6_siege_transfer_prod: 5 passed; p6_siege_transfer_effects: 4 passed; p6_siege_transfer_effects_q4: 12 passed (bylo 10); p6_siege_surrender: 10 passed.
  Regeneracja generatora na pinie 07d2fbd72 (9 plikow wejsciowych, wycinane z git show): EXIT 0; dwa kolejne przebiegi identyczne, cmp EXIT 0.
  Mutacja kontrolna: wylaczenie zerowania revoltGraceRemaining w apply_post_capture_law_on_capture -> test p6_siege_transfer pada
    ("vector 0: revoltGraceRemaining"), EXIT 101. Kod przywrocony przed commitem.
  Pin uzyty tylko do odczytu (git show / git archive poza repo).

ODPOWIEDZI NA ZARZUTY:

Bramki (akapit "Bramki odtworzone"): PRZYJMUJE. Bramki powtorzone po zmianach na da9c4d77c (patrz TESTY).

Zarzut 1 (istotny, wektory Q4 wpisane z reki): PRZYJMUJE, naprawione.
  * p6_siege_transfer_gen.mjs nie stubuje juz applyPostCaptureLawOnCapture ani triggerRebelProtectionWarConsequence:
    wycina je z pina (post-capture-law.ts: applyPostCaptureLawOnCapture, isRebellionReconquest, stale
    POST_CAPTURE_FRESH_TURNS / POST_CAPTURE_REBELLION_RECONQUEST_TURNS; society-breakdown.ts: REBEL_FACTION_OWNER_ID;
    barbarians.ts: isBarbarian, BARBARIAN_OWNER_ID; main.ts:13253 triggerRebelProtectionWarConsequence).
    Atrapa ownerDeclareWarOn zapisuje argumenty do declareWar (nie jest stubem bez danych).
  * Scenariusze: ~30% miast nalezy do rebeliantow (-99); w polowie z nich poprzedni wlasciciel = zdobywca.
    Wynik: 28 odbic po buncie, 26 wojen 'wymuszona_inna' w 160 wektorach transfer.
  * Test p6_siege_transfer porownuje z pinem: wasRebellionReconquest, postCaptureLawTurnsRemaining (5/10 tur),
    rebelPreviousOwnerId i rebelProtectionTurnsRemaining po kasowaniu, revoltGraceRemaining, declareWar (declarer,
    target, force=true, cause). Asercje pokrycia: >=10 odbic i >=10 wojen.
  * Testy Q4 (p6_siege_transfer_effects_q4.rs) zostaja jako testy specyfikacji brzegowej; ich liczby (5, 10) to
    stale z pina, a zgodnosc potwierdza wektor, nie reczne wartosci.

Zarzut 2 (istotny, revoltGraceRemaining): PRZYJMUJE, naprawione. Raport r1 bylo bledne (potwierdzone: pin
  post-capture-law.ts:74 `city.revoltGraceRemaining = null`, a Rust order_effects_lane.rs:312 ma pole w strukturze miasta).
  * siege_transfer_effects.rs: nowa struktura PostCaptureCityFields { law: &mut PostCaptureLawFields,
    revolt_grace_remaining: &mut Option<f64> }; apply_post_capture_law_on_capture zeruje grace przy realnym przejeciu
    (no-op przy prevOwner == newOwner nie rusza grace).
  * TransferExtras::post_capture_law: Option<PostCaptureCityFields>. Status Ported zostaje, teraz zgodny z pinem.
  * Dowod: wektory (revoltGraceRemaining po wykonaniu) + mutacja (pada) + test q4 (odbicie zeruje, no-op zachowuje 2.5).

Zarzut 3 (sredni, post_capture_law: None po cichu): PRZYJMUJE (opis + test; bez zmiany sygnatury).
  * Doc TransferExtras::post_capture_law: None = krok POMINIETY; web wykonuje oba skutki zawsze w galezi Transfer,
    wiec wolajacy produkcyjny (W8 r4) MUSI podac Some.
  * Test none_pomija_prawo_i_wojne_jawnie: None na chronionym buncie -> brak wojny (jawna roznica); Some -> wojna i grace=None.
  * Wektory testuja wylacznie wariant Some (wszystkie 160 transferow).
  * Nie zmieniam na obowiazkowe pole, bo to zmiana sygnatury poza zakresem tematu; zapis wystarcza dla Evaluatora.

Zarzut 4 (sredni, force=true w ownerDeclareWarOn): PRZYJMUJE jako jawny zapis zaleznosci (NIE_ZMIERZONO po stronie Rust).
  * Pin main.ts:13197-13203: force=true omija guard isPeaceLockedBetween i czysci peaceUntilTurn pary.
  * Rust diplomacy_truce_flow.rs:247-275 (declare_war_opts): tylko skip_n2, brak force i powodu 'wymuszona_inna'.
    Plik nie jest w allowliscie tego tematu, wiec parytetu nie wdrazam tutaj.
  * Zapisane w: doc RebelWarRequest (zaleznosc W8 r4), wpis TRANSFER_EFFECTS ownerDeclareWarOn (CallerSide, opis z 'force'),
    test tabela_oznacza_nowe_skutki sprawdza slowo 'force' w opisie.

Zarzut 5 (maly, rebelPrevOwnerSnapshot): PRZYJMUJE, potwierdzone testem.
  * test snapshot_przed_kasowaniem_daje_odzysk_bez_straty: snapshot == zdobywca -> reclaim=true, strata 0,
    post_capture_law_reconquest=Some(true), brak wojny. Bez snapshotu -> strata 1 (blad kolejnosci wykryty przez test).
  * Wektory: applyCapturePopulationLoss dostaje rebelPreviousOwnerId odczytane przed applyPostCaptureLawOnCapture
    (ta sama kolejnosc co pin main.ts:17693-17703).

Zarzut 6 (kosmetyka): CZESCIOWO PRZYJMUJE.
  * Literowka 'bylty' -> 'byly' poprawiona (2 miejsca: doc RebelWarRequest::target i rebel_protection_war_request).
  * Mieszanie ASCII i polskich znakow: ODRZUCAM jako defekt. W katalogu siege_*.rs tylko 3 z 10 plikow zawiera
    polskie znaki w komentarzach (grep); ujednolicenie to osobny temat kosmetyczny, bez wplywu na zachowanie i bramki.

Zarzut 7 (baza, nie blokuje): ODRZUCAM jako zarzut kodu, z dowodem.
  * Dispatch wskazywal baze 6cf1bd282 (FC Q3 r2). Sprawdzone: `git merge-base --is-ancestor 6cf1bd282 origin/rust-port/parity-v2`
    -> TAK (lokalnie zapisany origin/rust-port/parity-v2 = 94cba6667; bez fetch w tej rundzie). Zarzut o e98099f5ce
    jest nieaktualny wzgledem tego zapisu.
  * Decyzja o integracji i kolejnosci Q3+Q4 nalezy do orkiestratora; Operator nie integruje.

Zarzut 8 (greppy BRAK pkt 3-9): PRZYJMUJE, zweryfikowane.
  * grep (begin/settle wonder transfer, note_city_capture, sync_city_garnizon, player_ever_owned, capital_capture_plunder,
    record_city_capture, live_safe_ration) w rust-port/engine/src: nazwy wystepuja tylko w tabeli TRANSFER_EFFECTS,
    komentarzach i tabeli BRAK w siege_surrender.rs:37-40. Brak implementacji -> 8 pozycji BRAK pozostaje.
  * player.rs:97 (player_ever_owned_city) to parametr konsumenta is_awaiting_first_player_city, NIE odpowiednik
    playerEverOwnedCityByOwner.add (zapis przy przejeciu). BRAK stoi.
  * Zakaz podpinania wolajacego (apply_transfer) pozostaje: nie wszystkie skutki nie-Ui sa zrobione.

Zmiany w blokach nie dotyczace zarzutow: brak.

BLOKADY:
  (1) Zakaz podpinania wolajacego w apply_transfer NIE zdjety: 8 skutkow BRAK + ExistsNotWired (maybeResolveRegularWarOnCityCapture,
      recordWarCityLossForPair, seedCityOwnerDefaults) nadal poza galezia.
  (2) ownerDeclareWarOn force=true: parytet w Rust (declare_war_opts) poza zakresem allowlisty; zaleznosc dla W8 r4.
  (3) W8 r4 musi podac TransferExtras::post_capture_law = Some(...) (pin wykonuje zawsze).
  (4) Brak blokad infrastrukturalnych.

RUNDY: 2/5 (Operator r2 po FAIL Evaluatora r1); ostatni werdykt: FAIL (Evaluator r1).
  Decyzja wymagana: nie (zarzut 7 odrzucony z dowodem; zarzut 4 zapisany jako zaleznosc).
NASTEPNY KROK: Evaluator r2 na da9c4d77c (ten sam ID); potem Final Control. Integracja/decyzja o bazie: orkiestrator.
DEPLOY/PUSH: NIE WYKONANO (lokalna galez, bez push; Cargo.lock nie commitowany).
