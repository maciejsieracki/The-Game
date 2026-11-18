# R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE — Obrona Operatora r1 (02a)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE
GOAL: ramka `GetRenderFrame` przy otwartym panelu budowy / trybie podświetlenia przywraca `selection`,
`reachable`, `pathRoute` po `selectPlayerUnit` (web), addytywnie, domyślnie D-OP-3 bajt w bajt.
ZMIANY/COMMIT: baza obrony = commit Evaluatora `6bdc3f60f` (gałąź `eval/p4-371-t5a-reselect`), nad commitem
Operatora `2fc8fa4c106277c33a33c8e6292405bcab890ac4` (rodzic = baza dispatchu `origin/rust-port/parity-v2` =
`47f8b2021c9736824f45054981d78660ad466594`). Obrona dodaje: `rust-port/engine/tests/p4_371_reselect.rs`
(jeden przypadek testu, U1) i ten raport. Gałąź `obrona/p4-371-t5a-reselect`; SHA commitu obrony w
odpowiedzi strukturalnej i w `git log` gałęzi. Kod produkcyjny (`render_frame.rs`) bez zmian.
TESTY: §2 (wszystkie EXIT 0; mutant g zabity).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Odpowiedzi na zarzuty

### U1 (mutant g przeżywa) — PRZYJMUJĘ
Pin `main.ts:32273`: `if (buildModeOpen && (foundCityMode || activeImprovementKey || activeWonderId))` —
pusty string jest w JS fałszywy, więc przy `activeImprovementKey = ""` trasa kursora NIE jest czyszczona.
Kod (`hover_path_blocked`, `.is_some_and(|k| !k.is_empty())`) był poprawny, brakowało asercji.
Poprawka: w `flaga_true_przywraca_we_wszystkich_trybach` dodany przypadek
`active_improvement_key: Some(String::new())` + `reselected(WARRIOR)` z oczekiwaną trasą = trasa poza trybem
budowy (`path_visible = true`).
Dowód: mutant g (`.is_some_and(|k| !k.is_empty())` → `.is_some()` w `render_frame.rs`, zastosowany
tymczasowo i cofnięty, `git diff --stat src` pusty po cofnięciu) →
`flaga_true_przywraca_we_wszystkich_trybach ... FAILED` (`tests/p4_371_reselect.rs:274`), wynik
`7 passed; 1 failed`. Bez mutanta: `8 passed; 0 failed`.

### U2 (D-371-5: zerowanie flagi przy każdym `refreshBuildHighlight`) — PRZYJMUJĘ (ustalenie dla orkiestratora; `REJESTR-RUST.md` poza allowlistą)
Potwierdzam z pinu: `refreshBuildHighlight` (`main.ts:16351-16396`) zmienia wyłącznie jedną warstwę
`unitRenderer.setHighlight`/`clearHighlight` i warstwę kopalni (`refreshMineEligibleOverlay`/
`clearMineEligibleOverlay`); NIE dotyka `selectedId`, `reachable` (zmiennej) ani `setSelectionHex`.
Po `selectPlayerUnit` (`:7233-7268`) i późniejszej zmianie klucza web pokazuje więc: pierścień zaznaczenia
(zostaje), a warstwę `setHighlight` nadpisaną podświetleniem budowy (albo wyczyszczoną dla kopalni —
`:16386-16389`). Gdyby klient zerował flagę przy każdym `refreshBuildHighlight` (litera D-371-5 z
`R-RUSTPORT-P4-371-CLIENT-ROZP-Q1/00-rozpoznanie.md:216`), ramka wróciłaby do D-OP-3 i zgubiła pierścień
— rozjazd z webem. Silnik T5a jest na to odporny: przy fladze `true` ramka zwraca jednocześnie
`selection`/`reachable`/`pathRoute` ORAZ `buildHighlight` (kryterium końca 1, test
`scenariusz_webu_open_build_select_klucz`), więc decyzja dotyczy wyłącznie klienta/renderera (T5b).
Rekomendacja do doprecyzowania D-371-5 przed T5b (decyzja techniczna orkiestratora):
1. flaga `unitSelectedAfterBuildOpen` zerowana tylko przy zmianie trybu budowy (`onOpenBuild`/zamknięcie
   panelu, wejście/wyjście z `foundCityMode`/`activeWonderId`), nie przy zmianie klucza;
2. osobny stan klienta „ostatni pisarz warstwy `setHighlight`” (zasięg jednostki vs podświetlenie budowy),
   ustawiany przy `selectPlayerUnit` i przy `refreshBuildHighlight`; renderer wybiera warstwę wg niego,
   pierścień i trasa idą z ramki niezależnie.
Zmiana kodu w T5a: brak (poza allowlistą i bez wpływu na silnik).

### U3 (nieaktualny komentarz `overlays_view.rs:507`) — PRZYJMUJĘ jako dług (plik poza allowlistą)
`overlays_view.rs:507-508` mówi, że `unit_overlays_view` jest „JEDYNYM wołającym” `reachable_overlay`,
`path_route_overlay`, `selection` i `build_highlight`; od D-OP-8 `render_frame.rs` (gałąź `if build_branch`)
woła trzy pierwsze bezpośrednio (uzasadnienie w komentarzu gałęzi: `unit_overlays_view` zeruje `reachable`
w trybie podświetlenia, Q6-2). Dług: **DŁUG-371-T5A-DOC-OVERLAYS** — poprawić komentarz w
`overlays_view.rs` (mikrotemat dokumentacyjny, Haiku).

### U4 (podgląd planowanego marszu przy wybranym kluczu) — PRZYJMUJĘ jako dług
Pin: `selectPlayerUnit` woła `refreshPlannedMarchPreview(u.id)` (`:7265-7267`) niezależnie od trybu
budowy; trasa planu znika dopiero przy ruchu myszy (`clearPathRoute`, `:32275`). Ramka bezstanowa
(D-R3-3) nie zna kolejności „zaznaczenie → ruch myszy”, więc przy `hover_path_blocked` zwraca zawsze
`None`. Odwzorowanie wymaga stanu klienta (jak U2). Dług: **DŁUG-371-T5B-PLAN-PREVIEW** (T5b: klient
przekazuje, czy od zaznaczenia był ruch myszy, albo ramka bierze trasę planu przy braku `hover`).

### U5 (scenariusz modelowany ręcznie, nie wykonaniem pinu) — ODRZUCAM
Dispatch (§KRYTERIA KOŃCA) wymaga „wektora scenariusza webu” w kolejności `onOpenBuild` →
`selectPlayerUnit` → zmiana klucza, bez wymogu wykonania tekstu pinu. Każdy krok testu cytuje linie pinu
(`:26702-26703`, `:7233-7260`, `:16351-16396`, `:32273-32278`), a oczekiwania są wyprowadzone z tych
samych producentów (`reachable_overlay`, `selection`, `path_route_overlay`) co ścieżka D-OP-4 poza trybem
budowy, więc test sprawdza równość z wzorcem, nie ręcznie wpisane liczby. Evaluator sam określa to jako
niewymagane przez dispatch.

### U6 (brak `isMe` dla `selection` i gałęzi panelu oblężenia) — ODRZUCAM w zakresie T5a (dług odziedziczony, bez zmiany)
Zachowanie gałęzi D-OP-8 jest identyczne z D-OP-4 poza trybem budowy (test
`flaga_true_przywraca_we_wszystkich_trybach`: `selection`/`reachable` = ramka `plain_selected`). T5a nie
wprowadza nowej rozbieżności; `isMe` (`:7236`) i `isSiegeMapPanelOpen()` (`:7250-7252`) należą do
istniejącego długu D-OP-4. Zostawiam w sekcji „Długi” jako **DŁUG-D-OP-4-ISME-SIEGE** do osobnego tematu.

### U7 (brak SHA w 01-operator-r1.md) — PRZYJMUJĘ
SHA commitu Operatora: `2fc8fa4c106277c33a33c8e6292405bcab890ac4`, rodzic = baza dispatchu
`47f8b2021c9736824f45054981d78660ad466594` (`git log --oneline -2 2fc8fa4c1`). Zapisane w nagłówku tego
raportu. `01-operator-r1.md` nie jest zmieniany (raport historyczny rundy).

### Bramki Evaluatora (notatka, nie zarzut)
Przyjmuję do wiadomości; odtworzone niezależnie po zmianie obrony (§2).

## 2. Bramki obrony (w `rust-port/engine`; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; `CARGO_TARGET_DIR` w scratchpadzie `t5areselect/obrona/target`, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_render_frame --test bridge_contract --test p4_364_dto_bridge --test p4_364_bridge_layers --test p4_371_reselect` | EXIT 0 (37 + 9 + 5 + 13 + 8 passed) |
| mutant g (`.is_some()`) | ZABITY (`flaga_true_przywraca_we_wszystkich_trybach` FAILED) |
| pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`) | EXIT 0 (536 binarek, 4033 passed, 0 failed, 1 ignored spoza tematu) |

Wolny dysk przed bramkami: 9,7 GB (≥ 8 GB); build renderera niepotrzebny (zmiana tylko w teście silnika).
`git diff --check` czysty; brak `#[ignore]`; testy `p4_364_*` niezmienione.

## 3. Długi
- **T5b** (renderer + klient): wybór warstwy `setHighlight` wg stanu klienta (U2), ustawianie flagi przy
  `select_unit` w trybie budowy, zerowanie tylko przy zmianie trybu budowy (doprecyzowanie D-371-5, U2).
- **T3b**: typy TS `RenderUiParams` (`unitSelectedAfterBuildOpen`).
- **DŁUG-371-T5A-DOC-OVERLAYS** (U3): komentarz `overlays_view.rs:507-508`.
- **DŁUG-371-T5B-PLAN-PREVIEW** (U4): trasa planowanego marszu po `selectPlayerUnit` przy wybranym kluczu.
- **DŁUG-D-OP-4-ISME-SIEGE** (U6): `isMe` dla `selection` i gałąź panelu oblężenia `selectPlayerUnit`.
