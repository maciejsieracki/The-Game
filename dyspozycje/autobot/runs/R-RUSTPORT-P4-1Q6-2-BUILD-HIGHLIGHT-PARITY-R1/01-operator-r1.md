# R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 — raport Operatora r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1
GOAL: przy aktywnym trybie budowy z PUSTYM zbiorem heksów producent nakładek (`unit_overlays_view`) daje ten sam obraz co web (warstwa podświetlenia wyczyszczona, zasięg ruchu niewidoczny); pozostałe tryby bez zmian.

BAZA: `326fd5545` (= `origin/rust-port/parity-v2` w chwili startu), gałąź `rust-port-wip/p4-1q6-2-build-highlight-r1`.

## Ustalenia z pinu `07d2fbd72`

- `gra/src/render/units.ts:6524-6568`: `setHighlight(hexes)` najpierw woła `clearHighlight()`, a przy `hexes.size === 0` kończy (brak warstwy). Jest JEDNA warstwa tarcz, wspólna dla zasięgu ruchu i trybu budowy.
- `gra/src/main.ts:7115-7135` (`syncPlayerUnitSelectionOnMap`): zasięg = `unitRenderer.setHighlight(reachable)` (`:7123-7125`).
- `gra/src/main.ts:16351-16396` (`refreshBuildHighlight`):
  - `foundCityMode` (`:16352-16361`): `setHighlight(qual)`, przy pustym `qual` warstwa (a więc zasięg) znika;
  - `activeWonderId` (`:16363-16367`): `setHighlight(new Set(...))`, to samo;
  - brak trybu (`!buildModeOpen || !activeImprovementKey || !buildApi`, `:16369-16373`): `clearHighlight()`, ale ta gałąź występuje przy wyjściu z budowy, a potem zaznaczenie ustawia zasięg na nowo; zwykły tryb ruchu = zasięg widoczny;
  - kopalnia złoża (`:16386-16390`): `clearHighlight()` + `refreshMineEligibleOverlay(hexes)` (`:15555-15564`, pusta lista = brak warstwy kopalni);
  - pozostałe ulepszenia (`:16391-16395`): `setHighlight(hexes, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY)`, pusty zbiór czyści warstwę.
- Wniosek: we wszystkich trzech gałęziach aktywnego trybu budowy (miasto, cud, ulepszenie/kopalnia) zasięg ruchu znika niezależnie od liczby heksów. `reachable` nie zależy od zbioru heksów, tylko od tego, czy tryb jest aktywny.

## Zmiana (decyzja techniczna)

Kontrakt DTO (`BuildHighlightDto`, view-model) i adapter renderera są poza allowlistą, więc naprawa jest w producencie:
- nowa `pub fn build_highlight_mode_active(&BuildHighlightUi) -> bool` w `overlays_view.rs` = warunek gałęzi trybu budowy z pinu (`found_city_mode || wonder_active || (build_mode_open && klucz niepusty)`);
- `build_highlight` używa tego samego warunku dla gałęzi „brak trybu” (jedno źródło; zachowanie bez zmian, test F6/Q6 zielone);
- `unit_overlays_view`: przy aktywnym trybie budowy `reachable = []`, w przeciwnym razie `reachable_overlay(state)` jak dotąd.
Adapter renderera (`renderer/src/view/units.rs`, `unit_highlight`) bez zmian daje wtedy: pusty `build_highlight.hexes` + pusty `reachable` -> `clearHighlight()`, czyli parytet z pinem.

## ZMIANY/COMMIT

- `rust-port/engine/src/domain/overlays_view.rs`: `build_highlight_mode_active`, refaktor warunku w `build_highlight`, wygaszenie `reachable` w `unit_overlays_view`, dokumentacja pola `UnitOverlaysView::reachable`.
- `rust-port/engine/tests/p4_1q6_2_build_highlight.rs` (nowy, 5 testów).
- `rust-port/engine/tests/p4_1q6_2_gen.mjs` (nowy generator): WYKONUJE tekst pinu (`syncPlayerUnitSelectionOnMap`, `refreshBuildHighlight`, `clear/refreshMineEligibleOverlay`, `filterBuildHighlightHexes`, `isMineImprovementKey`) przez `stripTypeScriptTypes`, renderer i źródła danych zastąpione stubami; SHA-256 fragmentów `b2ccd939fb790da379300974d5efa30909f025051523b80a9c855e1cb100899b`.
- `rust-port/engine/tests/p4_1q6_2_vectors/vectors.json`: 12 wektorów (ruch; miasto pusty / poza odkryciem / niepusty; cud pusty / niepusty z duplikatem; kopalnia pusta / niepusta / cofnięta w turze; ulepszenie puste / cofnięte w turze / niepuste).
- Commit: SHA w sekcji „Commit” na końcu raportu (ten plik jest w tym samym commicie).
- `Cargo.lock` nie jest commitowany (bez zmian).

## TESTY (env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

- `cargo fmt --check` (engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0.
- `cargo test --test p4_1q6_2_build_highlight`: 5 passed, 0 failed.
- `cargo test --all-targets --no-fail-fast` (engine): EXIT 0; 524 binarek testowych, 3907 passed, 0 failed, 1 ignored.
- Mutacje (plik przywrócony po każdej, `cmp` = identyczny):
  - (a) wygaszanie zasięgu tylko przy NIEPUSTYM zbiorze budowy (`!build_highlight(..).hexes.is_empty()` zamiast `build_highlight_mode_active`): FAIL (`q6_2_wektory_pinu_warstwa_podswietlenia`, `q6_2_pusty_zbior_budowy_wygasza_zasieg`);
  - (b) kopalnia zwraca brak warstwy (`return no_layer()` zamiast `BuildHighlightKind::Mine`): FAIL (3 testy, w tym `q6_2_kopalnia_zachowuje_heksy_budowy`);
  - (c) zwykły tryb ruchu traci zasięg (`Vec::new()` zamiast `reachable_overlay(state)`): FAIL (`q6_2_tryb_ruchu_zachowuje_zasieg`, `q6_2_wektory_pinu_warstwa_podswietlenia`).
- Bramka renderera: NIE uruchamiana (wg dispatchu; renderer niezmieniony).

## BLOKADY / uwagi dla kolejnych etapów

1. Komentarz modułu `rust-port/renderer/src/view/units.rs` (sekcja „KNOWN DIVERGENCE of Q6-2”) jest po tej zmianie nieaktualny. Plik jest poza allowlistą: osobny temat dokumentacyjny (bez zmiany kodu).
2. Odtworzenie obserwabli w teście engine przepisuje regułę adaptera (`unit_highlight`, `mine_eligible_group`) w funkcji `layer_of`, bo engine nie zależy od crate renderera. Rozjazd adaptera i tej kopii wykryłby dopiero test po stronie renderera (osobny temat, wymaga bramki renderera).
3. Gałąź `buildModeOpen` bez klucza ulepszenia nie jest w wektorach: web przy `onOpenBuild` woła `clearPlayerUnitSelection()` (`main.ts:26702-26703`), więc zasięg i tak jest pusty. Producent traktuje tę gałąź jak „brak trybu” (bez zmian względem F6/Q6). Wołający (most DTO, #308) musi zachować to samo czyszczenie zaznaczenia.
4. `reachable` w DTO to warstwa wizualna. Logiczny zbiór `reachable` webu (klik ruchu) nie jest tu modelowany i zmiana go nie dotyczy.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (Opus wg dispatchu).
DEPLOY/PUSH: NIE WYKONANO (brak push do parity, brak integracji).

## Commit
SHA kodu i raportu: podany w odpowiedzi Operatora dla orkiestratora (commit zawiera ten plik, więc SHA nie może być w nim wpisany bez zmiany SHA).
