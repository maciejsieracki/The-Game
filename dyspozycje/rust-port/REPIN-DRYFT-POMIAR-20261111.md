# REPIN-DRYFT-POMIAR-20261111 — pomiar dryfu web → Rust (temat `R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1`, runda 1/5, Operator)

**Typ:** DOKUMENTACJA (bez cargo, bez zmian w kodzie). **Status:** pomiar wykonany, bez zmian w `rust-port/**` i `gra/**`.

## 0. Piny i metoda

| Strona | Pin | Źródło odczytu |
|---|---|---|
| Web (źródło prawdy) | `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (`origin/main`) | `git archive 07d2fbd7… gra/src gra/data` rozpakowane poza repo (`/home/user/scratch_web_pin/gra/`) |
| Rust | `a4087f332c02bfc5a57aef7459f1e3fd8bf24a52` (`origin/rust-port/parity-v2`, tip = ten SHA, zweryfikowane `merge-base --is-ancestor`) | `git archive a4087f332 rust-port/engine` rozpakowane poza repo (`/home/user/scratch_rust_pin/rust-port/engine/`) |

Uwaga o dokumencie bazowym: `dyspozycje/rust-port/REPIN-DANE-20261029.md` nosi w nagłówku stempel `bb74ff9d` (stan sprzed kolejnych commitów). Aktualny tip `parity-v2` to `a4087f332`; wszystkie linie Rust w tym dokumencie pochodzą z `a4087f332`.

Legenda statusów: **ZGODNE** = wartość i logika zgodne z pinem web; **DRYF** = różnica wartości albo brak/odmienna logika; **NIE_ZMIERZONO** = nie zmierzono (powód podany).

Uwaga o etykiecie „FALA 618”: w dispatchu pozycja 2 ma opis „web 50/75 od FALI 618”. Etykiety „FALA 618” / „FALI 618” nie ma w `gra/src` ani `gra/data` (0 trafień). Wartości 50/75 zweryfikowano bezpośrednio w kodzie i danych (poniżej), więc pomiar opiera się na wartościach, nie na etykiecie. Oznaczenie w kodzie web: `R-WEB-BRONZE-OUTPUT-50-75-Q1` (2026-11-11).

## 1. Tabela zbiorcza

| # | Pozycja | Wartość web (plik:linia, pin 07d2fbd7) | Wartość Rust (plik:linia, parity-v2 a4087f332) | Status |
|---|---|---|---|---|
| 1 | Korupcja: Pałac II/III + Trybunał redukują 30% | `gra/src/game/economy.ts:1237` (6 budynków: sad, pretorium, palac, palac_ii, palac_iii, trybunal); 1243 (0,30/budynek); 1251 (sufit 0,60) | `rust-port/engine/src/domain/economy_city_fns.rs:220` (3 budynki: sad, pretorium, palac); 222 (0,30); 224 (0,60) | DRYF |
| 2 | Odlewnie brązu: 50 (epoka 2), 75 (epoka 3+) | `gra/src/game/converters.ts:99,100,102` (throughputEraParamKeys 2→`budynek_huta_braz_epoka2_przepustowosc`, 3→`budynek_huta_braz_epoka3_przepustowosc`); `gra/data/econ-params.json:362` (fallback 50), `:369` (epoka2 = 50), `:376` (epoka3 = 75) | `rust-port/engine/src/domain/turn_economy_resources.rs:77,86,95,113` (brąz: `budynek_huta_przepustowosc`, fallback 50, brak kluczy per epoka); `rust-port/engine/data/econ-params.json:362` (tylko `budynek_huta_przepustowosc` = 50; brak wierszy `budynek_huta_braz_epoka2/3_przepustowosc`) | DRYF (epoka 3+: 75 vs 50) |
| 3a | Handel: `emporion` w `TRADE_BUILDING_IDS` | `gra/src/game/trade-routes.ts:908-910` (`targowisko`, `port`, `port_wielki`, **`emporion`**) | `rust-port/engine/src/domain/trade.rs:345` (`["targowisko", "port", "port_wielki"]`, 3 elementy, brak `emporion`) | DRYF |
| 3b | Handel kontaktowy (R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1) | `gra/src/game/trade-routes.ts:1011-1017` `externalTradeContactOk` = `hasContact && miasta>0`; komunikaty braku łączności usunięte (ok. 1040-1082) | `rust-port/engine/src/domain/trade.rs:860-923` `find_city_connection_internal`: wymaga wspólnej granicy lądowej (884-887), komponentów lądowych (889-891), ścieżki BFS (897-899); gałąź morska wymaga Portu w obu miastach (901-904) i BFS wodnego (921) | DRYF |
| 4 | Łodzie rybackie 6/6/6 | `gra/data/terrain-improvements.json:237-243` (`lodzie_rybackie.bonus`: zywnosc 6, praca 6, handel 6) | `rust-port/engine/data/terrain-improvements.json:234-240` (zywnosc 2, praca 3, handel 3); **dodatkowo** `rust-port/engine/src/domain/improvements.rs:437-441` (`FishingBoats => Production { food: 2, work: 3, trade: 3 }`, wartości zakodowane na sztywno) | DRYF |
| 5 | `civBonusy` w zapisie | Zapis web (`gra/src/game/save.ts`): brak pola civBonusy (0 trafień w save.ts). Bonusy liczone w runtime: `gra/src/game/economy.ts:778` `civBonusyForCivKey`, `gra/src/main.ts:9842` `civBonusyForOwnerId` | Zapis Rust (`rust-port/engine/src/domain/save_load.rs`): brak pól civBonus (0 trafień). Bonusy liczone w runtime: `rust-port/engine/src/domain/economy_city_fns.rs:257-261` `civ_bonusy_for_civ_key` | ZGODNE (oba: poza zapisem, liczone z cywilizacji w runtime) |
| 6a | `przewagaMilitarna` (prog 0,20; epsilon 1e-9) | Wartości: `gra/data/diplomacy-war-peace-params.json:89-101`. Logika: `gra/src/game/diplomacy-war-peace-profile.ts:327-335` `militaryAdvantageClass`, `:339-344` `peaceBlockedByMilitaryAdvantage`; `gra/src/game/diplomacy-peace-lock.ts:173-180` (truceEnd) | Wartości: `rust-port/engine/data/derived/diplomacy-war-peace-params.json:89-101` (identyczne), stałe w kodzie `rust-port/engine/src/domain/diplomacy_truce_end.rs:19,21`. Logika: tylko `truce_end_ai_accepts` (`diplomacy_truce_end.rs:26-36`); brak `militaryAdvantageClass` / `peaceBlockedByMilitaryAdvantage` (grep: 0 trafień) | DRYF (wartości ZGODNE; reguły (a)/(b) z DODATKU 1 nieprzeniesione; prog w Rust jako stała, nie z danych) |
| 6b | `pokojAiAi.minBilansPW` (0) | Wartość: `gra/data/diplomacy-war-peace-params.json:102-`; konsument `gra/src/game/diplomacy-ai-forced-peace.ts:30-35` | Wartość: `rust-port/engine/data/derived/diplomacy-war-peace-params.json:102-` (0). Konsument: brak (grep `minBilansPW|min_bilans|pokojAiAi` w `src`: 0 trafień) | DRYF (wartość ZGODNE, konsument brak) |
| 6c | `progNapBezterminowyRelacja` (151) | Wartość: `gra/data/diplomacy.json:39`, `gra/src/game/diplomacy.ts:186`; konsument `gra/src/game/ai.ts:7269` (`napIndefinite`) | Wartość: `rust-port/engine/data/diplomacy.json:39` (151), `rust-port/engine/src/domain/diplomacy.rs:367` (151). Konsument: brak; kod sam deklaruje „Brak konsumenta po stronie Rust” (`diplomacy.rs:259-261`) | DRYF (wartość ZGODNE, konsument brak) |
| 6d | Ekspansja graniczna: Granica −2 / Brąz −3 / Żelazo −4 | Wartości: `gra/data/diplomacy.json:28-30`; wybór wg epoki pary: `gra/src/game/diplomacy.ts:603-606` (`pairEpoch>=3` → Żelazo, `>=2` → Brąz, inaczej Granica); użycie: `diplomacy.ts:990`, `:1800` | Wartości: `rust-port/engine/data/diplomacy.json:28-30` (identyczne). Pole w strukturze: `rust-port/engine/src/data/civilizations.rs:320-325`. Brak wyboru wg epoki i brak użycia Brąz/Żelazo w `src` (grep `ekspansja_granica_braz|ekspansja_granica_zelazo`: tylko definicja) | DRYF (wartości ZGODNE; logika epokowa nieprzeniesiona) |
| 6e | `sisterAlliance` (SISTER_ALLIANCE_THRESHOLD_SCALE 0,6/0,3/0,15; `sisterAllianceDiplomacyParams`) | `gra/src/game/diplomacy.ts:731-800` (blok sisterAlliance, `sisterAllianceDiplomacyParams` ok. 772) | Brak: grep `sister|siostr|SISTER` w `rust-port/engine/src`: 0 trafień | DRYF (brak portu) |
| 6f | `aiDiplomacyStance` | `gra/src/game/diplomacy.ts:1276` (pełna ścieżka: `resolveArchetypeAggression/Trade` z trudnością, wojna: `warWearinessShare` z `zmeczenieT` per cywilizacja + `militaryPressure` + `zaufanie/100*0.2`, pokój poza wojną: 0,80, alians z `diplomacyAllianceStrengthAdjust`); wojna 1337-1346: `aggr*0.50 + respekt/100*0.30 + (1-score/200)*0.20` | `rust-port/engine/src/domain/diplomacy.rs:1075-1140` (uproszczony „deterministyczny ekwiwalent”): wojna ta sama formuła 0,50/0,30/0,20 (zgodne), `archetype_aggression(ai_kind)` bez trudności; pokój w wojnie: `min(0,50, turns_at_war/20) + pressure + trust/100*0.2` (inna składowa zmęczenia niż `warWearinessShare`); pokój poza wojną 0,80 (zgodne) | DRYF (część formuł zgodna; zmęczenie wojną, archetypy z trudnością i blok sojuszu różnią się; blok sojuszu w Rust nie porównany w całości) |

## 2. Propozycje REPIN (tylko DRYF; bez zmian w kodzie w tym temacie)

**Pozycja 1 — korupcja Pałac II/III + Trybunał**
- Plik: `rust-port/engine/src/domain/economy_city_fns.rs:219-220`.
- Zmiana: `KORUPCJA_REDUKCJA_BUDYNKI` z `[&str; 3] = ["sad", "pretorium", "palac"]` na `[&str; 6] = ["sad", "pretorium", "palac", "palac_ii", "palac_iii", "trybunal"]` (kolejność jak w web `economy.ts:1237`). Stałe 0,30 i 0,60 bez zmian.
- Test: `economy_city_fns.rs:438-441` zostaje; dodać asercję dla `["trybunal"]` = 0,30 i `["palac_iii"]` = 0,30 (wartości web).
- Do potwierdzenia przy wdrożeniu: wywołujący musi przekazywać `builtIds` po usunięciu poprzednika tieru Pałacu (web: `palac`/`palac_ii` znikają przy awansie), NIE_ZMIERZONO w tym pomiarze.

**Pozycja 2 — odlewnie brązu 50/75**
- Pliki: `rust-port/engine/data/econ-params.json` (dodać wiersze `budynek_huta_braz_epoka2_przepustowosc` = 50 i `budynek_huta_braz_epoka3_przepustowosc` = 75, wszystkie trudności, wzór jak `gra/data/econ-params.json:369-381`); `rust-port/engine/src/domain/turn_economy_resources.rs:81-88, 95-100, 113-118` (receptury brązu: `odlewnia_brazu`, `odlewnia_zelaza__braz`, `wielka_odlewnia__braz`) — dodać wybór przepustowości wg epoki właściciela (epoka 1 → fallback 50; 2 → klucz epoka2; 3+ → klucz epoka3), analogicznie do `throughputEraParamKeys` w `gra/src/game/converters.ts:99-102`.
- Nie zmieniać receptur żelaza/stali (`m(e)`, `CONVERTER_FOUNDRY_ERA_RECIPE_IDS`, web `converters.ts:148-151`).

**Pozycja 3a — `emporion` w TRADE_BUILDING_IDS**
- Plik: `rust-port/engine/src/domain/trade.rs:345` — `TRADE_BUILDING_IDS: [&str; 4] = ["targowisko", "port", "port_wielki", "emporion"]`. Sprawdzić wszystkie wywołania `trade.rs:357` i testy liczące sloty (limit tras = liczba budynków handlowych).

**Pozycja 3b — handel kontaktowy (trasy zewnętrzne bez fizycznego połączenia)**
- Plik: `rust-port/engine/src/domain/trade.rs:860-923` (`find_city_connection_internal`). Dla tras zewnętrznych (między cywilizacjami) zastąpić warunek fizycznego połączenia kontaktem: `hasContact && miasta>0` (web `trade-routes.ts:1011-1017`); medium liczyć z geometrii (web `trade-routes.ts:1019-` „medium i dystans bez wymogu fizycznego połączenia”), bez BFS jako warunku istnienia.
- Przed zmianą: ustalić, które wywołania `find_city_connection*` dotyczą tras zewnętrznych, a które wewnętrznych (NIE_ZMIERZONO w tym pomiarze).

**Pozycja 4 — łodzie rybackie 6/6/6**
- Plik 1: `rust-port/engine/src/domain/improvements.rs:437-441` — `FishingBoats => Production { food: 6, work: 6, trade: 6, ..Production::default() }`.
- Plik 2: `rust-port/engine/data/terrain-improvements.json:237-240` — `bonus`: zywnosc 6, praca 6, handel 6 (wzór: `gra/data/terrain-improvements.json:240-243`).
- Uwaga: wartości w `improvements.rs` są zakodowane na sztywno, plik JSON nie jest czytany dla tej pozycji (do potwierdzenia przy wdrożeniu).

**Pozycja 5 — civBonusy w zapisie**
- Brak REPIN: ZGODNE.

**Pozycja 6a — przewagaMilitarna**
- Pliki: `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs` (dodać `military_advantage_class` i `peace_blocked_by_military_advantage` wg web `diplomacy-war-peace-profile.ts:327-344`); odczyt progu z `data/derived/diplomacy-war-peace-params.json` zamiast stałej `PRZEWAGA_PROG` (`diplomacy_truce_end.rs:19`).

**Pozycja 6b — pokojAiAi.minBilansPW**
- Pliki: `rust-port/engine/src/domain/diplomacy_tick_war_brake.rs` / miejsce zawierania pokoju AI-AI (`aiAiPeaceRequestByPairKey` w `war_turn_state.rs:47`): dodać warunek „bilans PW ≥ minBilansPW (0)” jak web `diplomacy-ai-forced-peace.ts:30-35`. Wyjątek gracza bez zmian.

**Pozycja 6c — progNapBezterminowyRelacja**
- Pliki: `rust-port/engine/src/domain/diplomacy.rs` (AI proponuje NAP bezterminowy przy `score >= nap_indefinite_relation`, odpowiednik web `ai.ts:7269`); wartość 151 już zgodna.

**Pozycja 6d — ekspansja graniczna wg epoki**
- Pliki: `rust-port/engine/src/domain/diplomacy_nap_trust.rs` lub moduł wyliczający zaufanie graniczne; dodać wybór `ekspansja_granica_braz_zaufanie_per_tura` (epoka pary ≥2) i `..._zelazo_...` (≥3) jak web `diplomacy.ts:603-606`. Wartości w `civilizations.rs:320-325` zgodne.

**Pozycja 6e — sisterAlliance**
- Port całości: `rust-port/engine/src/domain/diplomacy.rs` — `SISTER_ALLIANCE_THRESHOLD_SCALE` (0,6 / 0,3 / 0,15) i `sisterAllianceDiplomacyParams` jak web `diplomacy.ts:731-800`. Wymaga osobnej decyzji o zakresie (duży kawałek logiki).

**Pozycja 6f — aiDiplomacyStance**
- Plik: `rust-port/engine/src/domain/diplomacy.rs:1075-1140`. Wyrównać: (a) zmęczenie wojną na `warWearinessShare` z `zmeczenieT` per cywilizacja (web `diplomacy.ts:1343-1350`); (b) `archetype_aggression/trade` z parametrem trudności (`resolveArchetypeAggression`, web `diplomacy.ts:1280-1290`); (c) blok sojuszu porównać osobno (NIE_ZMIERZONO w całości). Wymaga osobnego tematu logiki.

## 3. NIE_ZMIERZONO (uczciwie)

- Etykieta „FALA 618” (pozycja 2): nieodnaleziona w web; zmierzono wartości, nie etykietę.
- Testy: nie uruchamiano (dispatch: temat bez cargo). Brak dowodu na zachowanie w grze, tylko zgodność definicji i danych.
- Pozycja 3b: nie zidentyfikowano wszystkich wywołań `find_city_connection*` (czy każde dotyczy trasy zewnętrznej).
- Pozycja 5: negatywny dowód (brak frazy w `save.ts` / `save_load.rs`). Pełnego schematu zapisu nie wyliczano; nie sprawdzono też, czy `civs.json` Rust = web (bytes), bo to nie należy do pozycji 5.
- Pozycja 6f: blok alliance (`diplomacy.ts` po 1366) porównano tylko na poziomie struktury; formuły nie zweryfikowane linia po linii.
- Derived / wektory `tests/*_vectors`: nie oceniano wpływu zmian na przeliczenia.
- Dane `civs.json`, `units.json`, `econ-params.json` w zakresie REPIN-DANE nie były częścią tego pomiaru poza wpisami cytowanymi powyżej.

## 4. Podsumowanie

- Pozycje: 1 DRYF; 2 DRYF; 3 DRYF (3a i 3b); 4 DRYF; 5 ZGODNE; 6 DRYF (6a–6f; w 6a/6b/6c/6d wartości danych ZGODNE, DRYF to logika).
- Zmiany w kodzie: brak (`rust-port/**` i `gra/**` nietknięte). Gate: NIE_DOTYCZY (bez cargo).
