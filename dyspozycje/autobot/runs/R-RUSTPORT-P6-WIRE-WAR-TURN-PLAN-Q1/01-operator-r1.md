STATUS: PASS
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1
GOAL: Plan podpięcia do tury Rust zportowanych funkcji czystych wojny/dyplomacji (tabela moduł→wołający→miejsce→zależności→rozmiar, 5–8 partii ≤600 LOC, ABC).
ZMIANY/COMMIT: dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md (nowy), dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1/01-operator-r1.md (nowy). Gałąź rustport-p6-wire-war-turn-plan-q1 z bazy 730cd6f18 (parity-v2). SHA: patrz commit (git log -1 tej gałęzi). Brak zmian w gra/** i rust-port/**.
TESTY: nie dotyczy (dokumentacja, zero cargo). Pomiar: grep/wc -l/git show na 730cd6f18 (Rust) i 60a18c60d (web main).
BLOKADY: brak. Uwagi: (1) numery linii z dispatchu nieco inne na 60a18c60d (ownerLoop = main.ts:39152, Krok A = 38853–38990, sweep = 11245); (2) dispatch jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, nie skopiowano go do tej gałęzi.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja tabel i liczb), po PASS orkiestrator zadaje ABC D1–D8 i rozpisuje dispatche W1–W8.
DEPLOY/PUSH: NIE WYKONANO

KLUCZOWE WYNIKI
- Wszystkie moduły z GOAL (war_home_defense*, war_target_select, war_era_pool, war_forced_*, ai_peace_city_offer, diplomacy_siege_war_gate, diplomacy_locks, siege_defender_units, diplomacy_rejection_cooldown, ai_zakup_jednostki) nie mają wołającego w kodzie produkcyjnym; tylko testy p6_*.
- Pętla tury Rust to szkielet kolejki faz (playable.rs:559, session.rs:82); run_economy_tick_for_game jest wołane tylko z testów. Brak nosiciela stanu świata i adapterów do ~10 mini-typów.
- SaveMeta zawiera tylko warRulesEraWarCountByCiv; ~14 pól stanu wojny weba (pending/cycle/rest/active x3 epoki, *EraEnterTurnByOwner, fale, kampanie, cooldowny, stores pokoju/zmęczenia, crisis, agresor/casus belli) nie ma miejsca w zapisie.
- 8 partii: W1 STATE (450), W2 WORLDVIEW (550), W3 FORCED-STEP (500), W4 DECLARE-CLEANUP (450), W5 MARCH-PLAN (580), W6 DIPLO-TURN (550), W7 SIEGE-AIAI (560), W8 PIPELINE (400); suma ~4040 LOC (szacunek).
- ABC D1–D8: nosiciel stanu, kolejność kroków, progi 20/20/25, format zapisu, wznowienie po bitwie, flagi, zakup AI, determinizm.
