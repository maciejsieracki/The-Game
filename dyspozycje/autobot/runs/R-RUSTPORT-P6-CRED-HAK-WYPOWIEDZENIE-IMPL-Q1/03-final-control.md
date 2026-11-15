# 03-final-control — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (wypowiedzenie wojny przez gracza, pierwszy wycinek)
GOAL: wrapper `declare_war_by_player` w kolejności webu (a)->(b)->(c)->(d), komenda `declare_war` w mostku, wektory z pinu `07d2fbd72`, test mutacji.
ZMIANY/COMMIT: oceniany SHA kodu = `8f382f38939ae0d2032cf5efba8e4f788fc4d8fb` (obrona r2, gałąź `worktree-wf_527c2223-a63-3`). Ancestry: `git merge-base --is-ancestor a01363d5f 8f382f389` = TAK; łańcuch a01363d5f -> ff6392336 (WIP Operatora r1) -> 8f382f389. Ten raport dopisany jako osobny commit na 8f382f389 (SHA końcowy: patrz odpowiedź Final Control); poza raportem zero zmian względem 8f382f389.
TESTY: sekcja 2.
BLOKADY: brak blokad procesowych. Luki zakresu jawnie w BRAK (sekcja 4).
RUNDY: 2/5 (r1 FAIL procesowy -> obrona r2 -> FC).
NASTĘPNY KROK: integracja przez orkiestratora (merge-tree względem parity-v2, FF), wpis BRAK-1..BRAK-10 do `dyspozycje/rust-port/REJESTR-RUST.md` (poza allowlistą tematu).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Rozstrzygnięcie zarzutów Evaluatora r1 (NAPRAW / ODDAL / DO DECYZJI CZŁOWIEKA)

| # | Zarzut | Rozstrzygnięcie | Dowód |
|---|---|---|---|
| 1 | Brak commitu i `01-operator-impl.md`, brak zapisu decyzji o `CONTRACT_VERSION` | ODDAL (naprawione w r2) | commit `ff6392336` + `8f382f389` istnieją; `01-operator-impl.md` §2 zapisuje decyzję "bez podbicia" z uzasadnieniem. Sprawdzone w kodzie: `bridge.rs` waliduje wersję równością (odrzuciłoby klientów na v1), zmiana addytywna. Decyzja zgodna z dispatchem pkt 2. |
| 2 | `declare_war` to atrapa kontraktowa (adaptery zwracają `engine_rejected`, brak wołającego `declare_war_by_player`); lustro TS rozjeżdża się | ODDAL (jawny BRAK-1/BRAK-2) | `bridge.rs` diff: obie gałęści `EngineCommand::DeclareWar` zwracają `engine_rejected`; test `p6_cred_hak_bridge` to pinuje. Dispatch ogranicza zakres do "wrappera kolejności" i "komendy w bridge.rs (dopisanie)"; wiring stanu i `src-tauri/**` są poza allowlistą. Brak cichego no-op. |
| 3 | Test mutacji bez literału z pinu | ODDAL (naprawione) | dodana asercja `(trust_canonical - 0.4).abs() < 1e-9`. Samodzielnie zweryfikowano wektor z pinu: `wiarygodnoscStartNormalny` = 20 (`gra/data/diplomacy.json:98`), N2 NAP -18 -> w = 2, `wiarygodnoscTempoAmplituda` = 0,5 (`:136`), spadekMult = 1 - (2/100)*0,5 = 0,99 (`diplomacy-credibility.ts:610-614`), dZ = -40 * 0,99 = -39,6, zaufanie 40 -> 0,4. Zgodne. |
| 4 | Luki pokrycia `charge_war_declaration_credibility` | ODDAL (naprawione) | dodane: `okno_rozejmu_z_nap_daje_dwa_zdarzenia_n2`, `odwet_dla_kazdego_typu_otwierajacego_pomija_n2`, `odwet_wymaga_typu_i_wlasciwych_stron`, `oferta_konca_rozejmu_bez_aktywnego_rozejmu_to_zlamanie`, asercja braku nadpisania `ostatniePrzewinienieWobecNas` przy odwecie (web `main.ts:12214`). Wszystkie w 16/16. |
| 5 | Supresje lintów, pub wrapper z luką `applyAllianceObligationsOnWar` | ODDAL (jawny BRAK-3, BRAK-10) | udokumentowane w komentarzu modułu (linie 17-21) i `01-operator-impl.md` §4. Supresje akceptowalne (clippy -D warnings EXIT 0; zmiana API poza sensem tematu). |
| 6 | Weryfikacja (nie zarzut) | potwierdzone | patrz sekcja 2. |

Zarzuty NAPRAW: 0. Zarzuty DO DECYZJI CZŁOWIEKA: 0 (zasada 11: decyzje gameplay wynikają z webu; nic nie wymaga pytania).

## 2. Bramki odtworzone SAMODZIELNIE (worktree `wf_527c2223-a63-4`, HEAD = `8f382f389`, CARGO_TARGET_DIR poza repo, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (pełny) | EXIT 0; 469 binariów `ok`; passed 3401, failed 0, ignored 1 (pre-existing `e2e::dump_tick1_econ_for_web_generator`, spoza tematu) |
| `git diff --check a01363d5f..HEAD` | pusty (EXIT 0) |

Pierwsze podejście do pełnego testu zostało ubite limitem czasu tła (nie wynik testu); powtórzone od zera z dłuższym limitem, wynik powyżej jest z drugiego, kompletnego przebiegu.

## 3. Allowlista (samodzielnie: `git diff --name-status a01363d5f HEAD`)

- A `rust-port/engine/src/domain/diplomacy_player_war.rs` (dozwolone)
- M `rust-port/engine/src/domain/mod.rs` (+1 linia `pub mod diplomacy_player_war;`, dozwolone)
- M `rust-port/engine/src/bridge.rs` (+13: wariant `DeclareWar` i 2 gałęzie adapterów; istniejące komendy bez zmian; `CONTRACT_VERSION` bez zmian, dozwolone)
- A `rust-port/engine/tests/p6_cred_hak_bridge.rs`, `.../p6_cred_hak_kolejnosc.rs` (dozwolone, wzorzec `p6_cred_hak_*.rs`)
- A `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1/{01-parametry,01-operator-impl,02a-obrona}.md` (dozwolone)

Zero zmian w `gra/**`, `renderer/**`, `view-model/**`, `src-tauri/**`, `diplomacy.rs`, `diplomacy_truce_flow.rs`. `Cargo.lock` nieśledzony, niecommitowany. Brak `#[ignore]` w plikach tematu. Zmiany r2 w testach tylko dodają asercje (151 wstawek, 1 usunięcie = przeformatowanie/zamiana asercji kolejności na pełniejszą, bez osłabienia).

## 4. Zgodność z webem (samodzielna weryfikacja `git show 07d2fbd72:gra/src/main.ts`)

- Kolejność `playerDeclareWarOnOwner` (13152-13186): guard pokoju -> (a) `chargeWarDeclarationCredibility` 13168 -> (b) `breakTreatiesOnWar(…, true)` 13169 -> [obowiązki sojusznicze 13170, BRAK-3] -> (c) relacja `wojna_wypowiedziana` 13171-13175 -> (d) `zarejestrujWypowiedzenie` 13177. Rust `declare_war_by_player` wykonuje a->b->c->d.
- Krok (a) (12176-12225): bariera barbarzyńcy, odwet (12161-12167, okno 10 tur), `isTruceWindowBreach`, else-if sojusz > NAP, osobne zdarzenie okna rozejmu, `clearTruceEndOffer`, reset meta pary, `ostatniePrzewinienieWobecNas` tylko gdy nie odwet, P4 obu stron. Rust 1:1.
- Krok (b) (23688-23702): `suspendZlozeOnWar` + `treatiesBrokenByWar`; kara `zlamana_obietnica` tylko gdy zerwano >= 1; tempo z `applyDiploEventTracked` (12310-12327): brak modyfikatora, gdy `wojna` lub para bez gracza. Rust 1:1 (`break_treaties_on_war` robi suspend + zerwanie, wrapper dokłada karę z tempem).
- Wartości: N2 NAP -18, sojusz -25, odwet 10, `zlamanaPaktGracz_zaufanie` -40 zgodne z `gra/data/diplomacy.json` na pinie.

## 5. Czułość testu mutacji (samodzielnie)

Mutant produkcyjny: zamiana (b)<->(c) w `declare_war_by_player` -> `kolejnosc_a_c_zmienia_kare_mutacja_musi_dac_roznica` FAIL (15 passed, 1 failed). Plik przywrócony z kopii, `git status` czysty (poza nieśledzonym Cargo.lock). Mutanty M1-M5, M7 zabite przez Evaluatora r1; M6 (c<->d) równoważny na obecnym modelu (NIE_ZMIERZONO-1).

## 6. BRAK / NIE_ZMIERZONO (jawna lista; do rejestru przez orkiestratora)

- BRAK-1 wiring: `declare_war` odrzucane przez oba adaptery; `declare_war_by_player` bez wołającego produkcyjnego.
- BRAK-2 lustro TS `src-tauri/frontend-v2/src/controller/commands.ts` bez `DeclareWar` (dług poza allowlistą; razem z ewentualnym bumpem `CONTRACT_VERSION` w temacie integracji mostka).
- BRAK-3 `applyAllianceObligationsOnWar` (main.ts:13170) nie wykonywane; pub wrapper wywoływalny z jego pominięciem.
- BRAK-4 `diplomacyLayerForOwner` + `playerDiplomacyActionAllowed` (13158-13163); guard pokoju jako wejście `peace_locked`.
- BRAK-5 `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`, `pruneInvalidNegotiations` (13178-13181).
- BRAK-6 `recordDiploFactor` (tracking czynników).
- BRAK-7 N3 i N5 (ścieżka dobrowolnego zerwania), N1 (kontekst ataku).
- BRAK-8 hinty/UI.
- BRAK-9 wpis do `REJESTR-RUST.md` (poza allowlistą) wykonuje orkiestrator.
- BRAK-10 supresje `allow(clippy::too_many_arguments)` i `allow(dead_code)` (test mostka).
- NIE_ZMIERZONO-1 kolejność (c)<->(d) nieobserwowalna; NIE_ZMIERZONO-2 mutacje nowych testów poza gałęzią `truce_breach` i zamianą (b)<->(c).

## 7. Notatki (nie blokują)

- Rozbieżność 3 vs 4 testy mostka wyjaśniona: `p6_cred_hak_bridge.rs` ma 3 własne testy, a czwarty (`bridge::add_player_atomicity_tests::...`) wchodzi przez `#[path = "../src/bridge.rs"]`. Log pełnego testu: "running 4 tests", 4 ok.
- Pierwotny worktree Obrony startował z innej bazy (794ec9eda); poprawione przełączeniem na ff6392336, ancestry względem a01363d5f potwierdzona powyżej.

WERDYKT: PASS-WITH-NOTES. Można integrować po ancestry/merge-tree względem `origin/rust-port/parity-v2`.
