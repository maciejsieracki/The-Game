STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1
GOAL: odpowiedź na 8 zarzutów Evaluatora r1 (02-evaluator.md, commit ebbe60ea2): każdy PRZYJĘTY (poprawka + dowód) albo ODRZUCONY (dowód). Bez zmian statusów DRYF/ZGODNE.
ZMIANY/COMMIT: `dyspozycje/rust-port/REPIN-DRYFT-POMIAR-20261111.md` (poprawki plik:linia i celów REPIN) oraz ten plik. Zero zmian w `rust-port/**` i `gra/**`. SHA: w odpowiedzi orkiestratorowi (commit lokalny, bez push).
TESTY: NIE_DOTYCZY (bez cargo). Dowody: odczyt przez `git show <pin>:<ścieżka>` (web 07d2fbd7, Rust a4087f332), kopie robocze w scratchpadzie sesji; `git rev-parse origin/main` = 674f9faef.
BLOKADY: brak. NIE_ZMIERZONO pozostaje w sekcji 3 dokumentu (czyli wywołania `find_city_connection*` dla tras zewnętrznych; ścieżka plonów łodzi; konsumpcja `ekspansjaGranicaBraz/Zelazo`; blok sojuszu w 6f).
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator r2 (ponowna ocena zmienionych wierszy tabeli i linii w `REPIN-DRYFT-POMIAR-20261111.md`).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. (6d) Wybór epokowy i miejsca użycia — PRZYJMUJĘ
Potwierdzone w pinie web 07d2fbd7:
- `gra/src/game/diplomacy.ts:598-606` `sharedBorderPenaltyForEpochs` (`max(epochA, epochB)`: >=3 Żelazo, >=2 Brąz, inaczej Granica) — to jest wybór epokowy, nie `diplomacy.ts:990/1800`.
- `diplomacy.ts:990`: `dZ = p.ekspansjaGranica_zaufanie_perTura` (baza).
- `diplomacy.ts:1800`: `dZ += ctx.karaWspolnaGranicaDelta ?? p.ekspansjaGranica_zaufanie_perTura`.
- Wywołania `sharedBorderPenaltyForEpochs`: `gra/src/main.ts:22879` i `:41356` (jako `karaWspolnaGranicaDelta`).
- Dodatkowy konsument: `gra/src/game/diplomacy-factors.ts:189` (`karaWspolnaGranicaZaufaniePerTura ?? base`), zasilany z `main.ts:22921`.
Rust (a4087f332): `karaWspolnaGranicaDelta` / `shared_border_penalty` — 0 trafień w `rust-port/engine/src`; jest tylko `kara_wspolna_granica: bool` (`diplomacy_nap_trust.rs:41-46, 132, 225-233`) ze stałym narzutem 20. Zarzut o całym kontrakcie delty jest trafny.
Poprawka: wiersz 6d tabeli i sekcja REPIN 6d przepisane (wybór wg epoki + kontrakt delty + konsumenci).

### 2. (6b) Zły plik REPIN i zły cytat web — PRZYJMUJĘ
Potwierdzone: `war_turn_state.rs:47` to lista kluczy meta, a `diplomacy_tick_war_brake.rs` nie zawiera decyzji o pokoju AI-AI.
- Rust: decyzja w `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs` — `decide_ai_peace_request` (l.273-285; tolerancja bilansu po zapłacie, komentarz l.269-272, bez `minBilansPW`) i `run_ai_ai_peace_tick` (l.414). Grep `minBilansPW|min_bilans|pokojAiAi` w tym pliku: 0.
- Web: `gra/src/game/diplomacy-ai-forced-peace.ts:34-40` (`aiAiPeaceMinBalance`, stała l.39), `:42-50` (`isAiAiPeaceBalanceAllowed`). Cytat „30-35” był błędny.
Status DRYF bez zmian. Poprawka: wiersz 6b i REPIN 6b.

### 3. (6f) Numery linii web i zależność zmęczenia — PRZYJMUJĘ
Potwierdzone w pinie web:
- `warWearinessShare`: wywołanie `diplomacy.ts:1355-1358`; definicja `diplomacy-war-peace-profile.ts:199` (nie w `diplomacy.ts`).
- `resolveArchetypeAggression/Trade`: wywołania `diplomacy.ts:1322-1332` (definicje `civ-ai-data.ts:164, 188`).
- `warW` (formuła wojny): `diplomacy.ts:1337-1346` — poprzedni zapis „1337-1346” był poprawny, teraz podany w całości.
- `peaceW = 0,80` poza wojną: `diplomacy.ts:1366`.
Rust: `zmeczenie_t` w `diplomacy_war_peace_profile.rs:238, 395, 418` i helper `war_weariness_share` `:436-458` już istnieją; `ai_diplomacy_stance` (`diplomacy.rs:1076-1140`) z nich nie korzysta (liczy `min(0,50, turns_at_war/20)` w l.1118). Uwzględnione w wierszu 6f i w REPIN 6f jako „podpięcie, nie budowa od zera”.

### 4. (3b) Warunkowość granicy i zakres portu — PRZYJMUJĘ
Potwierdzone w `rust-port/engine/src/domain/trade.rs`:
- sprawdzenie granicy jest warunkowe: `if let Some(nodes) = territory_nodes { ... }` (l.883-888);
- wymóg Portu w obu miastach dla gałęzi morskiej: l.904-908 (l.901-902 to zwrot gałęzi lądowej);
- wywołania `find_city_connection_internal`: `trade.rs:940, 966, 1026, 1127, 1140, 1239` (lista pełna z grepu; klasyfikacja na trasy zewnętrzne/wewnętrzne NIE_ZMIERZONO).
Status DRYF potwierdzony (`contact` w `trade.rs`: 0). Poprawka: wiersz 3b i REPIN 3b.

### 5. (2) Zakresy linii receptur i kluczy econ-params — PRZYJMUJĘ
- Rust `turn_economy_resources.rs`: `odlewnia_brazu` l.81 (klucz w l.86), `odlewnia_zelaza__braz` l.90 (klucz l.95), `wielka_odlewnia__braz` l.108 (klucz l.113). Zakresy 81-88 / 95-100 / 113-118 wchodziły w sąsiednie receptury; poprawione.
- Web `gra/data/econ-params.json`: klucze w l.362 / 369 / 376; wartości w l.363-365 (50), 370-372 (50, epoka2), 377-379 (75, epoka3). Poprawione.

### 6. (4) Twierdzenie „JSON nie jest czytany” — PRZYJMUJĘ (zmiana na NIE_ZMIERZONO)
Rust czyta `terrain-improvements.json`: `data/terrain_map.rs:12` (`TERRAIN_IMPROVEMENTS_JSON`), `improvements.rs:630-635` (`ImprovementCatalog`, jednorazowy odczyt), `loader.rs:218`. Nie ustalono, czy plony łodzi w grze idą przez `production_for` (`improvements.rs:437-441`, na sztywno 2/3/3) czy przez katalog JSON. Zdanie zastąpione sformułowaniem NIE_ZMIERZONO (sekcje 1, 2 i 3). Wniosek „zmienić oba miejsca” zostaje.

### 7. (6a) Brak isWarWeary w Rust — CZĘŚCIOWO ODRZUCAM (dowód)
Zarzut Evaluatora: „Rust … nie ma isWarWeary z progiem chętności”. To nieprawda: `rust-port/engine/src/domain/diplomacy_multiwar.rs:291-292` `pub fn is_war_weary(level, p) -> bool { level >= p.prog_chetnosci }`, z progiem w `WarWearinessParams` (l.225, domyślnie 0,5 w l.248). Web: `isWarWeary` = `gra/src/game/war-weariness.ts:76`.
Prawdziwa luka 6a: brak `militaryAdvantageClass` i `peaceBlockedByMilitaryAdvantage` (grep: 0). Dopisane w wierszu 6a i REPIN 6a, że zależności `isWarWeary` i `zmeczenie_t` istnieją w Rust i trzeba je tylko podpiąć.
Wartości danych zgodne (plik derived bajt-w-bajt identyczny, zarzut nie kwestionował).

### 8. (pin) Pin zamrożony, nie objęty dryf main — PRZYJMUJĘ
Dopisane w sekcji 0 dokumentu: pomiar dotyczy pinu `07d2fbd7`; `origin/main` = `674f9faef` (sprawdzone `git rev-parse origin/main` w tej rundzie) nie jest objęty pomiarem i wymaga ponownego odczytu przed wdrożeniem REPIN.

## Podsumowanie zmian w dokumencie
- Wiersze tabeli 3b, 4, 6a, 6b, 6d, 6f przepisane z poprawnymi plik:linia.
- Sekcja REPIN 2, 3b, 4, 6a, 6b, 6d, 6f skorygowane (plik i cel), 6d rozszerzone o kontrakt delty.
- Sekcja 0: dopisek o zamrożeniu pinu. Sekcja 3: wykreślone błędne zdanie o JSON, dodane NIE_ZMIERZONO dla wywołań i konsumpcji.
- Statusy DRYF/ZGODNE w tabeli: bez zmian (poz. 5 ZGODNE; reszta DRYF).
