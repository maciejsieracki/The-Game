STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1
GOAL: Zmierzyć, które elementy dryfu web→Rust (pozycja 9 REJESTR-RUST) nadal nie są zgodne, i zapisać listę REPIN dla DRYF. Dokument pomiaru: `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md`.
ZMIANY/COMMIT: allowlista: `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md` (nowy) oraz `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1/01-operator-r1.md` (nowy). Zero zmian w `rust-port/**` i `gra/**`. Commit: SHA w sekcji „Commit” poniżej.
TESTY: NIE_DOTYCZY (bez cargo, temat dokumentacyjny). Pomiar: git archive web `07d2fbd7` (gra/src, gra/data) i Rust `a4087f332` (rust-port/engine), rozpakowane poza repo; odczyty plik:linia w dokumencie pomiaru.
BLOKADY: brak blokad wykonania. NIE_ZMIERZONO (szczegóły w sekcji 3 dokumentu): etykieta „FALA 618” nieodnaleziona w web (zmierzono wartości 50/75); brak uruchomienia testów; niepełna lista wywołań `find_city_connection*` (3b); schemat zapisu nie wyliczony w całości (5); blok sojuszu aiDiplomacyStance nie porównany linia po linii (6f); wpływ na derived/wektory nieoceniany.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (sprawdzić wiersze tabeli i linie cytowane w dokumencie pomiaru względem pinów; potwierdzić statusy ZGODNE/DRYF).
DEPLOY/PUSH: NIE WYKONANO

## Wyniki pozycji (skrót; pełne cytaty w dokumencie pomiaru)

| # | Pozycja | Status | Różnica (web → Rust) |
|---|---|---|---|
| 1 | Korupcja Pałac II/III + Trybunał | DRYF | web 6 budynków redukcji (economy.ts:1237), Rust 3 (economy_city_fns.rs:220); 0,30 i sufit 0,60 zgodne |
| 2 | Odlewnie brązu 50/75 | DRYF | web epoka2=50, epoka3+=75 (econ-params.json:369/376, converters.ts:99-102); Rust stałe 50 (turn_economy_resources.rs:77-113), brak wierszy epoka2/3 |
| 3a | `emporion` w TRADE_BUILDING_IDS | DRYF | web ma 4 (trade-routes.ts:908-910), Rust 3 (trade.rs:345) |
| 3b | Handel kontaktowy (contact-only) | DRYF | web: sam kontakt (trade-routes.ts:1011-1017); Rust: wymaga granicy/BFS/portu (trade.rs:884-921) |
| 4 | Łodzie rybackie 6/6/6 | DRYF | web 6/6/6 (terrain-improvements.json:240-243); Rust 2/3/3 w danych (234-240) i na sztywno (improvements.rs:437-441) |
| 5 | civBonusy w zapisie | ZGODNE | żaden zapis nie zawiera civBonusy; oba liczą je w runtime z cywilizacji |
| 6a | przewagaMilitarna | DRYF | wartości 0,20 / 1e-9 zgodne; Rust ma tylko truceEnd, brak reguł (a)/(b) |
| 6b | pokojAiAi.minBilansPW | DRYF | wartość 0 zgodna; brak konsumenta w Rust |
| 6c | progNapBezterminowyRelacja | DRYF | wartość 151 zgodna; brak konsumenta w Rust (kod to deklaruje) |
| 6d | Ekspansja Brąz −3 / Żelazo −4 | DRYF | wartości zgodne (diplomacy.json:28-30); brak wyboru wg epoki pary (diplomacy.ts:603-606) |
| 6e | sisterAlliance | DRYF | brak portu w Rust (0 trafień) |
| 6f | aiDiplomacyStance | DRYF | wojna i pokój poza wojną częściowo zgodne; zmęczenie wojną i archetypy z trudnością różne |

## Propozycje REPIN (skrót; szczegóły w dokumencie pomiaru, sekcja 2)

- 1: `rust-port/engine/src/domain/economy_city_fns.rs:219-220` — rozszerzyć listę do 6 id (sad, pretorium, palac, palac_ii, palac_iii, trybunal); stałe bez zmian.
- 2: `rust-port/engine/data/econ-params.json` — dodać `budynek_huta_braz_epoka2_przepustowosc` (50) i `budynek_huta_braz_epoka3_przepustowosc` (75); `rust-port/engine/src/domain/turn_economy_resources.rs:81-118` — wybór przepustowości brązu wg epoki (1→50, 2→epoka2, 3+→epoka3). Receptury żelaza/stali bez zmian.
- 3a: `rust-port/engine/src/domain/trade.rs:345` — dodać `"emporion"` (tablica 4 elementy).
- 3b: `rust-port/engine/src/domain/trade.rs:860-923` — trasy zewnętrzne: warunek = kontakt (`hasContact && miasta>0`), bez wymogu granicy/BFS/portu.
- 4: `rust-port/engine/src/domain/improvements.rs:437-441` i `rust-port/engine/data/terrain-improvements.json:237-240` — 6/6/6.
- 6a: `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs` — porty `militaryAdvantageClass` / `peaceBlockedByMilitaryAdvantage`; prog z danych zamiast `diplomacy_truce_end.rs:19`.
- 6b: miejsce zawierania pokoju AI-AI (`war_turn_state.rs:47` / `diplomacy_tick_war_brake.rs`) — warunek bilansu PW ≥ 0.
- 6c: `rust-port/engine/src/domain/diplomacy.rs:259-261` — konsument `nap_indefinite_relation` (AI proponuje NAP przy wyniku ≥ 151).
- 6d: moduł zaufania granicznego — wybór −3/−4 wg max epoki pary.
- 6e: port `sisterAllianceDiplomacyParams` (osobna decyzja o zakresie).
- 6f: `rust-port/engine/src/domain/diplomacy.rs:1075-1140` — zmęczenie wojną, archetypy z trudnością, blok sojuszu (osobny temat logiki).

## Commit

Commit na gałęzi roboczej `worktree-wf_58bf63b9-1b1-1` (nie pushowany). SHA: podany w odpowiedzi tej rundy.

## Dowody (ścieżki robocze poza repo)

- Web: `/home/user/scratch_web_pin/gra/` (git archive `07d2fbd72f758705f8e1d59cc4968027ffbafe75`).
- Rust: `/home/user/scratch_rust_pin/rust-port/engine/` (git archive `a4087f332c02bfc5a57aef7459f1e3fd8bf24a52`).
