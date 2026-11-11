# REPIN-DRYFT-POMIAR-20261111 — pomiar dryfu web → Rust (temat `R-RUSTPORT-REPIN-DRYFT-POMIAR-Q1`, runda 1/5, Operator + obrona)

**Typ:** DOKUMENTACJA (bez cargo, bez zmian w kodzie). **Status:** pomiar wykonany i poprawiony po zarzutach Evaluatora r1 (`02-evaluator.md`, commit `ebbe60ea2`); bez zmian w `rust-port/**` i `gra/**`.

## 0. Piny i metoda

| Strona | Pin | Źródło odczytu |
|---|---|---|
| Web (źródło prawdy) | `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (`origin/main` w chwili pomiaru) | `git show 07d2fbd7:<ścieżka>` (odczyt z obiektów git, bez checkoutu; kopie robocze poza repo) |
| Rust | `a4087f332c02bfc5a57aef7459f1e3fd8bf24a52` (`origin/rust-port/parity-v2`, tip = ten SHA) | `git show a4087f332:<ścieżka>` (kopie robocze poza repo) |

**Pomiar dotyczy stanu zamrożonego pinu web `07d2fbd7`.** `origin/main` poszedł dalej (w chwili obrony: `674f9faef`, sprawdzone `git rev-parse origin/main`); ten późniejszy stan NIE jest objęty pomiarem i może zawierać dalszy dryf. Przed wdrożeniem REPIN trzeba powtórzyć odczyt na aktualnym pinie.

Uwaga o dokumencie bazowym: `dyspozycje/rust-port/REPIN-DANE-20261029.md` nosi w nagłówku stempel `bb74ff9d` (stan sprzed kolejnych commitów). Wszystkie linie Rust w tym dokumencie pochodzą z `a4087f332`.

Legenda statusów: **ZGODNE** = wartość i logika zgodne z pinem web; **DRYF** = różnica wartości albo brak/odmienna logika; **NIE_ZMIERZONO** = nie zmierzono (powód podany).

Uwaga o etykiecie „FALA 618”: w dispatchu pozycja 2 ma opis „web 50/75 od FALI 618”. Etykiety „FALA 618” / „FALI 618” nie ma w `gra/src` ani `gra/data` (0 trafień). Wartości 50/75 zweryfikowano bezpośrednio w kodzie i danych (poniżej), więc pomiar opiera się na wartościach, nie na etykiecie. Oznaczenie w kodzie web: `R-WEB-BRONZE-OUTPUT-50-75-Q1` (2026-11-11).

## 1. Tabela zbiorcza

| # | Pozycja | Wartość web (plik:linia, pin 07d2fbd7) | Wartość Rust (plik:linia, parity-v2 a4087f332) | Status |
|---|---|---|---|---|
| 1 | Korupcja: Pałac II/III + Trybunał redukują 30% | `gra/src/game/economy.ts:1237` (6 budynków: sad, pretorium, palac, palac_ii, palac_iii, trybunal); 1243 (0,30/budynek); 1251 (sufit 0,60) | `rust-port/engine/src/domain/economy_city_fns.rs:220` (3 budynki: sad, pretorium, palac); 222 (0,30); 224 (0,60) | DRYF |
| 2 | Odlewnie brązu: 50 (epoka 2), 75 (epoka 3+) | `gra/src/game/converters.ts:99,100,102` (throughputEraParamKeys 2→`budynek_huta_braz_epoka2_przepustowosc`, 3→`budynek_huta_braz_epoka3_przepustowosc`); `gra/data/econ-params.json:362` (klucz bazowy, wartości 363-365 = 50), `:369` (klucz epoka2, wartość 370-372 = 50), `:376` (klucz epoka3, wartość 377-379 = 75) | `rust-port/engine/src/domain/turn_economy_resources.rs:77` (klucz `budynek_huta_przepustowosc` dla huty), receptury brązu: `:81` (`odlewnia_brazu`, klucz w :86), `:90` (`odlewnia_zelaza__braz`, klucz w :95), `:108` (`wielka_odlewnia__braz`, klucz w :113) — wszystkie na `budynek_huta_przepustowosc`, brak kluczy per epoka; `rust-port/engine/data/econ-params.json:362` (tylko `budynek_huta_przepustowosc` = 50; brak wierszy `budynek_huta_braz_epoka2/3_przepustowosc`) | DRYF (epoka 3+: 75 vs 50) |
| 3a | Handel: `emporion` w `TRADE_BUILDING_IDS` | `gra/src/game/trade-routes.ts:908-910` (`targowisko`, `port`, `port_wielki`, **`emporion`**) | `rust-port/engine/src/domain/trade.rs:345` (`["targowisko", "port", "port_wielki"]`, 3 elementy, brak `emporion`) | DRYF |
| 3b | Handel kontaktowy (R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1) | `gra/src/game/trade-routes.ts:1011-1017` `externalTradeContactOk` = `hasContact && miasta>0`; komunikaty braku łączności usunięte (ok. 1040-1082) | `rust-port/engine/src/domain/trade.rs:860-923` `find_city_connection_internal`: sprawdzenie wspólnej granicy lądowej jest **warunkowe** — `if let Some(nodes) = territory_nodes` (883-888); komponenty lądowe (889-891); ścieżka BFS (897-899). Gałąź morska wymaga **Portu w obu miastach** (904-908) i BFS wodnego (921). Brak odpowiednika `externalTradeContactOk` (grep `contact` w `trade.rs`: 0). Wywołania `find_city_connection*`: `trade.rs:940, 966, 1026, 1127, 1140, 1239` (do rozpisania, który z nich dotyczy tras zewnętrznych — NIE_ZMIERZONO) | DRYF |
| 4 | Łodzie rybackie 6/6/6 | `gra/data/terrain-improvements.json:237-243` (`lodzie_rybackie.bonus`: zywnosc 6, praca 6, handel 6) | `rust-port/engine/data/terrain-improvements.json:234-240` (zywnosc 2, praca 3, handel 3); **dodatkowo** `rust-port/engine/src/domain/improvements.rs:437-441` (`production_for`, gałąź `FishingBoats => Production { food: 2, work: 3, trade: 3 }`, wartości zakodowane na sztywno) | DRYF (dane i kod enumu: 2/3/3 vs 6/6/6). Która ścieżka zasila plony w grze — NIE_ZMIERZONO (patrz sekcja 3) |
| 5 | `civBonusy` w zapisie | Zapis web (`gra/src/game/save.ts`): brak pola civBonusy (0 trafień w save.ts). Bonusy liczone w runtime: `gra/src/game/economy.ts:778` `civBonusyForCivKey`, `gra/src/main.ts:9842` `civBonusyForOwnerId` | Zapis Rust (`rust-port/engine/src/domain/save_load.rs`): brak pól civBonus (0 trafień). Bonusy liczone w runtime: `rust-port/engine/src/domain/economy_city_fns.rs:257-261` `civ_bonusy_for_civ_key` | ZGODNE (oba: poza zapisem, liczone z cywilizacji w runtime) |
| 6a | `przewagaMilitarna` (prog 0,20; epsilon 1e-9) | Wartości: `gra/data/diplomacy-war-peace-params.json:89-101`. Logika: `gra/src/game/diplomacy-war-peace-profile.ts:327-333` `militaryAdvantageClass`, `:339-345` `peaceBlockedByMilitaryAdvantage` (zależy od `isWarWeary`, `gra/src/game/war-weariness.ts:76`); `gra/src/game/diplomacy-peace-lock.ts:173-180` (truceEnd) | Wartości: `rust-port/engine/data/derived/diplomacy-war-peace-params.json:89-101` (identyczne), stałe w kodzie `rust-port/engine/src/domain/diplomacy_truce_end.rs:19,21`. Logika: `truce_end_ai_accepts` (`diplomacy_truce_end.rs:26-36`); brak `militaryAdvantageClass` / `peaceBlockedByMilitaryAdvantage` (grep: 0 trafień). Zależność `isWarWeary` **jest** w Rust: `is_war_weary` (`rust-port/engine/src/domain/diplomacy_multiwar.rs:291-292`, `level >= prog_chetnosci`, prog 0,5 z `WarWearinessParams` l.225/248) | DRYF (wartości ZGODNE; reguły (a)/(b) z DODATKU 1 nieprzeniesione; prog w Rust jako stała, nie z danych) |
| 6b | `pokojAiAi.minBilansPW` (0) | Wartość: `gra/data/diplomacy-war-peace-params.json:102-104`. Konsument: `gra/src/game/diplomacy-ai-forced-peace.ts:34-40` (`aiAiPeaceMinBalance`, stała `AI_AI_PEACE_MIN_BALANCE` l.39), `:42-50` (`isAiAiPeaceBalanceAllowed`: bilans zwycięzcy I przegranego >= minBilans) | Wartość: `rust-port/engine/data/derived/diplomacy-war-peace-params.json:102-104` (0). Miejsce decyzji o pokoju AI-AI: `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs` — `decide_ai_peace_request` (l.273-285; tolerancja bilansu po zapłacie w komentarzu l.269-272 i w gałęzi `AcceptPaid`) oraz `run_ai_ai_peace_tick` (l.414). Konsument `minBilansPW`: brak (grep `minBilansPW\|min_bilans\|pokojAiAi` w `diplomacy_ai_forced_peace.rs`: 0; w całym `src`: 0) | DRYF (wartość ZGODNE, konsument brak) |
| 6c | `progNapBezterminowyRelacja` (151) | Wartość: `gra/data/diplomacy.json:39`, `gra/src/game/diplomacy.ts:186`; konsument `gra/src/game/ai.ts:7269` (`napIndefinite`) | Wartość: `rust-port/engine/data/diplomacy.json:39` (151), `rust-port/engine/src/domain/diplomacy.rs:367` (151). Konsument: brak; kod sam deklaruje „Brak konsumenta po stronie Rust” (`diplomacy.rs:259-261`) | DRYF (wartość ZGODNE, konsument brak) |
| 6d | Ekspansja graniczna: Granica −2 / Brąz −3 / Żelazo −4 | Wartości: `gra/data/diplomacy.json:28-30`. Wybór wg epoki pary: `gra/src/game/diplomacy.ts:598-606` `sharedBorderPenaltyForEpochs` (`pairEpoch = max(epochA, epochB)`; >=3 → Żelazo, >=2 → Brąz, inaczej Granica). Wywołania: `gra/src/main.ts:22879` i `:41356` (wynik jako `karaWspolnaGranicaDelta`). Konsumpcja: `diplomacy.ts:990` używa BAZOWEGO `p.ekspansjaGranica_zaufanie_perTura`; `diplomacy.ts:1800` używa `ctx.karaWspolnaGranicaDelta ?? base`; `gra/src/game/diplomacy-factors.ts:189` (`continuous.karaWspolnaGranicaZaufaniePerTura ?? base`, zasilane z `main.ts:22921`) | Wartości: `rust-port/engine/data/diplomacy.json:28-30` (identyczne). Pola w strukturze: `rust-port/engine/src/data/civilizations.rs:320-325` (tylko odczyt w teście `tests/p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja.rs:38-39`). Brak parametru delty: `karaWspolnaGranicaDelta` / `shared_border_penalty` w `rust-port/engine/src`: 0 trafień. Rust ma tylko `kara_wspolna_granica: bool` (`diplomacy_nap_trust.rs:41-46`, 132, 225-233) ze stałym narzutem `NAP_GRANICA_RELACJA_NARZUT` (20) — bez wyboru wg epoki | DRYF (wartości ZGODNE; cały kontrakt delty granicznej i wybór epokowy nieprzeniesione, nie tylko sam wybór) |
| 6e | `sisterAlliance` (SISTER_ALLIANCE_THRESHOLD_SCALE 0,6/0,3/0,15; `sisterAllianceDiplomacyParams`) | `gra/src/game/diplomacy.ts:731-800` (blok sisterAlliance, `sisterAllianceDiplomacyParams` ok. 772) | Brak: grep `sister|siostr|SISTER` w `rust-port/engine/src`: 0 trafień | DRYF (brak portu) |
| 6f | `aiDiplomacyStance` | `gra/src/game/diplomacy.ts:1276` (początek ścieżki pełnej). Archetypy z trudnością: wywołania `resolveArchetypeAggression` / `resolveArchetypeTrade` w `diplomacy.ts:1322-1332` (definicje `gra/src/game/civ-ai-data.ts:164`, `:188`). Wojna: `warW` `diplomacy.ts:1337-1346` (`aggr*0,50 + respekt/100*0,30 + (1-score/200)*0,20`). Zmęczenie wojną: wywołanie `warWearinessShare` `diplomacy.ts:1355-1358` (z `zmeczenieT` per cywilizacja), definicja `gra/src/game/diplomacy-war-peace-profile.ts:199`; `militaryPressure` 1359-1361; `goodwill` 1362; `peaceW = clamp(...)` 1363. Pokój poza wojną: `peaceW = 0,80` w `diplomacy.ts:1366`. Alians: `diplomacyAllianceStrengthAdjust` (blok po ok. 1366) | `rust-port/engine/src/domain/diplomacy.rs:1076-1140` `ai_diplomacy_stance` (uproszczony „deterministyczny ekwiwalent”): wojna ta sama formuła 0,50/0,30/0,20 (zgodne), `archetype_aggression(ai_kind)` (l.1027, bez trudności); pokój w wojnie: `min(0,50, turns_at_war/20)` (l.1118) + `pressure` + `trust/100*0,2` — inna składowa niż `warWearinessShare`; pokój poza wojną 0,80 (l.1127, zgodne). Składowe już są w Rust, ale nie podpięte: `zmeczenie_t` per cywilizacja (`rust-port/engine/src/domain/diplomacy_war_peace_profile.rs:238, 395, 418`) i helper `war_weariness_share` (`diplomacy_war_peace_profile.rs:436-458`) — `ai_diplomacy_stance` z nich nie korzysta | DRYF (część formuł zgodna; zmęczenie wojną, archetypy z trudnością i blok sojuszu różnią się; blok sojuszu w Rust nie porównany w całości) |

## 2. Propozycje REPIN (tylko DRYF; bez zmian w kodzie w tym temacie)

**Pozycja 1 — korupcja Pałac II/III + Trybunał**
- Plik: `rust-port/engine/src/domain/economy_city_fns.rs:219-220`.
- Zmiana: `KORUPCJA_REDUKCJA_BUDYNKI` z `[&str; 3] = ["sad", "pretorium", "palac"]` na `[&str; 6] = ["sad", "pretorium", "palac", "palac_ii", "palac_iii", "trybunal"]` (kolejność jak w web `economy.ts:1237`). Stałe 0,30 i 0,60 bez zmian.
- Test: `economy_city_fns.rs:438-441` zostaje; dodać asercję dla `["trybunal"]` = 0,30 i `["palac_iii"]` = 0,30 (wartości web).
- Do potwierdzenia przy wdrożeniu: wywołujący musi przekazywać `builtIds` po usunięciu poprzednika tieru Pałacu (web: `palac`/`palac_ii` znikają przy awansie). NIE_ZMIERZONO w tym pomiarze.

**Pozycja 2 — odlewnie brązu 50/75**
- Pliki: `rust-port/engine/data/econ-params.json` (dodać wiersze `budynek_huta_braz_epoka2_przepustowosc` = 50 i `budynek_huta_braz_epoka3_przepustowosc` = 75, wszystkie trudności, wzór jak `gra/data/econ-params.json:369-381`); `rust-port/engine/src/domain/turn_economy_resources.rs:81-118` (receptury brązu: `odlewnia_brazu` l.81, `odlewnia_zelaza__braz` l.90, `wielka_odlewnia__braz` l.108 — ich klucze przepustowości l.86, 95, 113) — dodać wybór przepustowości wg epoki właściciela (epoka 1 → fallback 50; 2 → klucz epoka2; 3+ → klucz epoka3), analogicznie do `throughputEraParamKeys` w `gra/src/game/converters.ts:99-102`.
- Nie zmieniać receptur żelaza/stali (`odlewnia_zelaza__zelazo`, `wielka_odlewnia__zelazo`, `wielka_odlewnia__stal`; `CONVERTER_FOUNDRY_ERA_RECIPE_IDS`, web `converters.ts:148-151`).

**Pozycja 3a — `emporion` w TRADE_BUILDING_IDS**
- Plik: `rust-port/engine/src/domain/trade.rs:345` — `TRADE_BUILDING_IDS: [&str; 4] = ["targowisko", "port", "port_wielki", "emporion"]`. Sprawdzić wszystkie wywołania (w tym `trade.rs:357`) i testy liczące sloty (limit tras = liczba budynków handlowych).

**Pozycja 3b — handel kontaktowy (trasy zewnętrzne bez fizycznego połączenia)**
- Plik: `rust-port/engine/src/domain/trade.rs:860-923` (`find_city_connection_internal`). Dla tras zewnętrznych (między cywilizacjami) zastąpić warunek fizycznego połączenia kontaktem: `hasContact && miasta>0` (web `trade-routes.ts:1011-1017`); medium liczyć z geometrii (web `trade-routes.ts:1019-` „medium i dystans bez wymogu fizycznego połączenia”), bez BFS jako warunku istnienia. Warunek Portu (904-908) i granicy (883-888) dotyczą wyłącznie tras wewnętrznych — do potwierdzenia po rozpisaniu wywołań.
- Przed zmianą: ustalić, które wywołania `find_city_connection*` (`trade.rs:940, 966, 1026, 1127, 1140, 1239`) dotyczą tras zewnętrznych, a które wewnętrznych (NIE_ZMIERZONO w tym pomiarze).

**Pozycja 4 — łodzie rybackie 6/6/6**
- Plik 1: `rust-port/engine/src/domain/improvements.rs:437-441` — `FishingBoats => Production { food: 6, work: 6, trade: 6, ..Production::default() }`.
- Plik 2: `rust-port/engine/data/terrain-improvements.json:237-240` — `bonus`: zywnosc 6, praca 6, handel 6 (wzór: `gra/data/terrain-improvements.json:240-243`).
- Uwaga: wartości w `improvements.rs` (`production_for`) są zakodowane na sztywno; dane JSON są czytane przez katalog `ImprovementCatalog` (`improvements.rs:600-640`, `TERRAIN_IMPROVEMENTS_JSON` w `data/terrain_map.rs:12`). Która ścieżka zasila plony łodzi w grze — NIE_ZMIERZONO; oba miejsca zmienić jest bezpieczne.

**Pozycja 5 — civBonusy w zapisie**
- Brak REPIN: ZGODNE.

**Pozycja 6a — przewagaMilitarna**
- Pliki: `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs` (dodać `military_advantage_class` i `peace_blocked_by_military_advantage` wg web `diplomacy-war-peace-profile.ts:327-345`); odczyt progu z `data/derived/diplomacy-war-peace-params.json` zamiast stałej `PRZEWAGA_PROG` (`diplomacy_truce_end.rs:19`).
- Zależności już są w Rust: `is_war_weary` (`diplomacy_multiwar.rs:291-292`) i `zmeczenie_t` (`diplomacy_war_peace_profile.rs:238`). Do podpięcia, nie do budowy od zera.

**Pozycja 6b — pokojAiAi.minBilansPW**
- Plik: `rust-port/engine/src/domain/diplomacy_ai_forced_peace.rs` — miejsce decyzji o pokoju AI-AI: `run_ai_ai_peace_tick` (l.414) i `decide_ai_peace_request` (l.273-285). Dodać warunek „bilans zwycięzcy I przegranego >= minBilansPW (0)” jak web `diplomacy-ai-forced-peace.ts:42-50` (`isAiAiPeaceBalanceAllowed`). Wyjątek gracza bez zmian. (Uwaga: `war_turn_state.rs:47` to tylko lista kluczy meta i nie jest miejscem decyzji; `diplomacy_tick_war_brake.rs` nie zawiera decyzji o pokoju AI-AI.)

**Pozycja 6c — progNapBezterminowyRelacja**
- Pliki: `rust-port/engine/src/domain/diplomacy.rs` (AI proponuje NAP bezterminowy przy `score >= nap_indefinite_relation`, odpowiednik web `ai.ts:7269`); wartość 151 już zgodna.

**Pozycja 6d — ekspansja graniczna wg epoki (kontrakt delty)**
- Pliki: `rust-port/engine/src/domain/diplomacy_nap_trust.rs` (dodać parametr delty granicznej, odpowiednik `karaWspolnaGranicaDelta` z `diplomacy.ts:1744`, zamiast samego `kara_wspolna_granica: bool` i stałego narzutu), `rust-port/engine/src/domain/diplomacy.rs` lub moduł zaufania (wybór wg `max(epochA, epochB)`: >=3 → `ekspansja_granica_zelazo_zaufanie_per_tura`, >=2 → `..._braz_...`, inaczej bazowy) jak web `diplomacy.ts:598-606`. Wartości w `civilizations.rs:320-325` zgodne.
- Konsumenci po stronie web do odwzorowania: `diplomacy.ts:990` (bazowy — tu wybór NIE ma być stosowany, zgodnie z webem), `diplomacy.ts:1800` (delta z kontekstu), `diplomacy-factors.ts:189`.

**Pozycja 6e — sisterAlliance**
- Port całości: `rust-port/engine/src/domain/diplomacy.rs` — `SISTER_ALLIANCE_THRESHOLD_SCALE` (0,6 / 0,3 / 0,15) i `sisterAllianceDiplomacyParams` jak web `diplomacy.ts:731-800`. Wymaga osobnej decyzji o zakresie (duży kawałek logiki).

**Pozycja 6f — aiDiplomacyStance**
- Plik: `rust-port/engine/src/domain/diplomacy.rs:1076-1140` (`ai_diplomacy_stance`). Wyrównać: (a) zmęczenie wojną na `warWearinessShare` (web `diplomacy-war-peace-profile.ts:199`, wywołanie `diplomacy.ts:1355-1358`) z `zmeczenie_t` per cywilizacja — Rust ma już `war_weariness_share` (`diplomacy_war_peace_profile.rs:457`) do podpięcia; (b) `archetype_aggression/trade` z parametrem trudności (`resolveArchetypeAggression/Trade`, web `civ-ai-data.ts:164,188`, wywołania `diplomacy.ts:1322-1332`); (c) blok sojuszu porównać osobno (NIE_ZMIERZONO w całości). Wymaga osobnego tematu logiki.

## 3. NIE_ZMIERZONO (uczciwie)

- Etykieta „FALA 618” (pozycja 2): nieodnaleziona w web; zmierzono wartości, nie etykietę.
- Testy: nie uruchamiano (dispatch: temat bez cargo). Brak dowodu na zachowanie w grze, tylko zgodność definicji i danych.
- Pozycja 3b: nie zidentyfikowano, które wywołania `find_city_connection*` (`trade.rs:940, 966, 1026, 1127, 1140, 1239`) dotyczą tras zewnętrznych.
- Pozycja 4: nie ustalono, czy plony łodzi rybackich w grze pochodzą z `production_for` (`improvements.rs:437`, wartości na sztywno) czy z katalogu JSON (`ImprovementCatalog`). Wcześniejsze zdanie, że JSON „nie jest czytany”, było błędne i zostało usunięte.
- Pozycja 5: negatywny dowód (brak frazy w `save.ts` / `save_load.rs`). Pełnego schematu zapisu nie wyliczano; nie sprawdzono też, czy `civs.json` Rust = web (bytes), bo to nie należy do pozycji 5.
- Pozycja 6f: blok alliance (`diplomacy.ts` po 1366) porównano tylko na poziomie struktury; formuły nie zweryfikowane linia po linii.
- Pozycja 6d: nie ustalono, czy wartości `ekspansjaGranicaBraz/Zelazo` z `civilizations.rs` są gdziekolwiek konsumowane poza testem (grep w `src`: tylko definicja pola).
- Pin: pomiar nie obejmuje `origin/main` po `07d2fbd7` (patrz sekcja 0).
- Derived / wektory `tests/*_vectors`: nie oceniano wpływu zmian na przeliczenia.
- Dane `civs.json`, `units.json`, `econ-params.json` w zakresie REPIN-DANE nie były częścią tego pomiaru poza wpisami cytowanymi powyżej.

## 4. Podsumowanie

- Pozycje: 1 DRYF; 2 DRYF; 3 DRYF (3a i 3b); 4 DRYF; 5 ZGODNE; 6 DRYF (6a–6f; w 6a/6b/6c/6d wartości danych ZGODNE, DRYF to logika).
- Zmiany w kodzie: brak (`rust-port/**` i `gra/**` nietknięte). Gate: NIE_DOTYCZY (bez cargo).
