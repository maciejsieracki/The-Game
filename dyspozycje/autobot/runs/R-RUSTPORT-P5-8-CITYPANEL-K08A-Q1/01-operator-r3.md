STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1
GOAL: Port 15 jednostek nie-DOM bloku K08 (pin edb8fb56, `k08a-fundament.ts`); r3 = naprawa zarzutu 1 z FC r2 (lustro K06A w `refreshCityPanelIfOpen`).
ZMIANY/COMMIT: baza 249bca66 (detach). Commit kodu/logów/dokumentacji a42bab1b (`src-tauri/frontend-v2/src/ui/cityPanel/k08a-fundament.ts`, `tools/dom-harness/{gen-k08a-port,k08a-subs,run-k08a-units,mutate-k08a-units}.mjs`, `PORTING-QUEUE.md`, `dyspozycje/rust-port/p5/P5-8-K08A.md` §8, `runs/…K08A-Q1/r3-logi/`). Commit raportu: SHA w ostatniej wiadomości orkiestratora. Allowlista zachowana; zero zmian w `gra/**`, `package.json`, `WERSJE.md`.
TESTY: verify-k08a-copies.mjs EXIT 0 (15 bloków, ORPHAN=0); run-k08a-units.mjs 48 wektorów, 0 różnic (r2: 40; +8 wektorów r3: sync K06A po odświeżeniu K07A, ta sama referencja K06A/K07A, activeMap/activeOnClose zachowane, rerender, sync przed uxSectionRefresh, brak miasta, inne id); mutate-k08a-units.mjs 50 mutantów, 50 zabitych, 0 przeżytych, 0 NIE_ZMIERZONO (w tym resolve-k06-nosync zabity przez harness); npm run check EXIT 0; npm run typecheck EXIT 0. Nie uruchamiano ponownie harnessów K06A/K07A (kod poza K08A niezmieniony).
BLOKADY: brak. NIE_ZMIERZONO (uczciwie): zachowanie w przeglądarce; wiązanie setK08aDeps i obu lustr w kontrolerze/K09; zgodność z viewmodel/types.ts. Rzutowanie `fresh as unknown as CityK06` w resolveK08aActiveCity (getCities zwraca pełny obiekt miasta; CityK07 jest podzbiorem) — założenie K08A-Z4, do potwierdzenia przy K09.
RUNDY: 3/5.
NASTĘPNY KROK: Evaluator r3 -> Final Control r3 (ten sam ID); po PASS integracja nad origin/rust-port/parity-v2.
DEPLOY/PUSH: NIE WYKONANO
