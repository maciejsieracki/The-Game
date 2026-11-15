STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-WIRING-Q1 (#115 ZDOBYCIE-MIASTA-WIRING), runda r2 (dispatch 00-dispatch.md, DODATEK r2)
GOAL: podpiac `run_capital_capture_plunder` i akumulatory zdobyczy w produkcyjnej sciezce zdobycia stolicy (pin 07d2fbd72, gra/src/main.ts:17814-17828 i wolanie przy zdobyciu stolicy).
ZMIANY/COMMIT: brak zmian kodu. Dodano tylko ten raport. Baza: a381dd13f (sprawdzone: `merge-base --is-ancestor a381dd13f HEAD` OK; czubek origin/rust-port/parity-v2 jest juz f2bb11970, a381dd13f jest jego przodkiem). Nie pushowano, nie integrowano, gra/ i origin/main nietkniete, Cargo.lock nie zacommitowany.
TESTY: NIE_ZMIERZONO. Bramki (fmt, clippy, cargo test --lib, nowy test) nie uruchomione, bo nie napisano kodu. Dysk: `df -h /` = 16 GB wolne (powyzej progu 4 GB, DISK nie jest przyczyna).

BLOKADY (zmierzone przez git grep na bazie a381dd13f):
1. Brak produkcyjnego wolajacego `apply_transfer` / `apply_transfer_with_effects`. Jedyne wolania sa w testach i w samym module siege_transfer.rs (`apply_transfer` deleguje do `apply_transfer_with_effects`). Galaz SurrenderPath::Transfer w siege_surrender.rs:183/350 jest tylko decyzja (zwraca sciezke), nie wykonuje przejecia miasta. Nie istnieje wiec produkcyjna sciezka zdobycia stolicy, do ktorej mozna wpiac wolajacego run_capital_capture_plunder.
2. Brak implementacji traitow potrzebnych do wolania: `OwnerResourceAccess` (siege_capital_plunder.rs:56) i `PlunderLabels` (siege_capital_plunder.rs:441) nie maja implementacji w produkcji (tylko testy/generator). PlunderLabels wymaga etykiet webowych (civLabelForOwner, mocLabel, civDisplayNameForOwner, captureReportOneLine, buildSpectacleForElimination); captureReportOneLine istnieje (siege_capture_events.rs:99), reszta nie.
3. Kolejnosc z pinu (lost_power liczone PRZED eliminateOwner, po applyBarbarianAware...) wymaga, by wolajacy mial dostep do stanu przed transferem. Tej kolejnosci nie egzekwuje ani Rust, ani allowlista r2.
4. Zakres poza allowlista: produkcyjne wpiecie wymaga zmian w turn_war_pipeline.rs (faza kapitulacji) i siege_surrender.rs oraz mutacji miasta/jednostek w PlayableState (playable.rs). Allowlista r2 obejmuje tylko akumulatory w playable.rs, nie mutacje miast ani pipeline.

Zaleznosci: wiring transferu miasta zalezy od W8 (pipeline kapitulacji wykonujacy przejecie). W backlogu: #106 R7K7C-WIRING, #120 CRED-HAK-WYPOWIEDZENIE, #176 R7K7C-STATUS.

RUNDY: 2/5 (r1 zakonczona bez kodu z powodu bledu worktree; r2 bez kodu z powodu blokad 1-4).
NASTEPNY KROK: decyzja orkiestratora / wlasciciela (pytanie ABC ponizej). Bez decyzji nie ma podstawy do kodu.

PYTANIE ABC DO WLASCICIELA (przedmiot: jak wpiac plądrowanie stolicy, skoro nie ma produkcyjnej sciezki przejecia miasta)
Opis: `run_capital_capture_plunder` (siege_capital_plunder.rs:504) jest gotowa logika, ale nie ma wolajacego w produkcji, bo sama sciezka przejecia miasta (apply_transfer_with_effects, siege_transfer.rs:340) nie jest wolana z pipeline kapitulacji (turn_war_pipeline.rs / siege_surrender.rs). Brak tez implementacji OwnerResourceAccess/PlunderLabels w produkcji. Kazda opcja zmienia zakres tematu.
A) Pelne wpiecie: rozszerzyc allowliste o turn_war_pipeline.rs, siege_surrender.rs, playable.rs (mutacje miasta/jednostek) i zrobic produkcyjny orkiestrator przejecia (transfer + plundering + akumulatory) w jednym temacie. Za: kompletny parytet, jeden temat domyka #115. Przeciw: duzy diff, wielorundowy, zalezy od W8, wysokie ryzyko regresji, poza obecnym dispatchem.
B) Mala warstwa: w siege_transfer.rs dodac produkcyjna funkcje-wrapper (transfer -> run_capital_capture_plunder -> record_capture_power_gain) z wektorami pinu i testem; podpiecie w pipeline zrobic osobnym tematem. Za: maly, testowalny diff, zgodny z allowlista r2, daje realny wolajacy do testu. Przeciw: w produkcji nadal nic nie wola wrappera do czasu osobnego tematu; kryterium 1 spelnione tylko formalnie.
C) Odlozyc #115 do czasu zamkniecia W8 (#106, #120) i przejecia pipeline. Za: brak martwego kodu, brak ryzyka. Przeciw: stan parytetu zostaje, temat wraca pozniej.
REKOMENDACJA: B, a potem osobny temat na wpiecie wrappera w pipeline kapitulacji. Uzasadnienie: spelnia obecna allowliste, daje testowalny wektor pinu dla kolejnosci i akumulatora zdobyczy, a nie rozszerza zakresu do pipeline bez decyzji.

DEPLOY/PUSH: NIE WYKONANO
