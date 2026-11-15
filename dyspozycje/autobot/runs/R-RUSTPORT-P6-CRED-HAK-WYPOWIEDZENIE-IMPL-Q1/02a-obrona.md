# 02a-obrona — R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1 (Obrona Operatora, runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1
GOAL: odpowiedź na zarzuty 1-6 Evaluatora r1 (`973fac33d`, `02-evaluator.md`): przyjęcie z dowodem albo odrzucenie z dowodem z pinu.
ZMIANY/COMMIT: commit obrony r2 na gałęzi `worktree-wf_527c2223-a63-3`, nad WIP Operatora `ff6392336`. SHA: commit zawierający ten plik (`git log -1 --format=%H` w worktree Obrony; podany w odpowiedzi orkiestratorowi). Zmieniony plik kodu: `rust-port/engine/tests/p6_cred_hak_kolejnosc.rs`. Dodane: `01-operator-impl.md`, `02a-obrona.md`.
TESTY: fmt EXIT 0, clippy `-D warnings` EXIT 0, pełny `cargo test --all-targets` EXIT 0 (passed 3401, failed 0, ignored 1 pre-existing), `p6_cred_hak_kolejnosc` 16/16, `p6_cred_hak_bridge` 4/4, `git diff --check` EXIT 0. Szczegóły: `01-operator-impl.md` sekcja 3.
BLOKADY: brak blokad procesowych. Luki funkcjonalne jawnie w `01-operator-impl.md` sekcja 4 (BRAK-1..BRAK-10).
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja zarzutów 1-5), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Uwagi procesowe (przed zarzutami)

- Worktree Obrony startował z HEAD `794ec9eda`, który NIE zawiera `a01363d5f` (merge-base `a61337844`). Przełączono gałąź tego worktree na `ff6392336` (WIP Operatora, baza `a01363d5f`, potwierdzone `git merge-base --is-ancestor a01363d5f ff6392336`). Pracowano na kodzie Operatora, nie na świeżym checkoutcie bazy.
- Wspólny scratchpad sesji był nadpisywany przez inne procesy (logi o tych samych nazwach). Wyniki bramek pochodzą z prywatnego katalogu `…/scratchpad/obrona-credhak-q1/`.

## Zarzut 1 (BLOKER PROCESOWY): brak commitu Operatora, brak `01-operator-impl.md`, brak decyzji o `CONTRACT_VERSION`

ODPOWIEDŹ: PRZYJMUJĘ. Poprawka wykonana.
- Commit: nad `ff6392336` jest commit obrony r2 (SHA: patrz wyżej). `git add` jawnie na 3 ścieżki (`tests/p6_cred_hak_kolejnosc.rs`, `01-operator-impl.md`, `02a-obrona.md`). Bez `Cargo.lock` (nieśledzony, nie dodany) i bez `-A`.
- `01-operator-impl.md`: utworzony. Zawiera STATUS/DOMAIN/…/DEPLOY-PUSH, wyniki bramek, listę allowlisty, decyzję o wersji kontraktu i listę BRAK.
- Decyzja `CONTRACT_VERSION`: NIE podbijano (pozostaje `1`). Uzasadnienie w `01-operator-impl.md` sekcja 2: walidacja `bridge.rs` (~linia 69) jest równością, więc podbicie odrzuciłoby cały obecny frontend (wysyła wersję 1), a lustro TS jest poza allowlistą. Zmiana jest addytywna.
- Dowód: `git show --stat <SHA>` pokazuje commit z plikami testów i dwoma plikami dokumentacji.

## Zarzut 2 (ZAKRES): `declare_war` to atrapa kontraktowa; lustro TS rozjeżdża się z Rustem

ODPOWIEDŹ: PRZYJMUJĘ jako BRAK. Bez zmiany kodu.
- Potwierdzam: oba adaptery zwracają `engine_rejected`; `declare_war_by_player` nie ma wołającego w produkcji (grep: tylko definicja i testy). Zapisane jako BRAK-1 w `01-operator-impl.md`.
- Lustro TS (`src-tauri/frontend-v2/src/controller/commands.ts`): potwierdzam rozjazd, zapisany jako BRAK-2. Nie zmieniono, bo plik jest poza allowlistą tematu.
- Zakres tematu z dispatchu (pkt 2) to dopisanie komendy, nie wiring stanu sesji. Wiring jest w BRAK-1 do osobnego tematu.

## Zarzut 3 (TESTY, notatka): test mutacji a<->c składa mutanta ręcznie; dodać asercję literału 0.4

ODPOWIEDŹ: PRZYJMUJĘ. Poprawka wykonana.
- Dodano asercję literału w `kolejnosc_a_c_zmienia_kare_mutacja_musi_dac_roznica`: `(trust_canonical - 0.4).abs() < 1e-9`. Test przechodzi (16/16).
- Wektor ręczny (niezależny od funkcji Rust): w = 20 - 18 = 2; spadek = `1 - (w/100) * amplituda(0,5)` = 0,99 (`gra/src/game/diplomacy-credibility.ts`, `wiarygodnoscSpadekMult`, pin `07d2fbd72`, zweryfikowane w tej rundzie `git show`); dZ = -40 * 0,99 = -39,6; zaufanie 40 - 39,6 = 0,4.
- Uwaga: test mutacji a<->c nadal składa zmutowaną kolejność w ciele testu (nie w kodzie produkcyjnym). Mutanty produkcyjne z raportu Evaluatora (M1-M7) są jego własnym dowodem. Nie rozszerzałem tego w r2.

## Zarzut 4 (TESTY, notatka): luki pokrycia gałęzi `charge_war_declaration_credibility`

ODPOWIEDŹ: PRZYJMUJĘ (i), (ii), (iii), (iv). Dopisano 4 testy i jedną asercję:
- (i) NAP + okno rozejmu = dwa zdarzenia -18: `okno_rozejmu_z_nap_daje_dwa_zdarzenia_n2`. Zmierzone: test przechodzi; mutacja usunięcia drugiego zdarzenia daje FAIL.
- (ii) odwet dla pozostałych typów: `odwet_dla_kazdego_typu_otwierajacego_pomija_n2` (sojusz, odmowa_obowiazku_sojuszu, wypowiedzenie_wojny_bez_ostrzezenia). Typ spoza listy i niezgodne strony (`byOwnerId`/`againstOwnerId`, trzy warianty): `odwet_wymaga_typu_i_wlasciwych_stron`. Wszystkie przechodzą.
- (iii) po odwecie `ostatniePrzewinienieWobecNas` NIE jest nadpisane (web `main.ts:12214`): asercja dodana do `odwet_pomija_n2_ale_nie_p4`. Przechodzi.
- (iv) oferta pokoju po rozejmie bez aktywnego rozejmu = zlamanie Z8 (`isTruceWindowBreach`, web `main.ts:12176-12225`) i czyszczenie oferty: `oferta_konca_rozejmu_bez_aktywnego_rozejmu_to_zlamanie`. Przechodzi.
- Nowe testy są w `p6_cred_hak_kolejnosc.rs` (r1: 12, r2: 16). Zero `#[ignore]`.

## Zarzut 5 (NOTATKA): supresje lintów; wrapper `pub` można wywołać z pominięciem `applyAllianceObligationsOnWar`

ODPOWIEDŹ: PRZYJMUJĘ jako udokumentowanie. Bez zmiany kodu.
- `#[allow(clippy::too_many_arguments)]` (8 argumentów) i `#[allow(dead_code)]` w teście mostka zapisane jako BRAK-10 w `01-operator-impl.md`. Powód braku zmiany: bramka clippy zielona, a struktura parametrów zmieniłaby publiczne API wrappera.
- Luka obowiązków sojuszniczych (web `main.ts:13170`): zapisana jako BRAK-3 w `01-operator-impl.md` oraz w komentarzu modułu (`diplomacy_player_war.rs`, linie 17-21). Potwierdzam, że wrapper jest `pub`.
- Wpis do `REJESTR-RUST.md`: NIE wykonany, bo plik jest poza allowlistą tematu (BRAK-9). Orkiestrator wpisuje BRAK-1..BRAK-8 przy integracji.

## Zarzut 6 (WERYFIKACJA, nie zarzut): zgodność z pinem i mutanty

ODPOWIEDŹ: BEZ ZMIAN (potwierdzenie). Wartości N2 -18/-25, N3 -12, N5 -6, odwet 10, `zlamanaPaktGracz_zaufanie` -40, kolejność a->b->c->d (`main.ts:13168-13177`) zweryfikowane w tej rundzie `git show 07d2fbd72`. Bramki odtworzone (sekcja TESTY). Mutant M6 (zamiana (c)<->(d)) pozostaje równoważny i jest zapisany jako NIE_ZMIERZONO-1.

## Podsumowanie

- Odrzucone: brak.
- Przyjęte z poprawką: 1, 3, 4 (commit + testy + dokumentacja).
- Przyjęte jako BRAK (bez zmiany kodu): 2, 5.
- Weryfikacja: 6.
- Otwarte dla orkiestratora (poza tym tematem): wpis do `REJESTR-RUST.md` (BRAK-1..BRAK-8), dług lustra TS i decyzja o podbiciu `CONTRACT_VERSION` przy integracji mostka.
