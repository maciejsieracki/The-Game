## 6a. Kolejność i krytyczna ścieżka (runda 2)

Zależności są brane WYŁĄCZNIE z kolumny „zależności” tabeli §6b (`backlog.tsv`). Poprzednia ścieżka `P6.9 → P6.11 → P6.13 → P6.14` nie wynikała z tej tabeli (zarzut 13); usunięto ją.

**Krytyczna ścieżka (łańcuch zależności, bez wag):**
P6.1 → P6.2 → P6.3 → P6.4 → P6.5 → P6.6 → P6.7 → P6.8 → P6.9 → P6.14 → P6.15 → P6.20 → P6.21 → P6.24.

**Gałęzie poza ścieżką, które muszą się zakończyć przed P6.20** (P6.20 zależy od P6.1–P6.19):
- P6.11 (po P6.9) → P6.12 (po P6.11);
- P6.13 (po P6.4 i P6.9) → P6.18 (po P6.13);
- P6.16 (po P6.9);
- P6.17 (po P6.8) → P6.19 (po P6.9, P6.14, P6.17).
P6.22 (replay) — po P6.20.

**Równoległość (sprawdzona skryptem, §6b-i):** P6.12 ‖ P6.13 ‖ P6.16 ‖ P6.17 po osiągnięciu ich wspólnych zależności; ich allowlisty Rust są rozłączne (wynik kontroli w §6b-i). P6.11 i P6.12 dzielą `domain/ai_turn.rs` — sekwencyjnie. Pozostałe pary dzielące pliki są sekwencyjne: `pathfinding.rs` (P6.3/P6.4), `recruitment.rs` (P6.4/P6.5), `state.rs` (P6.5/P6.6), `turn_economy.rs` (P6.8/P6.9, P6.16 po P6.9), `improvements.rs` (P6.8 przed P6.17), `diplomacy.rs` (P6.14, podział 14a–14c), `trade.rs` (P6.15).

**Testy (zarzut 13):** P6.23 NIE jest tematem równoległym. Reguła: każdy temat dodaje WYŁĄCZNIE nowe pliki `rust-port/engine/tests/p6_<id>_*.rs` i nie edytuje wspólnych plików testów. Cargo używa domyślnych `autotests` (brak `[[test]]` w `Cargo.toml`, sprawdzone), więc każdy plik `tests/*.rs` jest osobnym crate'em i nowe pliki nie kolidują. Dlatego cztery równoległe tematy nie dotykają wspólnego pliku testów.

**Rozmiary i zakresy:** patrz §6b (skryptowo). Tematy P6.8 (XL) i P6.11 (XL, 11a–11c) są wieloetapowe i wymagają podziału w dispatchu.

## 7. Zero zmian poza allowlistą — samokontrola (runda 2)

Zmienione/dodane w tym temacie: `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (nowy) i `dyspozycje/autobot/runs/R-RUSTPORT-P6-0-GAP-ANALYSIS-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Cargo uruchomiony z `CARGO_TARGET_DIR` poza repo; `Cargo.lock` nie został dodany do commita (sprawdzane `git status` przed commitem). Nie uruchamiano weba ani npm.

## 8. NIE_ZMIERZONO (jawna lista)

- Wektory referencyjne z uruchomionego weba dla żadnego modułu (zakaz uruchamiania weba w tym temacie).
- Równoważność funkcji 1:1 (status PORTOWANE-1:1 = 0 wierszy). Dowody nazwowe (§3, `evidence.tsv`) potwierdzają zgodność nazwy, nie zachowania.
- LOC per funkcja po obu stronach; w §3 LOC Rust to LOC całego modułu docelowego.
- Pełne pokrycie dowodem plik:linia dla wszystkich eksportów: `evidence.tsv` obejmuje max 6 pierwszych eksportów na plik; reszta eksportów nie ma dowodu nazwowego.
- Rozbieżność liczby plików: dispatch i plan mówią ~179; pomiar `git ls-tree -r --name-only edb8fb56 gra/src/game` daje **183**; w dokumencie obowiązuje 183.

## 9. Odpowiedzi na zarzuty Evaluatora (runda 1 → runda 2)

Każdy zarzut ma werdykt: PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód). Dowody web i Rust wykonano w tej rundzie na `git archive edb8fb56` i drzewie `rust-port/engine/src` (e810d0d3).

1. **PRZYJMUJĘ.** `r-stawki-strojenie.ts` klasa DEV → SYSTEM, status CZĘŚCIOWO (tier domena): Rust ma wartości (`domain/recruitment.rs:215`, `domain/building_costs.rs:114`), nie mechanizm skalowania. Importy logiki gry potwierdzone: `production.ts:84`, `economy-upkeep.ts:59`, `difficulty-cost.ts:32`, `terrain-improvements.ts:9`, `population-growth-v85.ts:21`, `building-stock-cost.ts:1`, `main.ts:1280`.
2. **PRZYJMUJĘ.** `society-breakdown.ts` klasa UI → SYSTEM, status BRAK: `pickOsiedlePopBonus` (`society-breakdown.ts:312`) używany w `turn-economy.ts:453` (import `:170`); Rust nie ma funkcji osiedla (pola danych `data/economy_society.rs:422, 461, 654`). `REBEL_FACTION_OWNER_ID` (`society-breakdown.ts:206`) → `LEGACY_REBEL_OWNER_ID` (`domain/ids.rs:45`); użycia `human-owners.ts:18` i `post-capture-law.ts:17, 58, 170` odnotowane.
3. **PRZYJMUJĘ.** `diplomacy-layers.ts` klasa UI → SYSTEM, status BRAK: `startRelationForPair` (`diplomacy-layers.ts:42`) używany w `cluster-start.ts:230`; Rust nie ma funkcji relacji startowej (pole `economy_society_part2.rs:362` bez logiki).
4. **PRZYJMUJĘ.** `diplomacy-war-gates.ts` BRAK → CZĘŚCIOWO (tier nazwa): `isCurrencyProposalForbiddenDuringWar` (`diplomacy-war-gates.ts:46`) ↔ `is_currency_proposal_forbidden_during_war` (`domain/diplomacy.rs:2726`), wyjątek pokój/trybut zgodny; test `war_currency_gate_allows_only_peace_settlements` (`tests/diplomacy.rs:549`) dodany jako test Rust.
5. **PRZYJMUJĘ.** `cyna-access.ts` i `zelazo-access.ts` (klasa SYSTEM) → BRAK. Logika: `hasCynaAccess` (`cyna-access.ts:79`), `hasZelazoAccess` (`zelazo-access.ts:79`). Rust `data/economy_society.rs` ma tylko parametry i `parse_*`.
6. **PRZYJMUJĘ.** `ai-city-capture-executor.ts` → BRAK. Logika: `executeAiCityMove` (`ai-city-capture-executor.ts:75`). Jedyny trafień w Rust to komentarz `domain/ai_turn.rs:1193`.
7. **PRZYJMUJĘ.** `culture-religion.ts` → BRAK (Rust: pole `culture`, `domain/turn_economy.rs:32`, bez logiki). `victory.ts` → BRAK (Rust: slot `TurnPhase::Victory`, `domain/events.rs:60`, bez warunków). Zmieniono też legendę w §0: CZĘŚCIOWO wymaga funkcji logiki w Rust, pole danych nie wystarcza.
8. **PRZYJMUJĘ.** `civ-entry-epoch.ts` → BRAK. `getCivEpokaWejscia` (`civ-entry-epoch.ts:27`) i `isCivAvailableAtGameEpoch` nie mają odpowiednika w Rust; `epoka_wejscia` to tylko pole danych (`data/civilizations.rs:86`). Mapowanie na `domain/unit_epoch.rs` odrzucone.
9. **PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM CZĘŚĆ FAKTYCZNĄ.** Status zmieniono na ISTNIEJE-NIEZWERYFIKOWANE i usunięto test `alliance_uses_configured_hegemon_threshold` z kolumny testów (nie dowodzi zachowania). ODRZUCONO twierdzenie „brak słów obligation/honor w tym pliku”: `grep -ci 'obligation\|honor' gra/src/game/alliance-war-obligation.ts` = 15 (np. `shouldHonorAllianceWarObligation`, `:39`). ODRZUCONO też brak odpowiednika: w tej rundzie zweryfikowano to tylko w jedną stronę (`grep -rni obligat rust-port/engine/src` = 0), więc status to ISTNIEJE-NIEZWERYFIKOWANE, nie BRAK.
10. **PRZYJMUJĘ.** Dodano kolumny „dowód web (plik:linia)” i „dowód Rust (plik:linia)” dla wszystkich 183 wierszy (§3), generowane przez `evidence.py` i `build_gap.py`. Każdy wiersz ma lokalizator po obu stronach. Ograniczenie jawnie opisane: dowód nazwowy (trafienie tej samej nazwy w Rust) istnieje tylko dla części wierszy (liczbę podaje §1 jako tier „nazwa”); dla pozostałych kotwica modułu docelowego. Kotwica NIE jest dowodem równoważności.
11. **PRZYJMUJĘ.** Wszystkie 9 wskazanych wierszy (1–9) zreklasyfikowano (§9 pkt 1–9). Wskaźniki przeliczone skryptem po korektach i podane jako zakres: górna granica (wszystkie tiery) oraz dolna granica dowodowa (tier nazwa). Nie identyfikuję „próbki 30 wierszy” Evaluatora z numerami, więc nie mogę potwierdzić, że pozostałe pozycje tej próbki są poprawne; zakres niepewności jest podany w §1 zamiast pojedynczego procentu.
12. **PRZYJMUJĘ.** Rozmiary S/M/L/XL nie są już wpisywane ręcznie; §6b wylicza je skryptem z `web-inventory.tsv` (suma LOC niepuste plików, których punkt główny należy do tematu), progi podane w §6b. Stare wartości z tabeli rundy 1 zostały usunięte.
13. **PRZYJMUJĘ.** Kolizja `tests/**` rozwiązana regułą per temat (`tests/p6_<id>_*.rs`, §6a), co potwierdza brak `[[test]]` w `Cargo.toml`. Ścieżka krytyczna przepisana z tabeli §6b: `P6.11` i `P6.13` nie są na niej, a są gałęziami, które muszą się zakończyć przed P6.20. Kontrola kolizji allowlist jest skryptowa (§6b-i); P6-12 ‖ P6-13 ‖ P6-16 ‖ P6-17 mają rozłączne allowlisty.
14. **PRZYJMUJĘ.** `diplomacy-basket-transfer.ts`: test `basket_and_treaty_duration_read_diplomacy_table` (`tests/derived_values.rs:911`) dotyczy czasu trwania traktatu, nie transferu koszyka; kolumna testu ustawiona na `-`.
15. **PRZYJMUJĘ.** Dodano ryzyka: `idb-storage.ts` jest importowany przez `save.ts:80` (ryzyko dla P6.20); `side-panel-event-priority.ts` (`isBlockingSidePanelEvent`, `:7`) blokuje koniec tury (`main.ts:14264`), klasa zmieniona na SYSTEM, status BRAK, punkt P6.10.

### 9a. Poprawka Final Control (runda 2): pozostałe NIE-DOTYCZY z logiką gry

Final Control sprawdził skryptem wszystkie 24 pliki NIE-DOTYCZY pod kątem importu przez pliki SYSTEM/DATA (zarzut 15 w tej samej klasie co 1–3). Trzy pliki UI zawierały logikę gry, a Operator ich nie ujął: `diplomacy-display.ts` (`sameCultureCircle` używane przez `culture-religion.ts:605`, `conquest-stability.ts:18`; `splitNegotiationDealPlayerSides` przez `diplomacy-acceptance-points.ts:22`), `display-names.ts` (`isOwnerClusterCityState` w `power-ranking.ts:33`; `clearCityStateFlagOnCapture`), `unit-card-stats.ts` (`effectiveMaxHp` w `combat.ts:924,936`). Klasa zmieniona na SYSTEM, status BRAK (Rust ma tylko pola danych), punkty P6.14, P6.6, P6.13. Po korekcie NIE-DOTYCZY = 21 plików; jedyny import przez SYSTEM/DATA z pozostałych to `idb-storage.ts` (`save.ts`, odnotowany w pkt 15).

Wniosek rundy 2: wszystkie 15 zarzutów rozpatrzone; jedyne częściowe odrzucenie to zarzut 9 (część faktyczna o słowach w pliku). Brak PORTOWANE-1:1. Deploy/push: NIE WYKONANO.
