# R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1 — 02 Evaluator (adwersarialny, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (read-only)
TEMAT: R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1
GOAL: zakres wektorów K5-LOOP-AUTO (#234 / #118 / #157)
ZMIANY/COMMIT: ten plik; commit Operatora 96bf9232 zmienia wyłącznie `01-rozpoznanie.md` (git diff --stat f7baa3848 96bf9232: 1 plik, +166) = zgodne z allowlistą. Kod, `gra/`, Cargo.lock nietknięte.
TESTY: bramki cargo (fmt/clippy/test) N/D: dispatch to rozpoznanie tylko do odczytu, brak zmian kodu. Zweryfikowano odczytem: 36 nazw funkcji pinu (07d2fbd72) pod podanymi numerami linii (wszystkie zgodne), kluczowe cytaty pinu (3615-3627, 6048-6125, 6136, 6284-6298, 17348-17352, 17612-17630, 5752-5800, 5961-5970, 9449-9464) oraz Rust (`siege_tactics_loop.rs` 541-545, 698-712, 753-758, 975-1010, `siege_tactics_autobatch.rs`, `siege_tactics_turnseq.rs`, `siege_tactics_roundcap.rs`, `siege_tactics_fastforward.rs`). Brak #[ignore] / osłabionych asercji (brak zmian kodu). Testy Rust nie były uruchamiane: zielony wynik wektorów NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control; Operator r2 tylko jeśli FC zażąda poprawek poniżej.
DEPLOY/PUSH: NIE WYKONANO

## Co się zgadza (sprawdzone)
- Numery linii pinu i większość linii Rust są poprawne. Teza główna jest prawdziwa: `BeginAutoBatchPhase` przerywa pętlę (`siege_tactics_loop.rs:541-545`), a stuby `perform_player_order`/`doctrine_step` zwracają `false` (753-758).
- Zależności #109 / #123 / #148 oraz brak tematu na tryb ręczny są spójne z kodem.

## Zarzuty (ponumerowane)

1. **V1 i V2 mają błędną zależność od #112 (istotne).** Raport mówi, że V1 ("bez grupy") nie ma zależności, a V2 ma ją tylko dla doktryny. Pin `_snapshotAutoBatchIntents` (5752-5800) planuje przez `_activateUnit(clone)`, a ta wywołuje `_executeGroupDoctrineStep` dla każdej jednostki z domyślną doktryną `steady` (17612-17621, 6092-6097). Jednostki "2 atk + 2 def bez grupy" (wejście V1) wchodzą więc na ścieżkę doktryny; generator wykonujący tekst pinu da plan z doktryny, a produkcyjnej implementacji `plan_unit` w Rust nie ma (autobatch.rs:264). Poprawnie: V1/V2 są niezależne od #112 tylko dla jednostek z `unitDoctrine='manual'` albo grupą `autoPlay=false` (a wtedy planowanie idzie dalej przez gałęzie strzelec/marsz, zależne od #148/#123). Naprawdę wolne od #112 są tylko V5 i V6 (finish, halt); sekcja 5 pkt 1 ("V1, V5, V6 od razu") jest przesadzona.
2. **V13 jest już POKRYTE, a raport każe pisać nowy wektor.** `round_cap_verdict` jest wspólny dla oblężenia i nie-oblężenia (`wall_present`), a `p6_siege_tactics_roundcap_vectors/vectors.json` zawiera 745 przypadków `wallPresent:false`. Gałąź FF_MAX_ROUNDS=400 / morale (pin 9449-9464, stała w linii 1125) jest więc wektorowo pokryta na poziomie modułu. Zależność od #109 jest fałszywa dla samego werdyktu (czyta `_armyMoraleRatio`, które jest wejściem). Opis "400 tur, remis morale → obrońca" jest błędny: pin nie zwraca remisu przy morale, tylko `ratioA <= ratioD ? obronca : atakujacy`. Zostaje co najwyżej integracja przez `SiegeLoop`, nie nowy wektor.
3. **Status "POKRYTE" dla `ProdBody` zawyża stan produkcyjny.** Wiersze 2b/2c (6049-6050, `_doMeleeAttack`/`strike`, kontratak) oznaczono POKRYTE, ale nagłówek `siege_tactics_loop.rs:698-703` mówi wprost "NIE WPINAĆ do SiegeLoop", a `ProdBody::start` uznaje `wall_col>=0` za `oblezenie` (unported, ~990-1000), czyli ciało jest przeznaczone dla bitwy BEZ oblężenia, ale nie jest w produkcji podpięte. Raport nie mówi tego jawnie, a w ustaleniu 4 pisze, że pętla produkcyjna obsługuje tylko oblężenie, co razem z "POKRYTE" jest mylące. Wymagana adnotacja: POKRYTE (ciało, test) + BRAK (wiring #113).
4. **Łańcuch zależności niepełny.** Zadanie #112 jest zadeklarowane "po OUTCOME" (#109). Sekcja 4 podaje V7/V8 jako zależne od #112, ale nie od #109 przechodnio; kolejność powinna brzmieć #109 → #112 → V7/V8.
5. **Teza "praktycznie cała AUTO bez oblężenia w Rust jest poza zakresem" bez pomiaru.** Wynika z kodu pina; raport sam przyznaje, że nie zbadał pełnego `_executeGroupDoctrineStep` (NIE_ZMIERZONO). Brak też zaznaczenia, że w pinie atakujący w oblężeniu (poza machinami) też wchodzą w doktrynę (6092-6097), więc #112 dotyczy także oblężenia, a Rust taguje to samo "doktryna" w obu przypadkach.
6. **Drobne:** (a) raport nie uruchomił testów, a oznacza "POKRYTE (test)"; istnienie plików testowych potwierdzono (`p6_siege_tactics_autobatch.rs`, `_autophase.rs`, `_loop_body_pin.rs`), ich zielony wynik jest NIE_ZMIERZONO; (b) w sekcji 3 brak wektorów dla `_executeQueuedOrders` (3603) i `_ffEnterAuto` (3709), mimo wpisów CZĘŚCIOWO w tabeli.

## Werdykt
PASS-WITH-NOTES: rozpoznanie jest użyteczne, zmiany tylko w allowliście, tabela i numery linii wiarygodne. Do poprawy przed użyciem jako specyfikacji osobnego tematu: zarzuty 1 (V1/V2 a doktryna), 2 (V13 już pokryte) i 3 (adnotacja o niepodpiętym ProdBody).
