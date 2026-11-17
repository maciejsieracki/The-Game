# 02a-obrona — R-RUSTPORT-P6-AUDIT-ZINTEGROWANE (runda 1, Obrona Operatora, HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-AUDIT-ZINTEGROWANE
GOAL: odpowiedzieć na każdy zarzut Evaluatora (pięć pozycji) przez PRZYJMUJĘ z poprawką i dowodem albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDIT-ZINTEGROWANE/01-audyt.md` (dopisek §8 z korektą; §1–§7 zostają jako historia) oraz ten plik `02a-obrona.md`. Bez zmian w kodzie, `gra/`, `REJESTR-RUST.md`, bez cargo, bez push.
TESTY: brak (dokumentacja). Dowody = `git grep` na bazie `f85622878` (dokładne polecenia i wyniki w odpowiedziach poniżej).
BLOKADY: pełne przeliczenie wpisów „zintegrowane” z rejestru (zarzut 4) NIE wykonane w tej rundzie — NIE_ZMIERZONO, zostaje otwarte.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator aktualizuje rejestr wg §8.5 `01-audyt.md`; osobna runda na pełne przeliczenie ZINTEGROWANE (zarzut 4).
DEPLOY/PUSH: NIE_WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1 — wiersze oznaczone BRAK z wołającymi w testach — PRZYJMUJĘ

Dowód (`git grep -l <nazwa> f85622878 -- rust-port/engine/tests`):
- `resolve_combat` → `tests/combat.rs`. Wiersz `combat::resolve` był zawyżony: `resolve_combat` ma wołającego testowego. `combat::resolve` (`combat.rs:381`) nie ma wołających ani w `src`, ani w `tests` (ścisły grep `combat::resolve\b` = 0 kodu).
- `decide_ai_turn` → `tests/ai_turn.rs` (11 wywołań). `plan_ai_turn` jest wołany przez `decide_ai_turn` (`ai_turn.rs:1089`), więc ma wołającego testowego pośrednio. Zarzut był częściowo nietrafiony w jednym szczególe: `plan_ai_turn` nie występuje bezpośrednio w `tests/` (grep 0). Wniosek ten sam: WOŁANE TYLKO W TESTACH.
- `SiegeLoop`, `ProdBody` → `tests/p4_1i*.rs`, `tests/p6_siege_tactics_loop*.rs`, `tests/p6_k5loop_outcome_pin.rs`, `tests/p6_k5doc_state.rs`.
- `pick_tower_target` → `tests/p6_tower_target*.rs`, `tests/p6_wieze_2b2.rs`.

Poprawka: w `01-audyt.md` §8.1–§8.2. Liczba BRAK spada z 4 do 1 (`combat::resolve`); WOŁANE TYLKO W TESTACH rośnie z 17 do 20. Pierwotne „4 BRAK” w §2 zostaje jako historia, obowiązuje §8.2.

Nota: produkcyjnie `SiegeLoop`, `ProdBody` i `pick_tower_target` nadal nie mają wołających poza klastrem nieosiągalnym z `bridge.rs`. Dlatego status „ZINTEGROWANE” w rejestrze nadal nie jest uzasadniony, a zmienia się tylko etykieta, nie wniosek.

### Zarzut 2 — §0.3 „brak rust-port/src-tauri” — PRZYJMUJĘ (poprawka wording + dowód)

Dowód: `git ls-tree -d --name-only f85622878` zwraca `src-tauri`. `git grep -n src-tauri`: `src-tauri/src/lib.rs:13,17,21` (`EngineBridge`, `CivEngineAdapter`, `EngineStateHandle`). Dodatkowy grep po `SiegeLoop|ProdBody|resolve_combat|pick_tower_target|siege_tactics|combat::` w `src-tauri` daje tylko linie `EngineBridge`/`CivEngineAdapter`, czyli zero wołających audytowanych funkcji.

Poprawka: `01-audyt.md` §8.3 (zastępuje §0.3). Wniosek z §1 bez zmian, dowód dopisany.

### Zarzut 3 — wiersz js_max/js_round niespójny — PRZYJMUJĘ

Dowód:
- `js_max`: definicja `domain/js_math.rs:20`. Producenci: `mapgen/relief.rs:56` (import), `relief.rs:143,323,325,437,463,469,508,514,790,1324,1347,1593,2280` (wywołania). Zarzut trafny: `relief.rs:143,323` wołają `js_max`, nie `js_round`. Poprzednie „relief.rs:143,323 jako js_round” było błędem Operatora.
- `js_round`: `siege_tactics_blow.rs:191` definicja. Producent produkcyjny: `domain/unit_power.rs:16` (import jako `js_round_js`) i `unit_power.rs:89` (wywołanie). Plik nie ma `#[cfg(test)]` (grep 0). Stąd `siege_tactics_blow::js_round` ma wołającego produkcyjnego. Zarzut pyta o wołających bloku z `siege_tactics_blow.rs`; ten konkretny blok (silnik oblężniczy) nadal NIE_ZMIERZONO, ale sama funkcja `js_round` ma wołającego.
- Lokalne kopie `js_round` (`relief.rs:62`, `siege_tactics_inputs_unit.rs:200`, `ai_peace_city_offer.rs:53`, `siege_tactics_blow` itd.) nie są tą funkcją.

Poprawka: `01-audyt.md` §8.1 — wiersz js przeklasyfikowany na ZINTEGROWANE z dowodami; liczba CZĘŚCIOWO = 0.

### Zarzut 4 — pełny zbiór „zintegrowane” w rejestrze nieprzeliczony — PRZYJMUJĘ (jako lukę, nie zamykam w tej rundzie)

Dowód: `REJESTR-RUST.md` istnieje tylko na `origin/claude/rust-sivvrn` (nie w `f85622878`, potwierdzone przez audyt §0.2). `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/REJESTR-RUST.md | grep -c -i zintegrowan` = 141 linii. Liczba ta nie jest liczbą wierszy ze statusem ZINTEGROWANE, więc pełnego przeliczenia nie wykonano.

Poprawka: `01-audyt.md` §8.4 oznacza ten punkt jako NIE_ZMIERZONO i nie twierdzi już kompletności. Pełne przeliczenie wymaga osobnej rundy (lista wierszy ZINTEGROWANE z numerem linii rejestru + wołający dla każdego). Nie zamykam tego w tej rundzie, bo wymaga przeglądu ~141 linii rejestru, co wykracza poza tę rundę i dispatch nie wymaga go w tej postaci. Zarzut zostaje otwarty jako NIE_ZMIERZONO.

### Zarzut 5 — trailer commitu z nazwą modelu — ODRZUCAM (dowód niżej)

Dowód:
- Trailer `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i linia `Claude-Session:` w commicie `8a598e3f5` są wymagane przez instrukcje atrybucji obowiązujące w tej sesji (system-reminder: „End git commit messages with …”). Ta instrukcja pochodzi z konfiguracji sesji, nie z treści dispatchu.
- Dispatch (`00-dispatch.md`, linia o zakazie nazwy modelu w trailerach) jest instrukcją workflow i nie zastępuje wymaganej atrybucji sesji.
- Zarzut sam oznacza się jako informacyjny i nie wymaga poprawki w zakresie tego tematu.
- Konflikt zgłaszam orkiestratorowi: to decyzja orkiestratora, czy przepisać trailery (zadanie #289 mówi „bez nazwy modelu wg reguły harnessu”, co jest sprzeczne z aktualną instrukcją atrybucji). Nie przepisuję historii commitów z własnej inicjatywy.

---

## Podsumowanie

- PRZYJMUJĘ: zarzuty 1, 2, 3 (z poprawkami w `01-audyt.md` §8).
- PRZYJMUJĘ jako otwarte (NIE_ZMIERZONO): zarzut 4.
- ODRZUCAM: zarzut 5 (wymóg atrybucji sesji; konflikt do decyzji orkiestratora).

Poprawiony wynik audytu (`01-audyt.md` §8.2): 22 wiersze = 20 WOLANE TYLKO W TESTACH + 1 BRAK (`combat::resolve`) + 1 ZINTEGROWANE (`js_max` / `siege_tactics_blow::js_round`).

Push: NIE_WYKONANO. Integracja: NIE_WYKONANO.
