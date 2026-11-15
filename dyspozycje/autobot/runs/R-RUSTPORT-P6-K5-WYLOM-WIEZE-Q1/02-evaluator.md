# 02-evaluator: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (#98 K5-LOOP-WYLOM, zakres 1-3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1
GOAL: wieża bez kafla muru nie jest planowana i nie strzela (pin :4214-4216, :4227); wyłom usuwa kafel i zburza wieżę w tym samym wywołaniu (pin :7646-7648); wektory z pinu; mutacja daje FAIL.
EVALUATOR: Sonnet 5.5, adwersarialny. Oceniany commit: 1849d5eea (baza d5a52a980, przodek potwierdzony `git merge-base --is-ancestor`).
ZMIANY/COMMIT: ten plik (commit Evaluatora, bez push). Kod Operatora nietknięty (mutacje przywrócone, `cmp` identyczny z kopią).
DEPLOY/PUSH: NIE WYKONANO.

## BRAMKI ODTWORZONE (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)

- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets` (pełny): EXIT 0; suma ze wszystkich binarek: 3421 passed, 0 failed, 1 ignored (pre-istniejący `e2e::dump_tick1_econ_for_web_generator`; zgodne z raportem Operatora). `p6_siege_wylom_tower` uruchomiony w pełnym przebiegu.
- `git show --check HEAD` (odpowiednik `git diff --check` dla commita 1849d5eea): czysto.
- `#[ignore]` w nowych plikach: 0. Istniejące testy nie były modyfikowane (diff tylko dodaje nowe pliki; w `src` zmiany to komentarze + `sync_wall_state` + import).

## ALLOWLISTA (`git diff --name-only d5a52a980 1849d5eea`)

1. `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1/01-operator-impl.md` OK.
2. `rust-port/engine/src/domain/siege_tactics_breach.rs`: tylko komentarz dokumentacyjny `breach_wall_tile`; kod bez zmian. OK.
3. `rust-port/engine/src/domain/siege_tactics_loop.rs`: import, NOWA `pub fn SiegeEnv::sync_wall_state`, komentarze. Kod `plan_tower_shots`/`tower_shoot` bez zmian. Granica (zarzut 3).
4. `rust-port/engine/tests/p6_siege_wylom_tower.rs` OK (`p6_siege_wylom_*.rs`).
5. `rust-port/engine/tests/p6_siege_wylom_gen.mjs` i `p6_siege_wylom_vectors/vectors.json`: POZA literalną allowlistą (zarzut 4).
- Brak zmian w `gra/**`, `renderer/**`, `view-model/**`, `bridge.rs`, `domain/mod.rs`. `Cargo.lock` nieśledzony, nie w commicie.

## WERYFIKACJA WZGLĘDEM PINU 07d2fbd72 (git show / git archive gra/src)

- Numery linii: `_destroyTowerAtRow` :4194-4199; pętla `_fireSiegeTowers` :4214-4216 (`if (t.destroyed) continue; if (!this.wallTileHp.has(t.row)) { destroy; continue }`, `stagger += 180` dopiero po tych dwóch); guard `_fireOneTower` jest w :4227 (dispatch :4226 był przesunięty, Operator ma rację); `_breachWallTile` :7638-7648 (`return` przy `!tiles` PRZED delete/flagą/destroy, :7646 `delete`, :7647 flaga, :7648 `_destroyTowerAtRow`). Rust `breach_wall_tile` zgadza się z tą kolejnością i z wczesnym `return`.
- `wallTileHp.set/delete/clear` w pinie występują tylko w :4050/:4053, :7558, :7646, :10524/:10529 (grep). Teza Operatora o miejscach zapisu jest zgodna z pinem.
- Regeneracja wektorów: `git archive 07d2fbd72 gra/src` do katalogu poza repo, `node tests/p6_siege_wylom_gen.mjs <WEB_ROOT>` (Node 22.23.4) = EXIT 0, wynik `cmp`-IDENTYCZNY z `vectors.json`. Strażnik SHA-256 pliku `battleScene.ts` i `city-towers.ts` przeszedł na świeżo wyciągniętym pinie, więc skróty nie są samo-odniesieniem dla plików (tylko skróty wyciętych fragmentów są ustalone z pierwszego uruchomienia, ale pochodzą z tego samego pinu).
- Trzy wektory sprawdzone ręcznie (geometria: kolumna muru 5, atakujący A0 (6,2) i A1 (6,4), zasięg 2, wieże na wierszach 2 i 4):
  1. `wylom-po-planowaniu-przed-strzalem`: fire planned [0,180]; breach(2) -> destroyed [true,false], kafle [4], flaga true; drain -> trafienie tylko w cel 1. Zgodne z pinem (:4227 blokuje wieżę 2).
  2. `brak-kafla-przy-planowaniu`: wieże [1,4], kafel tylko 4; fire planned [0] (zburzona wieża 1 nie zjada odroczenia), destroyed [true,false], trafienie w cel 1. Zgodne z :4216-4218.
  3. `wylom-przed-kolejna-salwa`: salwa 1 planned [0,180], trafienia [0,1]; breach(2); salwa 2 planned [0], trafienie [1]. Zgodne.
- Wyłom ustawia stan zburzenia w tym samym wywołaniu (pin :7646-7648): test `breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu` sprawdza po jednym wywołaniu: kafel zniknął (= wieża zburzona), sąsiednia nietknięta, flaga ustawiona, brak terenu = brak zmian. Zgodne z pinem.

## MUTACJE (własny skrypt, każda mutacja przywracana z kopii; na końcu `cmp` = RESTORED_OK)

| Mutacja | Wynik `p6_siege_wylom_tower` |
|---|---|
| M1 usunięcie `wall_tile_hp.remove` w `breach_wall_tile` | FAIL 3/6 (breach pure, po planowaniu, przed kolejną salwą) |
| M2 `sync_wall_state` bez aktualizacji `wall_tile_rows` | FAIL 2/6 |
| M3 usunięcie guardu `wall_tile_rows.contains` w `tower_shoot` | FAIL 1/6 (po planowaniu) |
| M4 usunięcie pominięcia zburzonej wieży w `plan_tower_shots` | FAIL 2/6 |
| M5 `breach_wall_tile` bez `wall_ever_breached = true` | FAIL 3/6 |
| M6 usuwanie złego wiersza (`wall_row + 2`) | FAIL 3/6 |
| M7 `stagger` rośnie także dla pominiętej wieży | FAIL 2/6 |

Wszystkie siedem zabite. Testy są czułe na stan wyłomu, guard strzału, pominięcie przy planowaniu i odroczenie.

## ZARZUTY (ponumerowane)

1. [ŚREDNI, uzasadnienie decyzji 1] Predykat "wieża zburzona <=> brak klucza w `wall_tile_hp`" NIE jest równoważny fladze pinu po replayu. Pin `_resetSiegeForReplay` (:10518-10531) odtwarza `wallTileHp.set(r, WALL_TILE_HP)` (:10529), ale NIE dotyka `siegeTowers[].destroyed` (jedyne zapisy `destroyed`: :4189 inicjalizacja przy `_placeSiegeTowers`, :4197 `_destroyTowerAtRow`; `_replayBattle` :10572-10600 nie woła `_placeSiegeTowers`). Po "Rozegraj ponownie" w pinie zburzone wcześniej wieże pozostają zburzone (nie planują, nie strzelają, :4215/:4227, i nie wchodzą do zagrożeń AI :7933), mimo że kafle wróciły. Rust z wyprowadzonym predykatem po takim resecie by je ożywił. Operator wymienia :10529 w komentarzu `breach_wall_tile` (siege_tactics_breach.rs:83), ale uzasadnienie "kafel nie wraca" (01-operator-impl.md decyzja 1) jest w tym punkcie błędne i brak wpisu w NIE_ZMIERZONO/BRAK. Replay nie jest portowany (breach.rs:25), więc brak regresji dziś, ale jawna flaga z dispatchu (zakres pkt 1) tego problemu nie miałaby. Wymagane: dopisać do NIE_ZMIERZONO/BRAK i poprawić komentarz na "dokładnie wtedy ... poza replayem (pin :10529 przywraca kafle bez ożywiania wież)", albo zrobić flagę lepiej.
2. [NISKI-ŚREDNI, odstępstwo od dispatchu] Dispatch (zakres 1 i 2) żąda stanu `destroyed` w `SiegeEnv`/`ProdBody` i ustawiania go w `breach_wall_tile`. Operator nie zmienił kodu `breach_wall_tile`, `plan_tower_shots` ani `tower_shoot` (planowanie i guard strzału z `wall_tile_rows` istniały w bazie). Jedyna zmiana produkcyjna to pomost `sync_wall_state`, bez żadnego produkcyjnego wołającego (#113; jedyny wołający to nowy test). Zawartość dostarczona = testy i wektory zamykające luki 4, 7, 21 dowodem, nie nowa logika. Powód odstępstwa (literały `WallState {`/`SiegeEnv {` w testach poza allowlistą: tests/p6_siege_tactics_breach.rs:64 i :393, p6_siege_tactics_loop.rs:148, p6_tower_target_wiring.rs:228) zweryfikowany i prawdziwy. Kryterium mutacji spełnione równoważnie (M1). Ocena FC, czy to wystarcza.
3. [NISKI] `sync_wall_state` to nowa funkcja publiczna w `siege_tactics_loop.rs`; allowlista mówi "zmiany tylko w strukturze stanu wież i planowaniu (`plan_tower_shots`, `tower_shoot`)". Dodany też import. Granica allowlisty, do decyzji FC (Operator sam to zgłosił).
4. [NISKI] Pliki `p6_siege_wylom_gen.mjs` i `p6_siege_wylom_vectors/vectors.json` nie pasują do literalnej allowlisty (`p6_siege_wylom_*.rs`), a dispatch mówi "wszystko poza tym = FAIL". Precedens: `p6_tower_target_wiring_gen.mjs` i katalog wektorów istnieją w bazie. Bez generatora i wektorów test nie ma sensu ("wektory pinu, nie ręczne liczby"), więc Evaluator rekomenduje zatwierdzenie z adnotacją; decyzja FC/orkiestratora.
5. [NISKI] `sync_wall_state` przypisuje `wall_ever_breached = w.wall_ever_breached`, więc wywołanie ze starszym `WallState` obniży flagę true -> false, a w pinie flaga jest monotoniczna (poza replayem :10522). Nadpisuje też `wall_tile_rows` w całości. Bez wołającego produkcyjnego nieszkodliwe, ale przy wiringu (#113) wołający musi przekazywać najnowszy stan. Rozważyć `|=` albo zapis w NIE_ZMIERZONO.
6. [NISKI, pokrycie] Brak wektorów dla: (a) wyłomu na wierszu bez wieży (flaga true, nic nie zburzone), (b) zburzenia wszystkich wież (pusta salwa), (c) dwóch wyłomów po sobie, (d) `terrain_tiles_present=false` w ścieżce pętli (pure test to pokrywa), (e) ścieżki `_attackWallTile` :7555-7565 (rzeczywista droga do wyłomu; poza zakresem, wiring #113/#98 finał), (f) trafienia w locie przy wyłomie po wystrzale (Operator zgłosił w NIE_ZMIERZONO). Żaden z tych braków nie jest w zakresie 1-3 dispatchu, ale (a), (b) i (c) to tanie dopiski generatora.
7. [INFORMACYJNY] Sufit tur wyłączony w teście (`no_breach_cap: 1_000_000`), harness pinu go nie modeluje; jawnie zgłoszone. Brak zastrzeżeń.

Wszystkie NIE_ZMIERZONO z 01-operator-impl.md (czas trafienia 380 ms i kolejność timerów o równym `due`, trafienie w locie przy wyłomie po wystrzale, `hp` celu `CombatUnit.hp` vs `bu.hp`, sufit tur, wpływ `wall_ever_breached` na end-check, strefa zagrożenia AI :7928-7935) są jawne. Evaluator dodaje: interakcję replay x `destroyed` (zarzut 1).

## KRYTERIA KOŃCA DISPATCHU

1. Luki 4, 7, 21 zamknięte z dowodem plik:linia: TAK (z zastrzeżeniem zarzutu 1 dla pkt 4/7 w kontekście replayu).
2. Wektory pinu, nie ręczne liczby: TAK (regeneracja bajt-w-bajt).
3. Mutacja daje FAIL: TAK (M1-M7).
4. Brak `#[ignore]`, brak osłabionych asercji: TAK.
5. NIE_ZMIERZONO jawnie: TAK, plus zarzut 1.

## WERDYKT

PASS-WITH-NOTES. Bramki zielone, wektory odtworzone bajt-w-bajt, mutacje zabijane. Do FC: zarzuty 1 (korekta uzasadnienia/komentarza + wpis NIE_ZMIERZONO), 2-4 (decyzja o odstępstwie i granicy allowlisty), 5-6 (opcjonalne). Obrona Operatora potrzebna dla zarzutu 1.

RUNDY: Evaluator r1 (runda 1/5).
NASTĘPNY KROK: Obrona Operatora (Haiku) na zarzuty 1, 5; następnie Final Control.
