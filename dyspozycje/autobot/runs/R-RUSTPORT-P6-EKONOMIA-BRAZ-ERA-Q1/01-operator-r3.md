# OPERATOR r3 — R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (Haiku)

STATUS: BLOCK (wymagana decyzja orkiestratora; brak zmian kodu w tej rundzie)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (#15 / T-A): przepustowosc brazu per epoka, runda 3 (dodatek r3)
GOAL: zregenerowac wektory running-web z pina 07d2fbd72 (zamiast 4bbef081d) tak, by zmieniac WYLACZNIE wartosci brazu.
BAZA: `b611211fc` (detach). Kod operatora r2 w historii: `53d409a44`. Brak commitu kodu w r3.

## Co zrobiono
1. Sprawdzono bazę i dysk: `df -h /` = 9,0 GB wolne (>= 8 GB, start dozwolony).
2. Zbadano generatory: `dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1/gen-p6-adv-city-econ-vectors.mjs` ma PIN `4bbef081d` zaszyty w kodzie (linia 2 i 18). Generator uruchamia prawdziwy `advanceCityEconomy` z pina przez esbuild.
3. Zregenerowano wektory miasta z pina 07d2fbd72 — KOPIA generatora z podmienionym PIN-em w scratchpadzie (`/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/regen/gen-city.mjs`), wyjscie do scratchpadu (`.../regen/out-city/advance.json`). Wersja w repo NIE zostala nadpisana; generatory w repo NIE zostaly zmienione (PIN nadal 4bbef081d).
4. Porownano stare i nowe wektory (skrypty `.../regen/jdiff.py`, `.../regen/nonbraz.py`).

## Wynik porownania (advance.json, 519 scenariuszy, 360 przepustowosci, 18 happy)
- Roznice brazu (oczekiwane, zgodne z pinem 07d2fbd72): kolumny `odlewnia_brazu`, `odlewnia_zelaza__braz`, `wielka_odlewnia__braz` w `out.thr` oraz `braz` w surowcach; lacznie ok. 2 300 roznic (747 na kazdej z 3 receptur brazu, plus 51 `braz` i 3 brakujace klucze `braz`).
- ROZROZNICA NIEBRAZOWA (NIE do zaakceptowania po cichu): zmienione sa rowniez wartosci `drewno` (16), `ruda` (33), `ruda_cyny` (20), `ruda_zelaza` (15), `zelazo` (20), `stal` (9), `glina` (6), `ceramika` (4), `cegla` (3), oraz 164 brakujace klucze `ruda` (surowce miast), `cegielnia#outMult` (120 w przepustowosciach) i pole `pin` (oczekiwane).
- Przyczyna (zweryfikowana `git diff --stat 4bbef081d 07d2fbd72`): pin 07d2fbd72 rozni sie od 4bbef081d SZEROKO, nie tylko w brazie. Dotyczy to m.in.:
  - `gra/data/econ-params.json`: cegielnia (cegla) — `outputAmount` 1→2 i wyjscie cegly skalowane epoka (R-WEB-BRICK-PRODUCTION-X2-ERA-50PCT-Q1); zelazo/stal — baza 25→50 (R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1); cap populacji (`spichlerz_ii_prog_ludnosci`, nowy `akwedukt_max_ludnosci` 20); zuzycie racji (`citizen-consumption-era.ts`, m(e) = 1 + 0,5·(e−1)).
  - `gra/src/game/turn-economy.ts` (+300/-, np. ścieżki pod 1503/2484), `converters.ts` (+140/-), `citizen-consumption-era.ts` (+40).
  - Łącznie 273 pliki i 29 767 linii dodanych w `gra/`.
- Wniosek: założenie dispatchu r3 („regeneracja zmienia tylko brąz”) jest FAKTYCZNIE NIEPRAWDZIWE. Regeneracja z 07d2fbd72 zmienia wektory cegły, żelaza, stali, drewna, cyny, rudy, cegielni i racji. Tych wartości Rust (baza tego tematu) jeszcze nie implementuje, więc testy `p6_adv_*` i `p6_empirefood_*` po regeneracji nadal nie przejdą — i to z przyczyn spoza tematu brązu.

## Dlaczego nie zacommitowano wektorów
Dispatch r3 wymaga: „jeśli regeneracja zmienia coś poza brązem — zgłosić w BLOKADACH, nie akceptować po cichu”. Stąd wektory w repo pozostają z 4bbef081d, a generatory z PIN=4bbef081d. Commit w tej rundzie zawiera wyłącznie ten raport.

## Pozostałe pliki (do decyzji, NIE zmieniane w r3)
- `p6_adv_city_econ_pipeline.rs`, `p6_adv_q4_preview.rs`, `p6_adv_q5_tick.rs`, `p6_adv_q6_wire.rs`, `p6_empirefood_e2e.rs` — NIE zmienione.
- Wektory `p6_adv_city_econ_vectors/advance.json`, `p6_adv_q4_vectors/`, `p6_adv_q5_vectors/`, `p6_adv_q6_vectors/`, `p6_empirefood_vectors/` — NIE zmienione.
- Generatory `gen-*.mjs` w run-dirach ADVANCE-CITY-ECONOMY-* i ECON-TICK-EMPIREFOOD — NIE zmienione.

## TESTY (kody wyjscia)
- `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, `cargo test --no-fail-fast`: NIE_ZMIERZONO w r3 (brak zmian kodu Rust w tej rundzie; wynik r2 bez zmian: 3304 passed, 7 failed — wszystkie przez stare wektory brazu/econ). Pelny przebieg nie byl potrzebny do decyzji BLOCK.
- Walidacja regeneracji: generator wykonal sie bez bledu (`scenarios 519 thr 360 happy 18 bytes 1843009`), exit 0. Pin 07d2fbd72 zawiera oczekiwany blok brazu w `econ-params.json` (50 / 75, linie 369 / 376 wg dodatku — zweryfikowane w r2).

## BLOKADY
1. [KRYTYCZNA — DECYZJA ORKIESTRATORA] Dodatek r3 zaklada, ze pin 07d2fbd72 rozni sie od 4bbef081d tylko w brazie. Fakt: 273 pliki `gra/` i zmiany econ (cegla, zelazo/stal, cap ludnosci, racje). Trzeba wybrac jedno z:
   (a) rozszerzyc zakres tematu na pelny dryf econ 4bbef081d→07d2fbd72 (cegielnia x2, foundry x2, spichlerz/akwedukt, racje) — duzy temat, wymaga Rust-portu tych zmian (poza tym tematem);
   (b) przyjac 07d2fbd72 dla wektorow BRAZU tylko przez wektory per-receptura z jawna maska (osobna regeneracja z wycieciem nie-brazowych kolumn) — wymaga zgody na niepelna zgodnosc z pinem;
   (c) zostawic 4bbef081d dla wszystkich wektorow `running web` i przeniesc parytet brazu do osobnego tematu REPIN po zamknieciu dryfu econ.
   Rekomendacja operatora: (c) — najmniejsze ryzyko; (a) dopiero po osobnym temacie econ-dryf.
2. [Konflikt zasad] Dispatch r1 zabrania linii `Co-Authored-By` z nazwa modelu; systemowa regula atrybucji wymaga jej. W tej rundzie zastosowano regule systemowa. Do potwierdzenia przez orkiestratora.
3. Gałąź: commit wykonany lokalnie na galezi `wip/R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1-r3`; brak push.

## RUNDY
3/5 (r1 FAIL na FC — brak commitu kodu; r2 BLOCK — 7 FAILED przez stare wektory; r3 BLOCK — decyzja wymagana, patrz BLOKADA 1). Po decyzji: kolejna runda = regeneracja wg wybranej opcji + pelny `cargo test --no-fail-fast` (0 failed) + FC.

## NASTEPNY KROK
Orkiestrator wybiera opcje (a)/(b)/(c) z BLOKADY 1. Dopiero potem operator generuje wektory (nowy PIN lub maska) i uruchamia bramki z kodami wyjscia.

## DEPLOY/PUSH: NIE WYKONANO (brak push; brak READY_FOR_DEPLOY)
