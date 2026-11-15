# 02a — Obrona Operatora (Haiku): ZDOBYCIE-MIASTA-ROZPOZNANIE (#175 / #115), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1
GOAL: Odpowiedzieć na zarzuty 1-6 z `02-evaluator.md` (commit `e4ab636db`): każdy PRZYJĘTY (poprawka + dowód) albo ODRZUCONY (dowód z pinu/parity). Poprawki tekstu raportu podane poniżej jako gotowe wiersze do wklejenia do `01-rozpoznanie.md` przez FC.
ZMIANY/COMMIT: tylko ten plik (`02a-obrona.md`). Zero zmian w `gra/`, `rust-port/`, zero zmian w `01-rozpoznanie.md` (korekta w tym pliku, nie w cudzym pliku). Brak push.
TESTY: NIE_ZMIERZONO — tryb wyłącznie odczytu (`git grep`/`git show`), bez `cargo`/`npm`. Wszystkie numery linii sprawdzone na pinie `07d2fbd72` (web) i `d5a52a980` (Rust, `origin/rust-port/parity-v2`).
BLOKADY: brak.
RUNDY: 1/5 (obrona w ramach rundy 1)
NASTĘPNY KROK: Final Control (Sonnet) — weryfikacja korekt z sekcji „Korekty do 01” i decyzja o wpisaniu zakresu z zarzutu 4.
DEPLOY/PUSH: NIE WYKONANO

## Werdykty na zarzuty

| # | Zarzut Evaluatora | Werdykt |
|---|---|---|
| 1 | Krok 15: `noteCityCapture` podany jako `main.ts:17830+`; Rust `:50` | PRZYJMUJĘ |
| 2 | Krok 16: `main.ts:17820, :17834 okolice`; wrappery bez plik:linia | PRZYJMUJĘ |
| 3 | Krok 13: `recordCityCaptureEvent` podany jako `main.ts:17830+` | PRZYJMUJĘ |
| 4 | Luka zakresu: aneksja, cesja, bunt, fort pominięte bez wpisu o wyłączeniu | PRZYJMUJĘ |
| 5 | Stale komentarze w kodzie Rust (`siege_surrender.rs:37`, `playable.rs:630`) | PRZYJMUJĘ |
| 6 | Status „ZINTEGROWANE wewnątrz funkcji” zbyt mocny | PRZYJMUJĘ |

Zarzutów odrzuconych: 0. Sekcja „Potwierdzone bez zarzutu” w `02-evaluator.md` nie wymaga odpowiedzi.

## Odpowiedzi szczegółowe

### Zarzut 1 — krok 15 (`noteCityCapture`) — PRZYJMUJĘ

Dowód (pin `07d2fbd72`, `git grep 'noteCityCapture('`):
- wywołania: `gra/src/main.ts:17706` (kapitulacja głodowa), `gra/src/main.ts:36047` (bitwa);
- definicja: `gra/src/ui/eliminationSpectacle.ts:138` (nie `main.ts`).

Dowód (Rust, `d5a52a980`):
- tablica `TRANSFER_EFFECTS` zaczyna się w `rust-port/engine/src/domain/siege_transfer.rs:50` — to jest wartość z raportu, ale to początek tablicy, nie wpis;
- wpis `"noteCityCapture"` to krotka `siege_transfer.rs:95-100` (nazwa w `:96`), status `Ported("siege_transfer_q5::note_city_capture (wolajacy po apply_transfer; NIE w apply_transfer ...)")`;
- funkcja: `rust-port/engine/src/domain/siege_transfer_q5.rs:92` (`pub fn note_city_capture`).

Werdykt: zarzut trafny. Raport podał niedokładne odwołanie web i błędną lokalizację wpisu Rust.

### Zarzut 2 — krok 16 (wonder watch) — PRZYJMUJĘ

Dowód (pin `07d2fbd72`, `git grep 'beginWonderTransferWatch|settleWonderTransfer'`):
- definicje: `gra/src/main.ts:4232` (`beginWonderTransferWatch`), `:4240` (`settleWonderTransfer`), wymóg kolejności w komentarzu `:4230`;
- wywołania begin/settle, z parami:
  - fort: `:16116` / `:16124`;
  - zakładanie miasta: `:16142` / `:16144` (poza zakresem zdobycia — patrz zarzut 4);
  - kapitulacja głodowa: `:17698` / `:17705`;
  - aneksja: `:35272` / `:35287`;
  - bitwa: `:36060` / `:36089`;
  - cesja: `:36478` / `:36481`;
  - bunt: `:39563` / `:39568`.

Dowód (Rust, `d5a52a980`):
- wrappery: `rust-port/engine/src/domain/siege_wonder_wrappers.rs:45` (`begin_wonder_transfer_watch`), `:107` (`settle_wonder_transfer`);
- rdzeń planu: `rust-port/engine/src/domain/siege_wonder_watch.rs:61` (`plan_wonder_transfers`), `:106` (`apply_wonder_transfers`).

Werdykt: zarzut trafny. Słowo „okolice” przy wymaganym plik:linia było nieprecyzyjne; wiersz 16 w korekcie poniżej ma pełne lokalizacje.

### Zarzut 3 — krok 13 (`recordCityCaptureEvent`) — PRZYJMUJĘ

Dowód (pin `07d2fbd72`, `git grep 'recordCityCaptureEvent'`):
- definicja: `gra/src/main.ts:10650`;
- wywołania: `:17848` (kapitulacja), `:35647` i `:35724` (w ciele `runCapitalCapturePlunder`, którego def to `:35558`, a kolejna funkcja zaczyna się od `:35785` — więc oba wywołania leżą wewnątrz plundera), `:36249` (bitwa);
- `:26399`, `:35759`, `:35765` to komentarze, nie wywołania.

Werdykt: zarzut trafny. Raport miał `main.ts:17830+`, co nie wskazuje żadnego z wywołań.

### Zarzut 4 — luka zakresu web — PRZYJMUJĘ

Dowód (pin `07d2fbd72`):
- aneksja: wonder watch `:35272`/`:35287`, `clearCityStateFlagOnCapture` `:35279`;
- cesja: wonder watch `:36478`/`:36481`, `clearCityStateFlagOnCapture` `:36484`;
- bunt/rebelia: wonder watch `:39563`/`:39568`;
- fort: wonder watch `:16116`/`:16124`.
- `applyCapturePopulationLoss` (def `gra/src/game/cities.ts:1235`) wołany tylko w `post-battle-map.ts:508` i `main.ts:17700`;
- `applyPostCaptureLawOnCapture` (def `gra/src/game/post-capture-law.ts:62`) wołany tylko w `post-battle-map.ts:573` i `main.ts:17702`.

Wniosek z dowodu: aneksja, cesja, bunt i fort NIE wołają `applyCapturePopulationLoss` ani `applyPostCaptureLawOnCapture`, więc nie są ścieżką zdobycia miasta w rozumieniu dispatchu (`runCapitalCapturePlunder`, `applyCaptureTransfer` i skutki). Są jednak zmianą właściciela miasta, która dotyka tych samych wrapperów cudów i flagi miasta-państwa. Raport powinien to wyłączyć jawnie, zamiast sugerować kompletność.

Działanie: dopisano sekcję „Zakres i wyłączenia” (poniżej) z listą tych ścieżek, ich lokalizacją i statusem NIE_ZMIERZONO po stronie Rust. Nie badano Rust dla aneksji/cesji/buntu/fortu — to jest jawnie NIE_ZMIERZONO, nie wniosek.

Werdykt: zarzut trafny w kwestii jawności zakresu. Rozszerzenia tabeli o te ścieżki nie robię w tej rundzie (dispatch wskazuje zakres bitwa + kapitulacja + plunder).

### Zarzut 5 — stale komentarze w kodzie Rust — PRZYJMUJĘ

Dowód (Rust, `d5a52a980`):
- `rust-port/engine/src/domain/siege_surrender.rs:37`: `beginWonderTransferWatch / settleWonderTransfer | wrapper: brak ... | BRAK (wrapper)` — stale, bo `rust-port/engine/src/domain/mod.rs:133` deklaruje `pub mod siege_wonder_wrappers;`, a wrappery są w `siege_wonder_wrappers.rs:45` i `:107`;
- `rust-port/engine/src/domain/playable.rs:629-631`: komentarz „BRAK wolajacego w produkcji: `apply_transfer_with_effects` nie jest wolany poza testami” przy `pub fn power_record_city_capture` (`:631`). Sprawdzono `git grep -n 'power_record_city_capture' d5a52a980 -- rust-port/engine/src`: jedyne trafienie to definicja `playable.rs:631`. W `siege_transfer.rs` nie ma wywołania `power_record|record_capture_power_gain` (ciało `apply_transfer_with_effects` od `:340` tego nie woła).

Korekta wniosku z `playable.rs:630`: brak wołającego `power_record_city_capture` NIE wynika z tego, że `apply_transfer_with_effects` nie jest wołany — ta funkcja go nie woła nawet gdyby była podpięta. Wołającego nie ma w `engine/src` w ogóle. Komentarz jest błędnym uzasadnieniem; nie wolno na nim opierać tematu #115.

Werdykt: zarzut trafny. Oba stale komentarze odnotowano w korekcie poniżej jako zależności do uporządkowania w temacie #115; kod nie jest zmieniany w tym temacie.

### Zarzut 6 — status „ZINTEGROWANE wewnątrz funkcji” — PRZYJMUJĘ

W `01-rozpoznanie.md` słowo „ZINTEGROWANE” występuje tylko w wierszu 5 (wiersz 6 ma już „BRAK”). Wiersz 5 opisuje wyłącznie to, że skutki są w ciele `apply_transfer_with_effects` (`siege_transfer.rs:386-392`), bez porównania kolejności i wartości z `main.ts:17700-17880`. Zgodnie z zarzutem status poprawiono na „ISTNIEJE, zgodność NIE_ZMIERZONO”. Podsumowanie liczbowe (0 z 20 w produkcji) się nie zmienia, bo żaden wiersz nie ma wołającego w produkcji.

## Korekty do 01-rozpoznanie.md (do wklejenia przez FC; 01 pozostaje nietknięty w `92393c2c1`)

Wiersz 5 (status):
`| 5 | Zmiana city.ownerId, flaga miasta-panstwa (clearCityStateFlagOnCapture), foundedByOwner | Wewnatrz apply_transfer_with_effects: siege_transfer.rs:386-392 (city.found_by_owner = Some(false) na :392); clear_city_state_flag_on_capture w tej samej funkcji | Brak (jw.) | ISTNIEJE (wewnatrz funkcji), wolajacy BRAK; zgodnosc z pinem NIE_ZMIERZONO |`

Wiersz 13 (web):
`| 13 | recordCityCaptureEvent (def gra/src/main.ts:10650; wolajacy: main.ts:17848 kapitulacja, :35647 i :35724 wewnatrz runCapitalCapturePlunder (def :35558), :36249 bitwa) | CaptureEventStore::record_city_capture_event — siege_capture_events.rs:182. Plunder tylko dopisuje wpis do ui_calls (siege_capital_plunder.rs:~575-585, :~659-669) i NIE zapisuje do store (komentarz :19-27) | Brak wolajacego zapisujacego do store | BRAK |`

Wiersz 15 (web i Rust):
`| 15 | noteCityCapture (def gra/src/ui/eliminationSpectacle.ts:138; wolajacy: gra/src/main.ts:17706 kapitulacja, :36047 bitwa) | Wpis Ported w TRANSFER_EFFECTS: wpis krotka siege_transfer.rs:95-100 (nazwa :96); funkcja siege_transfer_q5::note_city_capture (siege_transfer_q5.rs:92); NIE w apply_transfer | Brak | BRAK (Ported, nie podpiety) |`

Wiersz 16 (web i Rust):
`| 16 | beginWonderTransferWatch / settleWonderTransfer (def gra/src/main.ts:4232 / :4240; wywolania begin/settle: fort :16116/:16124, zakladanie miasta :16142/:16144, kapitulacja :17698/:17705, aneksja :35272/:35287, bitwa :36060/:36089, cesja :36478/:36481, bunt :39563/:39568) | siege_wonder_wrappers::begin_wonder_transfer_watch (siege_wonder_wrappers.rs:45), settle_wonder_transfer (:107); plan siege_wonder_watch.rs:61 (plan_wonder_transfers), :106 (apply_wonder_transfers); wpis TRANSFER_EFFECTS siege_transfer.rs:90 z adnotacja NIE podpiete w apply_transfer | Brak | BRAK |`

Uwaga: w wierszu 13 i 16 zakres „zdobycie” obejmuje tylko wywołania z kapitulacji, bitwy i plundera; pozostałe pozycje (zakładanie, aneksja, cesja, bunt, fort) są poza zakresem tego tematu — patrz niżej.

Dopisek do 01 (nowa uwaga, zarzut 5): `rust-port/engine/src/domain/siege_surrender.rs:37` ma stale komentarz „BRAK (wrapper)” dla begin/settle wonder watch; wrappery istnieją (`siege_wonder_wrappers.rs:45`, `:107`; deklaracja `mod.rs:133`). Komentarz `playable.rs:630` przypisuje brak wołającego `power_record_city_capture` do nie-wołania `apply_transfer_with_effects` — błędne uzasadnienie (patrz zarzut 5).

## Zakres i wyłączenia (dopisek do 01, zarzut 4)

Poza zakresem tego rozpoznania (NIE_ZMIERZONO po stronie Rust, bez wniosku o zgodności):
- aneksja: web `gra/src/main.ts:35272-35287` (wonder watch + `clearCityStateFlagOnCapture` `:35279`); bez `applyCapturePopulationLoss` i `applyPostCaptureLawOnCapture`;
- cesja: web `gra/src/main.ts:36478-36484`; bez `applyCapturePopulationLoss` i `applyPostCaptureLawOnCapture`;
- bunt/rebelia: web `gra/src/main.ts:39563-39568`; bez `applyCapturePopulationLoss` i `applyPostCaptureLawOnCapture`;
- fort: web `gra/src/main.ts:16116-16124`; bez `applyCapturePopulationLoss` i `applyPostCaptureLawOnCapture`;
- zakładanie miasta: web `gra/src/main.ts:16142-16144` (migawka cudów przy założeniu; nie jest zmianą właściciela przez zdobycie).

Zakres objęty tabelą: bitwa (`post-battle-map.ts`, `main.ts:36047-36249`), kapitulacja głodowa (`main.ts:17698-17848`) i plunder stolicy (`main.ts:35558-35784`).

## Co FC ma sprawdzić

1. Czy korekty wierszy 5, 13, 15, 16 zgadzają się z pinem (komendy w „Metoda” poniżej).
2. Czy sekcja zakresu jest wystarczająca dla zarzutu 4 (alternatywa: rozszerzenie tabeli — ODRZUCONA w tej rundzie, bo dispatch wskazuje inny zakres).
3. Czy komentarz `playable.rs:630` i wpis `siege_surrender.rs:37` trafiają do listy stale komentarzy dla tematu #115 (nie są poprawiane w tym temacie — allowlista wyłącznie run dir).

## Metoda (do odtworzenia)

- `git grep -n 'noteCityCapture(' 07d2fbd72 -- gra/src`
- `git grep -n 'beginWonderTransferWatch|settleWonderTransfer' 07d2fbd72 -- gra/src`
- `git grep -n 'recordCityCaptureEvent' 07d2fbd72 -- gra/src`
- `git grep -n 'clearCityStateFlagOnCapture|applyCapturePopulationLoss|applyPostCaptureLawOnCapture' 07d2fbd72 -- gra/src`
- `git show 07d2fbd72:gra/src/main.ts | grep -n -E '^\s*(export )?function ' ` (granice `runCapitalCapturePlunder` 35558-35784)
- `git grep -n 'TRANSFER_EFFECTS|"noteCityCapture"|"settleWonderTransfer"' d5a52a980 -- rust-port/engine/src/domain/siege_transfer.rs`
- `git grep -n 'power_record_city_capture|record_capture_power_gain' d5a52a980 -- rust-port/engine/src`
- `git grep -n -E 'pub fn (begin|settle)_wonder_transfer|pub fn (plan|apply)_wonder_transfers' d5a52a980 -- rust-port/engine/src`
