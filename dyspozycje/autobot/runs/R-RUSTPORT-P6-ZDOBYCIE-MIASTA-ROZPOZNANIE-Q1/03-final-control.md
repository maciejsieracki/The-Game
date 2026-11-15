# 03 — Final Control (Sonnet): ZDOBYCIE-MIASTA-ROZPOZNANIE (#175 / #115), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1
GOAL: Rozpoznanie (tylko odczyt): które funkcje ścieżki zdobycia miasta mają wołającego w produkcji Rust (baza `d5a52a980`) względem webu (pin `07d2fbd72`).
ZMIANY/COMMIT: tylko katalog runu: korekty w `01-rozpoznanie.md` (wiersze 5, 13, 14, 15, 16, 20 + sekcje „Zakres i wyłączenia” i „Stale komentarze”) oraz ten plik. Zero zmian w `gra/` i `rust-port/`. Brak push.
TESTY: NIE_ZMIERZONO — tryb wyłącznie odczytu (`git show`/`git grep`), bez `cargo`/`npm`. Numery linii zweryfikowane samodzielnie przez FC.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator integruje dokumenty runu; wpięcie #115 dzielone na klocki wg sekcji ZALEŻNOŚCI w `01-rozpoznanie.md` (zależne od W8 i #113); decyzje poniżej.
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja zakresu commitów (samodzielna)

`git diff --name-only 9cbadc54a 2fac01914` (baza → obrona) zwraca wyłącznie trzy pliki w `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1/`: `01-rozpoznanie.md` (92393c2c1), `02-evaluator.md` (e4ab636db), `02a-obrona.md` (2fac01914). Zero zmian w `gra/`, `rust-port/`, poza runem. Łańcuch rodziców: 9cbadc54a → 92393c2c1 → e4ab636db → 2fac01914. Zakres POPRAWNY.

## Weryfikacja dowodów (FC, samodzielnie, `git grep`/`git show`)

Web (pin `07d2fbd72`) — potwierdzone: `noteCityCapture` def `ui/eliminationSpectacle.ts:138`, wołający `main.ts:17706`, `:36047`; `recordCityCaptureEvent` def `:10650`, wołający `:17848`, `:35647`, `:35724`, `:36249`; `beginWonderTransferWatch`/`settleWonderTransfer` def `:4232`/`:4240`, pary `16116/16124`, `16142/16144`, `17698/17705`, `35272/35287`, `36060/36089`, `36478/36481`, `39563/39568`; `applyCapturePopulationLoss` wołany tylko `post-battle-map.ts:508`, `main.ts:17700`; `applyPostCaptureLawOnCapture` tylko `post-battle-map.ts:573`, `main.ts:17702`; `runCapitalCapturePlunder` wołany `main.ts:17828`, `:36221`; `recordCivElimEvent` `:35767`, `eliminateOwner` `:35769`; `applyCaptureTransfer` — zero trafień w pinie.
Rust (`d5a52a980`) — potwierdzone: brak wołającego w `engine/src` poza testami i komentarzami dla `run_capital_capture_plunder`, `apply_transfer_with_effects` (jedyne wywołanie to wrapper `apply_transfer` `siege_transfer.rs:323`, sam bez wołającego), `eliminate_owner`, `power_record_city_capture`, `resolve_surrender_path`, `surrender_tick_action` (tylko test-moduł), `handle_siege_capitulation_phase` (tylko `surrender_tick_action` + testy), `combat::resolve`/`resolve_combat` (`combat.rs:321`, `:382` — wzajemnie), `CaptureEventStore`, `note_city_capture`, wrappery cudów. Dwa akumulatory zdobyczy: `siege_capital_plunder.rs:458` (zapis `:611-615`) vs `war_turn_state.rs:145` (zapis `:654`) — brak mostu. `TRANSFER_EFFECTS` wpis `noteCityCapture` `siege_transfer.rs:95-100`. Stale komentarze `siege_surrender.rs:37` (`mod.rs:133` deklaruje `siege_wonder_wrappers`) i `playable.rs:630` — potwierdzone.

## Orzeczenia na zarzuty Evaluatora (02-evaluator.md) i Obrony (02a-obrona.md)

| # | Zarzut | Orzeczenie | Działanie FC |
|---|---|---|---|
| 1 | Krok 15: błędne `main.ts:17830+`, Rust `:50` | NAPRAW (trafny, Obrona przyjęła) | Wiersz 15 w `01` poprawiony: `17706`/`36047`, def `eliminationSpectacle.ts:138`, Rust `siege_transfer.rs:95-100`, `siege_transfer_q5.rs:92` |
| 2 | Krok 16: „okolice”, brak plik:linia wrapperów | NAPRAW | Wiersz 16 poprawiony: pary begin/settle, def `:4232`/`:4240`, wrappery `siege_wonder_wrappers.rs:45`/`:107` |
| 3 | Krok 13: nieprecyzyjne `17830+` | NAPRAW | Wiersz 13 poprawiony: `:17848`, `:35647`, `:35724`, `:36249`, def `:10650` |
| 4 | Luka zakresu web (aneksja, cesja, bunt, fort) | NAPRAW (jawne wyłączenie) + DO DECYZJI CZŁOWIEKA (czy objąć w #115) | Dodana sekcja „Zakres i wyłączenia”; rozszerzenie tabeli odrzucone jako poza dispatchem; FC dodał, że aneksja też woła `eliminateOwner` (`:35300`) i `recordCivElimEvent` (`:35336`) |
| 5 | Stale komentarze (`siege_surrender.rs:37`, `playable.rs:630`) | NAPRAW (odnotowane w `01`; kod nietknięty — allowlista) | Dodana sekcja „Stale komentarze”; do uprzątnięcia w #115 |
| 6 | Status „ZINTEGROWANE” zbyt mocny (kroki 5-6) | NAPRAW | Wiersz 5: „ISTNIEJE (wewnątrz funkcji), wołający BRAK; zgodność NIE_ZMIERZONO”. Krok 6 miał już „BRAK” |

Dodatkowe korekty FC (poza zarzutami): wiersz 14 (`recordCivElimEvent` precyzyjnie `:35767`, aneksja `:35336`), wiersz 20 (zakres bloku kapitulacji `17698-17848` zamiast `17700-17830`). Wiersz 19 (`playerEverOwnedCityByOwner.add`) ma też wywołanie w bitwie `:36218` — uwaga drobna, kod tabeli nie wymaga zmiany wniosku (0 wołających w Rust).

Zarzuty „Potwierdzone, bez zarzutu” Evaluatora: zgodne z FC. Zarzuty odrzucone przez Obronę: 0; FC zgadza się z przyjęciem wszystkich 6.

## Wniosek końcowy rozpoznania (po korektach)

Żaden z 20 kroków ścieżki zdobycia miasta (bitwa + kapitulacja głodowa + plunder) nie ma wołającego w produkcji Rust; logika istnieje, wiring nie (zależny od W8 i pętli bitwy #113). Jedna rozbieżność stanu: dwa niescalone akumulatory zdobyczy Power. Ścieżki poza zakresem: NIE_ZMIERZONO. Zgodność wartości i kolejności Rust z pinem: NIE_ZMIERZONO.

## Do decyzji człowieka / orkiestratora

1. Zakres #115: czy obejmuje aneksję/cesję/bunt/fort, czy te ścieżki dostają osobne rozpoznanie (web rozstrzyga, co robią; to nie jest pytanie gameplay).
2. Status #114 ELIMINACJA-GRACZA „completed” przy `eliminate_owner` bez wołającego w produkcji — rozstrzygnięcie statusu (zakres domenowy vs wpięcie).
3. Nazwa `applyCaptureTransfer` z dispatchu nie istnieje w pinie — poprawić opis tematu #115 (`applyCityCaptureAfterBattle` + blok kapitulacji `main.ts:17698-17848`).
4. Akumulator zdobyczy Power: decyzja techniczna, która mapa jest źródłem prawdy (web ma jedną, `main.ts:2264`) — do zapisu w `REJESTR-RUST.md` bez pytania właściciela (zasada 9/11).
